/**
 * Data processing utilities for the Website Rebuild Prompt Generator
 * Handles parsing and structuring data from Firecrawl and Lighthouse
 */

import { mapWebsite, scrapeWebpage, extractStructuredData } from './mcp-utils';
import { createWebsiteAnalysisRequest, updateWebsiteAnalysisStatus, markAnalysisAsFailed } from './prisma-utils';
import { generateSonnetPrompt, generateWebsiteRebuildPackage } from './generate-docs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Process raw Firecrawl site map data into a structured format
 * @param rawData - Raw data from Firecrawl site mapping
 * @returns Processed site structure data
 */
export function processSiteMap(rawData: unknown) {
  try {
    // Extract URLs from the raw data
    const urls = Array.isArray(rawData) ? rawData : [];

    // Group URLs by path segments to create a hierarchical structure
    const structure: Record<string, unknown> = {};

    urls.forEach(url => {
      try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);

        let currentLevel = structure;
        pathSegments.forEach((segment, index) => {
          if (!currentLevel[segment]) {
            currentLevel[segment] = {};
          }
          currentLevel = currentLevel[segment] as Record<string, unknown>;

          // Add the full URL as a leaf node if this is the last segment
          if (index === pathSegments.length - 1) {
            (currentLevel as Record<string, unknown>)['__url'] = url;
          }
        });
      } catch (error) {
        console.warn(`Error processing URL: ${url}`, error);
      }
    });

    return {
      pages: urls,
      structure,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        totalPages: urls.length
      }
    };
  } catch (error) {
    console.error('Error processing site map data:', error);
    return {
      pages: [],
      structure: {},
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Process raw Firecrawl content scraping data into structured documentation format
 * @param rawData - Raw data from Firecrawl content scraping
 * @returns Processed content data
 */
export async function processContentData(rawData: unknown) {
  try {
    if (!rawData) {
      throw new Error('No content data provided');
    }

    const data = rawData as Record<string, unknown>;

    // Extract HTML content
    const html = (data.html as string) || (data.rawHtml as string) || '';

    // Extract markdown content
    const markdown = (data.markdown as string) || '';

    // Extract links
    const links = (data.links as string[]) || [];

    // Extract assets (CSS, JS, images, etc.)
    const assets: Record<string, unknown>[] = [];

    // Process CSS links and extract actual CSS content
    const cssLinks = extractResourceLinks(html, 'link[rel="stylesheet"]', 'href');
    const cssContents: Record<string, string> = {};

    for (const cssUrl of cssLinks) {
      try {
        // Skip invalid URLs (like cid: URLs from MHTML, data: URLs, etc.)
        if (cssUrl.startsWith('cid:') || cssUrl.startsWith('data:') || cssUrl.startsWith('blob:') || cssUrl.startsWith('javascript:')) {
          console.log(`⚠️ Skipping invalid CSS URL: ${cssUrl}`);
          assets.push({
            url: cssUrl,
            type: 'css',
            error: 'Invalid URL format'
          });
          continue;
        }

        // Resolve relative URLs
        const absoluteUrl = cssUrl.startsWith('http') ? cssUrl : new URL(cssUrl, data.url || '').href;

        // Fetch CSS content
        const cssContent = await fetchCSSContent(absoluteUrl);
        if (cssContent) {
          cssContents[cssUrl] = cssContent;
          console.log(`✅ Extracted CSS content from: ${cssUrl} (${cssContent.length} chars)`);
        }

        assets.push({
          url: cssUrl,
          type: 'css', // Use lowercase for consistency
          content: cssContent || undefined
        });
      } catch (error) {
        console.error(`❌ Failed to fetch CSS from ${cssUrl}:`, error);
        assets.push({
          url: cssUrl,
          type: 'css', // Use lowercase for consistency
          error: 'Failed to fetch content'
        });
      }
    }

    // Process JS links
    const jsLinks = extractResourceLinks(html, 'script[src]', 'src');
    jsLinks.forEach(url => {
      assets.push({
        url,
        type: 'javascript' // Use lowercase for consistency
      });
    });

    // Process image links
    const imageLinks = extractResourceLinks(html, 'img[src]', 'src');
    imageLinks.forEach(url => {
      assets.push({
        url,
        type: 'image' // Use lowercase for consistency
      });
    });

    // Extract metadata
    const metadata = extractMetadata(html);

    return {
      html,
      markdown,
      links,
      assets,
      metadata,
      cssContents, // Include extracted CSS contents
      screenshot: (rawData as any).screenshot || null, // Preserve screenshot data
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
  } catch (error) {
    console.error('Error processing content data:', error);
    return {
      html: '',
      markdown: '',
      links: [],
      assets: [],
      metadata: {},
      screenshot: null,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetch CSS content from a URL
 * @param url - CSS file URL
 * @returns CSS content as string
 */
async function fetchCSSContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/css') && !contentType.includes('text/plain')) {
      console.warn(`Warning: CSS URL returned unexpected content-type: ${contentType}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch CSS from ${url}:`, error);
    return null;
  }
}

/**
 * Extract resource links from HTML content
 * @param html - HTML content
 * @param selector - CSS selector for the elements
 * @param attribute - Attribute to extract
 * @returns Array of resource URLs
 */
function extractResourceLinks(html: string, selector: string, attribute: string): string[] {
  const links: string[] = [];

  // Simple regex-based extraction (in a real implementation, use a proper HTML parser)
  const regex = new RegExp(`<${selector.split('[')[0]}[^>]*${attribute}=["']([^"']+)["'][^>]*>`, 'gi');
  let match;

  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      links.push(match[1]);
    }
  }

  return links;
}

/**
 * Extract metadata from HTML content
 * @param html - HTML content
 * @returns Metadata object
 */
function extractMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};

  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1];
  }

  // Extract meta tags
  const metaRegex = /<meta[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let metaMatch;

  while ((metaMatch = metaRegex.exec(html)) !== null) {
    if (metaMatch[1] && metaMatch[2]) {
      metadata[metaMatch[1]] = metaMatch[2];
    }
  }

  return metadata;
}

