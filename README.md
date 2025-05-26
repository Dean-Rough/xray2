# Xrai - Website X-Ray Analysis Tool

Xrai is an advanced website analysis tool that performs deep x-ray scans of websites to generate comprehensive rebuild packages. It combines web scraping, performance analysis, and AI-powered insights to create detailed documentation for website reconstruction.

## 🎯 Key Features

### **Smart Navigation Discovery**
- **Intelligent Page Selection**: Analyzes homepage navigation to identify key pages
- **Rate Limit Compliance**: Respects Firecrawl API limits (10 requests/min) with smart selection
- **Navigation-First Approach**: Prioritizes main navigation and key pages over random URLs
- **12-Page Limit**: Intelligently selects up to 12 most important pages per site

### **Advanced Scanning Capabilities**
- **Deep Website Analysis**: Comprehensive structure, content, and asset analysis
- **Full-Page Screenshots**: High-quality Puppeteer captures with improved loading detection
- **Performance Metrics**: Lighthouse audits for performance, accessibility, and SEO
- **AI-Powered Insights**: Structured data extraction and intelligent analysis
- **Multi-Format Output**: JSON data, ZIP packages, and downloadable assets

### **Reliability & Performance**
- **Rate-Limited Processing**: 6-second delays between API calls to prevent rate limit errors
- **Exponential Backoff**: Intelligent retry logic with 3 attempts (2s, 4s, 8s delays)
- **Resume Capability**: Can resume failed analyses from the last successful step
- **Fallback Systems**: Automatic fallback from Firecrawl to Puppeteer when needed

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firecrawl API key
- Database (PostgreSQL recommended)

### Environment Variables
Create a `.env.local` file:

```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_api_key (optional)
```

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3250
```

## 🔧 Technical Architecture

### **Smart Navigation Discovery System**
1. **Homepage Analysis**: Scrapes homepage to extract navigation structure
2. **Page Categorization**: Identifies main navigation vs. key pages using URL patterns
3. **Intelligent Selection**: Combines navigation analysis with URL pattern matching
4. **Rate Limit Compliance**: Ensures maximum 12 pages selected to respect API limits

### **Rate Limiting Strategy**
- **6-second delays** between Firecrawl API requests (10 requests/min limit)
- **Exponential backoff** retry logic: 2s → 4s → 8s delays
- **Automatic fallback** to Puppeteer when Firecrawl fails
- **Progress tracking** with database persistence for resume capability

### **Enhanced Screenshot Capture v2.1**
- **Progressive Scroll Loading**: Comprehensive page traversal to trigger all content
  - Intelligent scroll steps based on page height and viewport
  - 1.5s wait per scroll position for content loading
  - Scroll-triggered animation and lazy loading activation
  - Intersection observer and animation library triggers
- **Advanced Multi-Stage Loading**: 20+ second comprehensive loading detection
  - 8s initial content rendering wait
  - 15s dynamic content detection timeout
  - 10s image loading validation
  - Progressive scroll sequence (varies by page height)
  - 3s final rendering wait after scroll completion
- **Intelligent Wait Conditions**:
  - `networkidle0` for network request completion
  - `document.readyState === 'complete'` validation
  - Body content existence verification
  - All images loaded (`img.complete`) detection
  - Lazy loading element detection and triggering
- **Smart Retry Logic**: Enhanced retry with aggressive scroll patterns
- **Quality Validation**: Screenshot size validation to detect blank/failed captures
- **Enhanced Error Handling**: Navigation timeout, frame detachment recovery
- **Base64 Encoding**: Embedded screenshots in analysis packages

## 📊 API Endpoints

### `POST /api/generate-prompt`
Starts a new website analysis with smart navigation discovery.

**Request:**
```json
{
  "url": "https://example.com",
  "fullSite": true,
  "includeScreenshots": true,
  "maxPages": 12
}
```

**Response:**
```json
{
  "id": "analysis-id",
  "status": "PENDING"
}
```

### `GET /api/generate-prompt?id={analysisId}`
Checks analysis status and retrieves results.

### `GET /api/download-package?id={analysisId}`
Downloads the complete analysis package as ZIP.

### `POST /api/resume-analysis`
Resumes a failed analysis from the last successful step.

## 🎨 UI Features

### **CRT-Style Interface**
- **Monochrome dark mode** with VHS aesthetic
- **Animated scan lines** and screen noise effects
- **Real-time progress tracking** with authentic task cycling
- **Audio completion chimes** for user feedback
- **Smart page limit notice** explaining intelligent selection

### **Progress Indicators**
- **Realistic task progression** through 22 analysis stages
- **Staggered loading animations** with stuttering for authenticity
- **Timer estimates** (5-10 minutes) with elapsed time tracking
- **Completion status** with download package options

## 🔄 Deployment

### **Vercel Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Environment variables are pre-configured
# Project ID: prj_gF6t9JD4XQwRSKt0F8bs3li0KxSu
```

