/**
 * Optimized Database Service
 *
 * Implements database optimization strategies:
 * - Connection pooling with read/write separation
 * - Query optimization and caching
 * - Batch operations
 * - Performance monitoring
 */
import { Pool, PoolClient } from 'pg';

interface DatabaseConfig {
  analyticsHost?: string;
  connectionTimeoutMs: number;
  database: string;
  idleTimeoutMs: number;
  maxConnections: number;
  password: string;
  port: number;
  primaryHost: string;
  readReplicaHost?: string;
  username: string;
}

interface QueryResult<T = any> {
  duration: number;
  rowCount: number;
  rows: T[];
}

interface DatabaseStats {
  averageQueryTime: number;
  connectionPoolStats: {
    idle: number;
    total: number;
    waiting: number;
  };
  readQueries: number;
  totalQueries: number;
  writeQueries: number;
}

export class OptimizedDatabase {
  private writePool: Pool;
  private readPool: Pool;
  private analyticsPool: Pool | null = null;
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map();
  private stats: DatabaseStats;

  constructor(config: DatabaseConfig) {
    // Primary database pool for writes
    this.writePool = new Pool({
      application_name: 'pho-chat-write',
      connectionTimeoutMillis: config.connectionTimeoutMs,
      database: config.database,
      host: config.primaryHost,
      // 30% for writes
      idleTimeoutMillis: config.idleTimeoutMs,

      max: Math.floor(config.maxConnections * 0.3),

      password: config.password,

      port: config.port,

      user: config.username,
    });

    // Read replica pool for reads
    this.readPool = new Pool({
      application_name: 'pho-chat-read',
      connectionTimeoutMillis: config.connectionTimeoutMs,
      database: config.database,
      host: config.readReplicaHost || config.primaryHost,
      // 60% for reads
      idleTimeoutMillis: config.idleTimeoutMs,

      max: Math.floor(config.maxConnections * 0.6),

      password: config.password,

      port: config.port,

      user: config.username,
    });

    // Analytics pool (optional)
    if (config.analyticsHost) {
      this.analyticsPool = new Pool({
        application_name: 'pho-chat-analytics',

        // Longer idle timeout
        connectionTimeoutMillis: config.connectionTimeoutMs,

        database: config.database,

        host: config.analyticsHost,

        // 10% for analytics
        idleTimeoutMillis: config.idleTimeoutMs * 2,

        max: Math.floor(config.maxConnections * 0.1),

        password: config.password,

        port: config.port,

        user: config.username,
      });
    }

    this.stats = {
      averageQueryTime: 0,
      connectionPoolStats: {
        idle: 0,
        total: 0,
        waiting: 0,
      },
      readQueries: 0,
      totalQueries: 0,
      writeQueries: 0,
    };

    this.setupEventHandlers();
  }

