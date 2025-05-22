# Environment Setup Guide

## Required Environment Variables

### 1. OpenAI API Key
- Variable Name: `OPENAI_API_KEY`
- Description: API key for OpenAI services
- Obtain from: [OpenAI Platform](https://platform.openai.com/account/api-keys)
- Security: Keep this secret, never commit to version control

### 2. NeonDB PostgreSQL Connection
- Variable Name: `DATABASE_URL`
- Description: PostgreSQL connection string for NeonDB
- Format: `postgresql://username:password@host/database?sslmode=require`

### 3. Firecrawl API Key (Optional)
- Variable Name: `FIRECRAWL_API_KEY`
- Description: API key for Firecrawl web crawling service
- Obtain from: [Firecrawl Dashboard](https://www.firecrawl.dev)

### 4. Application Port
- Variable Name: `PORT`
- Description: Port number for the Next.js development server
- Default: `3250`
- Note: This ensures the WRPG app runs on a unique port to avoid conflicts

## Setup Steps

1. Create a `.env` file in the `src/` directory
   ```bash
   cd src
   touch .env
   ```

2. Open `.env` and add the following template:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgresql://neondb_owner:your_password@ep-bold-unit-aby1dlud-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
   FIRECRAWL_API_KEY=your_firecrawl_api_key_optional
   PORT=3250
   ```

3. Replace placeholder values with your actual credentials
   - Do NOT commit this file to version control
   - Add `.env` to your `.gitignore`

## Recommended Packages
- `uuid`: For generating unique request identifiers
- `prisma`: Database ORM
- `openai`: OpenAI API client
- `@firecrawl/js`: Firecrawl web crawling SDK (optional)

## Security Notes
- Never commit `.env` to version control
- Use environment-specific configurations
- Rotate API keys periodically
- Use strong, unique passwords for each service

## Troubleshooting
- If environment variables are not loading, ensure you have `dotenv` configured in your Next.js project
- Verify API keys have the correct permissions
- Check network connectivity for database connections