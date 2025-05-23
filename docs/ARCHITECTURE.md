# Architecture Document: Website Rebuild Prompt Generator (WRPG)

## 1. Overview

The Website Rebuild Prompt Generator (WRPG) is a specialized Next.js application engineered to generate hyper-detailed, Claude Sonnet-optimized AI prompts for precise website cloning. Focused exclusively on creating comprehensive reconstruction instructions for AI IDEs, the application implements exhaustive web scraping to enable maximum fidelity in website replication.

## 2. High-Level Architecture

```
+---------------------+     +-----------------------+     +----------------------+
|                     |     |                       |     |                      |
|     User Interface  +----->  Next.js Application    +----->  External Services   |
|                     |     |                       |     |                      |
+---------------------+     +-----------------------+     +----------------------+
        |                            |                            |
        |                            |                            |
        v                            v                            v
+---------------------+     +-----------------------+     +----------------------+
|                     |     |                       |     |                      |
|  URL Input Form     |     | /api/generate-prompt  |     | firecrawl-mcp-server |
|  (src/app/page.tsx) |     | - Orchestrates workflow|     | - site mapping        |
|                     |     | - Calls Firecrawl      |     | - content scraping    |
+---------------------+     | - Runs Lighthouse CLI  |     |                      |
                           | - Processes data        |     +----------------------+
                           | - Generates documentation|           |
                           +-----------------------+     |         v
                                                         |  +-----------------+
                                                         |  |                 |
                                                         |  | Lighthouse CLI  |
                                                         |  | - Performance   |
                                                         |  | - Accessibility |
                                                         |  | - SEO           |
                                                         |  | - Best Practices|
                                                         |  |                 |
                                                         |  +-----------------+
                                                         |
                                                         |  +------------------+
                                                         |  |                  |
                                                         |  | Puppeteer (fallback) |
                                                         |  | - Screenshot capture |
                                                         |  |                  |
                                                         |  +------------------+
                                                         |
                                                         |  +------------------+
                                                         |  |                  |
                                                         |  | JSZip            |
                                                         |  | - Documentation  |
                                                         |  |   packaging      |
                                                         |  |                  |
                                                         |  +------------------+
```

## 3. Frontend Architecture

### 3.1 Technology Stack
- **Framework:** Next.js App Router with React components
- **Styling:** Tailwind CSS via globals.css
- **State Management:** React component state and context
- **Client-Side Logic:** TypeScript in `src/app` components

### 3.2 Key Components
- **Main Page:** `src/app/page.tsx` - URL input form and main UI
- **Layout:** `src/app/layout.tsx` - Shared layout and styling
- **API Routes:** `src/app/api/generate-prompt/route.ts` - Server-side orchestration
- **Data Processing:** `src/lib/data-processing.ts` - Utility functions for data manipulation
- **Documentation Generation:** `src/lib/generate-docs.ts` - Creates Markdown documentation from extracted data

## 4. Backend Architecture

### 4.1 Technology Stack
- **Server Framework:** Next.js API routes
- **Language:** TypeScript
- **Build Tool:** `package.json` scripts and Next.js tooling

### 4.2 Key Modules

#### 4.2.1 Orchestration Module
- **Location:** `src/app/api/generate-prompt/route.ts`
- **Responsibilities:**
  - Accept URL input from the frontend
  - Call `firecrawl-mcp-server` tools for site mapping and content scraping
  - Optionally run Lighthouse CLI for performance metrics
  - Process and structure the extracted data
  - Generate documentation files
  - Return zip package to the user

#### 4.2.2 Data Processing Module
- **Location:** `src/lib/data-processing.ts`
- **Responsibilities:**
  - Parse and clean HTML content
  - Extract key elements from HTML (headers, navigation, footers, etc.)
  - Identify common components across pages
  - Process Lighthouse metrics
  - Extract fonts and technology stack information

#### 4.2.3 Documentation Generation Module
- **Location:** `src/lib/generate-docs.ts`
- **Responsibilities:**
  - Create structured Markdown documents from processed data
  - Organize content in AI-friendly format for prompt engineering
  - Generate README with usage instructions for the prompt package
  - Create JSON schema for AI consumption (if needed)

## 5. Data Flow

