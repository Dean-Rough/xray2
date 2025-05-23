# Development Guide: Website Rebuild Prompt Generator (WRPG)

## 🚀 DEPLOYMENT STATUS (Updated: May 23, 2025)

### ✅ COMPLETED SETUP:
- **Database**: NeonDB PostgreSQL configured and synced
- **Environment Variables**: All configured locally and in Vercel
  - DATABASE_URL: ✅ Connected to NeonDB
  - OPENAI_API_KEY: ✅ Configured
  - FIRECRAWL_API_KEY: ✅ Active (fc-9aa5cec432c84d8686b5dfa4bdb906ac)
- **Vercel Deployment**: ✅ Connected to GitHub repo & locally linked
- **Build Configuration**: ✅ Fixed ESLint issues and async/await errors

### 🔧 CURRENT STATUS:
- **Local Development**: Vercel CLI linked to project
- **Production Deployment**: ✅ DEPLOYED & WORKING at `https://xray-py6rfm99p-dean-roughs-projects.vercel.app`
- **Repository**: https://github.com/Dean-Rough/xray2
- **Vercel Project**: Linked to `xray` project in dean-rough's scope
- **Status**: Ready for production use

### 🐛 RECENT FIXES (May 23, 2025):
- **Async/Await Build Error**: Fixed forEach loops with async operations in `lib/generate-docs.ts`
  - Converted to `for...of` loops to properly handle async/await
  - Affected functions: `savePageFiles` and `saveScreenshots`
- **Error Logging**: Added comprehensive error logging to `data-processing.ts` for production debugging
- **Environment Variables**: All confirmed working in Vercel production environment
- **Deployment**: Successfully deployed with "Ready" status confirmed

## 1. Getting Started

### 1.1 Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- Python (for Lighthouse CLI)
- Puppeteer (for fallback screenshot capture)
- Firecrawl API key (configured)

### 1.2 Project Setup
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
open http://localhost:3000
```

### 1.3 Directory Structure
```
/docs - Project documentation
/src - Next.js application source code
/src/app - Main application files
/src/app/api - API routes for server-side processing
/src/lib - Utility libraries for data processing and documentation generation
/public - Static assets
```

## 2. Development Workflow

### 2.1 Making Changes
1. For frontend changes:
   - Modify files in `/src/app` and `/src/components`
   - Use React components and Tailwind CSS for styling

2. For backend changes:
   - Modify files in `/src/app/api/generate-prompt/route.ts`
   - Update data processing logic in `/src/lib/data-processing.ts`
   - Enhance documentation generation in `/src/lib/generate-docs.ts`

3. For documentation updates:
   - Modify the appropriate file in `/docs`

### 2.2 Testing

#### Package Quality Testing (CRITICAL)
**Before any release or major changes, run our comprehensive package quality assessment:**

1. **Quick Quality Check**: Use `docs/QUALITY-CHECKLIST.md` for rapid validation
2. **Full AI Evaluation**: Follow `docs/TESTING-PROTOCOL.md` for comprehensive assessment
3. **Success Criteria**: Package must score ≥ 8/10 with zero BLOCKING issues

**Quality Gates:**
- [ ] Screenshots actually captured (not placeholder text)
- [ ] CSS files extracted (not just HTML class names)
- [ ] Components complete (not truncated)
- [ ] AI evaluator confirms reconstruction feasibility

#### Automated Testing
1. Run unit tests:
```bash
npm run test
```

2. Run integration tests:
```bash
npm run test:integration
```

#### Manual Testing
3. Test with various website types:
   - Simple static sites
   - Complex dynamic sites
   - Sites with JavaScript-heavy content
   - Elementor/WordPress sites
   - E-commerce sites

**Remember**: If an AI can't rebuild the site with our package, we've failed our core mission.

### 2.3 Debugging
1. Use VSCode's built-in debugger for Next.js code
2. For API route debugging:
   - Set breakpoints in `/src/app/api/generate-prompt/route.ts`
   - Use `console.log` statements for quick debugging
3. For client-side debugging:
   - Use browser developer tools
   - Add `debugger` statements in client-side code

## 3. Implementation Details

### 3.1 Key Files
- **Frontend:**
  - `src/app/page.tsx` - Main UI component
  - `src/app/layout.tsx` - Shared layout
  - `src/app/components/url-input-form.tsx` - URL input component

- **Backend:**
  - `src/app/api/generate-prompt/route.ts` - Main API route for prompt generation
  - `src/lib/data-processing.ts` - Data parsing and processing utilities
  - `src/lib/generate-docs.ts` - Documentation generation logic

### 3.2 API Implementation
- **URL Input Handling:**
  - Validate URL format
  - Sanitize input
  - Handle errors gracefully

- **Firecrawl Integration:**
  - Call `firecrawl_map` to get site structure
  - Use `firecrawl_scrape` for content extraction
  - Handle Firecrawl errors and timeouts

- **Lighthouse Integration:**
  - Use `execute_command` to run Lighthouse CLI
  - Parse Lighthouse JSON output
  - Handle Lighthouse errors and timeouts

- **Screenshot Capture:**
  - Prefer Firecrawl's screenshot feature
  - Fallback to Puppeteer if needed
  - Save screenshots in appropriate format

- **Documentation Generation:**
  - Structure data in AI-friendly format
  - Create Markdown files with appropriate sections
  - Package files using JSZip

## 4. Building and Running

### 4.1 Development Build
```bash
npm run dev
```

### 4.2 Production Build
```bash
npm run build
```

### 4.3 Running the Application
```bash
npm run start
```

## 5. Troubleshooting

### 5.1 Common Issues

#### Firecrawl Integration
- **Issue:** Firecrawl server not responding
  - **Solution:** Ensure the Firecrawl MCP server is running
  - **Solution:** Check server logs for errors
  - **Solution:** Verify the connection settings in `mcp_settings.json`

#### Lighthouse CLI
- **Issue:** Lighthouse not installed
  - **Solution:** Install Lighthouse globally: `npm install -g lighthouse`
- **Issue:** Lighthouse timeouts
  - **Solution:** Increase timeout settings
  - **Solution:** Check network connectivity to target site

#### Screenshot Capture
- **Issue:** Screenshots not capturing correctly
  - **Solution:** Verify Puppeteer installation
  - **Solution:** Check browser permissions
  - **Solution:** Ensure headless Chrome is accessible

#### Data Processing
- **Issue:** Incomplete data extraction
  - **Solution:** Review Firecrawl output for completeness
  - **Solution:** Add additional parsing rules in data-processing.ts
- **Issue:** Performance metrics not displaying
  - **Solution:** Verify Lighthouse output format
  - **Solution:** Check JSON parsing logic in data-processing.ts

## 6. Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Commit your changes with clear messages
5. Push to your branch
6. Submit a pull request

## 7. Versioning

This project uses a versioning scheme that reflects its development phases:

- **0.0.x:** Initial setup and planning
- **0.1.x:** MVP (Alpha) - Core functionality
- **0.2.x:** Enhanced functionality
- **0.3.x:** Advanced analysis and optimization
- **0.4.x+:** Production-ready features and refinements

## 8. License

[MIT License](https://opensource.org/licenses/MIT) - See LICENSE file in project root

## 9. Acknowledgments

- Next.js for the application framework
- Firecrawl for website content extraction
- Lighthouse for performance metrics
- Puppeteer for browser automation
- JSZip for documentation packaging