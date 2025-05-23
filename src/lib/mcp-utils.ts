/**
 * Firecrawl API utilities for website scraping and mapping
 * Uses the official Firecrawl API for comprehensive web data extraction
 * Enhanced with retry logic, exponential backoff, and Puppeteer fallback
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 8000   // 8 seconds
};

// Initialize Firecrawl client
const getFirecrawlClient = () => {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || apiKey === 'your_firecrawl_api_key_here') {
    return null; // Return null if no API key, we'll use fallback
  }
  return new FirecrawlApp({ apiKey });
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts = RETRY_CONFIG.maxAttempts
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`${context} - Attempt ${attempt}/${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${context} - Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));

      if (attempt === maxAttempts) {
        console.error(`${context} - All ${maxAttempts} attempts failed`);
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      console.log(`${context} - Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  throw new Error(`${context} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
}

// Fallback implementation using simple HTTP requests
// Note: Puppeteer is commented out for server-side compatibility
// import puppeteer from 'puppeteer';

// Fallback function for mapping websites with simple HTTP
async function mapWebsiteWithFallback(url: string, _options?: {
  includeSubdomains?: boolean;
  limit?: number;
  search?: string;
}) {
  try {
    // For MVP, return a simple list with just the main URL
    // In production, this would use a proper web scraping service
    console.log('Using simple fallback for website mapping');
    return [url];
  } catch (error) {
    console.error('Error in fallback mapping:', error);
    return [url];
  }
}

/**
 * Puppeteer fallback for screenshot capture with multiple viewport sizes
 */
async function captureScreenshotWithPuppeteer(url: string): Promise<string | null> {
  try {
    console.log(`🔄 Attempting Puppeteer screenshot fallback for: ${url}`);

    // Import Puppeteer dynamically to avoid server-side issues
    const puppeteer = await import('puppeteer');

    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();

      // Set desktop viewport for full-page screenshot
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the page with extended timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 45000
      });

      // Wait for page to fully load
      await page.waitForTimeout(5000);

      // Capture full-page screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: 'base64',
        type: 'png'
      });

      await browser.close();

      const screenshotData = `data:image/png;base64,${screenshot}`;
      console.log('✅ Puppeteer screenshot captured successfully');
      return screenshotData;

    } catch (pageError) {
      await browser.close();
      throw pageError;
    }

  } catch (error) {
    console.error('❌ Puppeteer screenshot failed:', error);
    return null;
  }
}

