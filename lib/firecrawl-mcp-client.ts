/**
 * Firecrawl MCP Client Integration
 * Uses the official Firecrawl MCP server for enhanced web scraping
 * Provides batch processing, better error handling, and proper screenshot management
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

// MCP Configuration
const MCP_CONFIG = {
  retryMaxAttempts: 3,
  retryInitialDelay: 2000,
  retryBackoffFactor: 2,
  timeout: 120000, // 2 minutes
  serverCommand: 'npx',
  serverArgs: ['-y', 'firecrawl-mcp']
};

// Global MCP client instance
let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

/**
 * Initialize MCP client connection
 */
async function initializeMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || apiKey === 'your_firecrawl_api_key_here') {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }

    console.log('🔄 Initializing Firecrawl MCP client...');

    // Set up environment variables for the MCP server
    const env = {
      ...process.env,
      FIRECRAWL_API_KEY: apiKey,
      FIRECRAWL_RETRY_MAX_ATTEMPTS: MCP_CONFIG.retryMaxAttempts.toString(),
      FIRECRAWL_RETRY_INITIAL_DELAY: MCP_CONFIG.retryInitialDelay.toString(),
      FIRECRAWL_RETRY_BACKOFF_FACTOR: MCP_CONFIG.retryBackoffFactor.toString()
    };

    // Spawn the MCP server process
    const serverProcess = spawn(MCP_CONFIG.serverCommand, MCP_CONFIG.serverArgs, {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Create transport and client
    mcpTransport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin
    });

    mcpClient = new Client(
      {
        name: 'xrai-firecrawl-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    // Connect to the server
    await mcpClient.connect(mcpTransport);

    console.log('✅ Firecrawl MCP client initialized successfully');
    return mcpClient;

  } catch (error) {
    console.error('❌ Failed to initialize MCP client:', error);
    mcpClient = null;
    mcpTransport = null;
    throw error;
  }
}

/**
 * Execute MCP tool with proper error handling and retries
 */
async function executeMCPTool(toolName: string, arguments_: any): Promise<any> {
  let lastError: Error;

  for (let attempt = 1; attempt <= MCP_CONFIG.retryMaxAttempts; attempt++) {
    try {
      console.log(`🔄 Executing MCP tool: ${toolName} (attempt ${attempt}/${MCP_CONFIG.retryMaxAttempts})`);

      const client = await initializeMCPClient();

      const result = await client.callTool({
        name: toolName,
        arguments: arguments_
      });

      if (result.isError) {
        throw new Error(`MCP tool error: ${result.content?.[0]?.text || 'Unknown error'}`);
      }

      console.log(`✅ MCP tool ${toolName} completed successfully`);
      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ MCP tool ${toolName} attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));

      if (attempt === MCP_CONFIG.retryMaxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        MCP_CONFIG.retryInitialDelay * Math.pow(MCP_CONFIG.retryBackoffFactor, attempt - 1),
        30000 // Max 30 seconds
      );

      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Reset client on error to force reconnection
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.warn('Warning: Failed to close MCP client:', closeError);
        }
        mcpClient = null;
        mcpTransport = null;
      }
    }
  }

  throw new Error(`MCP tool ${toolName} failed after ${MCP_CONFIG.retryMaxAttempts} attempts. Last error: ${lastError.message}`);
}

/**
 * Batch scrape multiple URLs using Firecrawl MCP server
 * This is the primary method for efficient multi-page scraping
 */
