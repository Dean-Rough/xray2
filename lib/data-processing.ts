/**
 * Data processing utilities for the Website Rebuild Prompt Generator
 * Handles parsing and structuring data from Firecrawl and Lighthouse
 */

import { mapWebsite, scrapeWebpage, extractStructuredData, discoverNavigationPages } from './mcp-utils';
import { batchScrapeWithMCP, scrapeWithMCP, mapWebsiteWithMCP, checkMCPAvailability } from './firecrawl-mcp-client';
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

    // Use CSS content from Firecrawl if available, otherwise extract from HTML
    let cssContents: Record<string, string> = {};

    // First, try to use cssContents from Firecrawl
    if (data.cssContents && typeof data.cssContents === 'object') {
      cssContents = data.cssContents as Record<string, string>;
      console.log(`✅ Using CSS content from Firecrawl: ${Object.keys(cssContents).length} files`);

      // Add CSS files to assets
      Object.entries(cssContents).forEach(([cssUrl, cssContent]) => {
        assets.push({
          url: cssUrl,
          type: 'css',
          content: cssContent
        });
      });
    } else {
      // Fallback: Extract CSS links from HTML and fetch content manually
      console.log('⚠️ No cssContents from Firecrawl, falling back to manual CSS extraction');
      const cssLinks = extractResourceLinks(html, 'link[rel="stylesheet"]', 'href');

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
            type: 'css',
            content: cssContent || undefined
          });
        } catch (error) {
          console.error(`❌ Failed to fetch CSS from ${cssUrl}:`, error);
          assets.push({
            url: cssUrl,
            type: 'css',
            error: 'Failed to fetch content'
          });
        }
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
      screenshot: (rawData as any).screenshot || (rawData as any).data?.screenshot || null, // Preserve screenshot data from both Firecrawl and fallback
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
 * Extract screenshot from Lighthouse results as fallback
 * @param lighthouseResult - Lighthouse audit results
 * @returns Base64 screenshot data or null
 */
