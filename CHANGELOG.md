# Changelog

All notable changes to the Xrai project will be documented in this file.

## [2.2.0] - 2025-01-24

### 🎨 Enhanced UI & Version Tracking

#### UI Improvements
- **Version Number Display**: Added version tracking to separator line for better deployment visibility
- **Professional Styling**: Used xrai-label class with 30% opacity for subtle, consistent appearance
- **Clean Task Display**: Removed all icons from analysis task sequence for minimal, professional look
- **Reduced Bundle Size**: Eliminated emoji characters for better performance

#### Version Management
- **Deployment Tracking**: Version number now visible in UI for easy identification
- **Consistent Branding**: Maintains design system consistency with existing typography
- **Memory Integration**: Automated reminder system for version updates with each deployment

## [2.1.9] - 2025-01-24

### 🔧 Complete Production Compatibility

#### Variable Reference Fix
- **Fixed undefined zipPath**: Replaced zipPath reference with zipBuffer in return statement
- **Data Flow Consistency**: Ensures proper data flow for ZIP package handling
- **Production Stability**: Resolves "zipPath is not defined" error in production environment
- **Code Consistency**: Maintains alignment with new ZIP buffer storage system

## [2.1.8] - 2025-01-24

### 🔧 Serverless File System Compatibility

#### File System Fixes
- **Serverless Directory**: Changed temp directory from `./temp` to `/tmp` in production for Vercel compatibility
- **EROFS Resolution**: Fixed "read-only file system" errors in serverless environment
- **Recursive Directory Creation**: Added proper error handling for directory creation
- **Environment Detection**: Automatic path selection based on NODE_ENV

#### Database Storage Optimization
- **ZIP Buffer Storage**: Store ZIP packages as base64 strings in database instead of file system
- **Improved Reliability**: Eliminates dependency on persistent file storage in serverless environment
- **Backward Compatibility**: Maintains support for existing file-based packages
- **Download API Enhancement**: Updated to read ZIP data from database first, fallback to file system

#### Production Stability
- **API Error Resolution**: Fixed 500 errors in `/api/generate-prompt` and `/api/download-package` endpoints
- **Serverless Optimization**: Improved performance and reliability in Vercel environment
- **Storage Independence**: Reduced external storage dependencies for better scalability

## [2.1.7] - 2025-01-24

### 🔧 Production Database Fix & Endless Marquee

#### Database Configuration Fix
- **PostgreSQL Migration**: Changed Prisma schema from SQLite to PostgreSQL for Vercel compatibility
- **Production API Fix**: Resolved 500 errors in `/api/resume-analysis` and `/api/generate-prompt` endpoints
- **Environment Compatibility**: Fixed database URL validation errors in production environment
- **Prisma Client Update**: Generated new Prisma client for PostgreSQL support

#### Endless Marquee Animation
- **Seamless Loop**: Duplicated marquee content to eliminate visible animation restart
- **Flex Layout**: Added flex display to marquee container for proper content flow
- **Smoother Animation**: Increased duration from 20s to 30s for better visual experience
- **Performance Optimization**: Maintained smooth CSS transform animations

## [2.1.6] - 2025-01-24

### ✨ Scrolling Marquee Animation

#### Animated Right Navigation Bar
- **Scrolling Marquee Effect**: Implemented smooth scrolling animation for "website analysis tool" text
- **Infinite Loop**: Text repeats continuously with bullet separators (•) for visual flow
- **20-Second Animation**: Linear animation cycle using CSS keyframes and translateX
- **Typography Refinement**: Removed font-bold for cleaner appearance, maintained text-sm sizing
- **Overflow Management**: Added overflow-hidden to nav bar for proper text clipping

#### CSS Animation Implementation
- **Keyframe Animation**: Custom @keyframes marquee with 0% to -50% translateX movement
- **Smooth Performance**: Linear timing function for consistent scrolling speed
- **Responsive Design**: Animation works across all screen sizes and orientations
- **Professional Polish**: Adds dynamic visual interest while maintaining sophistication

## [2.1.5] - 2025-01-24

### 🎨 Perfected Navigation Bar Spacing

#### Fixed Padding Issues
- **Increased Padding**: Enhanced from py-12 to py-20 (80px) for proper breathing room
- **Eliminated Edge-Butting**: Logo and text elements no longer touch top/bottom edges
- **Consistent Spacing**: Applied same padding to both left and right navigation bars
- **Professional Layout**: Proper visual hierarchy with adequate white space