export async function batchScrapeWithMCP(urls: string[], options?: {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  mobile?: boolean;
}): Promise<any> {
  try {
    console.log(`🚀 Starting MCP batch scrape for ${urls.length} URLs`);

    // Prepare MCP batch scrape arguments
    const mcpArgs = {
      urls,
      options: {
        formats: options?.formats || ['markdown', 'html', 'screenshot@fullPage', 'links'],
        onlyMainContent: options?.onlyMainContent || false,
        waitFor: options?.waitFor || 5000,
        mobile: options?.mobile || false
      }
    };

    const result = await executeMCPTool('firecrawl_batch_scrape', mcpArgs);

    console.log(`✅ MCP batch scrape completed for ${urls.length} URLs`);
    return result;

  } catch (error) {
    console.error('❌ MCP batch scrape failed:', error);
    throw new Error(`MCP batch scrape failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Single URL scrape using Firecrawl MCP server
 * Use this for individual page scraping with advanced options
 */
export async function scrapeWithMCP(url: string, options?: {
  formats?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  mobile?: boolean;
  actions?: any[];
}): Promise<any> {
  try {
    console.log(`🔄 Starting MCP scrape for: ${url}`);

    // Prepare MCP scrape arguments
    const mcpArgs = {
      url,
      formats: options?.formats || ['markdown', 'html', 'screenshot@fullPage', 'links'],
      onlyMainContent: options?.onlyMainContent || false,
      waitFor: options?.waitFor || 5000,
      mobile: options?.mobile || false,
      actions: options?.actions || []
    };

    const result = await executeMCPTool('firecrawl_scrape', mcpArgs);

    console.log(`✅ MCP scrape completed for: ${url}`);
    return result;

  } catch (error) {
    console.error(`❌ MCP scrape failed for ${url}:`, error);
    throw new Error(`MCP scrape failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Map website URLs using Firecrawl MCP server
 * Discovers all accessible URLs on a website
 */
export async function mapWebsiteWithMCP(url: string, options?: {
  maxDepth?: number;
  limit?: number;
  allowExternalLinks?: boolean;
}): Promise<string[]> {
  try {
    console.log(`🗺️ Starting MCP website mapping for: ${url}`);

    // Use the map tool for URL discovery
    const mcpArgs = {
      url
    };

    const result = await executeMCPTool('firecrawl_map', mcpArgs);

    // Extract URLs from map result
    if (result.content && Array.isArray(result.content)) {
      // Look for text content that contains URLs
      const textContent = result.content.find((item: any) => item.type === 'text');

      if (textContent && textContent.text) {
        try {
          // Try to parse as JSON first (structured response)
          const parsedData = JSON.parse(textContent.text);
          if (Array.isArray(parsedData)) {
            const urls = parsedData.filter((url: string) => url.startsWith('http'));
            console.log(`✅ MCP mapping found ${urls.length} URLs (JSON format)`);
            return urls;
          }
        } catch (parseError) {
          // If not JSON, try to extract URLs from plain text
          const urlRegex = /https?:\/\/[^\s]+/g;
          const urls = textContent.text.match(urlRegex) || [];

          if (urls.length > 0) {
            console.log(`✅ MCP mapping found ${urls.length} URLs (text format)`);
            return urls;
          }
        }
      }

      // Fallback: try to extract from all text items
      const urls = result.content
        .filter((item: any) => item.type === 'text' && item.text)
        .map((item: any) => item.text)
        .filter((text: string) => text.startsWith('http'));

      if (urls.length > 0) {
        console.log(`✅ MCP mapping found ${urls.length} URLs (fallback format)`);
        return urls;
      }
    }

    console.log('⚠️ MCP mapping returned unexpected format, using fallback');
    return [url]; // Fallback to original URL

  } catch (error) {
    console.error('❌ MCP website mapping failed:', error);
    throw new Error(`MCP mapping failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if MCP server is available and properly configured
 */
export async function checkMCPAvailability(): Promise<boolean> {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || apiKey === 'your_firecrawl_api_key_here') {
      console.log('❌ MCP not available: FIRECRAWL_API_KEY not configured');
      return false;
    }

    console.log('🔍 Testing MCP server availability...');

    // TEMPORARY: Disable MCP to avoid connection issues
    // The MCP integration has transport connection issues that need to be resolved
    // For now, we'll use the standard Firecrawl API which is working perfectly
    console.log('⚠️ MCP temporarily disabled - using standard Firecrawl API');
    return false;

    // TODO: Fix MCP client connection issues
    // The error "The 'file' argument must be of type string. Received undefined"
    // indicates the StdioClientTransport is not being set up correctly

    /*
    // Try to initialize the MCP client
    const client = await initializeMCPClient();

    // List available tools to verify the server is working
    const tools = await client.listTools();

    if (tools && tools.tools && tools.tools.length > 0) {
      const toolNames = tools.tools.map((tool: any) => tool.name);
      console.log(`✅ MCP server available with tools: ${toolNames.join(', ')}`);
      return true;
    } else {
      console.log('⚠️ MCP server connected but no tools available');
      return false;
    }
    */

  } catch (error) {
    console.log('❌ MCP server not available:', error instanceof Error ? error.message : String(error));

    // Clean up failed connection
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        console.warn('Warning: Failed to close MCP client during availability check:', closeError);
      }
      mcpClient = null;
      mcpTransport = null;
    }

    return false;
  }
}

/**
 * Extract structured data using MCP server
 */
export async function extractWithMCP(urls: string[], options?: {
  prompt?: string;
  schema?: any;
}): Promise<any> {
  try {
    console.log(`🔍 Starting MCP extraction for ${urls.length} URLs`);

    const mcpArgs = {
      urls,
      prompt: options?.prompt || 'Extract all relevant information from this webpage',
      schema: options?.schema
    };

    const result = await executeMCPTool('firecrawl_extract', mcpArgs);

    console.log(`✅ MCP extraction completed for ${urls.length} URLs`);
    return result;

  } catch (error) {
    console.error('❌ MCP extraction failed:', error);
    throw new Error(`MCP extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up MCP client connection
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
      console.log('✅ MCP client connection closed');
    } catch (error) {
      console.warn('Warning: Failed to close MCP client:', error);
    } finally {
      mcpClient = null;
      mcpTransport = null;
    }
  }
}
