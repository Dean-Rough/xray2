# Website Rebuild Prompt Generator (WRPG)

A specialized AI tool designed to generate hyper-detailed, Claude Sonnet-optimized prompts for precise website cloning through exhaustive web scraping.

## Overview

The Website Rebuild Prompt Generator (WRPG) is a Next.js application engineered with a singular purpose: to create comprehensive, pixel-perfect AI prompts for Claude Sonnet-based IDEs, enabling maximum fidelity in website reconstruction.

This tool is exclusively focused on:
- AI developers using Claude Sonnet IDEs for website cloning
- Technical teams requiring precise digital website replication
- AI research professionals exploring advanced web reconstruction techniques
- Developers seeking to create exact digital replicas of existing websites

## Current Status

**Version:** 0.1.x (MVP Development)
**Status:** 80% Complete - CRITICAL ISSUES IDENTIFIED

### ✅ Phase 1 Achievements
- ✅ Core Firecrawl integration with comprehensive error handling
- ✅ Claude Sonnet-optimized prompt generation engine
- ✅ Enhanced URL input mechanism with smart validation
- ✅ Resume capability for failed analyses
- ✅ Comprehensive testing protocol and quality assurance framework
- ✅ CRT-style retro interface with VHS aesthetics

### 🚨 Critical Discovery: Package Quality Issues
**Package Quality Score: 2/10 - Currently unusable for AI reconstruction**

Through systematic testing, we discovered fundamental issues:
- **No screenshots captured** (BLOCKING) - Firecrawl API issues
- **No CSS extraction** (BLOCKING) - Only HTML with meaningless class names
- **Truncated component analysis** (HIGH) - Incomplete, unusable fragments
- **Elementor complexity** (HIGH) - Page builder markup too complex for AI

### 🚫 Phase 2 Blocked
**Do not proceed until package quality reaches 8/10 and all BLOCKING issues are resolved.**

### Quality Assurance Framework
- Testing protocol with AI evaluation methodology (`docs/TESTING-PROTOCOL.md`)
- Automated quality checks via test runner (`scripts/test-package-quality.js`)
- Quality gates requiring 8/10 minimum score (`docs/QUALITY-CHECKLIST.md`)

## Key Features

### 1. Hyper-Focused URL Input
- Singular, streamlined URL input field
- Strict URL validation
- Automatic, comprehensive full-site scraping

### 2. Exhaustive Data Extraction
- **Comprehensive Site Mapping:** Discover and index EVERY URL on the target site
- **Deep Content Scraping:** Extract EVERYTHING possible - HTML, text, metadata, dynamic content
- **Comprehensive Visual Capture:** Full-page, high-resolution screenshots of ALL pages
- **Complete Asset Identification:** Comprehensive listing of CSS, JavaScript, images, fonts, and all web assets
- **Detailed Performance Analysis:** Extensive Lighthouse audits for performance, accessibility, and SEO insights

### 3. Claude Sonnet-Optimized Prompt Generation
- Generate meticulously structured documentation specifically for Claude Sonnet-based AI IDEs:
  - Comprehensive site structure and hierarchy
  - Pixel-perfect page-specific HTML, content, and visual representations
  - Detailed CSS, JavaScript, and asset references
  - In-depth performance metrics and reconstruction recommendations
  - Complete technology stack and implementation details

### 4. AI-Ready Output Packaging
- Generate a complete, ready-to-use prompt package
- Deliver as a downloadable zip or comprehensive HTML bundle
- Include:
  - Detailed Claude Sonnet-optimized documentation (Markdown)
  - High-resolution screenshots (PNG)
  - Comprehensive raw data files (JSON)
  - Explicit usage instructions for AI IDE integration

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- Python (for Lighthouse CLI)
- Puppeteer (for fallback screenshot capture)
- Firecrawl MCP server running locally

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-username/website-rebuild-prompt-generator.git
```

2. Navigate to the project directory:
```bash
cd website-rebuild-prompt-generator
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open the application in your browser:
```bash
open http://localhost:3250
```

## Usage

1. Input the target website URL
2. Click "Generate Prompt"
3. Wait for comprehensive AI-optimized documentation generation
4. Download the ready-to-use Claude Sonnet prompt package

## Documentation

For detailed information about the WRPG application, please refer to the following documentation files:

### Core Documentation
- [Product Requirements Document (PRD.md)](./PRD.md)
- [Architecture Document (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [Development Guide (DEVELOPMENT.md)](./DEVELOPMENT.md)
- [Roadmap (ROADMAP.md)](./ROADMAP.md)

### Quality Assurance & Testing
- [Status Summary (STATUS-SUMMARY.md)](./STATUS-SUMMARY.md) - **Quick overview of current status**
- [Testing Protocol (TESTING-PROTOCOL.md)](./TESTING-PROTOCOL.md) - Comprehensive AI evaluation methodology
- [Quality Checklist (QUALITY-CHECKLIST.md)](./QUALITY-CHECKLIST.md) - Quick validation checklist
- [Phase 1 Completion Summary (PHASE-1-COMPLETION.md)](./PHASE-1-COMPLETION.md) - Detailed findings and analysis

### Project History
- [Changelog (CHANGELOG.md)](./CHANGELOG.md)
- [Handover Documentation (HANDOVER.md)](./HANDOVER.md)

## Contributing

We welcome contributions to improve the Website Rebuild Prompt Generator. Please follow these steps:
1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Commit your changes with clear messages
5. Push to your branch
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.