1. **User Input:** User provides single target URL through retro CRT-style interface
2. **Request Handling:** Frontend sends URL with `fullSite: true` to `/api/generate-prompt` API route
3. **Comprehensive Site Mapping:** Firecrawl API discovers ALL indexed pages (typically 20-100+ pages)
4. **Full-Site Content Extraction:**
   - Scrapes EVERY discovered page with full-page screenshot capture
   - Downloads actual screenshot images from Firecrawl URLs (not just references)
   - Runs comprehensive Lighthouse CLI for performance metrics on main page
   - Extracts HTML, Markdown, assets, and metadata from all pages
5. **Enhanced Data Processing:**
   - Processes raw data optimized for Claude Sonnet AI reconstruction
   - Handles relative URLs and asset references properly
   - Creates comprehensive ZIP packages with organized folder structure
6. **Claude Sonnet-Optimized Documentation Generation:**
   - Structures data in a format precisely engineered for Claude Sonnet AI IDEs
   - Creates meticulously detailed Markdown files for each page and component
   - Packages comprehensive documentation and assets into ready-to-use bundle
7. **Prompt Package Delivery:**
   - Returns fully-prepared AI prompt package
   - Provides clear, actionable documentation for website reconstruction

## 6. External Service Integration

### 6.1 firecrawl-mcp-server
- **Purpose:** Site mapping and content scraping
- **Integration:** Called via `firecrawl_scrape` and `firecrawl_map` tools
- **Data Flow:**
  - Request: URL and format options
  - Response: HTML, text content, metadata, and optionally screenshots

### 6.2 Lighthouse CLI
- **Purpose:** Performance, accessibility, SEO, and best practices metrics
- **Integration:** Called via `execute_command` tool
- **Data Flow:**
  - Request: URL and configuration options
  - Response: JSON with comprehensive audit data

### 6.3 Puppeteer (Fallback)
- **Purpose:** Screenshot capture if Firecrawl's feature isn't sufficient
- **Integration:** Called via `execute_command` tool
- **Data Flow:**
  - Request: URL and screenshot configuration
  - Response: Base64 encoded screenshot

## 7. File Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-prompt/
│   │       └── route.ts
│   ├── page.tsx
│   ├── layout.tsx
│   └── components/
│       └── (UI components)
├── lib/
│   ├── data-processing.ts
│   └── generate-docs.ts
├── public/
│   └── (static assets)
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 8. API Design

### 8.1 Frontend to Backend
- **Endpoint:** `POST /api/generate-prompt`
- **Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "fullSite": true,
    "includeScreenshots": true,
    "includeLighthouse": true
  }
}
```
- **Response:**
```json
{
  "status": "complete",
  "documentation": {
    "markdown": "base64 encoded zip file",
    "pages": [
      {
        "url": "https://example.com",
        "title": "Homepage",
        "content": "Extracted HTML content",
        "text": "Extracted text content",
        "screenshot": "base64 encoded PNG",
        "lighthouse": "Lighthouse JSON data"
      }
    ]
  }
}
```

## 9. Security Considerations

- **No persistent storage:** All data is processed in memory and returned in the response
- **No user authentication:** Tool is stateless and doesn't store user data
- **Input validation:** URL validation and sanitization in API route
- **Rate limiting:** Consider implementing rate limiting for production deployments
- **Timeouts:** Implement reasonable timeouts for external service calls

## 10. Error Handling

- **Frontend:**
  - Clear error messages for user
  - Progress indicator with cancellation option
  - Graceful degradation when services fail

- **Backend:**
  - Comprehensive error handling for external service calls
  - Status updates throughout processing
  - Clean error responses to frontend
  - Logging of errors for debugging

## 11. Future Architecture Considerations

- **Claude Sonnet AI IDE Integration:**
  - Develop direct plugin mechanisms for seamless prompt injection
  - Create standardized prompt schemas for different website types
  - Implement advanced AI-guided reconstruction workflows

- **Hyper-Detailed Scraping Enhancements:**
  - Develop machine learning models to identify complex web component patterns
  - Create advanced scripts for capturing intricate interactive and dynamic content states
  - Implement semantic understanding of web architectures beyond pure HTML parsing

- **Performance and Scalability:**
  - Design distributed scraping infrastructure for handling large, complex websites
  - Implement intelligent caching and optimization strategies
  - Create robust error recovery and partial reconstruction capabilities