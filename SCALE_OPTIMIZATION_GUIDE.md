# ⚡ SCALE OPTIMIZATION GUIDE - PHO.CHAT

**Date:** 2025-01-08  
**Purpose:** Kỹ thuật tối ưu để scale từ 1K → 1M users mà không giảm trải nghiệm

---

## 🎯 MỤC TIÊU SCALE

| Metric | Current | Target 6M | Target 1Y | Target 2Y |
|--------|---------|-----------|-----------|-----------|
| **Users** | 1,000 | 10,000 | 100,000 | 1,000,000 |
| **Requests/day** | 10K | 100K | 1M | 10M |
| **Response time** | <2s | <2s | <2s | <2s |
| **Uptime** | 99% | 99.5% | 99.9% | 99.99% |
| **Cost/user** | $1.61 | $1.40 | $1.20 | $1.00 |

---

## 🚀 OPTIMIZATION STRATEGIES

### 1. INTELLIGENT CACHING

#### Response Caching
```typescript
// Multi-layer caching strategy
class ResponseCache {
  private redis: Redis;
  private memory: LRU<string, any>;

  async get(query: string, model: string): Promise<string | null> {
    // L1: Memory cache (fastest)
    const memKey = `${model}:${this.hashQuery(query)}`;
    let response = this.memory.get(memKey);
    if (response) return response;

    // L2: Redis cache (fast)
    const redisKey = `cache:${memKey}`;
    response = await this.redis.get(redisKey);
    if (response) {
      this.memory.set(memKey, response);
      return response;
    }

    return null;
  }

  async set(query: string, model: string, response: string): Promise<void> {
    const key = `${model}:${this.hashQuery(query)}`;
    
    // Cache based on model type
    const ttl = this.getCacheTTL(model);
    
    // L1: Memory (immediate access)
    this.memory.set(key, response);
    
    // L2: Redis (persistent)
    await this.redis.setex(`cache:${key}`, ttl, response);
  }

  private getCacheTTL(model: string): number {
    // Budget models: longer cache (cheaper to serve from cache)
    if (['gemini-1.5-flash', 'gpt-4o-mini'].includes(model)) {
      return 3600; // 1 hour
    }
    
    // Premium models: shorter cache (more dynamic responses)
    return 1800; // 30 minutes
  }

  private hashQuery(query: string): string {
    // Normalize query for better cache hits
    const normalized = query.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  }
}
```

#### Semantic Caching
```typescript
// Cache similar queries using embeddings
class SemanticCache {
  private vectorDB: Pinecone;
  private threshold = 0.95; // Similarity threshold

  async findSimilar(query: string): Promise<string | null> {
    const embedding = await this.getEmbedding(query);
    
    const results = await this.vectorDB.query({
      vector: embedding,
      topK: 1,
      includeMetadata: true,
    });

    if (results.matches[0]?.score > this.threshold) {
      return results.matches[0].metadata.response;
    }

    return null;
  }

  async store(query: string, response: string): Promise<void> {
    const embedding = await this.getEmbedding(query);
    
    await this.vectorDB.upsert([{
      id: crypto.randomUUID(),
      values: embedding,
      metadata: { query, response, timestamp: Date.now() },
    }]);
  }
}
```

---

### 2. SMART MODEL ROUTING

#### Cost-Aware Routing
```typescript
class ModelRouter {
  async selectOptimalModel(
    query: string, 
    userBudget: number,
    userHistory: UserHistory
  ): Promise<string> {
    const complexity = this.analyzeComplexity(query);
    const userPreference = this.getUserPreference(userHistory);
    
    // Route based on multiple factors
    const candidates = this.getCandidateModels(complexity, userBudget);
    
    // Score each model
    const scored = candidates.map(model => ({
      model,
      score: this.calculateScore(model, complexity, userBudget, userPreference),
    }));

    // Return best model
    return scored.sort((a, b) => b.score - a.score)[0].model;
  }

  private calculateScore(
    model: string,
    complexity: string,
    budget: number,
    preference: ModelPreference
  ): number {
    const cost = this.getModelCost(model);
    const quality = this.getModelQuality(model, complexity);
    const speed = this.getModelSpeed(model);
    
    // Weighted scoring
    return (
      quality * 0.4 +           // 40% quality
      (budget / cost) * 0.3 +   // 30% cost efficiency  
      speed * 0.2 +             // 20% speed
      preference[model] * 0.1   // 10% user preference
    );
  }
}
```