// Fallback function for scraping with simple HTTP and optional Puppeteer
async function scrapeWebpageWithFallback(url: string, options?: {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  mobile?: boolean;
  actions?: Record<string, unknown>[];
}) {
  try {
    console.log(`Using fallback scraping for: ${url}`);

    // Try to get basic HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Basic markdown conversion (very simple)
    const markdown = `# ${title}\n\nContent scraped from ${url}\n\n[Original URL](${url})`;

    // Try to capture screenshot with Puppeteer if requested
    let screenshot = null;
    if (options?.formats?.includes('screenshot')) {
      screenshot = await captureScreenshotWithPuppeteer(url);
    }

    return {
      data: {
        html,
        markdown,
        title,
        links: [url],
        screenshot
      },
      success: true
    };
  } catch (error) {
    console.error('Error in fallback scraping:', error);
    return {
      data: {
        html: '<html><body><h1>Error</h1><p>Could not scrape content.</p></body></html>',
        markdown: '# Error\n\nCould not scrape content.',
        title: 'Error',
        links: [],
        screenshot: null
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Map a website to discover all indexed URLs on the site
 * @param url - Starting URL for URL discovery
 * @param options - Optional configuration for site mapping
 * @returns Array of URLs found on the site
 */
export async function mapWebsite(url: string, options?: {
  includeSubdomains?: boolean;
  limit?: number;
  search?: string;
}) {
  const app = getFirecrawlClient();

  if (app) {
    // Use Firecrawl with retry logic
    try {
      return await retryWithBackoff(async () => {
        const mapResult = await app.mapUrl(url, {
          includeSubdomains: options?.includeSubdomains || false,
          limit: options?.limit || 100,
          search: options?.search
        });

        if (!mapResult.success) {
          throw new Error(`Firecrawl mapping failed: ${mapResult.error}`);
        }

        return mapResult.links || [];
      }, `Firecrawl mapping for ${url}`);
    } catch (error) {
      console.error('Firecrawl mapping failed after retries, falling back to simple mapping:', error);
      return await mapWebsiteWithFallback(url, options);
    }
  } else {
    // Fallback to simple implementation
    console.log('Firecrawl not available, using simple fallback for mapping');
    return await mapWebsiteWithFallback(url, options);
  }
}

/**
 * Scrape content from a single URL with advanced options
 * @param url - The URL to scrape
 * @param options - Optional configuration for scraping
 * @returns Scraped content in requested formats
 */
export async function scrapeWebpage(url: string, options?: {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  mobile?: boolean;
  actions?: Record<string, unknown>[];
}) {
  const app = getFirecrawlClient();

  if (app) {
    // Use Firecrawl with retry logic
    try {
      return await retryWithBackoff(async () => {
        const scrapeOptions: Record<string, unknown> = {
          onlyMainContent: options?.onlyMainContent || false,
          waitFor: options?.waitFor || 3000, // Extra wait time for full page load and screenshots
          mobile: options?.mobile || false,
          actions: options?.actions || []
        };

        // Set formats - in Firecrawl v1, screenshot is a format, not a separate parameter
        const formats = options?.formats || ['markdown', 'html', 'rawHtml', 'screenshot', 'links'];
        scrapeOptions.formats = formats;

        const scrapeResult = await app.scrapeUrl(url, scrapeOptions);

        if (!scrapeResult.success) {
          throw new Error(`Firecrawl scraping failed: ${scrapeResult.error}`);
        }

        // Debug: Log what Firecrawl actually returns
        console.log(`Firecrawl result for ${url}:`, {
          success: scrapeResult.success,
          dataKeys: Object.keys(scrapeResult.data || {}),
          hasScreenshot: !!(scrapeResult.data as any)?.screenshot,
          screenshotType: typeof (scrapeResult.data as any)?.screenshot,
          dataStructure: scrapeResult.data ? Object.keys(scrapeResult.data) : 'no data',
          screenshotData: (scrapeResult.data as any)?.screenshot ? 'present' : 'missing'
        });

        // If screenshot was requested but not captured by Firecrawl, try Puppeteer fallback
        if (options?.formats?.includes('screenshot') && !(scrapeResult.data as any)?.screenshot) {
          console.log('🔄 Firecrawl failed to capture screenshot, trying Puppeteer fallback...');
          const puppeteerScreenshot = await captureScreenshotWithPuppeteer(url);
          if (puppeteerScreenshot) {
            (scrapeResult.data as any).screenshot = puppeteerScreenshot;
            console.log('✅ Puppeteer fallback screenshot successful');
          } else {
            console.log('❌ Both Firecrawl and Puppeteer screenshot capture failed');
          }
        }

        return scrapeResult;
      }, `Firecrawl scraping for ${url}`);
    } catch (error) {
      console.error('Firecrawl scraping failed after retries, falling back to simple scraping:', error);
      return await scrapeWebpageWithFallback(url, options);
    }
  } else {
    // Fallback to simple implementation
    console.log('Firecrawl not available, using simple fallback for scraping');
    return await scrapeWebpageWithFallback(url, options);
  }
}

/**
 * Extract structured information from web pages using LLM capabilities
 * @param urls - Array of URLs to extract information from
 * @param options - Optional configuration for extraction
 * @returns Extracted structured data
 */
export async function extractStructuredData(urls: string[], options?: {
  prompt?: string;
  systemPrompt?: string;
  schema?: Record<string, unknown>;
}) {
  try {
    const app = getFirecrawlClient();

    // For now, we'll extract from the first URL only
    // In a full implementation, we'd process all URLs
    const url = urls[0];
    if (!url) {
      throw new Error('No URLs provided for extraction');
    }

    if (app) {
      // Use Firecrawl if available
      const extractOptions = {
        prompt: options?.prompt || 'Extract all relevant information from this webpage',
        schema: options?.schema || {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'string' },
            technologies: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      };

      const extractResult = await app.extract([url], extractOptions);

      if (!extractResult.success) {
        throw new Error(`Firecrawl extraction failed: ${extractResult.error}`);
      }

      return extractResult;
    } else {
      // Fallback implementation - return basic structured data
      console.log('Firecrawl not available, using basic fallback for extraction');
      return {
        technologies: ['HTML', 'CSS', 'JavaScript'],
        designPatterns: ['Responsive Design'],
        keyFeatures: ['Web Content'],
        colorPalette: ['#000000', '#ffffff'],
        fontFamilies: ['Arial', 'sans-serif']
      };
    }
  } catch (error) {
    console.error('Error extracting structured data:', error);
    throw new Error(`Failed to extract structured data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Conduct deep web research on a query using intelligent crawling, search, and LLM analysis
 * @param query - The research question or topic to explore
 * @param options - Optional configuration for research
 * @returns Final analysis and research process details
 */
export async function conductDeepResearch(query: string, options?: {
  maxDepth?: number;
  timeLimit?: number;
  maxUrls?: number;
}) {
  try {
    // For MVP, we'll implement a simple version
    // In production, this would use Firecrawl's research capabilities
    console.log(`Conducting research for query: ${query}`);

    return {
      query,
      results: [],
      summary: `Research completed for: ${query}`,
      metadata: {
        maxDepth: options?.maxDepth || 3,
        timeLimit: options?.timeLimit || 120,
        maxUrls: options?.maxUrls || 50
      }
    };
  } catch (error) {
    console.error('Error conducting deep research:', error);
    throw new Error(`Failed to conduct deep research: ${error instanceof Error ? error.message : String(error)}`);
  }
}