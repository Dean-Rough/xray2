# Resume Analysis API Documentation

## Overview
The `/api/resume-analysis` endpoint allows clients to start a new website analysis or resume a previously failed or incomplete analysis. It integrates deep website scraping, Lighthouse performance audits, and a placeholder AI audit to generate a comprehensive website rebuild package.

---

## Endpoint

### POST /api/resume-analysis

#### Request Body

- `analysisId` (string, required): The unique identifier for the analysis. For new analyses, this is a new ID; for resuming, it is the existing analysis ID.
- `options` (object, optional): Configuration options for the analysis.
  - `maxPages` (number): Maximum number of pages to scrape (default 10).
  - `includeLighthouse` (boolean): Whether to run Lighthouse audits (default false).
  - `includeScreenshots` (boolean): Whether to include full-page screenshots (default false).
  - `fullSite` (boolean): Whether to perform a full site scrape (default false).

#### Response

- On success, returns JSON with:
  - `message`: Status message.
  - `analysisId`: The analysis ID.
  - Additional data depending on analysis status.

- On failure, returns error details.

---

## System Prompts and Processing Pipeline

1. **Website Mapping**: Uses Firecrawl MCP or fallback to map site URLs.
2. **Page Scraping**: Selects pages intelligently based on navigation and options.
3. **Lighthouse Audit**: Runs performance audits if enabled.
4. **Structured Data Extraction**: Extracts technologies, design patterns, colors, fonts.
5. **AI Audit (Placeholder)**: Provides initial AI-generated suggestions for improvements.
6. **Package Generation**: Creates a ZIP package with HTML, assets, screenshots, and documentation.

---

## Examples

### Start New Analysis

```bash
curl -X POST http://localhost:3000/api/resume-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "new-analysis-123",
    "options": {
      "maxPages": 10,
      "includeLighthouse": true,
      "includeScreenshots": true,
      "fullSite": true
    }
  }'
```

### Resume Failed Analysis

```bash
curl -X POST http://localhost:3000/api/resume-analysis \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "existing-failed-analysis-456"}'
```

---

## Notes

- The AI audit is currently a placeholder and will be enhanced in future releases.
- The system respects `maxPages` to avoid serverless timeouts.
- Lighthouse audits may increase processing time.
- The package includes detailed documentation to assist reconstruction.

---

## Version

- Documentation Version: 1.0.0
- Last Updated: ${new Date().toISOString()}