  /**
   * Execute read query (uses read replica)
   */
  async query<T = any>(
    sql: string,
    params: any[] = [],
    options: { cache?: boolean; cacheTTL?: number } = {},
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();

    // Check cache first
    if (options.cache) {
      const cached = this.getFromCache(sql, params);
      if (cached) {
        return {
          duration: Date.now() - startTime,
          rowCount: cached.result.rowCount,
          rows: cached.result.rows,
        };
      }
    }

    const client = await this.readPool.connect();

    try {
      const result = await client.query(sql, params);
      const duration = Date.now() - startTime;

      // Cache result if requested
      if (options.cache) {
        this.setCache(sql, params, result, options.cacheTTL || 300_000); // 5 min default
      }

      this.updateStats('read', duration);

      return {
        duration,
        rowCount: result.rowCount ?? 0,
        rows: result.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Execute write query (uses primary database)
   */
  async execute<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const client = await this.writePool.connect();

    try {
      const result = await client.query(sql, params);
      const duration = Date.now() - startTime;

      this.updateStats('write', duration);

      return {
        duration,
        rowCount: result.rowCount ?? 0,
        rows: result.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Execute analytics query (uses analytics database if available)
   */
  async analytics<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const pool = this.analyticsPool || this.readPool;
    const startTime = Date.now();
    const client = await pool.connect();

    try {
      const result = await client.query(sql, params);
      const duration = Date.now() - startTime;

      this.updateStats('read', duration);

      return {
        duration,
        rowCount: result.rowCount ?? 0,
        rows: result.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.writePool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch insert for high-volume operations
   */
  async batchInsert(
    table: string,
    columns: string[],
    values: any[][],
    batchSize: number = 1000,
  ): Promise<number> {
    let totalInserted = 0;

    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);

      const placeholders = batch
        .map((_, rowIndex) => {
          const rowPlaceholders = columns.map(
            (_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`,
          );
          return `(${rowPlaceholders.join(', ')})`;
        })
        .join(', ');

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
      const params = batch.flat();

      const result = await this.execute(sql, params);
      totalInserted += result.rowCount;
    }

    return totalInserted;
  }

  /**
   * Optimized user usage query
   */
  async getUserUsage(userId: string): Promise<any> {
    const sql = `
      SELECT 
        u.subscription_tier,
        u.monthly_budget_vnd,
        COALESCE(SUM(ul.cost_vnd), 0) as used_budget,
        COUNT(ul.id) as total_queries,
        AVG(ul.cost_vnd) as avg_cost_per_query,
        MAX(ul.timestamp) as last_query_time
      FROM users u
      LEFT JOIN usage_logs ul ON u.id = ul.user_id 
        AND ul.timestamp >= date_trunc('month', CURRENT_DATE)
      WHERE u.id = $1
      GROUP BY u.id, u.subscription_tier, u.monthly_budget_vnd
    `;

    const result = await this.query(sql, [userId], { cache: true, cacheTTL: 60_000 });
    return result.rows[0];
  }

  /**
   * Get popular queries for caching optimization
   */
  async getPopularQueries(limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT 
        query_hash,
        model,
        COUNT(*) as frequency,
        AVG(cost_usd) as avg_cost,
        MAX(timestamp) as last_used
      FROM usage_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY query_hash, model
      ORDER BY frequency DESC
      LIMIT $1
    `;

    const result = await this.analytics(sql, [limit]);
    return result.rows;
  }

  /**
   * Cache management
   */
  private getFromCache(sql: string, params: any[]): any | null {
    const key = this.getCacheKey(sql, params);
    const cached = this.queryCache.get(key);

    if (cached && Date.now() - cached.timestamp < 300_000) {
      // 5 min TTL
      return cached;
    }

    if (cached) {
      this.queryCache.delete(key);
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private setCache(sql: string, params: any[], result: any, _ttl: number): void {
    const key = this.getCacheKey(sql, params);
    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Clean up expired entries periodically
    if (this.queryCache.size > 1000) {
      this.cleanupCache();
    }
  }

  private getCacheKey(sql: string, params: any[]): string {
    return `${sql}:${JSON.stringify(params)}`;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > 300_000) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(type: 'read' | 'write', duration: number): void {
    this.stats.totalQueries++;

    if (type === 'read') {
      this.stats.readQueries++;
    } else {
      this.stats.writeQueries++;
    }

    // Update average query time
    this.stats.averageQueryTime =
      (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + duration) /
      this.stats.totalQueries;
  }

  /**
   * Get database statistics
   */
  getStats(): DatabaseStats {
    return {
      ...this.stats,
      connectionPoolStats: {
        idle: this.writePool.idleCount + this.readPool.idleCount,
        total: this.writePool.totalCount + this.readPool.totalCount,
        waiting: this.writePool.waitingCount + this.readPool.waitingCount,
      },
    };
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.writePool.on('error', (err) => {
      console.error('Write pool error:', err);
    });

    this.readPool.on('error', (err) => {
      console.error('Read pool error:', err);
    });

    if (this.analyticsPool) {
      this.analyticsPool.on('error', (err) => {
        console.error('Analytics pool error:', err);
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    analytics: boolean;
    read: boolean;
    write: boolean;
  }> {
    const results = {
      analytics: false,
      read: false,
      write: false,
    };

    try {
      await this.execute('SELECT 1');
      results.write = true;
    } catch (error) {
      console.error('Write pool health check failed:', error);
    }

    try {
      await this.query('SELECT 1');
      results.read = true;
    } catch (error) {
      console.error('Read pool health check failed:', error);
    }

    if (this.analyticsPool) {
      try {
        await this.analytics('SELECT 1');
        results.analytics = true;
      } catch (error) {
        console.error('Analytics pool health check failed:', error);
      }
    } else {
      results.analytics = true; // No analytics pool configured
    }

    return results;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await Promise.all([this.writePool.end(), this.readPool.end(), this.analyticsPool?.end()]);
  }
}

// Singleton instance
let dbInstance: OptimizedDatabase | null = null;

/**
 * Get or create database instance
 */
export function getOptimizedDatabase(config?: DatabaseConfig): OptimizedDatabase {
  if (!dbInstance && config) {
    dbInstance = new OptimizedDatabase(config);
  }

  if (!dbInstance) {
    throw new Error('Database not initialized. Provide config on first call.');
  }

  return dbInstance;
}

export type { DatabaseConfig, DatabaseStats, QueryResult };