#### Load Balancing
```typescript
class LoadBalancer {
  private modelEndpoints: Map<string, string[]> = new Map();
  private healthChecks: Map<string, boolean> = new Map();

  async routeRequest(model: string, request: any): Promise<any> {
    const endpoints = this.modelEndpoints.get(model) || [];
    const healthy = endpoints.filter(ep => this.healthChecks.get(ep));
    
    if (healthy.length === 0) {
      throw new Error(`No healthy endpoints for ${model}`);
    }

    // Round-robin with health checks
    const endpoint = this.selectEndpoint(healthy);
    
    try {
      return await this.makeRequest(endpoint, request);
    } catch (error) {
      // Mark endpoint as unhealthy and retry
      this.healthChecks.set(endpoint, false);
      return this.routeRequest(model, request);
    }
  }

  private selectEndpoint(endpoints: string[]): string {
    // Weighted round-robin based on response times
    const weights = endpoints.map(ep => 1 / this.getAverageResponseTime(ep));
    return this.weightedRandom(endpoints, weights);
  }
}
```

---

### 3. REQUEST OPTIMIZATION

#### Batching
```typescript
class RequestBatcher {
  private batches: Map<string, BatchRequest[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  async addRequest(model: string, request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const batchKey = this.getBatchKey(model);
      
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      batch.push({ request, resolve, reject });

      // Process batch when full or after timeout
      if (batch.length >= this.getMaxBatchSize(model)) {
        this.processBatch(batchKey);
      } else if (!this.timers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, this.getBatchTimeout(model));
        this.timers.set(batchKey, timer);
      }
    });
  }

  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear batch and timer
    this.batches.delete(batchKey);
    const timer = this.timers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(batchKey);
    }

    try {
      // Process all requests in parallel
      const results = await Promise.allSettled(
        batch.map(item => this.processRequest(item.request))
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value);
        } else {
          batch[index].reject(result.reason);
        }
      });
    } catch (error) {
      // Reject all if batch processing fails
      batch.forEach(item => item.reject(error));
    }
  }
}
```

#### Streaming Optimization
```typescript
class StreamingOptimizer {
  async streamResponse(
    model: string,
    query: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // Check cache first
    const cached = await this.cache.get(query, model);
    if (cached) {
      // Simulate streaming for cached responses
      return this.simulateStreaming(cached, onChunk);
    }

    // Real streaming
    const stream = await this.createModelStream(model, query);
    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
      onChunk(chunk);
    }

    // Cache complete response
    await this.cache.set(query, model, fullResponse);
  }

  private async simulateStreaming(
    response: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const words = response.split(' ');
    const chunkSize = 3; // 3 words per chunk
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      onChunk(chunk);
      
      // Simulate realistic typing speed
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
```

---

### 4. DATABASE OPTIMIZATION

#### Connection Pooling
```typescript
class DatabasePool {
  private readPool: Pool;
  private writePool: Pool;
  private analyticsPool: Pool;

  constructor() {
    // Read replicas for queries
    this.readPool = new Pool({
      host: 'read-replica.db.pho.chat',
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Primary for writes
    this.writePool = new Pool({
      host: 'primary.db.pho.chat', 
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Separate pool for analytics
    this.analyticsPool = new Pool({
      host: 'analytics.db.pho.chat',
      max: 10,
      idleTimeoutMillis: 60000,
    });
  }

  async query(sql: string, params: any[], type: 'read' | 'write' | 'analytics' = 'read') {
    const pool = this.getPool(type);
    const client = await pool.connect();
    
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  private getPool(type: string): Pool {
    switch (type) {
      case 'write': return this.writePool;
      case 'analytics': return this.analyticsPool;
      default: return this.readPool;
    }
  }
}
```