function extractLighthouseScreenshot(lighthouseResult: any): string | null {
  try {
    // Check for full page screenshot in Lighthouse results
    if (lighthouseResult?.audits?.['full-page-screenshot']?.details?.screenshot?.data) {
      const screenshotData = lighthouseResult.audits['full-page-screenshot'].details.screenshot.data;
      console.log(`📸 Found Lighthouse full-page screenshot (${screenshotData.length} chars)`);
      return screenshotData;
    }

    // Check for final screenshot
    if (lighthouseResult?.audits?.['final-screenshot']?.details?.data) {
      const screenshotData = lighthouseResult.audits['final-screenshot'].details.data;
      console.log(`📸 Found Lighthouse final screenshot (${screenshotData.length} chars)`);
      return screenshotData;
    }

    // Check for screenshot thumbnails
    if (lighthouseResult?.audits?.['screenshot-thumbnails']?.details?.items?.length > 0) {
      const lastThumbnail = lighthouseResult.audits['screenshot-thumbnails'].details.items.slice(-1)[0];
      if (lastThumbnail?.data) {
        console.log(`📸 Found Lighthouse thumbnail screenshot (${lastThumbnail.data.length} chars)`);
        return lastThumbnail.data;
      }
    }

    console.log('⚠️ No Lighthouse screenshot found in available audits');
    return null;
  } catch (error) {
    console.error('Error extracting Lighthouse screenshot:', error);
    return null;
  }
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

    // Step 1: Map the website to discover all URLs (try MCP first)
    console.log(`Mapping website: ${url}`);
    let siteMapResult;

    // Try MCP mapping first if available
    const mcpAvailable = await checkMCPAvailability();
    if (mcpAvailable) {
      try {
        console.log('🗺️ Using MCP website mapping for enhanced discovery');
        siteMapResult = await mapWebsiteWithMCP(url, {
          maxDepth: 2,
          limit: options.maxPages || 100,
          allowExternalLinks: false
        });
        console.log(`✅ MCP mapping found ${siteMapResult.length} URLs`);
      } catch (mcpError) {
        console.error('❌ MCP mapping failed, falling back to standard mapping:', mcpError);
        siteMapResult = await mapWebsite(url, {
          includeSubdomains: false,
          limit: options.maxPages || 100
        });
      }
    } else {
      console.log('🔄 Using standard website mapping (MCP not available)');
      siteMapResult = await mapWebsite(url, {
        includeSubdomains: false,
        limit: options.maxPages || 100
      });
    }

    console.log('Site map result:', Array.isArray(siteMapResult) ? `Array with ${siteMapResult.length} URLs` : 'Not an array');

    // Process the site map data
    const siteMapData = processSiteMap(siteMapResult);
    console.log('Processed site map data - pages:', siteMapData.pages?.length || 0);

    // Update status to SCRAPING
    await updateWebsiteAnalysisStatus(analysis.id, 'SCRAPING', { siteMap: siteMapData });

    // Step 2: Scrape pages using MCP batch processing for efficiency
    console.log(`Scraping ${siteMapData.pages.length} pages with MCP batch processing...`);
    const contentResults: Record<string, any> = {};

    // Smart page selection based on navigation structure
    let pagesToScrape: string[];
    if (options.fullSite) {
      // Intelligent selection: prioritize navigation pages over random discovered URLs
      const navigationPages = await discoverNavigationPages(url, siteMapData.pages);

      // Combine main navigation and key pages
      const selectedPages = [
        ...navigationPages.mainNavigation, // All main nav pages (up to 8)
        ...navigationPages.keyPages // All key pages (up to 6)
      ];

      // Remove duplicates and ensure we don't exceed rate limits
      pagesToScrape = [...new Set(selectedPages)].slice(0, 12); // Max 12 pages to respect rate limits

      // If we still don't have enough pages, add some from the full site map
      if (pagesToScrape.length < 6 && siteMapData.pages.length > pagesToScrape.length) {
        const additionalPages = siteMapData.pages
          .filter(page => !pagesToScrape.includes(page))
          .slice(0, 6 - pagesToScrape.length);
        pagesToScrape.push(...additionalPages);
      }

      console.log(`🎯 Smart selection: ${pagesToScrape.length} key pages from navigation`);
      console.log('Selected pages:', pagesToScrape.map(p => {
        try { return new URL(p).pathname; } catch { return p; }
      }));
      console.log(`📊 Selection breakdown:`, {
        mainNavigation: navigationPages.mainNavigation.length,
        keyPages: navigationPages.keyPages.length,
        totalSelected: pagesToScrape.length,
        totalAvailable: siteMapData.pages.length
      });
    } else {
      // Single page analysis
      pagesToScrape = [url];
      console.log('📄 Single page analysis mode');
    }

    console.log(`DEBUG: fullSite=${options.fullSite}, mapped pages=${siteMapData.pages.length}, pages to scrape=${pagesToScrape.length}`);

    // Check if MCP is available and use it for batch processing
    const mcpAvailableForBatch = await checkMCPAvailability();

    if (mcpAvailableForBatch && pagesToScrape.length > 1) {
      console.log('🚀 Using MCP batch scraping for efficient processing');

      try {
        const formats = ['markdown', 'html', 'rawHtml', 'links'];
        if (options.includeScreenshots) {
          formats.push('screenshot@fullPage');
        }

        const batchResult = await batchScrapeWithMCP(pagesToScrape, {
          formats,
          onlyMainContent: false,
          waitFor: 5000
        });

        // Process batch results - handle MCP response format
        console.log('🔍 MCP batch result structure:', JSON.stringify(batchResult, null, 2));

        if (batchResult.content && Array.isArray(batchResult.content)) {
          // Handle MCP response format where content is an array of text items
          const textContent = batchResult.content.find((item: any) => item.type === 'text');

          if (textContent && textContent.text) {
            try {
              // Try to parse the text content as JSON (batch results)
              const batchData = JSON.parse(textContent.text);

              if (Array.isArray(batchData) && batchData.length === pagesToScrape.length) {
                for (let i = 0; i < pagesToScrape.length; i++) {
                  const pageUrl = pagesToScrape[i];
                  const pageData = batchData[i];

                  if (pageData) {
                    const processedData = await processContentData(pageData);
                    contentResults[pageUrl] = processedData;

                    console.log(`✅ MCP batch processed: ${pageUrl}`, {
                      hasScreenshot: !!(processedData as any)?.screenshot,
                      screenshotType: typeof (processedData as any)?.screenshot
                    });
                  }
                }
              } else {
                console.log('⚠️ MCP batch data format unexpected, falling back to individual scraping');
                mcpAvailableForBatch = false;
              }
            } catch (parseError) {
              console.log('⚠️ Failed to parse MCP batch response, falling back to individual scraping:', parseError);
              mcpAvailableForBatch = false;
            }
          } else {
            console.log('⚠️ MCP batch response missing text content, falling back to individual scraping');
            mcpAvailableForBatch = false;
          }
        } else {
          console.log('⚠️ MCP batch response format unexpected, falling back to individual scraping');
          mcpAvailableForBatch = false;
        }

        console.log(`✅ MCP batch scraping completed for ${Object.keys(contentResults).length} pages`);

      } catch (mcpError) {
        console.error('❌ MCP batch scraping failed, falling back to individual scraping:', mcpError);
        // Fall back to individual scraping
        mcpAvailableForBatch = false;
      }
    }

    // Fallback: Individual page scraping (either MCP not available or batch failed)
    if (!mcpAvailableForBatch || Object.keys(contentResults).length === 0) {
      console.log('🔄 Using individual page scraping (MCP fallback)');

      for (const pageUrl of pagesToScrape) {
        console.log(`Scraping page individually: ${pageUrl}`);

        const formats = ['markdown', 'html', 'rawHtml', 'links'];
        if (options.includeScreenshots) {
          formats.push('screenshot@fullPage');
        }

        const pageResult = await scrapeWebpage(pageUrl, {
          formats,
          onlyMainContent: false,
          waitFor: 5000
        });

        const processedData = await processContentData(pageResult);

        // If no screenshot from Puppeteer, try to extract from Lighthouse
        if (options.includeScreenshots && !(processedData as any)?.screenshot && lighthouseResults[pageUrl]) {
          console.log(`🔄 No Puppeteer screenshot for ${pageUrl}, checking Lighthouse...`);
          const lighthouseScreenshot = extractLighthouseScreenshot(lighthouseResults[pageUrl]);
          if (lighthouseScreenshot) {
            (processedData as any).screenshot = lighthouseScreenshot;
            console.log(`✅ Using Lighthouse screenshot for ${pageUrl}`);
          }
        }

        contentResults[pageUrl] = processedData;

        console.log(`Screenshot data for ${pageUrl}:`, {
          hasScreenshot: !!(processedData as any)?.screenshot,
          screenshotType: typeof (processedData as any)?.screenshot,
          screenshotLength: (processedData as any)?.screenshot?.length || 0,
          source: (processedData as any)?.screenshot ? 'puppeteer-or-lighthouse' : 'none'
        });
      }
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