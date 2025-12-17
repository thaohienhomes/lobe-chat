/**
 * Migration Monitoring Service
 * 
 * Tracks migration progress, performance metrics, and user behavior changes
 * during the subscription model access control rollout.
 */

export interface MigrationMetrics {
  // System Health
  activeConnections: number;

  // Performance Metrics
  apiErrorRate: number; // 0-1
  averageApiResponseTime: number; // ms

  // System Health (continued)
  cpuUsage: number; // 0-100%
  databaseQueryTime: number; // ms

  // Migration Progress
  failedMigrations: number;
  memoryUsage: number; // MB
  migratedUsers: number;
  migrationProgress: number; // 0-100%

  // User Behavior Metrics
  modelSelectionChanges: number;
  subscriptionUpgrades: number;
  timestamp: Date;
  totalUsers: number;
  upgradePromptClicks: number;

  userComplaints: number;
}

export interface MigrationAlert {
  details?: any;
  id: string;
  message: string;
  resolved: boolean;
  timestamp: Date;
  type: 'error' | 'warning' | 'info';
}

export class MigrationMonitoringService {
  private alerts: MigrationAlert[] = [];
  private isMonitoring: boolean = false;
  private metrics: MigrationMetrics[] = [];
  private monitoringInterval?: ReturnType<typeof setInterval>;

