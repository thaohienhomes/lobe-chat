/**
 * Multi-layer Response Caching System
 * 
 * Implements intelligent caching strategy:
 * - L1: Memory cache (fastest, limited capacity)
 * - L2: Redis cache (fast, persistent)
 * - Different TTL for budget vs premium models
 * - Semantic similarity caching
 */

import crypto from 'crypto';
import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

interface CacheConfig {
  memoryMaxSize: number;
  memoryTTL: number;
  redisUrl?: string;
  defaultTTL: number;
  budgetModelTTL: number;
  premiumModelTTL: number;
}

interface CacheEntry {
  response: string;
  model: string;
  timestamp: number;
  tokens: number;
  cost: number;
}

interface CacheStats {
  memoryHits: number;
  redisHits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  costSaved: number;
}

export class ResponseCache {
  private memory: LRUCache<string, CacheEntry>;
  private redis: Redis | null = null;
  private config: CacheConfig;
  private stats: CacheStats;

  // Budget models get longer cache (cheaper to serve from cache)
  private budgetModels = [
    'gemini-1.5-flash',
    'gpt-4o-mini', 
    'claude-3-haiku',
  ];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memoryMaxSize: 1000, // 1000 entries
      memoryTTL: 1000 * 60 * 15, // 15 minutes
      defaultTTL: 1800, // 30 minutes
      budgetModelTTL: 3600, // 1 hour for budget models
      premiumModelTTL: 1800, // 30 minutes for premium models
      ...config,
    };

    // Initialize memory cache
    this.memory = new LRUCache<string, CacheEntry>({
      max: this.config.memoryMaxSize,
      ttl: this.config.memoryTTL,
    });

    // Initialize Redis if URL provided
    if (this.config.redisUrl) {
      this.redis = new Redis(this.config.redisUrl);
    }

    // Initialize stats
    this.stats = {
      memoryHits: 0,
      redisHits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      costSaved: 0,
    };
  }

  /**
   * Get cached response
   */
  async get(query: string, model: string): Promise<CacheEntry | null> {
    this.stats.totalRequests++;
    const key = this.generateCacheKey(query, model);

    try {
      // L1: Check memory cache first
      const memoryResult = this.memory.get(key);
      if (memoryResult) {
        this.stats.memoryHits++;
        this.updateHitRate();
        this.updateCostSaved(memoryResult.cost);
        return memoryResult;
      }

      // L2: Check Redis cache
      if (this.redis) {
        const redisResult = await this.redis.get(`cache:${key}`);
        if (redisResult) {
          const entry: CacheEntry = JSON.parse(redisResult);
          
          // Store in memory for faster access next time
          this.memory.set(key, entry);
          
          this.stats.redisHits++;
          this.updateHitRate();
          this.updateCostSaved(entry.cost);
          return entry;
        }
      }

      // Cache miss
      this.stats.misses++;
      this.updateHitRate();
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(
    query: string, 
    model: string, 
    response: string,
    tokens: number = 0,
    cost: number = 0
  ): Promise<void> {
    const key = this.generateCacheKey(query, model);
    const entry: CacheEntry = {
      response,
      model,
      timestamp: Date.now(),
      tokens,
      cost,
    };

    try {
      // L1: Store in memory
      this.memory.set(key, entry);

      // L2: Store in Redis with appropriate TTL
      if (this.redis) {
        const ttl = this.getTTL(model);
        await this.redis.setex(`cache:${key}`, ttl, JSON.stringify(entry));
      }

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Generate cache key from query and model
   */
  private generateCacheKey(query: string, model: string): string {
    // Normalize query for better cache hits
    const normalized = query
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      // Remove common variations that don't affect meaning
      .replace(/please|could you|can you|would you/gi, '')
      .replace(/\?+/g, '?')
      .replace(/!+/g, '!');

    // Create hash
    const hash = crypto
      .createHash('sha256')
      .update(`${model}:${normalized}`)
      .digest('hex')
      .slice(0, 16);

    return `${model}:${hash}`;
  }

  /**
   * Get TTL based on model type
   */
  private getTTL(model: string): number {
    if (this.budgetModels.includes(model)) {
      return this.config.budgetModelTTL;
    }
    return this.config.premiumModelTTL;
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const totalHits = this.stats.memoryHits + this.stats.redisHits;
    this.stats.hitRate = totalHits / this.stats.totalRequests;
  }

  /**
   * Update cost saved statistics
   */
  private updateCostSaved(cost: number): void {
    this.stats.costSaved += cost;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memory.clear();
    
    if (this.redis) {
      const keys = await this.redis.keys('cache:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }

    // Reset stats
    this.stats = {
      memoryHits: 0,
      redisHits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      costSaved: 0,
    };
  }

  /**
   * Get cache size information
   */
  async getSize(): Promise<{
    memorySize: number;
    redisSize: number;
  }> {
    const memorySize = this.memory.size;
    
    let redisSize = 0;
    if (this.redis) {
      const keys = await this.redis.keys('cache:*');
      redisSize = keys.length;
    }

    return { memorySize, redisSize };
  }

  /**
   * Cleanup expired entries (for maintenance)
   */
  async cleanup(): Promise<void> {
    // Memory cache auto-expires, but we can force cleanup
    this.memory.purgeStale();

    // Redis auto-expires with TTL, but we can clean up manually if needed
    if (this.redis) {
      const keys = await this.redis.keys('cache:*');
      const pipeline = this.redis.pipeline();
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          pipeline.del(key);
        }
      }
      
      await pipeline.exec();
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let cacheInstance: ResponseCache | null = null;

/**
 * Get or create cache instance
 */
export function getResponseCache(config?: Partial<CacheConfig>): ResponseCache {
  if (!cacheInstance) {
    cacheInstance = new ResponseCache({
      redisUrl: process.env.REDIS_URL,
      ...config,
    });
  }
  return cacheInstance;
}

/**
 * Cache middleware for AI responses
 */
export async function withCache<T>(
  query: string,
  model: string,
  tokens: number,
  cost: number,
  fn: () => Promise<T>
): Promise<T> {
  const cache = getResponseCache();
  
  // Try to get from cache first
  const cached = await cache.get(query, model);
  if (cached) {
    return cached.response as T;
  }

  // Execute function and cache result
  const result = await fn();
  
  // Cache the result
  await cache.set(query, model, result as string, tokens, cost);
  
  return result;
}

export type { CacheConfig, CacheEntry, CacheStats };