/**
 * Process Lighthouse performance metrics into a structured format
 * @param rawData - Raw Lighthouse audit data
 * @returns Processed performance metrics
 */
export function processPerformanceData(rawData: unknown) {
  try {
    const data = rawData as Record<string, unknown>;
    if (!rawData || !data.categories) {
      throw new Error('Invalid Lighthouse data format');
    }

    const categories = data.categories as Record<string, unknown>;
    const audits = data.audits as Record<string, unknown>;

    // Extract scores from categories
    const performance: {
      score: number;
      metrics: Record<string, unknown>;
    } = {
      score: (categories.performance as Record<string, unknown>)?.score as number || 0,
      metrics: {}
    };

    const accessibility: {
      score: number;
      metrics: Record<string, unknown>;
    } = {
      score: (categories.accessibility as Record<string, unknown>)?.score as number || 0,
      metrics: {}
    };

    const seo: {
      score: number;
      metrics: Record<string, unknown>;
    } = {
      score: (categories.seo as Record<string, unknown>)?.score as number || 0,
      metrics: {}
    };

    const bestPractices: {
      score: number;
      metrics: Record<string, unknown>;
    } = {
      score: (categories['best-practices'] as Record<string, unknown>)?.score as number || 0,
      metrics: {}
    };

    // Extract key metrics from audits
    if (audits) {
      // Performance metrics
      if (audits['first-contentful-paint']) {
        const audit = audits['first-contentful-paint'] as Record<string, unknown>;
        performance.metrics['firstContentfulPaint'] = {
          score: audit.score,
          value: audit.numericValue
        };
      }

      if (audits['largest-contentful-paint']) {
        const audit = audits['largest-contentful-paint'] as Record<string, unknown>;
        performance.metrics['largestContentfulPaint'] = {
          score: audit.score,
          value: audit.numericValue
        };
      }

      if (audits['total-blocking-time']) {
        const audit = audits['total-blocking-time'] as Record<string, unknown>;
        performance.metrics['totalBlockingTime'] = {
          score: audit.score,
          value: audit.numericValue
        };
      }

      if (audits['cumulative-layout-shift']) {
        const audit = audits['cumulative-layout-shift'] as Record<string, unknown>;
        performance.metrics['cumulativeLayoutShift'] = {
          score: audit.score,
          value: audit.numericValue
        };
      }

      // Accessibility metrics
      if (audits['aria-required-attr']) {
        const audit = audits['aria-required-attr'] as Record<string, unknown>;
        accessibility.metrics['ariaRequiredAttr'] = {
          score: audit.score,
          details: audit.details
        };
      }

      // SEO metrics
      if (audits['meta-description']) {
        const audit = audits['meta-description'] as Record<string, unknown>;
        seo.metrics['metaDescription'] = {
          score: audit.score,
          details: audit.details
        };
      }

      // Best practices metrics
      if (audits['doctype']) {
        const audit = audits['doctype'] as Record<string, unknown>;
        bestPractices.metrics['doctype'] = {
          score: audit.score,
          details: audit.details
        };
      }
    }

    return {
      performance,
      accessibility,
      seo,
      bestPractices,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  } catch (error) {
    console.error('Error processing performance data:', error);
    return {
      performance: {
        score: 0,
        metrics: {}
      },
      accessibility: {
        score: 0,
        metrics: {}
      },
      seo: {
        score: 0,
        metrics: {}
      },
      bestPractices: {
        score: 0,
        metrics: {}
      },
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Combine all processed data into the final prompt structure
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data
 * @param performanceData - Processed performance data
 * @returns Final structured prompt data
 */
export function generateFinalPrompt(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>
) {
  return {
    siteStructure: siteMapData,
    content: contentData,
    performance: performanceData,
    structuredData: {}, // Initialize empty object to be filled later
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      generatedFor: 'Claude Sonnet AI IDE'
    },
    instructions: {
      title: 'Website Rebuild Instructions',
      description: 'This prompt contains comprehensive data for rebuilding the analyzed website with maximum fidelity.',
      steps: [
        'Analyze the site structure to understand the overall architecture',
        'Review the HTML content for each page to understand the markup structure',
        'Examine the CSS and JavaScript assets to understand styling and functionality',
        'Consider the performance metrics to optimize the rebuild',
        'Implement the website following the provided structure and content'
      ]
    }
  };
}

/**
 * Perform AI audit of scraped data for quality assurance
 * @param siteMapData - Site mapping data
 * @param contentData - Content scraping data
 * @param performanceData - Performance analysis data
 * @returns Audited and cleaned data
 */
async function performAIAudit(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>
) {
  // TODO: Implement AI audit functionality
  // This would use OpenAI API to:
  // 1. Review scraped content for completeness
  // 2. Identify missing critical elements
  // 3. Suggest improvements to the rebuild package
  // 4. Clean up any inconsistencies in the data
  // 5. Enhance the AI prompt with better instructions

  console.log('AI audit phase would analyze:', {
    pages: Object.keys(contentData).length,
    siteStructure: Object.keys(siteMapData).length,
    performanceMetrics: Object.keys(performanceData).length
  });

  // For now, return the data unchanged
  return {
    siteMapData,
    contentData,
    performanceData,
    auditReport: {
      completeness: 'high',
      suggestions: [
        'Consider adding more detailed component analysis',
        'Include accessibility audit results',
        'Add mobile responsiveness analysis'
      ],
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Run Lighthouse CLI for a URL and return the results
 * @param url - The URL to analyze
 * @returns Lighthouse audit results
 */
export async function runLighthouseAudit(url: string): Promise<Record<string, unknown>> {
  try {
    // Create a temporary directory for the output
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const outputPath = path.join(tempDir, `lighthouse-${Date.now()}.json`);

    // Run Lighthouse CLI
    const { stderr } = await execAsync(
      `npx lighthouse ${url} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox --disable-gpu"`
    );

    if (stderr) {
      console.warn('Lighthouse stderr:', stderr);
    }

    // Read the output file
    const data = fs.readFileSync(outputPath, 'utf8');

    // Clean up
    fs.unlinkSync(outputPath);

    return JSON.parse(data);
  } catch (error) {
    console.error('Error running Lighthouse audit:', error);
    throw error;
  }
}

/**
 * Perform deep scraping of a website using firecrawl
 * @param url - The URL to scrape
 * @param options - Optional scraping configuration
 * @returns Comprehensive scraping results
 */
export async function deepScrapeWebsite(url: string, options: {
  fullSite?: boolean;
  includeScreenshots?: boolean;
  includeLighthouse?: boolean;
  maxPages?: number;
} = {}) {
  const startTime = Date.now();
  let analysis: any = null;

  try {
    console.log('Starting deepScrapeWebsite for:', url);
    console.log('Environment check - FIRECRAWL_API_KEY exists:', !!process.env.FIRECRAWL_API_KEY);

    // Create a database record for the analysis
    analysis = await createWebsiteAnalysisRequest(url, options);
    console.log('Created analysis record:', analysis.id);

    // Update status to MAPPING
    await updateWebsiteAnalysisStatus(analysis.id, 'MAPPING');

    // Step 1: Map the website to discover all URLs
    console.log(`Mapping website: ${url}`);
    const siteMapResult = await mapWebsite(url, {
      includeSubdomains: false,
      limit: options.maxPages || 100
    });
    console.log('Site map result:', Array.isArray(siteMapResult) ? `Array with ${siteMapResult.length} URLs` : 'Not an array');

    // Process the site map data
    const siteMapData = processSiteMap(siteMapResult);
    console.log('Processed site map data - pages:', siteMapData.pages?.length || 0);

    // Update status to SCRAPING
    await updateWebsiteAnalysisStatus(analysis.id, 'SCRAPING', { siteMap: siteMapData });

    // Step 2: Scrape each URL for content WITH FULL-PAGE SCREENSHOTS
    console.log(`Scraping ${siteMapData.pages.length} pages with full-page screenshots...`);
    const contentResults: Record<string, any> = {};

    // If fullSite is true, scrape all pages; otherwise, just scrape the main URL
    const pagesToScrape = options.fullSite ? siteMapData.pages : [url];

    console.log(`DEBUG: fullSite=${options.fullSite}, mapped pages=${siteMapData.pages.length}, pages to scrape=${pagesToScrape.length}`);

    for (const pageUrl of pagesToScrape) {
      console.log(`Scraping page with full screenshot: ${pageUrl}`);

      const formats = ['markdown', 'html', 'rawHtml', 'links'];
      if (options.includeScreenshots) {
        formats.push('screenshot');
      }

      const pageResult = await scrapeWebpage(pageUrl, {
        formats,
        onlyMainContent: false,
        waitFor: 3000 // Extra time for full page load
      });

      const processedData = await processContentData(pageResult);
      contentResults[pageUrl] = processedData;

      // Debug screenshot data for each page
      console.log(`Screenshot data for ${pageUrl}:`, {
        hasScreenshot: !!(processedData as any)?.screenshot,
        screenshotType: typeof (processedData as any)?.screenshot,
        screenshotLength: (processedData as any)?.screenshot?.length || 0
      });
    }

    // Update status to PROCESSING
    await updateWebsiteAnalysisStatus(analysis.id, 'PROCESSING', {
      siteMap: siteMapData,
      content: contentResults
    });

    // Step 3: Run Lighthouse for performance metrics (if enabled)
    let performanceData = null;
    if (options.includeLighthouse) {
      console.log(`Running Lighthouse audit for: ${url}`);
      try {
        const lighthouseResult = await runLighthouseAudit(url);
        performanceData = processPerformanceData(lighthouseResult);
      } catch (error) {
        console.error('Error running Lighthouse audit:', error);
        performanceData = processPerformanceData(null);
      }
    }

    // Step 4: Extract structured data about the website
    console.log(`Extracting structured data for: ${url}`);
    const structuredData = await extractStructuredData([url], {
      prompt: 'Extract detailed information about this website including technologies used, design patterns, and key features',
      schema: {
        type: 'object',
        properties: {
          technologies: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of technologies used in the website'
          },
          designPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of design patterns used in the website'
          },
          keyFeatures: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of key features of the website'
          },
          colorPalette: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of main colors used in the website'
          },
          fontFamilies: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of font families used in the website'
          }
        }
      }
    });

    // Step 5: Optional AI audit phase for quality check
    // Note: This could be enabled as a feature flag in the future
    // const auditedData = await performAIAudit(siteMapData, contentResults, performanceData);

    // Step 6: Generate the comprehensive website rebuild package
    const rebuildPackage = await generateWebsiteRebuildPackage(
      siteMapData,
      contentResults,
      performanceData || {},
      structuredData as Record<string, unknown>,
      analysis.id
    );

    // Save the package as a ZIP file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const zipBuffer = await rebuildPackage.zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(tempDir, `${rebuildPackage.packageName}.zip`);
    fs.writeFileSync(zipPath, zipBuffer);

    // Also generate the legacy JSON format for backward compatibility
    const legacyPrompt = generateSonnetPrompt(
      siteMapData,
      contentResults,
      performanceData || {},
      structuredData as Record<string, unknown>
    );

    // Update status to COMPLETED with both formats
    const finalResult = {
      package: {
        name: rebuildPackage.packageName,
        zipPath,
        manifest: rebuildPackage.manifest
      },
      legacy: legacyPrompt
    };

    await updateWebsiteAnalysisStatus(analysis.id, 'COMPLETED', finalResult);

    return {
      id: analysis.id,
      package: rebuildPackage,
      zipPath,
      prompt: legacyPrompt
    };
  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Error performing deep scraping:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Environment variables check:', {
      hasFirecrawlKey: !!process.env.FIRECRAWL_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });

    // Mark analysis as failed in database if we have an analysis ID
    if (analysis?.id) {
      try {
        await markAnalysisAsFailed(analysis.id, errorMessage, processingTime);
        console.log(`Marked analysis ${analysis.id} as failed in database`);
      } catch (dbError) {
        console.error('Failed to update database with error status:', dbError);
      }
    }

    // Provide structured error information
    const structuredError = {
      type: 'SCRAPING_ERROR',
      message: errorMessage,
      url,
      processingTime,
      analysisId: analysis?.id,
      canResume: !!analysis?.id,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Check if the website is accessible',
        'Verify Firecrawl API key is valid',
        'Try resuming the failed analysis',
        'Contact support if the issue persists'
      ]
    };

    throw structuredError;
  }
}

