/**
 * Feature Flag System for Cost Optimization Rollout
 * Enables gradual deployment and instant rollback capabilities
 */

export interface FeatureFlags {
  budgetAlertsEnabled: boolean;
  costOptimizationEnabled: boolean;
  intelligentRoutingEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  rolloutPercentage: number;
  usageTrackingEnabled: boolean;
}

export interface RolloutConfig {
  endDate?: Date;
  excludeUsers?: string[];
  percentage: number;
  phase: 'disabled' | 'testing' | 'partial' | 'full';
  startDate: Date;
  targetUsers?: string[];
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags;
  private rolloutConfig: RolloutConfig;

  private constructor() {
    this.flags = this.loadDefaultFlags();
    this.rolloutConfig = this.loadDefaultRolloutConfig();
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if cost optimization is enabled for a specific user
   */
  isEnabledForUser(
    userId: string,
    feature: keyof FeatureFlags = 'costOptimizationEnabled',
  ): boolean {
    // Global feature flag check
    if (!this.flags[feature]) {
      return false;
    }

    // Rollout phase check
    if (this.rolloutConfig.phase === 'disabled') {
      return false;
    }

    if (this.rolloutConfig.phase === 'testing') {
      return this.rolloutConfig.targetUsers?.includes(userId) || false;
    }

    if (this.rolloutConfig.phase === 'full') {
      return !this.rolloutConfig.excludeUsers?.includes(userId);
    }

    // Partial rollout - use percentage-based selection
    if (this.rolloutConfig.phase === 'partial') {
      const userHash = this.hashUserId(userId);
      const userPercentile = userHash % 100;
      return userPercentile < this.rolloutConfig.percentage;
    }

    return false;
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get current rollout configuration
   */
  getRolloutConfig(): RolloutConfig {
    return { ...this.rolloutConfig };
  }

  /**
   * Update feature flags (admin only)
   */
  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    if (process.env.NODE_ENV !== 'production') {
      console.log('Feature flags updated:', newFlags);
    }
  }

  /**
   * Update rollout configuration (admin only)
   */
  updateRolloutConfig(newConfig: Partial<RolloutConfig>): void {
    this.rolloutConfig = { ...this.rolloutConfig, ...newConfig };
    if (process.env.NODE_ENV !== 'production') {
      console.log('Rollout config updated:', newConfig);
    }
  }

  /**
   * Emergency rollback - disable all cost optimization features
   */
  emergencyRollback(reason: string): void {
    console.error('🚨 EMERGENCY ROLLBACK TRIGGERED:', reason);

    this.flags = {
      budgetAlertsEnabled: false,
      costOptimizationEnabled: false,
      intelligentRoutingEnabled: false,
      performanceMonitoringEnabled: false,
      rolloutPercentage: 0,
      usageTrackingEnabled: false,
    };

    this.rolloutConfig = {
      percentage: 0,
      phase: 'disabled',
      startDate: new Date(),
    };

    // Log rollback event
    this.logRollbackEvent(reason);
  }

  /**
   * Get rollout statistics
   */
  getRolloutStats(): {
    activeFeatures: string[];
    estimatedUsers: number;
    percentage: number;
    phase: string;
  } {
    const activeFeatures = Object.entries(this.flags)
      .filter(([, value]) => value === true)
      .map(([key]) => key);

    return {
      activeFeatures,
      estimatedUsers: this.estimateAffectedUsers(),
      percentage: this.rolloutConfig.percentage,
      phase: this.rolloutConfig.phase,
    };
  }

  /**
   * Check system health and auto-rollback if needed
   */
  async checkHealthAndRollback(): Promise<void> {
    try {
      // Import performance monitoring service
      const { PerformanceMonitoringService } = await import('../PerformanceMonitoring');
      const { getServerDB } = await import('@/database/server');

      const db = await getServerDB();
      const monitoring = new PerformanceMonitoringService(db);

      const alerts = await monitoring.checkAlerts();
      const criticalAlerts = alerts.filter((alert) => alert.severity === 'high');

      if (criticalAlerts.length > 0) {
        const reasons = criticalAlerts.map((alert) => alert.message).join('; ');
        console.warn('🚨 Critical alerts detected, considering rollback:', reasons);

        // Auto-rollback conditions
        const shouldRollback = criticalAlerts.some(
          (alert) =>
            alert.type === 'performance' ||
            alert.type === 'reliability' ||
            (alert.type === 'budget' && alert.message.includes('20%')), // 20% budget overrun
        );

        if (shouldRollback) {
          this.emergencyRollback(`Auto-rollback due to critical alerts: ${reasons}`);
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Load default feature flags from environment
   */
  private loadDefaultFlags(): FeatureFlags {
    return {
      budgetAlertsEnabled: process.env.BUDGET_ALERT_EMAIL_ENABLED === 'true',
      costOptimizationEnabled: process.env.COST_OPTIMIZATION_ENABLED === 'true',
      intelligentRoutingEnabled: process.env.INTELLIGENT_ROUTING_ENABLED !== 'false',
      performanceMonitoringEnabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
      rolloutPercentage: parseInt(process.env.ROLLOUT_PERCENTAGE || '0', 10),
      usageTrackingEnabled: process.env.USAGE_TRACKING_ENABLED === 'true',
    };
  }

  /**
   * Load default rollout configuration
   */
  private loadDefaultRolloutConfig(): RolloutConfig {
    const phase = (process.env.ROLLOUT_PHASE as RolloutConfig['phase']) || 'disabled';
    const percentage = parseInt(process.env.ROLLOUT_PERCENTAGE || '0', 10);

    return {
      excludeUsers: process.env.ROLLOUT_EXCLUDE_USERS?.split(',') || [],
      percentage,
      phase,
      startDate: new Date(),
      targetUsers: process.env.ROLLOUT_TARGET_USERS?.split(',') || [],
    };
  }

  /**
   * Hash user ID for consistent percentage-based rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Estimate number of affected users
   */
  private estimateAffectedUsers(): number {
    // This would query the database for total user count
    // For now, return an estimate based on percentage
    const totalUsers = 1000; // Mock value

    if (this.rolloutConfig.phase === 'disabled') return 0;
    if (this.rolloutConfig.phase === 'testing') return this.rolloutConfig.targetUsers?.length || 0;
    if (this.rolloutConfig.phase === 'full') return totalUsers;

    return Math.floor(totalUsers * (this.rolloutConfig.percentage / 100));
  }

  /**
   * Log rollback event for audit trail
   */
  private logRollbackEvent(reason: string): void {
    const rollbackEvent = {
      previousConfig: this.rolloutConfig,
      previousFlags: this.flags,
      reason,
      timestamp: new Date().toISOString(),
    };

    // In production, this would be sent to logging service
    if (process.env.NODE_ENV !== 'production') {
      console.log('Rollback event logged:', rollbackEvent);
    }
  }
}

// Singleton instance
export const featureFlags = FeatureFlagService.getInstance();

// Convenience functions
export const isEnabledForUser = (userId: string, feature?: keyof FeatureFlags) =>
  featureFlags.isEnabledForUser(userId, feature);

export const isCostOptimizationEnabled = (userId: string) =>
  featureFlags.isEnabledForUser(userId, 'costOptimizationEnabled');

export const isIntelligentRoutingEnabled = (userId: string) =>
  featureFlags.isEnabledForUser(userId, 'intelligentRoutingEnabled');

export const isUsageTrackingEnabled = (userId: string) =>
  featureFlags.isEnabledForUser(userId, 'usageTrackingEnabled');
