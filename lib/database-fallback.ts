/**
 * Database fallback for when Prisma/PostgreSQL is not available
 * This provides in-memory storage for development and emergency fallback
 */

interface WebsiteAnalysisData {
  id: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
  processingTime?: number;
  options?: any;
}

// In-memory storage (will be lost on server restart, but works for demo)
const analysisStore = new Map<string, WebsiteAnalysisData>();

export class DatabaseFallback {
  static async createAnalysis(data: Omit<WebsiteAnalysisData, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = Math.random().toString(36).substring(2, 15);
    const analysis: WebsiteAnalysisData = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    analysisStore.set(id, analysis);
    console.log('📝 Created analysis (fallback):', id);
    return analysis;
  }

  static async updateAnalysis(id: string, data: Partial<WebsiteAnalysisData>) {
    const existing = analysisStore.get(id);
    if (!existing) {
      throw new Error(`Analysis ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    analysisStore.set(id, updated);
    console.log('📝 Updated analysis (fallback):', id);
    return updated;
  }

  static async findAnalysis(id: string) {
    const analysis = analysisStore.get(id);
    if (!analysis) {
      throw new Error(`Analysis ${id} not found`);
    }
    return analysis;
  }

  static async listAnalyses() {
    return Array.from(analysisStore.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  static async deleteAnalysis(id: string) {
    const deleted = analysisStore.delete(id);
    if (!deleted) {
      throw new Error(`Analysis ${id} not found`);
    }
    console.log('🗑️ Deleted analysis (fallback):', id);
    return true;
  }

  static getStats() {
    return {
      total: analysisStore.size,
      byStatus: Array.from(analysisStore.values()).reduce((acc, analysis) => {
        acc[analysis.status] = (acc[analysis.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

/**
 * Smart database client that tries Prisma first, falls back to in-memory
 */
export async function getDbClient() {
  try {
    // Try to import and use Prisma
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test the connection
    await prisma.$connect();
    console.log('✅ Using Prisma database');
    return {
      type: 'prisma' as const,
      client: prisma,
    };
  } catch (error) {
    console.warn('⚠️ Prisma not available, using fallback storage:', error instanceof Error ? error.message : String(error));
    return {
      type: 'fallback' as const,
      client: DatabaseFallback,
    };
  }
}

/**
 * Universal database operations that work with both Prisma and fallback
 */
export class UniversalDb {
  static async createWebsiteAnalysis(data: {
    url: string;
    status?: string;
    options?: any;
  }) {
    const db = await getDbClient();
    
    if (db.type === 'prisma') {
      return await db.client.websiteAnalysis.create({
        data: {
          url: data.url,
          status: (data.status as any) || 'PENDING',
          options: data.options,
        },
      });
    } else {
      return await db.client.createAnalysis({
        url: data.url,
        status: (data.status as any) || 'PENDING',
        options: data.options,
      });
    }
  }

  static async updateWebsiteAnalysis(id: string, data: {
    status?: string;
    result?: any;
    error?: string;
    processingTime?: number;
  }) {
    const db = await getDbClient();
    
    if (db.type === 'prisma') {
      return await db.client.websiteAnalysis.update({
        where: { id },
        data: {
          status: data.status as any,
          result: data.result,
          error: data.error,
          processingTime: data.processingTime,
        },
      });
    } else {
      return await db.client.updateAnalysis(id, {
        status: data.status as any,
        result: data.result,
        error: data.error,
        processingTime: data.processingTime,
      });
    }
  }

  static async findWebsiteAnalysis(id: string) {
    const db = await getDbClient();
    
    if (db.type === 'prisma') {
      return await db.client.websiteAnalysis.findUnique({
        where: { id },
      });
    } else {
      return await db.client.findAnalysis(id);
    }
  }

  static async listWebsiteAnalyses() {
    const db = await getDbClient();
    
    if (db.type === 'prisma') {
      return await db.client.websiteAnalysis.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return await db.client.listAnalyses();
    }
  }
}
