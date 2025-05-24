#!/usr/bin/env node

/**
 * Test script for Firecrawl MCP integration
 * This script tests the MCP client functionality
 */

// Load environment variables
require('dotenv').config({ path: './src/.env' });

async function loadMCPClient() {
  // Dynamic import for ES modules
  const module = await import('./src/lib/firecrawl-mcp-client.js');
  return {
    checkMCPAvailability: module.checkMCPAvailability,
    scrapeWithMCP: module.scrapeWithMCP
  };
}

async function testMCPIntegration() {
  console.log('🧪 Testing Firecrawl MCP Integration...\n');

  try {
    // Load the MCP client functions
    const { checkMCPAvailability, scrapeWithMCP } = await loadMCPClient();

    // Test 1: Check MCP availability
    console.log('1️⃣ Testing MCP server availability...');
    const isAvailable = await checkMCPAvailability();

    if (isAvailable) {
      console.log('✅ MCP server is available and working!\n');

      // Test 2: Try a simple scrape
      console.log('2️⃣ Testing MCP scraping with a simple URL...');
      const testUrl = 'https://example.com';

      const result = await scrapeWithMCP(testUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      });

      if (result && result.content) {
        console.log('✅ MCP scraping successful!');
        console.log('📄 Content preview:', result.content[0]?.text?.substring(0, 200) + '...');
      } else {
        console.log('⚠️ MCP scraping returned unexpected format');
        console.log('Result:', JSON.stringify(result, null, 2));
      }

    } else {
      console.log('❌ MCP server is not available');
      console.log('This could be due to:');
      console.log('- Missing FIRECRAWL_API_KEY environment variable');
      console.log('- firecrawl-mcp package not installed globally');
      console.log('- Network connectivity issues');
      console.log('- Firecrawl API service issues');
    }

  } catch (error) {
    console.error('❌ MCP test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testMCPIntegration().then(() => {
  console.log('\n🏁 MCP integration test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});
