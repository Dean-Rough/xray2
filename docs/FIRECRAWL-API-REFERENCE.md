# Firecrawl API Reference

## Overview
Firecrawl allows you to turn entire websites into LLM-ready markdown. Official docs: https://docs.firecrawl.dev/

## Valid Formats
- `'markdown'` - Clean markdown content
- `'html'` - Full HTML content
- `'rawHtml'` - Raw HTML without processing
- `'screenshot'` - Viewport screenshot
- `'screenshot@fullPage'` - Full page screenshot (recommended)
- `'links'` - Extracted links
- `'extract'` - AI extraction
- `'json'` - Structured data extraction
- `'changeTracking'` - Change tracking

**Note: `'cssContents'` is NOT a valid format!**

## Basic Scraping
```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="fc-YOUR_API_KEY")

# Scrape with screenshots
scrape_result = app.scrape_url(
    'https://example.com',
    formats=['markdown', 'html', 'screenshot@fullPage', 'links']
)
```

## Response Format
```json
{
  "success": true,
  "data": {
    "markdown": "# Page content...",
    "html": "<!DOCTYPE html>...",
    "metadata": {
      "title": "Page Title",
      "description": "Page description",
      "sourceURL": "https://example.com",
      "statusCode": 200
    },
    "screenshot": "https://firecrawl-hosted-screenshot-url.png"
  }
}
```

## CSS Extraction Strategy
Since `cssContents` format doesn't exist, extract CSS manually:

1. **Get HTML** with `'html'` format
2. **Parse `<link>` tags** for CSS URLs
3. **Fetch CSS content** directly from URLs
4. **Extract inline styles** from `<style>` tags

## Screenshot Handling
Screenshots are returned as:
- **Hosted URLs** (Firecrawl-hosted images)
- **Base64 data** (in some cases)
- **Actions screenshots** (when using actions)

## Actions for Advanced Scraping
```python
actions = [
    {"type": "wait", "milliseconds": 2000},
    {"type": "screenshot"},
    {"type": "scrape"}
]

result = app.scrape_url(
    'https://example.com',
    formats=['markdown', 'html'],
    actions=actions
)
```

## Crawling Multiple Pages
```python
crawl_result = app.crawl_url(
    'https://example.com',
    limit=10,
    scrape_options=ScrapeOptions(formats=['markdown', 'html', 'screenshot@fullPage'])
)
```

## Error Handling
- **400 Bad Request**: Invalid format or parameters
- **429 Rate Limited**: Too many requests
- **500 Server Error**: Firecrawl service issues

## Best Practices
1. **Always use valid formats** (check docs)
2. **Include `screenshot@fullPage`** for complete screenshots
3. **Add wait times** for dynamic content
4. **Handle rate limits** with retry logic
5. **Extract CSS manually** from HTML content

## Firecrawl MCP Server (RECOMMENDED APPROACH)
**URL:** https://docs.firecrawl.dev/mcp

### Key Benefits:
- Built-in retry logic (3 attempts with exponential backoff)
- Proper rate limiting and batch processing
- Correct screenshot URL handling
- No format guessing - uses correct API formats
- Better error handling and logging

### Installation:
```bash
npm install -g firecrawl-mcp
env FIRECRAWL_API_KEY=fc-YOUR_API_KEY npx -y firecrawl-mcp
```

### Available Tools:
1. `firecrawl_scrape` - Single URL scraping
2. `firecrawl_batch_scrape` - Multiple URLs efficiently
3. `firecrawl_crawl` - Full website crawling
4. `firecrawl_search` - Web search with content extraction
5. `firecrawl_extract` - AI-powered structured extraction

### Batch Scraping Example:
```json
{
  "name": "firecrawl_batch_scrape",
  "arguments": {
    "urls": ["https://example1.com", "https://example2.com"],
    "options": {
      "formats": ["markdown", "html", "screenshot@fullPage", "links"]
    }
  }
}
```

### Configuration:
```bash
export FIRECRAWL_API_KEY=fc-YOUR_API_KEY
export FIRECRAWL_RETRY_MAX_ATTEMPTS=3
export FIRECRAWL_RETRY_INITIAL_DELAY=2000
export FIRECRAWL_RETRY_BACKOFF_FACTOR=2
```

## Examples Repository
Check official examples: https://github.com/mendableai/firecrawl/tree/main/examples
