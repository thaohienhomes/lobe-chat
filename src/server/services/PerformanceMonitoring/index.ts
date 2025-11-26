/**
 * Performance Monitoring Service for Cost Optimization System
 * Tracks system performance, cost efficiency, and user satisfaction metrics
 */
import { LobeChatDatabase } from '@lobechat/database';
import { sql } from 'drizzle-orm';

export interface PerformanceMetrics {
  averageCostPerQuery: number;
  // System Performance
  averageLatency: number;
  // User Satisfaction
  budgetOverrunRate: number;

  budgetUtilization: number;
  // Cost Efficiency
  costReductionPercentage: number;
  errorRate: number;

  // Model Performance
  modelRoutingAccuracy: number;
  optimalModelUsageRate: number;
  subscriptionRetentionRate: number;

  throughput: number;
  userComplaintRate: number;
}

export interface AlertConfig {
  // percentage
  budgetOverrunThreshold: number;
  // percentage
  costIncreaseThreshold: number;
  // ms
  errorRateThreshold: number;
  latencyThreshold: number; // percentage
}

export class PerformanceMonitoringService {
  private db: LobeChatDatabase;
  private alertConfig: AlertConfig;

  constructor(db: LobeChatDatabase) {
    this.db = db;
    this.alertConfig = {
      // 1% error rate
      budgetOverrunThreshold: 5,

      // 5% of users exceeding budget
      costIncreaseThreshold: 10,

      // 200ms additional latency
      errorRateThreshold: 1,
      latencyThreshold: 200, // 10% cost increase
    };
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(timeRange: { end: Date; start: Date }): Promise<PerformanceMetrics> {
    const { start, end } = timeRange;

    // System Performance Metrics
    const latencyMetrics = await this.db.execute(sql`
      SELECT 
        AVG(response_time_ms) as avg_latency,
        COUNT(CASE WHEN response_time_ms > 2000 THEN 1 END) * 100.0 / COUNT(*) as error_rate,
        COUNT(*) as total_queries
      FROM usage_logs 
      WHERE created_at BETWEEN ${start} AND ${end}
    `);

    // Cost Efficiency Metrics
    const costMetrics = await this.db.execute(sql`
      SELECT 
        AVG(cost_vnd) as avg_cost_per_query,
        SUM(cost_vnd) as total_cost,
        COUNT(DISTINCT user_id) as active_users
      FROM usage_logs 
      WHERE created_at BETWEEN ${start} AND ${end}
    `);

    // Budget Utilization
    const budgetMetrics = await this.db.execute(sql`
      SELECT 
        COUNT(CASE WHEN budget_used_vnd > budget_limit_vnd THEN 1 END) * 100.0 / COUNT(*) as overrun_rate,
        AVG(budget_used_vnd * 100.0 / NULLIF(budget_limit_vnd, 0)) as avg_utilization
      FROM monthly_usage_summary 
      WHERE month = ${this.getCurrentMonth()}
    `);

    // Model Routing Performance
    const routingMetrics = await this.db.execute(sql`
      SELECT 
        COUNT(CASE WHEN query_complexity = 'simple' AND model IN ('gemini-1.5-flash', 'gpt-4o-mini') THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN query_complexity = 'simple' THEN 1 END), 0) as simple_routing_accuracy,
        COUNT(CASE WHEN query_complexity = 'complex' AND model IN ('claude-3-sonnet', 'gpt-4o') THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN query_complexity = 'complex' THEN 1 END), 0) as complex_routing_accuracy
      FROM usage_logs 
      WHERE created_at BETWEEN ${start} AND ${end}
    `);

    const latencyRows = latencyMetrics.rows as any[] || [];
    const costRows = costMetrics.rows as any[] || [];
    const budgetRows = budgetMetrics.rows as any[] || [];
    const routingRows = routingMetrics.rows as any[] || [];

    const latency = latencyRows[0];
    const cost = costRows[0];
    const budget = budgetRows[0];
    const routing = routingRows[0];

    return {
      averageCostPerQuery: Number(cost?.avg_cost_per_query) || 0,
      averageLatency: Number(latency?.avg_latency) || 0,
      budgetOverrunRate: Number(budget?.overrun_rate) || 0,

      budgetUtilization: Number(budget?.avg_utilization) || 0,
      costReductionPercentage: await this.calculateCostReduction(),
      errorRate: Number(latency?.error_rate) || 0,

      modelRoutingAccuracy:
        (Number(routing?.simple_routing_accuracy) + Number(routing?.complex_routing_accuracy)) /
        2 || 0,

      optimalModelUsageRate: await this.calculateOptimalModelUsage(timeRange),

      // Would be calculated from support tickets
      subscriptionRetentionRate: await this.calculateRetentionRate(),

      throughput: Number(latency?.total_queries) || 0,
      userComplaintRate: 0,
    };
  }

  /**
   * Check for performance alerts
   */
  async checkAlerts(): Promise<
    Array<{ message: string; severity: 'low' | 'medium' | 'high'; type: string }>
  > {
    const alerts: Array<{ message: string; severity: 'low' | 'medium' | 'high'; type: string }> = [];
    const metrics = await this.getPerformanceMetrics({
      // Last 24 hours
      end: new Date(),
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    // Latency Alert
    if (metrics.averageLatency > this.alertConfig.latencyThreshold) {
      alerts.push({
        message: `Độ trễ trung bình cao: ${metrics.averageLatency.toFixed(0)}ms (ngưỡng: ${this.alertConfig.latencyThreshold}ms)`,
        severity:
          metrics.averageLatency > this.alertConfig.latencyThreshold * 2
            ? 'high'
            : ('medium' as const),
        type: 'performance',
      });
    }

    // Error Rate Alert
    if (metrics.errorRate > this.alertConfig.errorRateThreshold) {
      alerts.push({
        message: `Tỷ lệ lỗi cao: ${metrics.errorRate.toFixed(1)}% (ngưỡng: ${this.alertConfig.errorRateThreshold}%)`,
        severity:
          metrics.errorRate > this.alertConfig.errorRateThreshold * 2
            ? 'high'
            : ('medium' as const),
        type: 'reliability',
      });
    }

    // Budget Overrun Alert
    if (metrics.budgetOverrunRate > this.alertConfig.budgetOverrunThreshold) {
      alerts.push({
        message: `Tỷ lệ vượt ngân sách cao: ${metrics.budgetOverrunRate.toFixed(1)}% người dùng (ngưỡng: ${this.alertConfig.budgetOverrunThreshold}%)`,
        severity:
          metrics.budgetOverrunRate > this.alertConfig.budgetOverrunThreshold * 2
            ? 'high'
            : ('medium' as const),
        type: 'budget',
      });
    }

    // Cost Efficiency Alert
    if (metrics.costReductionPercentage < 10) {
      alerts.push({
        message: `Hiệu quả tiết kiệm chi phí thấp: ${metrics.costReductionPercentage.toFixed(1)}% (mục tiêu: 15%)`,
        severity: 'low',
        type: 'cost',
      });
    }

    return alerts;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange: { end: Date; start: Date }): Promise<{
    recommendations: string[];
    summary: PerformanceMetrics;
    trends: Array<{ [key: string]: any; date: string }>;
  }> {
    const metrics = await this.getPerformanceMetrics(timeRange);
    const trends = await this.getPerformanceTrends(timeRange);
    const recommendations = this.generateRecommendations(metrics);

    return {
      recommendations,
      summary: metrics,
      trends,
    };
  }

  /**
   * Calculate cost reduction compared to baseline (no optimization)
   */
  private async calculateCostReduction(): Promise<number> {
    // This would compare actual costs vs. estimated costs without optimization
    // For now, return a mock value
    return 15.2; // 15.2% cost reduction
  }

  /**
   * Calculate subscription retention rate
   */
  private async calculateRetentionRate(): Promise<number> {
    // This would calculate monthly retention rate
    // For now, return a mock value
    return 92.5; // 92.5% retention rate
  }

  /**
   * Calculate optimal model usage rate
   */
  private async calculateOptimalModelUsage(timeRange: { end: Date; start: Date }): Promise<number> {
    const { start, end } = timeRange;

    const result = await this.db.execute(sql`
      SELECT 
        COUNT(CASE 
          WHEN (query_complexity = 'simple' AND model IN ('gemini-1.5-flash', 'gpt-4o-mini', 'claude-3-haiku')) OR
               (query_complexity = 'medium' AND model IN ('gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-pro')) OR
               (query_complexity = 'complex' AND model IN ('claude-3-sonnet', 'gpt-4o', 'gemini-1.5-pro'))
          THEN 1 
        END) * 100.0 / COUNT(*) as optimal_usage_rate
      FROM usage_logs 
      WHERE created_at BETWEEN ${start} AND ${end}
    `);

    const rows = result.rows as any[] || [];
    return Number(rows[0]?.optimal_usage_rate) || 0;
  }

  /**
   * Get performance trends over time
   */
  private async getPerformanceTrends(timeRange: {
    end: Date;
    start: Date;
  }): Promise<Array<{ [key: string]: any; date: string }>> {
    const { start, end } = timeRange;

    const result = await this.db.execute(sql`
      SELECT
        DATE(created_at) as date,
        AVG(response_time_ms) as avg_latency,
        AVG(cost_vnd) as avg_cost,
        COUNT(*) as total_queries,
        COUNT(CASE WHEN response_time_ms > 2000 THEN 1 END) * 100.0 / COUNT(*) as error_rate
      FROM usage_logs
      WHERE created_at BETWEEN ${start} AND ${end}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const rows = result.rows as any[] || [];
    return rows.map((row: any) => ({
      avgCost: Number(row.avg_cost),
      avgLatency: Number(row.avg_latency),
      date: row.date,
      errorRate: Number(row.error_rate),
      totalQueries: Number(row.total_queries),
    }));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations = [];

    if (metrics.averageLatency > 1000) {
      recommendations.push(
        'Cân nhắc tối ưu hóa độ trễ bằng cách sử dụng mô hình nhanh hơn cho truy vấn đơn giản',
      );
    }

    if (metrics.budgetOverrunRate > 5) {
      recommendations.push('Tăng cường giám sát ngân sách và cảnh báo sớm cho người dùng');
    }

    if (metrics.costReductionPercentage < 10) {
      recommendations.push('Cải thiện thuật toán định tuyến mô hình để tối ưu hóa chi phí');
    }

    if (metrics.modelRoutingAccuracy < 80) {
      recommendations.push('Tinh chỉnh hệ thống phân tích độ phức tạp truy vấn');
    }

    if (recommendations.length === 0) {
      recommendations.push('Hệ thống đang hoạt động tốt, tiếp tục giám sát các chỉ số hiệu suất');
    }

    return recommendations;
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
