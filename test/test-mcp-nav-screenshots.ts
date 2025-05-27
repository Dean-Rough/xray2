import { scrapeWebpage } from '../lib/mcp-utils';
import puppeteer from 'puppeteer-core';

async function extractNavigationLinksWithPuppeteer(url: string): Promise<string[]> {
  console.log('Extracting navigation links with Puppeteer from:', url);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Click any menu buttons or hamburger icons to reveal navigation
    await page.evaluate(() => {
      const menuSelectors = [
        'button[aria-label*="menu" i]',
        'button[aria-label*="navigation" i]',
        '.menu-button',
        '.hamburger',
        '[class*="menu-toggle"]',
        '[class*="nav-toggle"]'
      ];

      menuSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(button => {
          (button as HTMLElement).click();
        });
      });
    });

    // Wait for any animations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract all navigation links
    const links = await page.evaluate((baseUrl) => {
      const navigationSelectors = [
        'nav a',
        'header a',
        '.menu a',
        '.navigation a',
        '[role="navigation"] a',
        '.nav a',
        '.navbar a',
        '#menu a',
        '#navigation a',
        '.main-menu a',
        '.primary-menu a'
      ];

      const allLinks = new Set<string>();
      navigationSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            try {
              const absoluteUrl = new URL(href, baseUrl).href;
              if (absoluteUrl.includes(new URL(baseUrl).hostname)) {
                allLinks.add(absoluteUrl);
              }
            } catch (e) {
              // Skip invalid URLs
            }
          }
        });
      });

      return Array.from(allLinks);
    }, url);

    console.log(`Found ${links.length} navigation links:`, links);
    return links;

  } finally {
    await browser.close();
  }
}

async function runNavScreenshotsTest() {
  const homepageUrl = 'https://dukesumbrella.com';
  console.log('Discovering navigation pages for:', homepageUrl);

  try {
    // Extract navigation links using Puppeteer
    const navigationLinks = await extractNavigationLinksWithPuppeteer(homepageUrl);
    
    // Use the extracted links for screenshots
    const pagesToScreenshot = navigationLinks.slice(0, 10);
    console.log(`Pages to screenshot (max 10):`, pagesToScreenshot);

    for (const pageUrl of pagesToScreenshot) {
      console.log(`\nScraping and screenshotting: ${pageUrl}`);
      const result = await scrapeWebpage(pageUrl, {
        formats: ['markdown', 'html', 'screenshot@fullPage']
      });

      if (result.success && 'data' in result && result.data) {
        console.log(`Title: ${result.data.title}`);
        if (result.data.screenshot) {
          console.log(`Screenshot base64 length: ${result.data.screenshot.length}`);
        } else {
          console.log('No screenshot captured');
        }
      } else {
        console.error(`Failed to scrape ${pageUrl}:`, result.error);
      }

      // Wait between screenshots to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error in navigation screenshots test:', error);
  }
}

runNavScreenshotsTest();
