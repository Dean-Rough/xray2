# Product Requirements Document (PRD): Website Rebuild Prompt Generator (WRPG)

## 1. Product Overview

### 1.1 Product Name
Website Rebuild Prompt Generator (WRPG)

### 1.2 Elevator Pitch
A specialized tool designed to generate comprehensive, AI-optimized prompts for Claude Sonnet-based AI IDEs, enabling precise and thorough website cloning through exhaustive data scraping.

### 1.3 Product Goals
1. Create highly detailed AI prompts specifically for Claude Sonnet-based AI IDEs to clone websites with maximum accuracy
2. Implement comprehensive web scraping to capture every possible detail of a target website
3. Provide an ultra-minimal, streamlined user interface focused on prompt generation
4. Deliver a ready-to-use, fully-packaged prompt solution for AI-driven website replication

### 1.4 Target Audience
1. AI developers using Claude Sonnet-based IDEs for website cloning
2. Technical teams requiring precise website replication through AI
3. Developers seeking to create exact digital replicas of existing websites
4. AI research professionals exploring advanced web reconstruction techniques

## 2. Core Features

### 2.1 URL Input
- Singular, simple URL input field
- Strict URL validation
- Automatic full-site comprehensive scraping

### 2.2 Comprehensive Data Extraction
- **Exhaustive Site Mapping:** Discover and index ALL URLs on the target site
- **Deep Content Scraping:** Extract EVERYTHING possible - HTML, text, metadata, dynamic content
- **Comprehensive Visual Capture:** Full-page, high-resolution screenshots of ALL pages
- **Complete Asset Identification:** Comprehensive listing of CSS, JavaScript, images, fonts, and all web assets
- **Detailed Performance Analysis:** Extensive Lighthouse audits for performance, accessibility, and SEO insights

### 2.3 Claude Sonnet-Optimized Prompt Generation
- Generate meticulously structured documentation specifically for Claude Sonnet-based AI IDEs:
  - Comprehensive site structure and hierarchy
  - Pixel-perfect page-specific HTML, content, and visual representations
  - Detailed CSS, JavaScript, and asset references
  - In-depth performance metrics and reconstruction recommendations
  - Complete technology stack and implementation details
- Organize content in a format precisely engineered for Claude Sonnet AI prompt engineering

### 2.4 AI-Ready Output Packaging
- Generate a complete, ready-to-use prompt package
- Deliver as a downloadable zip or comprehensive HTML bundle
- Include:
  - Detailed Claude Sonnet-optimized documentation (Markdown)
  - High-resolution screenshots (PNG)
  - Comprehensive raw data files (JSON)
  - Explicit usage instructions for AI IDE integration

## 3. Technical Requirements

### 3.1 Technology Stack
- **Frontend:** Next.js App Router with React components
- **Backend:** Next.js API routes for orchestration
- **Data Extraction:**
  - `firecrawl-mcp-server` for site mapping and content scraping
  - Lighthouse CLI for performance metrics
- **Screenshot Capture:** Firecrawl's screenshot feature or Puppeteer
- **Packaging:** JSZip for client-side zip creation

### 3.2 System Architecture
- Single-page application with:
  - URL input form
  - Progress/status indicators
  - Download section for completed packages
- API route (`/api/generate-prompt`) to orchestrate:
  - Firecrawl site mapping
  - Firecrawl content scraping
  - Lighthouse audits
  - Data processing and structuring
  - Package generation

### 3.3 Performance Requirements
- Handle websites up to 100 pages in under 5 minutes
- Generate documentation packages under 50MB
- Support cancellation of ongoing operations

## 4. Non-Functional Requirements

### 4.1 Usability
- Minimal UI with clear status updates
- Intuitive workflow: Input → Process → Download
- Responsive design for desktop and mobile

### 4.2 Reliability
- Handle common website structures and content types
- Gracefully handle errors (e.g., unreachable sites, timeouts)
- Provide meaningful error messages

### 4.3 Security
- No persistent storage of user data
- All processing done server-side
- No user authentication required

## 5. Release Criteria

### 5.1 MVP (Minimum Viable Product)
- Basic URL input and validation
- Site mapping and single-page scraping
- Simple Markdown documentation generation
- Downloadable zip package

### 5.2 Phase 2 (Enhanced Functionality)
- Full site scraping with component identification
- Lighthouse metrics integration
- Optimized AI prompt formatting
- Improved UI with progress indicators

### 5.3 Phase 3 (Production Ready)
- Advanced configuration options
- Selective page analysis
- Comprehensive documentation
- Performance optimizations