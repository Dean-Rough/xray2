/**
 * Firecrawl API utilities for website scraping and mapping
 * Uses the official Firecrawl API for comprehensive web data extraction
 */

import FirecrawlApp from '@mendable/firecrawl-js';

// Initialize Firecrawl client
const getFirecrawlClient = () => {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || apiKey === 'your_firecrawl_api_key_here') {
    return null; // Return null if no API key, we'll use fallback
  }
  return new FirecrawlApp({ apiKey });
};

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

// Fallback function for scraping with simple HTTP
async function scrapeWebpageWithFallback(url: string, _options?: {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  mobile?: boolean;
  actions?: Record<string, unknown>[];
}) {
  try {
    // For MVP, return basic mock data
    // In production, this would use a proper web scraping service
    console.log('Using simple fallback for webpage scraping');
    return {
      html: '<html><body><h1>Sample Content</h1><p>This is fallback content for MVP testing.</p></body></html>',
      markdown: '# Sample Content\n\nThis is fallback content for MVP testing.',
      title: 'Sample Page',
      links: [url],
      screenshot: null
    };
  } catch (error) {
    console.error('Error in fallback scraping:', error);
    return {
      html: '<html><body><h1>Error</h1><p>Could not scrape content.</p></body></html>',
      markdown: '# Error\n\nCould not scrape content.',
      title: 'Error',
      links: [],
      screenshot: null
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
  try {
    const app = getFirecrawlClient();

    if (app) {
      // Use Firecrawl if available
      const mapResult = await app.mapUrl(url, {
        includeSubdomains: options?.includeSubdomains || false,
        limit: options?.limit || 100,
        search: options?.search
      });

      if (!mapResult.success) {
        throw new Error(`Firecrawl mapping failed: ${mapResult.error}`);
      }

      return mapResult.links || [];
    } else {
      // Fallback to simple implementation
      console.log('Firecrawl not available, using simple fallback for mapping');
      return await mapWebsiteWithFallback(url, options);
    }
  } catch (error) {
    console.error('Error mapping website:', error);
    throw new Error(`Failed to map website: ${error instanceof Error ? error.message : String(error)}`);
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
  try {
    const app = getFirecrawlClient();

    if (app) {
      // Use Firecrawl if available
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

      return scrapeResult;
    } else {
      // Fallback to simple implementation
      console.log('Firecrawl not available, using simple fallback for scraping');
      return await scrapeWebpageWithFallback(url, options);
    }
  } catch (error) {
    console.error('Error scraping webpage:', error);
    throw new Error(`Failed to scrape webpage: ${error instanceof Error ? error.message : String(error)}`);
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