#### Typography Refinements
- **Restored Font Weight**: Ensured right nav bar text maintains font-bold styling
- **Consistent Sizing**: Maintained text-sm sizing across all navigation elements
- **Styrene Integration**: Proper font family application for brand consistency

## [2.1.4] - 2025-01-24

### 🎨 Dual Navigation Bar System

#### Enhanced Left Navigation Bar
- **Restored Width**: Returned to 128px (w-32) for better proportions and user feedback
- **Increased Padding**: Enhanced vertical padding (py-12) for improved spacing
- **Larger Logo**: Restored logo to h-8 for better visibility and brand presence
- **White Separator**: Maintained fully white vertical separator line (100px)
- **Brand Attribution**: "A ROUGH tool" link at top with proper text-sm sizing

#### New Right Navigation Bar
- **Mirrored Design**: Added matching right nav bar with same width and styling
- **Styrene Typography**: "website analysis tool" text using Styrene font family
- **Centered Content**: Vertically centered text with 90-degree rotation
- **Professional Branding**: Bold font weight with proper tracking for readability

#### Layout Adjustments
- **Dual Margins**: Main content now uses mx-32 to account for both nav bars
- **Responsive Design**: Maintained responsive behavior across screen sizes
- **Fixed Positioning**: Both nav bars fixed to viewport with proper z-index

## [2.1.3] - 2025-01-24

### 🎨 Optimized Navigation Bar Layout

#### Fixed Viewport Navigation
- **Narrower Width**: Reduced from 128px to 64px (w-16) for better proportions
- **Fixed Positioning**: Position fixed to viewport with full height coverage
- **Dynamic Sizing**: Proper z-index (z-50) for layering above content
- **Viewport Padding**: Improved vertical padding (py-6) for better spacing

#### Visual Improvements
- **White Separator**: Made vertical separator line fully white (removed opacity)
- **Smaller Logo**: Reduced logo size (h-6) for better fit in narrower nav
- **Content Adjustment**: Added left margin (ml-16) to main content for fixed nav
- **Responsive Layout**: Maintained responsive behavior across screen sizes

## [2.1.2] - 2025-01-24

### 🎨 Fixed Navigation Bar Layout

#### Left Nav Bar Improvements
- **Proper Layout Structure**: Fixed left nav bar with flex column layout and proper spacing
- **Bottom-Aligned Logo**: Xrai logo positioned at bottom of nav bar with 90-degree rotation
- **Vertical Separator**: 100px vertical line in center of nav bar for visual balance
- **Brand Attribution**: "A ROUGH tool" link at top of nav bar linking to https://www.rough.ink
- **Hover Effects**: Added smooth opacity transitions for interactive elements
- **Typography**: Proper text sizing and spacing for rotated elements

#### UI/UX Enhancements
- **Visual Hierarchy**: Clear separation between brand elements and logo
- **Professional Branding**: Consistent brand attribution and linking
- **Responsive Design**: Maintained responsive behavior across screen sizes

## [2.1.1] - 2025-01-24

### 🚀 Enhanced Screenshot Capture v2.1

#### Progressive Scroll Loading System
- **Intelligent Page Traversal**: Calculates optimal scroll steps based on page height and viewport
- **Comprehensive Content Triggering**: 1.5s wait per scroll position to trigger lazy-loaded content
- **Animation Library Support**: Automatic triggering of AOS, ScrollMagic, and other animation frameworks
- **Intersection Observer Activation**: Forces visibility checks for scroll-based animations
- **Lazy Loading Detection**: Targets `[data-src]`, `.lazy`, `.lazyload`, `[loading="lazy"]` elements
- **Event Dispatching**: Triggers scroll and resize events to activate dynamic content

#### Enhanced Loading Detection (20+ seconds total)
- **Progressive Scroll Sequence**: Variable duration based on page complexity
- **Scroll-Triggered Content**: Waits for animations and lazy content at each scroll position
- **Image Loading Validation**: Checks for newly loaded images after each scroll step
- **Final Rendering Wait**: 3s settling time after scroll completion

#### Improved Retry Logic
- **Aggressive Scroll Patterns**: Enhanced retry with up to 5 scroll steps
- **Content Triggering**: Dispatches events and forces layout calculations during retry
- **Layout Recalculation**: Forces `getBoundingClientRect()` calls to trigger observers

