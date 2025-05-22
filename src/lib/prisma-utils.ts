import { PrismaClient } from '@prisma/client'

// Define enum types until Prisma generates them
type AnalysisStatus = 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

const prisma = new PrismaClient()

/**
 * Create a new website analysis request
 * @param url - The URL to analyze
 * @param options - Optional scraping configuration
 * @returns The created analysis record
 */
export async function createWebsiteAnalysisRequest(url: string, options?: Record<string, unknown>) {
  try {
    const analysis = await prisma.websiteAnalysis.create({
      data: {
        url,
        status: 'PENDING' as AnalysisStatus,
        result: options ? JSON.parse(JSON.stringify(options)) : undefined
      }
    })
    return analysis
  } catch (error) {
    console.error('Error creating website analysis request:', error)
    throw error
  }
}

/**
 * Get a website analysis by ID
 * @param id - The analysis ID
 * @returns The analysis record
 */
export async function getWebsiteAnalysisById(id: string) {
  try {
    return await prisma.websiteAnalysis.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error('Error fetching website analysis:', error)
    throw error
  }
}

/**
 * Update a website analysis status and optional result
 * @param id - The analysis ID
 * @param status - The new status
 * @param result - Optional result data
 * @returns The updated analysis record
 */
export async function updateWebsiteAnalysisStatus(
  id: string,
  status: 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  result?: Record<string, unknown>
) {
  try {
    return await prisma.websiteAnalysis.update({
      where: { id },
      data: {
        status,
        result: result ? JSON.parse(JSON.stringify(result)) : undefined
        // Note: error and processingTime fields are not in the current schema yet
      }
    })
  } catch (error) {
    console.error('Error updating website analysis:', error)
    throw error
  }
}

/**
 * List website analysis requests with pagination
 * @param limit - Maximum number of records to return
 * @param skip - Number of records to skip
 * @returns List of analysis records
 */
export async function listWebsiteAnalysisRequests(limit = 10, skip = 0) {
  try {
    return await prisma.websiteAnalysis.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error listing website analyses:', error)
    throw error
  }
}

/**
 * Delete a website analysis request and all related data
 * @param id - The analysis ID
 * @returns The deleted analysis record
 */
export async function deleteWebsiteAnalysisRequest(id: string) {
  try {
    return await prisma.websiteAnalysis.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting website analysis:', error)
    throw error
  }
}

/**
 * Cleanup old or completed analysis requests
 * @param daysOld - Age in days to consider for cleanup
 * @returns Count of deleted records
 */
export async function cleanupOldAnalysisRequests(daysOld = 7) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    return await prisma.websiteAnalysis.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        OR: [
          { status: 'COMPLETED' },
          { status: 'FAILED' }
        ]
      }
    })
  } catch (error) {
    console.error('Error cleaning up old analysis requests:', error)
    throw error
  }
}

// Note: The following functions will be implemented after running prisma generate
// to update the client with the new schema. For now, we'll comment them out to avoid TypeScript errors.

/*
 * Create a website page record
 * @param analysisId - The parent analysis ID
 * @param pageData - The page data
 * @returns The created page record
 */
/*
export async function createWebsitePage(analysisId: string, pageData: {
  url: string;
  title?: string;
  htmlContent?: string;
  markdownContent?: string;
  screenshotPath?: string;
  metadata?: any;
}) {
  try {
    return await prisma.websitePage.create({
      data: {
        ...pageData,
        metadata: pageData.metadata ? JSON.parse(JSON.stringify(pageData.metadata)) : undefined,
        analysis: {
          connect: { id: analysisId }
        }
      }
    })
  } catch (error) {
    console.error('Error creating website page:', error)
    throw error
  }
}
*/

/*
 * Create a website asset record
 * @param analysisId - The parent analysis ID
 * @param assetData - The asset data
 * @param pageIds - Optional IDs of pages to connect this asset to
 * @returns The created asset record
 */
/*
export async function createWebsiteAsset(
  analysisId: string,
  assetData: {
    url: string;
    type: AssetType;
    content?: string;
    metadata?: any;
  },
  pageIds?: string[]
) {
  try {
    return await prisma.websiteAsset.create({
      data: {
        ...assetData,
        metadata: assetData.metadata ? JSON.parse(JSON.stringify(assetData.metadata)) : undefined,
        analysis: {
          connect: { id: analysisId }
        },
        pages: pageIds?.length ? {
          connect: pageIds.map(id => ({ id }))
        } : undefined
      }
    })
  } catch (error) {
    console.error('Error creating website asset:', error)
    throw error
  }
}
*/

/*
 * Create or update performance data for an analysis
 * @param analysisId - The parent analysis ID
 * @param performanceData - The performance data
 * @returns The created or updated performance record
 */
/*
export async function upsertPerformanceData(
  analysisId: string,
  performanceData: {
    performanceScore?: number;
    accessibilityScore?: number;
    seoScore?: number;
    bestPracticesScore?: number;
    lighthouseData?: any;
  }
) {
  try {
    return await prisma.performanceData.upsert({
      where: { analysisId },
      update: {
        ...performanceData,
        lighthouseData: performanceData.lighthouseData
          ? JSON.parse(JSON.stringify(performanceData.lighthouseData))
          : undefined
      },
      create: {
        ...performanceData,
        lighthouseData: performanceData.lighthouseData
          ? JSON.parse(JSON.stringify(performanceData.lighthouseData))
          : undefined,
        analysis: {
          connect: { id: analysisId }
        }
      }
    })
  } catch (error) {
    console.error('Error upserting performance data:', error)
    throw error
  }
}
*/