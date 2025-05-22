/**
 * Data processing utilities for the Website Rebuild Prompt Generator
 * Handles parsing and structuring data from Firecrawl and Lighthouse
 */

import { mapWebsite, scrapeWebpage, extractStructuredData } from './mcp-utils';
import { createWebsiteAnalysisRequest, updateWebsiteAnalysisStatus } from './prisma-utils';
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
export function processContentData(rawData: unknown) {
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

    // Process CSS links
    const cssLinks = extractResourceLinks(html, 'link[rel="stylesheet"]', 'href');
    cssLinks.forEach(url => {
      assets.push({
        url,
        type: 'CSS'
      });
    });

    // Process JS links
    const jsLinks = extractResourceLinks(html, 'script[src]', 'src');
    jsLinks.forEach(url => {
      assets.push({
        url,
        type: 'JAVASCRIPT'
      });
    });

    // Process image links
    const imageLinks = extractResourceLinks(html, 'img[src]', 'src');
    imageLinks.forEach(url => {
      assets.push({
        url,
        type: 'IMAGE'
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
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      error: error instanceof Error ? error.message : String(error)
    };
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
  try {
    // Create a database record for the analysis
    const analysis = await createWebsiteAnalysisRequest(url);

    // Update status to MAPPING
    await updateWebsiteAnalysisStatus(analysis.id, 'MAPPING');

    // Step 1: Map the website to discover all URLs
    console.log(`Mapping website: ${url}`);
    const siteMapResult = await mapWebsite(url, {
      includeSubdomains: false,
      limit: options.maxPages || 100
    });

    // Process the site map data
    const siteMapData = processSiteMap(siteMapResult);

    // Update status to SCRAPING
    await updateWebsiteAnalysisStatus(analysis.id, 'SCRAPING', { siteMap: siteMapData });

    // Step 2: Scrape each URL for content
    console.log(`Scraping ${siteMapData.pages.length} pages...`);
    const contentResults: Record<string, any> = {};

    // If fullSite is true, scrape all pages; otherwise, just scrape the main URL
    const pagesToScrape = options.fullSite ? siteMapData.pages : [url];

    for (const pageUrl of pagesToScrape) {
      console.log(`Scraping page: ${pageUrl}`);

      const formats = ['markdown', 'html', 'rawHtml', 'links'];
      if (options.includeScreenshots) {
        formats.push('screenshot');
      }

      const pageResult = await scrapeWebpage(pageUrl, {
        formats,
        onlyMainContent: false,
        waitFor: 2000
      });

      contentResults[pageUrl] = processContentData(pageResult);
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

    // Step 5: Generate the final prompt
    const finalPrompt = generateFinalPrompt(
      siteMapData,
      contentResults,
      performanceData || {}
    );

    // Add the structured data to the final prompt
    finalPrompt.structuredData = structuredData;

    // Update status to COMPLETED
    await updateWebsiteAnalysisStatus(analysis.id, 'COMPLETED', finalPrompt);

    return {
      id: analysis.id,
      prompt: finalPrompt
    };
  } catch (error) {
    console.error('Error performing deep scraping:', error);
    throw error;
  }
}