  /**
   * Start monitoring migration progress
   */
  public startMonitoring(intervalMinutes: number = 5): void {
    if (this.isMonitoring) {
      console.log('Migration monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting migration monitoring (interval: ${intervalMinutes} minutes)`);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('Error during monitoring:', error);
        this.createAlert('error', 'Monitoring collection failed', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Migration monitoring stopped');
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: MigrationMetrics = {
        // System Health
        activeConnections: await this.getActiveConnections(),

        // Performance Metrics
        apiErrorRate: await this.getApiErrorRate(),
        averageApiResponseTime: await this.getAverageApiResponseTime(),

        // System Health (continued)
        cpuUsage: await this.getCpuUsage(),
        databaseQueryTime: await this.getDatabaseQueryTime(),

        // Migration Progress
        failedMigrations: await this.getFailedMigrations(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        migratedUsers: await this.getMigratedUsers(),
        migrationProgress: 0, // Calculated below

        // User Behavior Metrics
        modelSelectionChanges: await this.getModelSelectionChanges(),
        subscriptionUpgrades: await this.getSubscriptionUpgrades(),
        timestamp: new Date(),
        totalUsers: await this.getTotalUsers(),
        upgradePromptClicks: await this.getUpgradePromptClicks(),

        userComplaints: await this.getUserComplaints(),
      };

      // Calculate migration progress
      metrics.migrationProgress = metrics.totalUsers > 0
        ? (metrics.migratedUsers / metrics.totalUsers) * 100
        : 0;

      this.metrics.push(metrics);

      // Keep only last 24 hours of metrics (assuming 5-minute intervals)
      if (this.metrics.length > 288) {
        this.metrics = this.metrics.slice(-288);
      }

      console.log(`Migration Progress: ${metrics.migrationProgress.toFixed(1)}% (${metrics.migratedUsers}/${metrics.totalUsers})`);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      this.createAlert('error', 'Metrics collection failed', error);
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(): Promise<void> {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    // High error rate alert
    if (latestMetrics.apiErrorRate > 0.05) { // 5% error rate
      this.createAlert('error', `High API error rate: ${(latestMetrics.apiErrorRate * 100).toFixed(1)}%`);
    }

    // Slow response time alert
    if (latestMetrics.averageApiResponseTime > 2000) { // 2 seconds
      this.createAlert('warning', `Slow API response time: ${latestMetrics.averageApiResponseTime}ms`);
    }

    // High memory usage alert
    if (latestMetrics.memoryUsage > 1000) { // 1GB
      this.createAlert('warning', `High memory usage: ${latestMetrics.memoryUsage.toFixed(0)}MB`);
    }

    // Migration failure rate alert
    const failureRate = latestMetrics.totalUsers > 0
      ? (latestMetrics.failedMigrations / latestMetrics.totalUsers) * 100
      : 0;

    if (failureRate > 10) { // 10% failure rate
      this.createAlert('error', `High migration failure rate: ${failureRate.toFixed(1)}%`);
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(type: MigrationAlert['type'], message: string, details?: any): void {
    const alert: MigrationAlert = {
      details,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      message,
      resolved: false,
      timestamp: new Date(),
      type,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`[${type.toUpperCase()}] ${message}`);

    // In production, would send to alerting system (Slack, email, etc.)
    if (type === 'error') {
      this.sendCriticalAlert(alert);
    }
  }

  /**
   * Get latest metrics
   */
  public getLatestMetrics(): MigrationMetrics | null {
    return this.metrics.length > 0 ? (this.metrics.at(-1) ?? null) : null;
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(hours: number = 24): MigrationMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): MigrationAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Generate monitoring report
   */
  public generateReport(): {
    alerts: MigrationAlert[];
    metrics: MigrationMetrics[];
    summary: any;
  } {
    const latestMetrics = this.getLatestMetrics();
    const activeAlerts = this.getActiveAlerts();

    return {
      alerts: this.alerts,
      metrics: this.getMetricsHistory(),
      summary: {
        activeAlerts: activeAlerts.length,
        failedMigrations: latestMetrics?.failedMigrations || 0,
        migratedUsers: latestMetrics?.migratedUsers || 0,
        migrationProgress: latestMetrics?.migrationProgress || 0,
        systemHealth: this.getSystemHealthStatus(),
        totalUsers: latestMetrics?.totalUsers || 0,
      },
    };
  }

  // Mock implementations for metrics collection
  // In production, these would integrate with real monitoring systems

  private async getActiveConnections(): Promise<number> {
    // Mock: would query connection pool or load balancer
    return Math.floor(Math.random() * 100 + 50); // 50-150 connections
  }

  private async getApiErrorRate(): Promise<number> {
    // Mock: would calculate from API logs
    return Math.random() * 0.02; // 0-2% error rate
  }

  private async getAverageApiResponseTime(): Promise<number> {
    // Mock: would integrate with APM tools like New Relic, DataDog
    return Math.random() * 500 + 200; // 200-700ms
  }

  private async getCpuUsage(): Promise<number> {
    // Mock: would use system monitoring
    return Math.random() * 30 + 10; // 10-40% CPU
  }

  private async getDatabaseQueryTime(): Promise<number> {
    // Mock: would measure actual DB query performance
    return Math.random() * 100 + 50; // 50-150ms
  }

  private async getFailedMigrations(): Promise<number> {
    // Mock: would query migration logs or error tables
    return 25;
  }

  private async getMigratedUsers(): Promise<number> {
    // Mock: would query users with migrated flag or ai_models entries
    return 750;
  }

  private async getModelSelectionChanges(): Promise<number> {
    // Mock: would track user analytics events
    return Math.floor(Math.random() * 50);
  }

  private async getSubscriptionUpgrades(): Promise<number> {
    // Mock: would query subscription changes
    return Math.floor(Math.random() * 5);
  }

  private async getTotalUsers(): Promise<number> {
    // Mock: would query users table
    return 1000;
  }

  private async getUpgradePromptClicks(): Promise<number> {
    // Mock: would track UI interaction events
    return Math.floor(Math.random() * 20);
  }

  private async getUserComplaints(): Promise<number> {
    // Mock: would integrate with support system
    return Math.floor(Math.random() * 3);
  }

  private getSystemHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return 'warning';

    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.type === 'error');

    if (criticalAlerts.length > 0) return 'critical';
    if (activeAlerts.length > 3) return 'warning';
    if (latestMetrics.apiErrorRate > 0.03) return 'warning';
    if (latestMetrics.averageApiResponseTime > 1500) return 'warning';

    return 'healthy';
  }

  private sendCriticalAlert(alert: MigrationAlert): void {
    // Mock: would send to Slack, email, PagerDuty, etc.
    console.error(`🚨 CRITICAL ALERT: ${alert.message}`);

    // In production:
    // - Send Slack notification
    // - Send email to on-call team
    // - Create PagerDuty incident
    // - Log to external monitoring system
  }
}

// Singleton instance
export const migrationMonitor = new MigrationMonitoringService();