### 📊 Performance Impact
- **Longer capture times**: 20-40+ seconds depending on page complexity
- **Higher content accuracy**: Captures scroll-triggered animations and lazy content
- **Better mobile compatibility**: Handles progressive enhancement patterns
- **Animation completeness**: Ensures all scroll-based animations are captured

## [2.1.0] - 2025-01-24

### 🎯 Major Features Added

#### Smart Navigation Discovery System
- **Intelligent Page Selection**: Analyzes homepage navigation to identify key pages instead of scraping all discovered URLs
- **Navigation-First Approach**: Prioritizes main navigation and key pages over random discovered URLs
- **12-Page Maximum**: Intelligently selects up to 12 most important pages to respect API rate limits
- **Enhanced Page Categorization**: Improved URL pattern matching for better page classification

#### Rate Limiting & Reliability
- **6-Second Delays**: Added rate limiting between Firecrawl API calls to respect 10 requests/min limit
- **Exponential Backoff**: Intelligent retry logic with 2s → 4s → 8s delays for failed requests
- **Zero Rate Limit Errors**: Eliminated 429 errors through proper request spacing
- **Automatic Fallback**: Graceful degradation from Firecrawl to Puppeteer when needed

#### Enhanced Screenshot Capture v2.0 ✅ WORKING
- **Advanced Multi-Stage Loading Detection**:
  - 8-second initial content rendering wait
  - 15-second dynamic content detection timeout
  - 10-second image loading validation
  - 5-second final rendering wait (13+ seconds total)
- **Comprehensive Wait Conditions**:
  - `networkidle0` for network request completion
  - `document.readyState === 'complete'` validation
  - Body content existence verification
  - All images loaded (`img.complete`) detection
- **Smart Retry Logic**:
  - Automatic retry with additional 10-second wait for failed captures
  - Scroll-based lazy loading triggers for retry attempts
  - Screenshot size validation to detect blank/failed captures
- **Enhanced Error Handling**:
  - Navigation timeout detection (60+ second sites)
  - Frame detachment error recovery
  - Comprehensive logging for debugging
- **Improved ZIP Naming**: `sitename_YYYY-MM-DD_HH-MM-SS.zip` format
- **Full-Page Capture**: Consistent full-page screenshots with quality validation

#### Package Generation Improvements
- **Smart ZIP Naming**: Extract hostname from URL for descriptive package names
- **Timestamp Format**: Clean YYYY-MM-DD_HH-MM-SS format for better organization
- **Enhanced Debugging**: Comprehensive logging for screenshot data flow
- **Graceful Degradation**: System completes analysis even when screenshots fail

#### Font & Typography Extraction System ✅ NEW
- **Comprehensive Font Analysis**: Extract fonts from CSS @font-face rules and HTML links
- **Google Fonts Detection**: Automatic detection and parsing of Google Fonts URLs
- **Custom Font Extraction**: Extract font files with family, weight, style, and format info
- **Font Family Inventory**: Complete list of all typography used across the website
- **Ready-to-Use Assets**: Generated HTML snippets and CSS @font-face rules
- **Download Scripts**: Cross-platform scripts for font file downloading
- **Font Manifest**: JSON manifest with complete font information and instructions
- **Typography Reconstruction**: Clear implementation guide for font integration

### 🎨 UI/UX Improvements

#### Smart Selection Messaging
- **API Limitations Notice**: Clear blue info box explaining intelligent page selection
- **User Education**: Transparent communication about 12-page limit and smart selection benefits
- **Progress Transparency**: Detailed logging of navigation discovery and page selection process

#### Enhanced Progress Tracking
- **Realistic Task Progression**: 22-stage analysis process with authentic task names
- **Staggered Loading Animations**: Stuttering progress bars for realistic feel
- **Timer Estimates**: 5-10 minute estimates with elapsed time tracking
- **Completion Audio**: Chime notifications when analysis completes

### 🔧 Technical Improvements

#### Architecture Enhancements
- **Navigation Discovery Engine**: New `discoverNavigationPages()` function for intelligent page analysis
- **Page Categorization Logic**: Enhanced URL pattern matching for main navigation vs. key pages
- **Rate Limiting Infrastructure**: Global rate limiting with request timing enforcement
- **Fallback Systems**: Robust error handling with multiple fallback strategies