### **Production URLs**
- **Primary**: xrai.it.com
- **Latest**: https://xray-epxln0bjo-dean-roughs-projects.vercel.app
- **Previous**: https://xray-ga3sjsycn-dean-roughs-projects.vercel.app
- **Vercel**: xray2-git-main-dean-roughs-projects.vercel.app

## 📈 Recent Improvements

### **v2.1.1 - Progressive Scroll Loading Screenshots ✅ WORKING**
- ✅ **Progressive scroll loading** with intelligent page traversal
- ✅ **Scroll-triggered content capture** for animations and lazy loading
- ✅ **Animation library support** (AOS, ScrollMagic, intersection observers)
- ✅ **Enhanced loading detection** with 20-40+ second comprehensive capture
- ✅ **Lazy loading element targeting** for complete content capture
- ✅ **Improved retry logic** with aggressive scroll patterns
- ✅ **Event dispatching** to trigger dynamic content loading
- ✅ **Layout recalculation** forcing for intersection observer activation

### **v2.1.0 - Smart Navigation Discovery & Enhanced Screenshots ✅ WORKING**
- ✅ **Intelligent page selection** based on navigation analysis
- ✅ **Rate limit compliance** with 6-second delays
- ✅ **12-page maximum** to respect API constraints
- ✅ **Enhanced UI messaging** about smart selection
- ✅ **Advanced screenshot system v2.0** with 13+ second loading detection
- ✅ **Multi-stage loading validation** with comprehensive wait conditions
- ✅ **Smart retry logic** with scroll-based lazy loading triggers
- ✅ **Quality validation** to detect and retry blank/failed screenshots
- ✅ **Enhanced error handling** for navigation timeouts and frame detachment
- ✅ **Improved ZIP naming** with `sitename_YYYY-MM-DD_HH-MM-SS.zip` format
- ✅ **Graceful degradation** for problematic sites
- ✅ **Comprehensive debugging** and logging system
- ✅ **Font & Typography Extraction** with comprehensive font analysis
- ✅ **Google Fonts detection** and HTML snippet generation
- ✅ **Custom font extraction** with @font-face rules and download scripts

### **Performance Gains**
- **8x fewer API calls** (from 77+ pages to 8-12 key pages)
- **Zero rate limit errors** with intelligent delays
- **Faster analysis completion** due to focused page selection
- **Enhanced screenshot quality** with 13+ second loading detection and validation
- **Improved reliability** with smart retry logic and error handling
- **Better coverage** of slow-loading and JavaScript-heavy sites

### **🔤 Font & Typography Extraction (NEW)**
- **Comprehensive Font Analysis**: Extract all fonts from CSS and HTML
- **Google Fonts Detection**: Automatic detection and HTML snippet generation
- **Custom Font Extraction**: @font-face rules with download scripts
- **Font Family Lists**: Complete typography inventory for reconstruction
- **Ready-to-Use Assets**: Generated CSS and HTML for easy implementation
- **Cross-Platform Scripts**: Font download scripts for Windows and Unix

### **🔐 Next: Authentication System (v2.2.0)**
- **User Authentication**: Secure login/logout functionality
- **Usage Tracking**: Monitor API usage per user
- **Rate Limiting**: Per-user quotas and limits
- **Session Management**: Secure session handling
- **Access Control**: Protected routes and API endpoints
- **User Dashboard**: Personal analysis history and usage stats

## 🛠️ Development

### **Key Files**
- `lib/mcp-utils.ts` - Smart navigation discovery and rate limiting
- `lib/data-processing.ts` - Main analysis orchestration
- `app/page.tsx` - CRT-style UI with progress tracking
- `app/api/generate-prompt/route.ts` - Analysis API endpoint

### **Testing**
```bash
# Test smart navigation discovery
curl -X POST "http://localhost:3250/api/generate-prompt" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com", "fullSite": true, "maxPages": 12}'
```

## 📝 License

MIT License - Built for elite web developers who need comprehensive website analysis tools.
