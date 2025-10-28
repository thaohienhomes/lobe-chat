/**
 * Request Batching System
 *
 * Batches multiple AI requests to reduce latency and improve throughput:
 * - Groups similar requests together
 * - Processes batches in parallel
 * - Reduces API call overhead
 * - Improves cost efficiency
 */

interface BatchRequest {
  id: string;
  model: string;
  priority: number;
  query: string;
  reject: (error: any) => void;
  resolve: (result: any) => void;
  timestamp: number;
  userId: string;
}

interface BatchConfig {
  maxBatchSize: number;
  // milliseconds
  maxConcurrentBatches: number;
  maxWaitTime: number;
  priorityLevels: number;
}

interface BatchStats {
  averageBatchSize: number;
  averageWaitTime: number;
  batchedRequests: number;
  throughputImprovement: number;
  totalRequests: number;
}

export class RequestBatcher {
  private batches: Map<string, BatchRequest[]> = new Map();
  // eslint-disable-next-line no-undef
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private activeBatches: Set<string> = new Set();
  private config: BatchConfig;
  private stats: BatchStats;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 10,
      // 100ms
      maxConcurrentBatches: 5,
      maxWaitTime: 100,
      priorityLevels: 3,
      ...config,
    };

    this.stats = {
      averageBatchSize: 0,
      averageWaitTime: 0,
      batchedRequests: 0,
      throughputImprovement: 0,
      totalRequests: 0,
    };
  }

  /**
   * Add request to batch queue
   */
  async addRequest(
    query: string,
    model: string,
    userId: string,
    priority: number = 1,
  ): Promise<any> {
    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: this.generateRequestId(),
        model,
        priority,
        query,
        reject,
        resolve,
        timestamp: Date.now(),
        userId,
      };

      const batchKey = this.getBatchKey(model, priority);

      // Initialize batch if it doesn't exist
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      batch.push(request);

      // Process batch if it's full or if we hit the concurrent limit
      if (batch.length >= this.config.maxBatchSize || this.shouldProcessImmediately(batchKey)) {
        this.processBatch(batchKey);
      } else if (!this.timers.has(batchKey)) {
        // Set timer for batch processing
        const timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, this.config.maxWaitTime);

        this.timers.set(batchKey, timer);
      }
    });
  }

  /**
   * Process a batch of requests
   */
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

    // Mark batch as active
    this.activeBatches.add(batchKey);

    try {
      // Update stats
      this.stats.batchedRequests += batch.length;
      this.updateAverageBatchSize(batch.length);

      // Sort by priority (higher priority first)
      batch.sort((a, b) => b.priority - a.priority);

      // Process requests in parallel
      const results = await Promise.allSettled(
        batch.map((request) => this.processRequest(request)),
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const request = batch[index];
        const waitTime = Date.now() - request.timestamp;
        this.updateAverageWaitTime(waitTime);

        if (result.status === 'fulfilled') {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
      });
    } catch (error) {
      // Reject all requests in batch if batch processing fails
      batch.forEach((request) => request.reject(error));
    } finally {
      // Mark batch as completed
      this.activeBatches.delete(batchKey);
    }
  }

  /**
   * Process individual request
   */
  private async processRequest(request: BatchRequest): Promise<any> {
    // This would be replaced with actual AI model API call
    // For now, simulate processing
    await this.simulateProcessing(request.model);

    return {
      model: request.model,
      response: `Processed: ${request.query}`,
      timestamp: Date.now(),
      userId: request.userId,
    };
  }

  /**
   * Simulate AI model processing time
   */
  private async simulateProcessing(model: string): Promise<void> {
    // Different models have different processing times
    const processingTimes = {
      'claude-3-haiku': 250,
      'claude-3-sonnet': 1000,
      'gemini-1.5-flash': 200,
      'gemini-1.5-pro': 500,
      'gpt-4o': 800,
      'gpt-4o-mini': 300,
    };

    const delay = processingTimes[model as keyof typeof processingTimes] || 400;
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  /**
   * Generate batch key for grouping similar requests
   */
  private getBatchKey(model: string, priority: number): string {
    return `${model}:p${priority}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Check if batch should be processed immediately
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldProcessImmediately(_batchKey: string): boolean {
    // Process immediately if we're at the concurrent batch limit
    return this.activeBatches.size >= this.config.maxConcurrentBatches;
  }

  /**
   * Update average batch size statistic
   */
  private updateAverageBatchSize(batchSize: number): void {
    const totalBatches = this.stats.batchedRequests / this.stats.averageBatchSize || 1;
    this.stats.averageBatchSize =
      (this.stats.averageBatchSize * (totalBatches - 1) + batchSize) / totalBatches;
  }

  /**
   * Update average wait time statistic
   */
  private updateAverageWaitTime(waitTime: number): void {
    const totalRequests = this.stats.batchedRequests;
    this.stats.averageWaitTime =
      (this.stats.averageWaitTime * (totalRequests - 1) + waitTime) / totalRequests;
  }

  /**
   * Get batching statistics
   */
  getStats(): BatchStats {
    const batchingRate = this.stats.batchedRequests / this.stats.totalRequests;
    const throughputImprovement = batchingRate * this.stats.averageBatchSize;

    return {
      ...this.stats,
      throughputImprovement,
    };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    activeBatches: number;
    pendingBatches: number;
    totalPendingRequests: number;
  } {
    const totalPendingRequests = Array.from(this.batches.values()).reduce(
      (sum, batch) => sum + batch.length,
      0,
    );

    return {
      activeBatches: this.activeBatches.size,
      pendingBatches: this.batches.size,
      totalPendingRequests,
    };
  }

  /**
   * Clear all pending batches (for shutdown)
   */
  async clearAll(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Reject all pending requests
    for (const batch of this.batches.values()) {
      batch.forEach((request) => request.reject(new Error('Batcher shutting down')));
    }
    this.batches.clear();

    // Wait for active batches to complete
    while (this.activeBatches.size > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
let batcherInstance: RequestBatcher | null = null;

/**
 * Get or create batcher instance
 */
export function getRequestBatcher(config?: Partial<BatchConfig>): RequestBatcher {
  if (!batcherInstance) {
    batcherInstance = new RequestBatcher(config);
  }
  return batcherInstance;
}

/**
 * Batch middleware for AI requests
 */
export async function withBatching<T>(
  query: string,
  model: string,
  userId: string,
  priority: number = 1,
): Promise<T> {
  const batcher = getRequestBatcher();
  return batcher.addRequest(query, model, userId, priority);
}

export type { BatchConfig, BatchRequest, BatchStats };