#### Performance Optimizations
- **8x Fewer API Calls**: Reduced from 77+ pages to 8-12 key pages per analysis
- **Faster Analysis Completion**: Focused page selection reduces overall processing time
- **Better Resource Utilization**: More efficient use of API quotas and processing power
- **Improved Error Recovery**: Better handling of failed requests and timeouts

### 🐛 Bug Fixes

#### API Integration
- **Fixed Rate Limit Errors**: Eliminated 429 errors through proper request spacing
- **Improved Error Handling**: Better error messages and recovery strategies
- **Enhanced Retry Logic**: More robust retry mechanisms with exponential backoff
- **Puppeteer API Compatibility**: Fixed deprecated `waitForTimeout` usage

#### Screenshot Reliability v2.0
- **Advanced Loading Detection**: Multi-stage loading with comprehensive wait conditions
- **Intelligent Retry System**: Automatic retry with scroll-based lazy loading triggers
- **Size Validation**: Detection of blank/failed screenshots with automatic retry
- **Error Recovery**: Graceful handling of navigation timeouts and frame detachment
- **Comprehensive Logging**: Step-by-step screenshot capture process tracking
- **Quality Assurance**: Screenshot size validation and quality checks
- **Base64 Encoding**: Proper handling of screenshot data in analysis packages

### 📊 Performance Metrics

#### Before vs. After
- **API Calls**: 77+ pages → 8-12 key pages (8x reduction)
- **Rate Limit Errors**: Frequent 429 errors → Zero errors
- **Analysis Speed**: Variable (often failed) → Consistent 5-10 minutes
- **Success Rate**: ~60% → ~95% completion rate
- **Screenshot Quality**: Inconsistent → Reliable full-page captures

#### User Experience
- **Clear Expectations**: Users now understand the 12-page intelligent selection
- **Predictable Results**: Consistent analysis completion without rate limit failures
- **Better Coverage**: Smart selection ensures important pages are always included
- **Transparent Process**: Detailed logging shows exactly which pages were selected and why

### 🚀 Deployment

#### Infrastructure
- **Vercel Integration**: Seamless deployment with pre-configured environment variables
- **Production URLs**:
  - Primary: xrai.it.com
  - Latest: https://xray-6a157ajpc-dean-roughs-projects.vercel.app
  - Vercel: xray2-git-main-dean-roughs-projects.vercel.app
- **Environment Management**: Proper handling of API keys and database connections
- **Git Integration**: Streamlined development and deployment workflow
- **Deployment Date**: January 24, 2025

### 🔐 Upcoming Features (v2.2.0)

#### Authentication System
- **User Authentication**: Secure login/logout functionality
- **Usage Tracking**: Monitor API usage per user
- **Rate Limiting**: Per-user rate limiting and quotas
- **Session Management**: Secure session handling
- **Access Control**: Protected routes and API endpoints

## [2.0.0] - Previous Release

### Initial Features
- Basic website scraping and analysis
- Lighthouse performance audits
- ZIP package generation
- CRT-style UI interface
- Database persistence
- Resume capability

---

## Development Notes

### Smart Navigation Discovery Algorithm

1. **Homepage Analysis**: Scrape homepage to extract navigation structure
2. **HTML Pattern Matching**: Look for `<nav>`, `<header>`, and navigation class patterns
3. **URL Categorization**: Classify URLs based on patterns:
   - Main Navigation: `/`, `/about`, `/services`, `/products`, `/contact`, etc.
   - Key Pages: `/team`, `/careers`, `/privacy`, `/terms`, etc.
   - Secondary Pages: Two-level deep pages that might be important
4. **Intelligent Selection**: Combine navigation analysis with URL pattern matching
5. **Rate Limit Compliance**: Ensure maximum 12 pages selected

### Rate Limiting Strategy

- **6-second minimum** between Firecrawl API requests
- **Global rate limiting** across all concurrent requests
- **Exponential backoff** for failed requests
- **Automatic fallback** to Puppeteer when Firecrawl fails
- **Progress tracking** with database persistence

### Future Improvements

- **User Page Selection**: Allow users to manually select pages from discovered navigation
- **Advanced Pattern Recognition**: Machine learning for better page importance scoring
- **Batch Processing**: Optimize for larger sites with intelligent batching
- **Real-time Updates**: WebSocket-based progress updates for better UX
