import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteAnalysisById } from '../../../lib/prisma-utils';
import { deepScrapeWebsite } from '../../../lib/data-processing';

/**
 * POST handler for generating rebuild prompts
 * @param request - The incoming request containing the URL to analyze
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const {
      url,
      fullSite = false,
      includeScreenshots = true,
      includeLighthouse = true,
      maxPages = 100
    } = await request.json();

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
    if (!url || !urlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Start the deep scraping process
    // This will create a database record and begin processing
    const { id } = await deepScrapeWebsite(url, {
      fullSite,
      includeScreenshots,
      includeLighthouse,
      maxPages
    });

    return NextResponse.json({
      id,
      status: 'processing_started',
      url,
      fullSite,
      message: 'Rebuild prompt generation has started. Use the returned ID to check status or cancel the operation.'
    });
  } catch (error) {
    console.error('Error processing request:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking the status of a prompt generation request
 * @param request - The incoming request containing the ID to check
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

    // Return the status and result if available
    return NextResponse.json({
      id: analysis.id,
      url: analysis.url,
      status: analysis.status,
      createdAt: analysis.createdAt,
      result: analysis.status === 'COMPLETED' ? analysis.result : undefined
    });
  } catch (error) {
    console.error('Error checking status:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    );
  }
}