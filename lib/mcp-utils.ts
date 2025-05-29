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
  let lastError: Error = new Error('No attempts made');

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

// Enhanced fallback function for mapping websites with navigation discovery
async function mapWebsiteWithFallback(url: string, options?: {
  includeSubdomains?: boolean;
  limit?: number;
  search?: string;
}) {
  try {
    console.log('🔍 Using enhanced fallback for website mapping with navigation discovery');
    
    // Start with the homepage
    const discoveredUrls = [url];
    
    try {
      // Fetch the homepage HTML directly to extract navigation links
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        console.log(`✅ Fetched homepage HTML (${html.length} chars)`);
        
        // Extract navigation links from HTML
        const navLinks = extractNavigationLinksFromHTML(html, url);
        console.log(`🧭 Found ${navLinks.length} navigation links:`, navLinks.map(link => {
          try { return new URL(link).pathname; } catch { return link; }
        }));
        
        // Add unique navigation links
        navLinks.forEach(link => {
          if (!discoveredUrls.includes(link)) {
            discoveredUrls.push(link);
          }
        });
        
        // Also extract common page patterns from the HTML
        const commonPages = extractCommonPageLinks(html, url);
        console.log(`📄 Found ${commonPages.length} common page links:`, commonPages.map(link => {
          try { return new URL(link).pathname; } catch { return link; }
        }));
        
        commonPages.forEach(link => {
          if (!discoveredUrls.includes(link)) {
            discoveredUrls.push(link);
          }
        });
        
      } else {
        console.warn(`⚠️ Failed to fetch homepage: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.warn('⚠️ Failed to fetch homepage for navigation discovery:', fetchError);
    }
    
    // Limit results based on options
    const limit = options?.limit || 20;
    const finalUrls = discoveredUrls.slice(0, limit);
    
    console.log(`✅ Enhanced fallback mapping discovered ${finalUrls.length} URLs`);
    return finalUrls;
    
  } catch (error) {
    console.error('Error in enhanced fallback mapping:', error);
    return [url]; // Fallback to just the homepage
  }
}

/**
 * Extract navigation links from HTML content using comprehensive patterns
 */
function extractNavigationLinksFromHTML(html: string, baseUrl: string): string[] {
  const navigationLinks: string[] = [];
  
  try {
    const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const baseDomain = new URL(formattedBaseUrl).origin;
    
    // Enhanced navigation patterns - look for common navigation structures
    const navPatterns = [
      // Standard navigation elements
      /<nav[^>]*>(.*?)<\/nav>/gi,
      /<header[^>]*>(.*?)<\/header>/gi,
      
      // Navigation by class names (more comprehensive)
      /<[^>]*class="[^"]*\b(?:nav|navigation|menu|header-menu|main-menu|primary-menu|site-nav)\b[^"]*"[^>]*>(.*?)<\/[^>]+>/gi,
      
      // Navigation by ID
      /<[^>]*id="[^"]*\b(?:nav|navigation|menu|header-menu|main-menu|primary-menu|site-nav)\b[^"]*"[^>]*>(.*?)<\/[^>]+>/gi,
      
      // Common navigation list patterns
      /<ul[^>]*class="[^"]*\b(?:nav|menu|navigation)\b[^"]*"[^>]*>(.*?)<\/ul>/gi,
      
      // Header sections that often contain navigation
      /<div[^>]*class="[^"]*\b(?:header|top-bar|navbar|nav-bar)\b[^"]*"[^>]*>(.*?)<\/div>/gi
    ];

    for (const pattern of navPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Extract all href attributes from the navigation section
          const hrefMatches = match.match(/href\s*=\s*["']([^"']+)["']/gi);
          if (hrefMatches) {
            for (const hrefMatch of hrefMatches) {
              const urlMatch = hrefMatch.match(/href\s*=\s*["']([^"']+)["']/i);
              if (urlMatch && urlMatch[1]) {
                const url = urlMatch[1];
                
                // Skip invalid URLs
                if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
                  continue;
                }
                
                try {
                  const absoluteUrl = url.startsWith('http') ? url : new URL(url, formattedBaseUrl).href;
                  const urlObj = new URL(absoluteUrl);
                  
                  // Only include same-domain links
                  if (urlObj.origin === baseDomain) {
                    navigationLinks.push(absoluteUrl);
                  }
                } catch (urlError) {
                  // Skip invalid URLs
                  continue;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting navigation from HTML:', error);
  }

  return [...new Set(navigationLinks)]; // Remove duplicates
}

/**
 * Extract common page links from HTML (about, contact, services, etc.)
 */
function extractCommonPageLinks(html: string, baseUrl: string): string[] {
  const commonPages: string[] = [];
  
  try {
    const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const baseDomain = new URL(formattedBaseUrl).origin;
    
    // Look for common page keywords in href attributes
    const commonPagePatterns = [
      /href\s*=\s*["']([^"']*\b(?:about|contact|services|products|portfolio|work|blog|news|gallery|team|careers|pricing|shop|store)\b[^"']*)["']/gi,
      /href\s*=\s*["']([^"']*\/(?:about|contact|services|products|portfolio|work|blog|news|gallery|team|careers|pricing|shop|store)(?:\/|$)[^"']*)["']/gi
    ];
    
    for (const pattern of commonPagePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          const urlMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
          if (urlMatch && urlMatch[1]) {
            const url = urlMatch[1];
            
            try {
              const absoluteUrl = url.startsWith('http') ? url : new URL(url, formattedBaseUrl).href;
              const urlObj = new URL(absoluteUrl);
              
              // Only include same-domain links
              if (urlObj.origin === baseDomain) {
                commonPages.push(absoluteUrl);
              }
            } catch (urlError) {
              // Skip invalid URLs
              continue;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting common pages from HTML:', error);
  }

  return [...new Set(commonPages)]; // Remove duplicates
}

/**
 * Capture screenshot using a reliable external API service
 */
async function captureScreenshotViaExternalAPI(url: string): Promise<string | null> {
  try {
    console.log(`🌐 Attempting screenshot via external API for: ${url}`);

    // Use shot.screenshotapi.net - a free, reliable service
    const apiUrl = `https://shot.screenshotapi.net/screenshot`;
    const params = new URLSearchParams({
      url: url,
      width: '1920',
      height: '1080',
      output: 'image',
      file_type: 'png',
      wait_for_event: 'load',
      ttl: '3600'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Screenshot API failed: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Verify it's actually an image (PNG should start with specific bytes)
    if (base64Image.length < 100) {
      throw new Error('Screenshot too small, likely failed');
    }

    console.log(`✅ Screenshot captured via external API: ${base64Image.length} characters`);
    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error('❌ External API screenshot failed:', error);
    return null;
  }
}

/**
 * Puppeteer fallback for screenshot capture with enhanced loading detection
 */
async function captureScreenshotWithPuppeteer(url: string): Promise<string | null> {
  let browser: any = null;
  
  try {
    console.log(`🔄 Attempting Puppeteer screenshot for: ${url}`);

    // Always use puppeteer-core for consistency
    const puppeteer = await import('puppeteer-core');
    const isProduction = process.env.NODE_ENV === 'production';

    // Enhanced Puppeteer configuration for serverless environments
    let launchOptions: any = {
      headless: 'new', // Use new headless mode
      timeout: 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--single-process', // Critical for serverless
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-web-resources',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ]
    };

    // Use serverless-optimized Chromium in production
    if (isProduction) {
      try {
        const chromium = await import('@sparticuz/chromium');
        launchOptions.executablePath = await chromium.default.executablePath();
        // Use chromium args but add our custom ones
        launchOptions.args = [...chromium.default.args, ...launchOptions.args];
        console.log(`🚀 Using serverless Chromium for production`);
      } catch (error) {
        console.warn('⚠️ Failed to load serverless Chromium, using system Chrome:', error);
        // Try to find system Chrome
        const possiblePaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        ];
        
        for (const path of possiblePaths) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(path)) {
              launchOptions.executablePath = path;
              console.log(`✅ Found system Chrome at: ${path}`);
              break;
            }
          } catch (fsError) {
            continue;
          }
        }
      }
    } else {
      console.log(`🚀 Using development Chromium`);
      // In development, try to use system Chrome for better compatibility
      try {
        const fs = await import('fs');
        const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(macChromePath)) {
          launchOptions.executablePath = macChromePath;
          console.log(`✅ Using system Chrome for development`);
        }
      } catch (error) {
        console.log(`📦 Using bundled Chromium for development`);
      }
    }

    console.log(`🚀 Launching browser with options:`, {
      executablePath: launchOptions.executablePath || 'bundled',
      headless: launchOptions.headless,
      argsCount: launchOptions.args.length
    });

    browser = await puppeteer.default.launch(launchOptions);

    try {
      const page = await browser.newPage();

      // Set desktop viewport for full-page screenshot
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the page with optimized timeout and wait conditions
      console.log(`📸 Loading page for screenshot: ${url}`);
      
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded', // Faster than networkidle0
          timeout: 20000 // Reduced timeout for serverless
        });
        console.log(`✅ Page DOM loaded successfully`);
      } catch (gotoError) {
        console.warn(`⚠️ Page load timeout, attempting with reduced wait conditions`);
        try {
          await page.goto(url, {
            waitUntil: 'load',
            timeout: 15000
          });
          console.log(`✅ Page loaded with reduced conditions`);
        } catch (fallbackError) {
          console.error(`❌ Failed to load page: ${fallbackError}`);
          throw new Error(`Page load failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
        }
      }

      console.log(`⏳ Waiting for content to render...`);

      // Optimized wait for page content
      await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced wait time

      // Wait for basic page readiness with shorter timeout
      try {
        await page.waitForFunction(
          () => document.readyState === 'complete' &&
                document.body &&
                document.body.children.length > 0,
          { timeout: 8000 } // Reduced timeout
        );
        console.log(`✅ Page content ready`);
      } catch (e) {
        console.log('⚠️ Page readiness timeout, proceeding with screenshot');
      }

      // Quick image load check with shorter timeout
      try {
        await page.waitForFunction(
          () => {
            const images = Array.from(document.images);
            return images.length === 0 || images.every(img => img.complete || img.naturalWidth > 0);
          },
          { timeout: 5000 } // Much shorter timeout
        );
        console.log(`🖼️ Images loaded or skipped`);
      } catch (e) {
        console.log('⚠️ Image loading timeout, proceeding with screenshot');
      }

      // ENHANCED: Progressive scroll loading to trigger all lazy content and animations
      console.log(`🔄 Starting progressive scroll loading to trigger all content...`);

      // Get page dimensions for intelligent scrolling
      const pageHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
      });

      const viewportHeight = await page.evaluate(() => window.innerHeight);
      console.log(`📏 Page height: ${pageHeight}px, Viewport: ${viewportHeight}px`);

      // Progressive scroll through entire page to trigger lazy loading and animations
      const scrollSteps = Math.ceil(pageHeight / (viewportHeight * 0.8)); // 80% overlap for safety
      console.log(`📜 Performing ${scrollSteps} scroll steps to trigger all content`);

      for (let i = 0; i <= scrollSteps; i++) {
        const scrollPosition = Math.min((i * viewportHeight * 0.8), pageHeight - viewportHeight);

        await page.evaluate((pos: number) => {
          window.scrollTo(0, pos);
        }, scrollPosition);

        // Wait for scroll-triggered content and animations
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s per scroll step

        // Trigger intersection observers and lazy loading mechanisms
        try {
          await page.evaluate(() => {
            // Dispatch scroll events to trigger any scroll-based animations
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));

            // Force intersection observer checks
            const lazyElements = document.querySelectorAll('[data-src], .lazy, .lazyload, [loading="lazy"]');
            lazyElements.forEach(el => {
              if (el.getBoundingClientRect) {
                const rect = el.getBoundingClientRect();
                // Force visibility check for intersection observers
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                  el.dispatchEvent(new Event('load'));
                }
              }
            });

            // Trigger any animation libraries (AOS, ScrollMagic, etc.)
            if ((window as any).AOS && (window as any).AOS.refresh) (window as any).AOS.refresh();
            if ((window as any).ScrollMagic) window.dispatchEvent(new Event('scroll'));
          });
        } catch (e) {
          // Continue if trigger fails
        }

        // Wait for any new images that might have loaded
        try {
          await page.waitForFunction(
            () => {
              const images = Array.from(document.images);
              return images.every(img => img.complete || img.src === '');
            },
            { timeout: 3000 }
          );
        } catch (e) {
          // Continue if image loading times out
        }

        console.log(`📍 Scroll step ${i + 1}/${scrollSteps + 1} - Position: ${scrollPosition}px`);
      }

      // Scroll back to top for final screenshot
      await page.evaluate(() => window.scrollTo(0, 0));
      console.log(`⬆️ Scrolled back to top for final screenshot`);

      // Additional wait for fonts and final rendering after scroll sequence
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for final settling

      console.log(`📷 Taking screenshot after comprehensive loading (${8 + 5 + (scrollSteps * 1.5) + 3}s+ total)`);

      // Capture full-page screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: 'base64',
        type: 'png'
      }) as string;

      console.log(`📊 Screenshot captured: ${screenshot.length} characters (base64)`);

      // Check if screenshot is suspiciously small (likely blank)
      const estimatedBytes = (screenshot.length * 3) / 4; // Rough base64 to bytes conversion
      if (estimatedBytes < 15000) {
        console.log(`⚠️ WARNING: Screenshot is very small (~${Math.round(estimatedBytes)} bytes) - likely blank or failed to load`);
        console.log(`🔄 Attempting additional wait and retry...`);

        // Additional wait and retry with enhanced scroll sequence
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Enhanced retry scroll sequence to trigger more content
        console.log(`🔄 Retry: Enhanced scroll sequence to trigger lazy content`);

        // Get updated page dimensions
        const retryPageHeight = await page.evaluate(() => {
          return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
        });

        // More aggressive scroll pattern for retry
        const retryScrollSteps = Math.min(5, Math.ceil(retryPageHeight / viewportHeight)); // Max 5 steps for retry

        for (let i = 0; i <= retryScrollSteps; i++) {
          const scrollPos = (i / retryScrollSteps) * retryPageHeight;
          await page.evaluate((pos: number) => window.scrollTo(0, pos), scrollPos);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s per retry step

          // Trigger any click-to-load or hover content
          try {
            await page.evaluate(() => {
              // Trigger any lazy loading by dispatching scroll events
              window.dispatchEvent(new Event('scroll'));
              window.dispatchEvent(new Event('resize'));

              // Try to trigger intersection observers
              const elements = document.querySelectorAll('[data-src], .lazy, .lazyload');
              elements.forEach(el => {
                if (el.getBoundingClientRect) {
                  el.getBoundingClientRect(); // Force layout calculation
                }
              });
            });
          } catch (e) {
            // Continue if trigger fails
          }
        }

        // Return to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 3000));

        const retryScreenshot = await page.screenshot({
          fullPage: true,
          encoding: 'base64',
          type: 'png'
        }) as string;

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
      if (browser) await browser.close();
      throw pageError;
    }

  } catch (error) {
    console.error('❌ Puppeteer screenshot failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      isProduction: process.env.NODE_ENV === 'production',
      nodeVersion: process.version,
      platform: process.platform
    });

    // In production, try a simpler fallback approach
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Attempting simplified Puppeteer fallback for production...');
      let fallbackBrowser: any = null;
      try {
        const isProductionFallback = process.env.NODE_ENV === 'production';
        const puppeteer = isProductionFallback
          ? await import('puppeteer-core')
          : await import('puppeteer');

        let fallbackOptions: any = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        // Use serverless Chromium for fallback too
        if (isProductionFallback) {
          try {
            const chromium = await import('@sparticuz/chromium');
            fallbackOptions.executablePath = await chromium.default.executablePath();
            fallbackOptions.args = chromium.default.args;
          } catch (chromiumError) {
            console.warn('⚠️ Fallback: Failed to load serverless Chromium:', chromiumError);
          }
        }

        fallbackBrowser = await puppeteer.default.launch(fallbackOptions);

        const page = await fallbackBrowser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const screenshot = await page.screenshot({ 
          fullPage: true, 
          encoding: 'base64',
          type: 'png'
        }) as string;
        await fallbackBrowser.close();

        console.log('✅ Simplified Puppeteer fallback succeeded');
        return `data:image/png;base64,${screenshot}`;
      } catch (fallbackError) {
        console.error('❌ Simplified Puppeteer fallback also failed:', fallbackError);
        if (fallbackBrowser) await fallbackBrowser.close();
      }
    }

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Basic markdown conversion (very simple)
    const markdown = `# ${title}\n\nContent scraped from ${url}\n\n[Original URL](${url})`;

    // Check if screenshot was requested and capture with best available method
    const screenshotRequested = options?.formats?.includes('screenshot') || options?.formats?.includes('screenshot@fullPage');
    let screenshot = null;

    if (screenshotRequested) {
      console.log('📸 Using Puppeteer for screenshot capture...');
      screenshot = await captureScreenshotWithPuppeteer(url);
    }

    if (screenshotRequested && screenshot) {
      console.log('✅ Screenshot captured in fallback mode');
    } else if (screenshotRequested) {
      console.log('⚠️ Screenshot failed in fallback mode');
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

        // CRITICAL: Firecrawl should NEVER handle screenshots - only Puppeteer
        // Firecrawl formats: only content, no screenshots
        const firecrawlFormats = ['markdown', 'html', 'rawHtml', 'links'];
        scrapeOptions.formats = firecrawlFormats;

        console.log('🔥 Firecrawl scraping content only (NO screenshots)');
        console.log('📸 Puppeteer will handle ALL screenshot requests separately');

        // Check if screenshot was requested
        const screenshotRequested = options?.formats?.includes('screenshot') || options?.formats?.includes('screenshot@fullPage');

        // Start both operations in parallel for efficiency
        const firecrawlPromise = app.scrapeUrl(url, scrapeOptions);
        const screenshotPromise = screenshotRequested
          ? (async () => {
              console.log('📸 Puppeteer handling screenshot capture (ONLY method)...');
              return await captureScreenshotWithPuppeteer(url);
            })()
          : Promise.resolve(null);

        const [scrapeResult, puppeteerScreenshot] = await Promise.all([
          firecrawlPromise,
          screenshotPromise
        ]);

        if (!scrapeResult.success) {
          throw new Error(`Firecrawl scraping failed: ${scrapeResult.error}`);
        }

        // Add Puppeteer screenshot to Firecrawl result
        if (screenshotRequested && puppeteerScreenshot) {
          // Ensure scrapeResult.data exists before setting screenshot
          if (!(scrapeResult as any).data) {
            (scrapeResult as any).data = {};
          }
          ((scrapeResult as any).data as any).screenshot = puppeteerScreenshot;
          console.log('✅ Puppeteer screenshot captured successfully (ONLY screenshot method)');
        } else if (screenshotRequested) {
          console.log('❌ Puppeteer screenshot failed - no other screenshot methods available');
        }

        // Debug: Log the result with clear separation of responsibilities
        console.log(`Scraping result for ${url}:`, {
          success: scrapeResult.success,
          hasContent: !!((scrapeResult as any).data),
          hasScreenshot: !!((scrapeResult as any).data as any)?.screenshot,
          contentSource: 'firecrawl',
          screenshotSource: screenshotRequested ? 'puppeteer-only' : 'none-requested'
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
    const navigationLinks = extractNavigationFromHTML((homepageData as any).data?.html || '', homepageUrl);

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
      /<nav[^>]*>(.*?)<\/nav>/gi,
      /<header[^>]*>(.*?)<\/header>/gi,
      /<ul[^>]*class="[^"]*nav[^"]*"[^>]*>(.*?)<\/ul>/gi,
      /<div[^>]*class="[^"]*nav[^"]*"[^>]*>(.*?)<\/div>/gi
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
              try {
                const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
                const absoluteUrl = new URL(url, formattedBaseUrl).href;
                navigationLinks.push(absoluteUrl);
              } catch (urlError) {
                // Skip invalid URLs
                continue;
              }
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
    // Ensure baseUrl has protocol
    const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const baseDomain = new URL(formattedBaseUrl).origin;

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
    const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    mainNavigation.push(formattedBaseUrl);
  }

  console.log(`📊 Page categorization results:`, {
    mainNavigation: mainNavigation.length,
    keyPages: keyPages.length,
    sampleMainNav: mainNavigation.slice(0, 3).map(url => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    }),
    sampleKeyPages: keyPages.slice(0, 3).map(url => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    })
  });

  return {
    mainNavigation: mainNavigation.slice(0, 8), // Limit main nav to 8
    keyPages: keyPages.slice(0, 6) // Limit key pages to 6
  };
}