/**
 * Resume a failed website analysis from the last successful step
 * @param analysisId - The ID of the failed analysis to resume
 * @returns Comprehensive scraping results
 */
export async function resumeFailedAnalysis(analysisId: string) {
  const startTime = Date.now();

  try {
    console.log('Resuming failed analysis:', analysisId);

    // Get the existing analysis record
    const { getWebsiteAnalysisById } = await import('./prisma-utils');
    const analysis = await getWebsiteAnalysisById(analysisId);

    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }

    if (analysis.status === 'COMPLETED') {
      throw new Error(`Analysis ${analysisId} is already completed`);
    }

    console.log(`Resuming analysis for URL: ${analysis.url}, current status: ${analysis.status}`);

    // Extract options from the original analysis
    const options = (analysis.result as any)?.options || {};

    // Determine where to resume based on current status and available data
    const existingResult = analysis.result as any || {};

    // Resume from the appropriate step
    if (analysis.status === 'FAILED' || analysis.status === 'PENDING') {
      // Start from the beginning
      console.log('Restarting analysis from the beginning');
      return await deepScrapeWebsite(analysis.url, options);
    } else if (analysis.status === 'MAPPING') {
      // Resume from mapping step
      console.log('Resuming from mapping step');
      await updateWebsiteAnalysisStatus(analysisId, 'MAPPING');
      return await deepScrapeWebsite(analysis.url, options);
    } else if (analysis.status === 'SCRAPING' && existingResult.siteMap) {
      // Resume from scraping step with existing site map
      console.log('Resuming from scraping step with existing site map');
      // This would require more complex logic to resume mid-scraping
      // For now, restart the scraping process
      return await deepScrapeWebsite(analysis.url, options);
    } else if (analysis.status === 'PROCESSING' && existingResult.content) {
      // Resume from processing step with existing content
      console.log('Resuming from processing step with existing content');
      // This would require extracting the processing logic into a separate function
      // For now, restart from the beginning
      return await deepScrapeWebsite(analysis.url, options);
    }

    // Default: restart from the beginning
    console.log('Defaulting to restart from the beginning');
    return await deepScrapeWebsite(analysis.url, options);

  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Error resuming failed analysis:', error);

    // Mark as failed again
    try {
      await markAnalysisAsFailed(analysisId, `Resume failed: ${errorMessage}`, processingTime);
    } catch (dbError) {
      console.error('Failed to update database with resume error:', dbError);
    }

    throw new Error(`Failed to resume analysis ${analysisId}: ${errorMessage}`);
  }
}