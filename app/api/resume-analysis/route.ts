import { NextRequest, NextResponse } from 'next/server';
import { resumeFailedAnalysis } from '../../../lib/data-processing';
import { getResumableAnalysisRequests, getFailedAnalysisRequests } from '../../../lib/prisma-utils';

/**
 * POST handler for resuming failed analyses
 * @param request - The incoming request containing the analysis ID to resume
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { analysisId } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing analysisId parameter' },
        { status: 400 }
      );
    }

    console.log(`Resuming analysis: ${analysisId}`);

    // Start the resume process
    const result = await resumeFailedAnalysis(analysisId);

    return NextResponse.json({
      id: result.id,
      status: 'processing_resumed',
      analysisId,
      message: 'Analysis has been resumed successfully. Use the returned ID to check status.'
    });
  } catch (error) {
    console.error('Error resuming analysis:', error);

    // Check if it's a structured error from our scraping process
    if (typeof error === 'object' && error !== null && 'type' in error) {
      return NextResponse.json(
        {
          error: (error as any).message,
          type: (error as any).type,
          canResume: (error as any).canResume,
          suggestions: (error as any).suggestions,
          analysisId: (error as any).analysisId
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resume analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for listing resumable analyses
 * @param request - The incoming request with optional query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all'; // 'failed', 'resumable', or 'all'
    const targetUrl = url.searchParams.get('url'); // Optional URL filter

    let analyses;

    if (type === 'failed') {
      analyses = await getFailedAnalysisRequests(10);
    } else if (type === 'resumable') {
      analyses = await getResumableAnalysisRequests(targetUrl || undefined);
    } else {
      // Get both failed and resumable
      const failed = await getFailedAnalysisRequests(5);
      const resumable = await getResumableAnalysisRequests(targetUrl || undefined);
      analyses = [...failed, ...resumable.filter(r => r.status !== 'FAILED')];
    }

    // Format the response with useful information
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      url: analysis.url,
      status: analysis.status,
      error: analysis.error,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      processingTime: analysis.processingTime,
      canResume: ['FAILED', 'MAPPING', 'SCRAPING', 'PROCESSING'].includes(analysis.status),
      lastStep: getLastCompletedStep(analysis.status),
      estimatedResumeTime: getEstimatedResumeTime(analysis.status)
    }));

    return NextResponse.json({
      analyses: formattedAnalyses,
      total: formattedAnalyses.length,
      type,
      targetUrl
    });
  } catch (error) {
    console.error('Error fetching resumable analyses:', error?.toString() || 'Unknown error');

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch resumable analyses' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to determine the last completed step
 */
function getLastCompletedStep(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'None';
    case 'MAPPING':
      return 'Database record created';
    case 'SCRAPING':
      return 'Site mapping completed';
    case 'PROCESSING':
      return 'Content scraping completed';
    case 'FAILED':
      return 'Process failed at some point';
    case 'COMPLETED':
      return 'All steps completed';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to estimate resume time based on status
 */
function getEstimatedResumeTime(status: string): string {
  switch (status) {
    case 'PENDING':
    case 'FAILED':
      return '5-10 minutes (full process)';
    case 'MAPPING':
      return '4-8 minutes (from mapping)';
    case 'SCRAPING':
      return '3-6 minutes (from scraping)';
    case 'PROCESSING':
      return '1-3 minutes (from processing)';
    case 'COMPLETED':
      return 'Already completed';
    default:
      return 'Unknown';
  }
}
