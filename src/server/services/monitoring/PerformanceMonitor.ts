/**
 * Performance Monitoring System
 * 
 * Real-time monitoring and metrics collection:
 * - Request/response metrics
 * - System performance tracking
 * - Auto-scaling triggers
 * - Cost optimization metrics
 * - User experience monitoring
 */

interface PerformanceMetrics {
  activeUsers: number;
  averageResponseTime: number;
  cacheHitRate: number;
  costPerUser: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  throughput: number;
}

interface SystemMetrics {
  cpuUsage: number;
  databaseConnections: number;
  diskUsage: number;
  memoryUsage: number;
  networkIO: number;
  queueLength: number;
}

interface AlertRule {
  action: 'log' | 'email' | 'scale' | 'restart';
  duration: number;
  metric: string;
  operator: 'gt' | 'lt' | 'eq'; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
}

interface MetricDataPoint {
  tags?: Record<string, string>;
  timestamp: number;
  value: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private alertRules: AlertRule[] = [];
  private alertStates: Map<string, boolean> = new Map();
  private collectors: Map<string, () => Promise<number>> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupDefaultAlertRules();
    this.setupDefaultCollectors();
    this.startCollection();
  }

  /**
   * Record a metric data point
   */
  recordMetric(
    name: string, 
    value: number, 
    tags?: Record<string, string>
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const dataPoints = this.metrics.get(name)!;
    dataPoints.push({
      tags,
      timestamp: Date.now(),
      value,
    });

    // Keep only last 1000 data points per metric
    if (dataPoints.length > 1000) {
      dataPoints.shift();
    }

    // Check alert rules
    this.checkAlerts(name, value);
  }

  /**
   * Track request performance
   */
  trackRequest(
    duration: number,
    success: boolean,
    model?: string,
    userId?: string
  ): void {
    this.recordMetric('request_duration_ms', duration, { 
      model, 
      success: success.toString() 
    });
    
    this.recordMetric('requests_total', 1, { 
      model, 
      success: success.toString() 
    });

    if (userId) {
      this.recordMetric('user_activity', 1, { userId });
    }
  }

  /**
   * Track cache performance
   */
  trackCache(hit: boolean, model?: string): void {
    this.recordMetric('cache_requests', 1, { 
      hit: hit.toString(), 
      model 
    });
  }

  /**
   * Track cost metrics
   */
  trackCost(
    costUSD: number, 
    model: string, 
    userId: string,
    tokens: number
  ): void {
    this.recordMetric('cost_usd', costUSD, { model, userId });
    this.recordMetric('tokens_used', tokens, { model, userId });
    this.recordMetric('cost_per_token', costUSD / tokens, { model });
  }

  /**
   * Get current performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    // Calculate requests per second
    const requestsLastMinute = this.getMetricSum('requests_total', oneMinuteAgo);
    const requestsPerSecond = requestsLastMinute / 60;

    // Calculate response times
    const responseTimes = this.getMetricValues('request_duration_ms', oneMinuteAgo);
    const averageResponseTime = this.calculateAverage(responseTimes);
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    // Calculate error rate
    const totalRequests = this.getMetricSum('requests_total', oneMinuteAgo);
    const failedRequests = this.getMetricSum('requests_total', oneMinuteAgo, { success: 'false' });
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    // Calculate cache hit rate
    const cacheRequests = this.getMetricSum('cache_requests', oneMinuteAgo);
    const cacheHits = this.getMetricSum('cache_requests', oneMinuteAgo, { hit: 'true' });
    const cacheHitRate = cacheRequests > 0 ? cacheHits / cacheRequests : 0;

    // Calculate active users (unique users in last 5 minutes)
    const activeUsers = this.getUniqueUsers(now - 300_000);

    // Calculate cost per user
    const totalCost = this.getMetricSum('cost_usd', oneMinuteAgo);
    const costPerUser = activeUsers > 0 ? totalCost / activeUsers : 0;

    return {
      activeUsers,
      averageResponseTime,
      cacheHitRate,
      costPerUser,
      errorRate,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      throughput: requestsPerSecond,
    };
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const metrics: Partial<SystemMetrics> = {};

    // Collect from registered collectors
    for (const [name, collector] of this.collectors) {
      try {
        metrics[name as keyof SystemMetrics] = await collector();
      } catch (error) {
        console.error(`Failed to collect ${name}:`, error);
      }
    }

    return metrics as SystemMetrics;
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        action: 'log',
        
duration: 60, 
        
metric: 'request_duration_ms',
        // 2 seconds
operator: 'gt',
        severity: 'medium',
        threshold: 2000,
      },
      {
        action: 'email',
        
duration: 300, 
        
metric: 'error_rate',
        // 5%
operator: 'gt',
        severity: 'high',
        threshold: 0.05,
      },
      {
        action: 'scale',
        duration: 60,
        metric: 'requests_per_second',
        operator: 'gt',
        severity: 'medium',
        threshold: 1000,
      },
      {
        action: 'log',
        
duration: 300, 
        
metric: 'cache_hit_rate',
        // 70%
operator: 'lt',
        severity: 'low',
        threshold: 0.7,
      },
      {
        action: 'email',
        
duration: 600, 
        
metric: 'cost_per_user',
        // $2 per user
operator: 'gt',
        severity: 'medium',
        threshold: 2,
      },
    ];
  }

  /**
   * Setup default metric collectors
   */
  private setupDefaultCollectors(): void {
    // CPU usage
    this.collectors.set('cpuUsage', async () => {
      // This would integrate with system monitoring
      return Math.random() * 100; // Placeholder
    });

    // Memory usage
    this.collectors.set('memoryUsage', async () => {
      const used = process.memoryUsage();
      return (used.heapUsed / used.heapTotal) * 100;
    });

    // Database connections (would integrate with actual pool)
    this.collectors.set('databaseConnections', async () => {
      return Math.floor(Math.random() * 50); // Placeholder
    });
  }

  /**
   * Start metric collection
   */
  private startCollection(): void {
    // Collect performance metrics every 10 seconds
    const performanceInterval = setInterval(async () => {
      const metrics = await this.getPerformanceMetrics();
      
      Object.entries(metrics).forEach(([key, value]) => {
        this.recordMetric(`performance_${key}`, value);
      });
    }, 10_000);

    this.intervals.set('performance', performanceInterval);

    // Collect system metrics every 30 seconds
    const systemInterval = setInterval(async () => {
      const metrics = await this.getSystemMetrics();
      
      Object.entries(metrics).forEach(([key, value]) => {
        this.recordMetric(`system_${key}`, value);
      });
    }, 30_000);

    this.intervals.set('system', systemInterval);
  }

  /**
   * Check alert rules
   */
  private checkAlerts(metricName: string, value: number): void {
    const relevantRules = this.alertRules.filter(rule => rule.metric === metricName);
    
    for (const rule of relevantRules) {
      const alertKey = `${rule.metric}_${rule.threshold}_${rule.operator}`;
      const shouldAlert = this.evaluateRule(rule, value);
      const currentlyAlerting = this.alertStates.get(alertKey) || false;

      if (shouldAlert && !currentlyAlerting) {
        this.triggerAlert(rule, value);
        this.alertStates.set(alertKey, true);
      } else if (!shouldAlert && currentlyAlerting) {
        this.resolveAlert(rule, value);
        this.alertStates.set(alertKey, false);
      }
    }
  }

  /**
   * Evaluate alert rule
   */
  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'gt': {
        return value > rule.threshold;
      }
      case 'lt': {
        return value < rule.threshold;
      }
      case 'eq': {
        return value === rule.threshold;
      }
      default: {
        return false;
      }
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    const message = `ALERT: ${rule.metric} is ${value} (threshold: ${rule.threshold})`;
    
    switch (rule.action) {
      case 'log': {
        console.warn(message);
        break;
      }
      case 'email': {
        console.error(message);
        // Would send email notification
        break;
      }
      case 'scale': {
        console.error(message);
        // Would trigger auto-scaling
        this.triggerAutoScale();
        break;
      }
      case 'restart': {
        console.error(message);
        // Would trigger service restart
        break;
      }
    }
  }

  /**
   * Resolve alert
   */
  private resolveAlert(rule: AlertRule, value: number): void {
    const message = `RESOLVED: ${rule.metric} is now ${value} (threshold: ${rule.threshold})`;
    console.info(message);
  }

  /**
   * Trigger auto-scaling
   */
  private triggerAutoScale(): void {
    // This would integrate with cloud provider APIs
    console.log('Triggering auto-scale...');
  }

  /**
   * Helper methods for metric calculations
   */
  private getMetricSum(
    name: string, 
    since: number, 
    tags?: Record<string, string>
  ): number {
    const dataPoints = this.metrics.get(name) || [];
    return dataPoints
      .filter(dp => dp.timestamp >= since)
      .filter(dp => !tags || this.matchesTags(dp.tags, tags))
      .reduce((sum, dp) => sum + dp.value, 0);
  }

  private getMetricValues(name: string, since: number): number[] {
    const dataPoints = this.metrics.get(name) || [];
    return dataPoints
      .filter(dp => dp.timestamp >= since)
      .map(dp => dp.value);
  }

  private getUniqueUsers(since: number): number {
    const dataPoints = this.metrics.get('user_activity') || [];
    const uniqueUsers = new Set(
      dataPoints
        .filter(dp => dp.timestamp >= since)
        .map(dp => dp.tags?.userId)
        .filter(Boolean)
    );
    return uniqueUsers.size;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private matchesTags(
    dataTags?: Record<string, string>, 
    filterTags?: Record<string, string>
  ): boolean {
    if (!filterTags) return true;
    if (!dataTags) return false;
    
    return Object.entries(filterTags).every(
      ([key, value]) => dataTags[key] === value
    );
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

/**
 * Get or create monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

export type { AlertRule, MetricDataPoint,PerformanceMetrics, SystemMetrics };
