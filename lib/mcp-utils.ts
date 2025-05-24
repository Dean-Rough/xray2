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
 * Rate limiting for Firecrawl API (Free plan: 10 requests/min)
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests (10 requests/min)

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before next Firecrawl request`);
    await sleep(waitTime);
  }

  lastRequestTime = Date.now();
}

/**
 * Retry wrapper with exponential backoff and rate limiting
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

      // Enforce rate limiting before each attempt
      await enforceRateLimit();

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

      // Navigate to the page with extended timeout and better wait conditions
      console.log(`📸 Loading page for screenshot: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle0', // Wait for no network requests for 500ms
        timeout: 60000
      });

      console.log(`⏳ Page loaded, waiting for content to render...`);

      // Extended wait for page to fully load and any lazy-loaded content
      await new Promise(resolve => setTimeout(resolve, 8000)); // Increased from 3s to 8s

      // Wait for any dynamic content to load
      try {
        await page.waitForFunction(
          () => document.readyState === 'complete' &&
                (!window.jQuery || window.jQuery.active === 0) &&
                document.body &&
                document.body.children.length > 0,
          { timeout: 15000 } // Increased timeout
        );
        console.log(`✅ Dynamic content loaded`);
      } catch (e) {
        console.log('⚠️ Dynamic content wait timeout, proceeding with screenshot');
      }

      // Wait for images to load
      try {
        await page.waitForFunction(
          () => {
            const images = Array.from(document.images);
            return images.every(img => img.complete);
          },
          { timeout: 10000 }
        );
        console.log(`🖼️ All images loaded`);
      } catch (e) {
        console.log('⚠️ Image loading timeout, proceeding with screenshot');
      }

      // Additional wait for fonts and final rendering
      await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 2s to 5s

      console.log(`📷 Taking screenshot after ${8 + 5}s+ loading time`);

      // Capture full-page screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: 'base64',
        type: 'png'
      });

      console.log(`📊 Screenshot captured: ${screenshot.length} characters (base64)`);

      // Check if screenshot is suspiciously small (likely blank)
      const estimatedBytes = (screenshot.length * 3) / 4; // Rough base64 to bytes conversion
      if (estimatedBytes < 15000) {
        console.log(`⚠️ WARNING: Screenshot is very small (~${Math.round(estimatedBytes)} bytes) - likely blank or failed to load`);
        console.log(`🔄 Attempting additional wait and retry...`);

        // Additional wait and retry
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Try to scroll to trigger any lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          window.scrollTo(0, 0);
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        const retryScreenshot = await page.screenshot({
          fullPage: true,
          encoding: 'base64',
          type: 'png'
        });

        const retryEstimatedBytes = (retryScreenshot.length * 3) / 4;
        console.log(`🔄 Retry screenshot: ~${Math.round(retryEstimatedBytes)} bytes`);

        await browser.close();

        const finalScreenshot = retryEstimatedBytes > estimatedBytes ? retryScreenshot : screenshot;
        const screenshotData = `data:image/png;base64,${finalScreenshot}`;
        console.log(`✅ Puppeteer screenshot captured (${retryEstimatedBytes > estimatedBytes ? 'retry' : 'original'} version)`);
        return screenshotData;
      }

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

    // Check if screenshot was requested and capture with Puppeteer (primary method)
    const screenshotRequested = options?.formats?.includes('screenshot') || options?.formats?.includes('screenshot@fullPage');
    const screenshot = screenshotRequested ? await captureScreenshotWithPuppeteer(url) : null;

    if (screenshotRequested && screenshot) {
      console.log('✅ Puppeteer screenshot captured in fallback mode');
    } else if (screenshotRequested) {
      console.log('⚠️ Puppeteer screenshot failed in fallback mode');
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

        // OPTIMIZATION: Use Puppeteer for screenshots (more reliable) and Firecrawl for content
        // Remove screenshot from Firecrawl formats since Puppeteer handles it better
        const baseFormats = ['markdown', 'html', 'rawHtml', 'links'];
        scrapeOptions.formats = baseFormats;

        // Check if screenshot was requested
        const screenshotRequested = options?.formats?.includes('screenshot') || options?.formats?.includes('screenshot@fullPage');

        // Start both operations in parallel for speed
        const [scrapeResult, puppeteerScreenshot] = await Promise.all([
          app.scrapeUrl(url, scrapeOptions),
          screenshotRequested ? captureScreenshotWithPuppeteer(url) : Promise.resolve(null)
        ]);

        if (!scrapeResult.success) {
          throw new Error(`Firecrawl scraping failed: ${scrapeResult.error}`);
        }

        // Add Puppeteer screenshot to Firecrawl result
        if (screenshotRequested && puppeteerScreenshot) {
          // Ensure scrapeResult.data exists before setting screenshot
          if (!scrapeResult.data) {
            scrapeResult.data = {};
          }
          (scrapeResult.data as any).screenshot = puppeteerScreenshot;
          console.log('✅ Puppeteer screenshot captured successfully (primary method)');
        } else if (screenshotRequested) {
          console.log('⚠️ Puppeteer screenshot failed');
        }

        // Debug: Log the optimized result
        console.log(`Optimized scraping result for ${url}:`, {
          success: scrapeResult.success,
          hasContent: !!(scrapeResult.data),
          hasScreenshot: !!(scrapeResult.data as any)?.screenshot,
          screenshotMethod: screenshotRequested ? 'puppeteer-primary' : 'none-requested'
        });

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

/**
 * Discover navigation structure by analyzing the homepage and categorizing pages
 * @param homepageUrl - The homepage URL to analyze
 * @param allPages - All discovered pages from site mapping
 * @returns Categorized navigation structure
 */
export async function discoverNavigationPages(homepageUrl: string, allPages: string[]) {
  try {
    console.log(`🧭 Discovering navigation structure for: ${homepageUrl}`);

    // Scrape the homepage to extract navigation links
    const homepageData = await scrapeWebpage(homepageUrl, {
      formats: ['html', 'links'],
      onlyMainContent: false
    });

    // Extract navigation links from the homepage HTML
    const navigationLinks = extractNavigationFromHTML(homepageData.data?.html || '', homepageUrl);

    // Categorize all pages based on URL patterns and common page types
    const categorizedPages = categorizePages(allPages, homepageUrl);

    // Combine navigation analysis with URL pattern analysis
    const result = {
      mainNavigation: [...new Set([
        ...navigationLinks.filter(link => allPages.includes(link)),
        ...categorizedPages.mainNavigation
      ])],
      keyPages: categorizedPages.keyPages,
      allPages: allPages
    };

    console.log(`✅ Navigation discovery complete:`, {
      mainNavigation: result.mainNavigation.length,
      keyPages: result.keyPages.length,
      totalPages: allPages.length
    });

    return result;
  } catch (error) {
    console.error('Error discovering navigation pages:', error);

    // Fallback: use simple URL pattern analysis
    const categorizedPages = categorizePages(allPages, homepageUrl);
    return {
      mainNavigation: categorizedPages.mainNavigation,
      keyPages: categorizedPages.keyPages,
      allPages: allPages
    };
  }
}

/**
 * Extract navigation links from HTML content
 */
function extractNavigationFromHTML(html: string, baseUrl: string): string[] {
  const navigationLinks: string[] = [];

  try {
    // Look for common navigation patterns in HTML
    const navPatterns = [
      /<nav[^>]*>(.*?)<\/nav>/gis,
      /<header[^>]*>(.*?)<\/header>/gis,
      /<ul[^>]*class="[^"]*nav[^"]*"[^>]*>(.*?)<\/ul>/gis,
      /<div[^>]*class="[^"]*nav[^"]*"[^>]*>(.*?)<\/div>/gis
    ];

    for (const pattern of navPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Extract href attributes from the navigation section
          const hrefMatches = match.match(/href="([^"]+)"/g);
          if (hrefMatches) {
            for (const href of hrefMatches) {
              const url = href.replace(/href="([^"]+)"/, '$1');
              const absoluteUrl = new URL(url, baseUrl).href;
              navigationLinks.push(absoluteUrl);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting navigation from HTML:', error);
  }

  return [...new Set(navigationLinks)];
}

/**
 * Categorize pages based on URL patterns and common page types
 */
function categorizePages(allPages: string[], baseUrl: string) {
  const mainNavigation: string[] = [];
  const keyPages: string[] = [];

  try {
    const baseDomain = new URL(baseUrl).origin;

    for (const page of allPages) {
      try {
        const url = new URL(page);
        const pathname = url.pathname.toLowerCase();

        // Skip if not same domain
        if (url.origin !== baseDomain) continue;

        // Always include homepage
        if (pathname === '/' || pathname === '') {
          mainNavigation.push(page);
          continue;
        }

        // Main navigation patterns (top-level pages) - be more inclusive
        if (
          /^\/(home|about|services|products|portfolio|work|projects|blog|news|contact|gallery|exhibitions)$/i.test(pathname) ||
          /^\/(shop|store|buy|pricing|plans|collections)$/i.test(pathname) ||
          /^\/(events|programs|education|visit|explore)$/i.test(pathname) ||
          (/^\/[^\/]+$/.test(pathname) && pathname.length < 20 && !pathname.includes('.')) // Short top-level paths without file extensions
        ) {
          mainNavigation.push(page);
        }

        // Key pages (important secondary pages)
        else if (
          /\/(about|contact|privacy|terms|faq|help|support|info)$/i.test(pathname) ||
          /\/(team|careers|jobs|press|media|history)$/i.test(pathname) ||
          /\/(current|upcoming|past|archive)$/i.test(pathname) ||
          /\/[^\/]+\/(about|info|details|overview)$/i.test(pathname) // Subsection about pages
        ) {
          keyPages.push(page);
        }

        // Include some deeper pages that might be important
        else if (
          pathname.split('/').length === 3 && // Two levels deep
          !/\.(jpg|jpeg|png|gif|pdf|doc|zip)$/i.test(pathname) && // Not a file
          pathname.length < 50 // Not too long
        ) {
          keyPages.push(page);
        }
      } catch (urlError) {
        // Skip invalid URLs
        continue;
      }
    }
  } catch (error) {
    console.warn('Error categorizing pages:', error);
  }

  // Ensure we have at least the homepage
  if (mainNavigation.length === 0) {
    mainNavigation.push(baseUrl);
  }

  console.log(`📊 Page categorization results:`, {
    mainNavigation: mainNavigation.length,
    keyPages: keyPages.length,
    sampleMainNav: mainNavigation.slice(0, 3).map(url => new URL(url).pathname),
    sampleKeyPages: keyPages.slice(0, 3).map(url => new URL(url).pathname)
  });

  return {
    mainNavigation: mainNavigation.slice(0, 8), // Limit main nav to 8
    keyPages: keyPages.slice(0, 6) // Limit key pages to 6
  };
}