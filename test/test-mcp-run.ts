import { scrapeWebpage } from '../lib/mcp-utils';

async function runTest() {
  const testUrl = 'https://example.com';
  console.log('Running MCP scrape test on:', testUrl);

  try {
    const result = await scrapeWebpage(testUrl, {
      formats: ['markdown', 'html', 'screenshot@fullPage']
    });

    console.log('Scrape result success:', result.success);
    if (result.success) {
    if ('data' in result && result.data) {
      console.log('Title:', result.data.title);
      console.log('Markdown snippet:', result.data.markdown?.substring(0, 200));
      console.log('HTML snippet:', result.data.html?.substring(0, 200));
      if (result.data.screenshot) {
        console.log('Screenshot captured, base64 length:', result.data.screenshot.length);
      } else {
        console.log('No screenshot captured');
      }
    } else {
      console.log('No data property in result');
    }

    } else {
      console.error('Scrape failed:', result.error);
    }
  } catch (error) {
    console.error('Error running MCP scrape test:', error);
  }
}

runTest();
