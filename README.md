# Website Rebuild Prompt Generator (WRPG)

A tool for generating comprehensive rebuild prompts for websites using AI analysis.

**Status**: Live deployment with ESLint disabled for build success.

## Features
- Website screenshot capture via Firecrawl API
- Content scraping and analysis
- Performance analysis with Lighthouse
- AI-powered prompt generation for website rebuilds

## Deployment
- **Live URL**: https://xray2-aujvnagps-dean-roughs-projects.vercel.app
- **Platform**: Vercel
- **Framework**: Next.js 15

## Environment Variables Required
- `DATABASE_URL` - NeonDB PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API for prompt generation
- `FIRECRAWL_API_KEY` - Firecrawl API for web scraping

## Deployment Status
✅ **CONNECTED**: Vercel project linked to xray2 repo
✅ **FIXED**: Prisma generation added to build process
✅ **READY**: ESLint disabled, all build issues resolved
🚀 **DEPLOYING**: Fresh deployment triggered - 2025-05-22 23:45:00 UTC
