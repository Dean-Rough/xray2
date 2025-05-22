/**
 * Type definitions for the Website Rebuild Prompt Generator
 */

export interface ProcessedSiteMap {
  pages: string[];
  structure: Record<string, unknown>;
  metadata: {
    createdAt: string;
    version: string;
    totalPages: number;
    error?: string;
  };
}

export interface ProcessedContentData {
  html: string;
  markdown: string;
  links: string[];
  assets: AssetInfo[];
  metadata: Record<string, string>;
  createdAt: string;
  version: string;
  error?: string;
}

export interface AssetInfo {
  url: string;
  type: 'CSS' | 'JAVASCRIPT' | 'IMAGE' | 'FONT' | 'VIDEO' | 'AUDIO' | 'OTHER';
}

export interface ProcessedPerformanceData {
  performance: {
    score: number;
    metrics: Record<string, unknown>;
  };
  accessibility: {
    score: number;
    metrics: Record<string, unknown>;
  };
  seo: {
    score: number;
    metrics: Record<string, unknown>;
  };
  bestPractices: {
    score: number;
    metrics: Record<string, unknown>;
  };
  metadata: {
    createdAt: string;
    version: string;
    error?: string;
  };
}

export interface StructuredData {
  technologies: string[];
  designPatterns: string[];
  keyFeatures: string[];
  colorPalette: string[];
  fontFamilies: string[];
}

export interface SonnetPrompt {
  metadata: {
    generatedAt: string;
    version: string;
    generatedFor: string;
    promptType: string;
  };
  siteOverview: Record<string, unknown>;
  pageDetails: Record<string, unknown>;
  components: Record<string, unknown>[];
  assets: Record<string, AssetInfo[]>;
  performanceConsiderations: Record<string, unknown>;
  reconstructionInstructions: Record<string, unknown>;
}

export interface ScrapingOptions {
  fullSite?: boolean;
  includeScreenshots?: boolean;
  includeLighthouse?: boolean;
  maxPages?: number;
}

export interface AnalysisResult {
  id: string;
  url: string;
  status: 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  result?: Record<string, unknown>;
}

// MCP (Machine Control Protocol) Types
export interface McpClientConfig {
  clientId: string;
  clientType: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface McpAuthOptions {
  type: 'api_key' | 'oauth' | 'bearer' | 'basic';
  credentials: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
  };
  scopes?: string[];
  expiresAt?: Date;
}

export interface McpResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    rateLimit?: {
      remaining: number;
      resetAt: Date;
    };
  };
}

export interface McpEvent {
  type: string;
  clientId: string;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface McpClientStatus {
  clientId: string;
  clientType: string;
  status: 'connected' | 'disconnected' | 'error' | 'rate_limited';
  lastActivity?: string;
  errorMessage?: string;
}