#### Query Optimization
```typescript
// Optimized queries with proper indexing
class OptimizedQueries {
  // Get user usage with single query instead of multiple
  async getUserUsageOptimized(userId: string): Promise<UserUsage> {
    return this.db.query(`
      SELECT 
        u.subscription_tier,
        u.monthly_budget_vnd,
        COALESCE(SUM(ul.cost_vnd), 0) as used_budget,
        COUNT(ul.id) as total_queries,
        AVG(ul.cost_vnd) as avg_cost_per_query
      FROM users u
      LEFT JOIN usage_logs ul ON u.id = ul.user_id 
        AND ul.timestamp >= date_trunc('month', CURRENT_DATE)
      WHERE u.id = $1
      GROUP BY u.id, u.subscription_tier, u.monthly_budget_vnd
    `, [userId]);
  }

  // Batch insert for high-volume logging
  async batchInsertUsageLogs(logs: UsageLog[]): Promise<void> {
    const values = logs.map((log, i) => 
      `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, $${i*6+6})`
    ).join(',');

    const params = logs.flatMap(log => [
      log.userId, log.model, log.inputTokens, 
      log.outputTokens, log.costUSD, log.timestamp
    ]);

    await this.db.query(`
      INSERT INTO usage_logs (user_id, model, input_tokens, output_tokens, cost_usd, timestamp)
      VALUES ${values}
    `, params);
  }
}
```

---

### 5. MONITORING & ALERTING

#### Real-time Metrics
```typescript
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private prometheus: PrometheusRegistry;

  trackRequest(model: string, responseTime: number, cost: number): void {
    // Update counters
    this.incrementCounter(`requests_total`, { model });
    this.recordHistogram(`response_time_seconds`, responseTime, { model });
    this.recordHistogram(`request_cost_usd`, cost, { model });

    // Track business metrics
    this.updateGauge(`active_users`, this.getActiveUsers());
    this.updateGauge(`monthly_revenue_usd`, this.getMonthlyRevenue());
  }

  async getHealthMetrics(): Promise<HealthMetrics> {
    return {
      requestsPerSecond: this.getMetric('requests_per_second'),
      averageResponseTime: this.getMetric('avg_response_time'),
      errorRate: this.getMetric('error_rate'),
      activeUsers: this.getMetric('active_users'),
      databaseConnections: this.getMetric('db_connections'),
      cacheHitRate: this.getMetric('cache_hit_rate'),
    };
  }
}
```

#### Auto-scaling
```typescript
class AutoScaler {
  async checkAndScale(): Promise<void> {
    const metrics = await this.metricsCollector.getHealthMetrics();
    
    // Scale up conditions
    if (metrics.requestsPerSecond > 1000 || 
        metrics.averageResponseTime > 2000 ||
        metrics.databaseConnections > 80) {
      await this.scaleUp();
    }
    
    // Scale down conditions  
    if (metrics.requestsPerSecond < 100 && 
        metrics.averageResponseTime < 500 &&
        metrics.databaseConnections < 20) {
      await this.scaleDown();
    }
  }

  private async scaleUp(): Promise<void> {
    // Add more server instances
    await this.addServerInstances(2);
    
    // Increase database connections
    await this.increaseDatabasePool(20);
    
    // Scale Redis cluster
    await this.scaleRedisCluster();
  }
}
```

---

## 📊 PERFORMANCE TARGETS

### Response Time Targets

| User Load | Target Response Time | Max Response Time |
|-----------|---------------------|-------------------|
| **1K users** | <1s | <2s |
| **10K users** | <1.5s | <3s |
| **100K users** | <2s | <4s |
| **1M users** | <2.5s | <5s |

### Cost Optimization Targets

| Optimization | Current Cost | Target Cost | Savings |
|--------------|--------------|-------------|---------|
| **Caching** | $1.61/user | $1.20/user | 25% |
| **Model Routing** | $1.20/user | $1.00/user | 17% |
| **Batching** | $1.00/user | $0.85/user | 15% |
| **Total** | $1.61/user | $0.85/user | **47%** |

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Month 1)
- ✅ Implement response caching
- ✅ Set up monitoring & alerting
- ✅ Database connection pooling
- ✅ Basic load balancing

### Phase 2: Intelligence (Month 2)
- ✅ Smart model routing
- ✅ Request batching
- ✅ Semantic caching
- ✅ Auto-scaling

### Phase 3: Advanced (Month 3)
- ✅ Edge computing deployment
- ✅ Advanced analytics
- ✅ Predictive scaling
- ✅ Cost optimization ML

---

**Prepared by:** AI Assistant  
**Date:** 2025-01-08  
**Status:** Ready for implementation  
**Expected Impact:** 47% cost reduction, 2x performance improvement
