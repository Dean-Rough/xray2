# Changelog: Website Rebuild Prompt Generator (WRPG)

All notable changes to this project will be documented in this file. This project adheres to a versioning scheme that reflects its development phases:

- **0.0.x:** Initial setup and planning
- **0.1.x:** MVP (Alpha) - Core functionality
- **0.2.x:** Enhanced functionality
- **0.3.x:** Advanced analysis and optimization
- **0.4.x+:** Production-ready features and refinements

## [Unreleased]

### Added
- Initial project setup and configuration
- Basic Next.js application structure
- Core documentation suite:
  - Product Requirements Document (PRD.md)
  - Architecture Document (ARCHITECTURE.md)
  - Changelog (CHANGELOG.md)
  - Development Guide (DEVELOPMENT.md)
  - README (README.md)
  - Roadmap (ROADMAP.md)

### Changed
- Project name from generic "AI Website Analyzer" to "Website Rebuild Prompt Generator (WRPG)"
- Unified documentation style across all files
- Improved versioning scheme to better reflect development phases

## 0.1.0 - 2025-05-22

### Added
- Implemented firecrawl deep scraping for maximum data capture
- Created MCP utilities for firecrawl-mcp-server integration
- Enhanced Prisma schema with comprehensive data models:
  - WebsiteAnalysis model with detailed status tracking
  - WebsitePage model for storing page-specific content
  - WebsiteAsset model for tracking CSS, JavaScript, images, and other assets
  - PerformanceData model for Lighthouse metrics
- Developed advanced data processing utilities:
  - Site map processing with hierarchical structure
  - Content extraction with HTML, CSS, and JavaScript parsing
  - Performance metrics processing from Lighthouse data
  - Structured data extraction using LLM capabilities
- Updated API routes with comprehensive error handling
- Added status checking endpoint for monitoring scraping progress
- Implemented Claude Sonnet-optimized prompt generation

## 0.0.1 - 2025-05-22

### Initial Setup & Planning Phase
- Project goal refined and documented
- Technical architecture outlined
- Next.js project initialized in `/src` for WRPG application
- Documentation suite created in `/docs`
- Initial exploration of `firecrawl-mcp-server` and Lighthouse CLI capabilities
- Development environment configured with necessary tools and dependencies

## 0.0.0 - 2025-05-22

### Initial Commit
- Project scaffolding completed
- Basic file structure established
- Placeholder documentation files created
- Development environment setup instructions drafted
- Initial exploration of required tools (firecrawl-mcp-server, Lighthouse, Puppeteer)
- Basic UI components created in Next.js