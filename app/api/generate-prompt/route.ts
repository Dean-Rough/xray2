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
      fullSite = true, // Default to TRUE - we want full site crawling with screenshots of ALL pages
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
      message: 'Website rebuild package generation has started. This will create a comprehensive package with screenshots, HTML files, assets, and AI prompts. Use the returned ID to check status.'
    });
  } catch (error) {
    console.error('Error processing request:', error);

    // Check if it's a structured error from our scraping process
    if (typeof error === 'object' && error !== null && 'type' in error) {
      const structuredError = error as any;
      return NextResponse.json(
        {
          error: structuredError.message,
          type: structuredError.type,
          canResume: structuredError.canResume,
          suggestions: structuredError.suggestions,
          analysisId: structuredError.analysisId,
          processingTime: structuredError.processingTime,
          timestamp: structuredError.timestamp
        },
        { status: 500 }
      );
    }

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