import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteAnalysisById } from '../../../lib/prisma-utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET handler for downloading generated website rebuild packages
 * @param request - The incoming request containing the ID to download
 */
export async function GET(request: NextRequest) {
  try {
    // Get the ID from the query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    // Get the analysis record from the database
    const analysis = await getWebsiteAnalysisById(id);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    if (analysis.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Analysis not completed yet', status: analysis.status },
        { status: 400 }
      );
    }

    // Check if the result contains package information
    const result = analysis.result as any;
    if (!result?.package?.zipBuffer && !result?.package?.zipPath) {
      return NextResponse.json(
        { error: 'Package not found or not generated' },
        { status: 404 }
      );
    }

    let fileBuffer: Buffer;
    let fileName: string;

    // Try to get ZIP buffer from database first (new method)
    if (result.package.zipBuffer) {
      fileBuffer = Buffer.from(result.package.zipBuffer, 'base64');
      fileName = `${result.package.name}.zip`;
    }
    // Fallback to file system (legacy method)
    else if (result.package.zipPath) {
      const zipPath = result.package.zipPath;

      // Check if the file exists
      if (!fs.existsSync(zipPath)) {
        return NextResponse.json(
          { error: 'Package file not found on server' },
          { status: 404 }
        );
      }

      // Read the file
      fileBuffer = fs.readFileSync(zipPath);
      fileName = path.basename(zipPath);
    } else {
      return NextResponse.json(
        { error: 'Package data not available' },
        { status: 404 }
      );
    }

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading package:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download package' },
      { status: 500 }
    );
  }
}
