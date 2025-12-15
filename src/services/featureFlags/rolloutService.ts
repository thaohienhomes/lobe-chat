/**
 * Enhanced Feature Flags Service for Gradual Rollout
 * 
 * Supports:
 * - Percentage-based rollout (0-100%)
 * - User targeting (specific users)
 * - Environment-based controls
 * - A/B testing capabilities
 */

export interface RolloutConfig {
  enabled: boolean;
  // When rollout should start
  endDate?: Date; 
  // Users to exclude from rollout
  environment?: 'development' | 'production' | 'test' | 'all'; // Specific user IDs for testing
  excludeUsers?: string[]; 
  rolloutPercentage: number;
  startDate?: Date; 
  // 0-100
  targetUsers?: string[]; // When rollout should end
}

export interface FeatureRolloutFlags {
  // Subscription-based model access control
  subscription_model_access: RolloutConfig;

  // Future rollout features can be added here
  // enhanced_chat_ui: RolloutConfig;
  // new_payment_flow: RolloutConfig;
}

export const DEFAULT_ROLLOUT_FLAGS: FeatureRolloutFlags = {
  subscription_model_access: {
    enabled: false, 
    // 0% rollout initially
environment: 'development', 
    
// Can add specific test users
excludeUsers: [], 
    
// Start disabled for safety
rolloutPercentage: 0, 
    // Only in development initially
targetUsers: [], // Can exclude problematic users
  },
};

export class FeatureRolloutService {
  private rolloutFlags: FeatureRolloutFlags;

  constructor(flags?: Partial<FeatureRolloutFlags>) {
    this.rolloutFlags = {
      ...DEFAULT_ROLLOUT_FLAGS,
      ...flags,
    };
  }

  /**
   * Check if a feature is enabled for a specific user
   */
  public isFeatureEnabled(
    featureName: keyof FeatureRolloutFlags,
    userId: string,
    environment: string = process.env.NODE_ENV || 'development'
  ): boolean {
    const config = this.rolloutFlags[featureName];

    if (!config || !config.enabled) {
      return false;
    }

    // Check environment
    if (config.environment && config.environment !== 'all' && config.environment !== environment) {
      return false;
    }

    // Check date range
    const now = new Date();
    if (config.startDate && now < config.startDate) {
      return false;
    }
    if (config.endDate && now > config.endDate) {
      return false;
    }

    // Check exclude list
    if (config.excludeUsers && config.excludeUsers.includes(userId)) {
      return false;
    }

    // Check target users (if specified, only these users get the feature)
    if (config.targetUsers && config.targetUsers.length > 0) {
      return config.targetUsers.includes(userId);
    }

    // Percentage-based rollout using consistent hash
    const userHash = this.hashUserId(userId);
    const userPercentile = userHash % 100;

    return userPercentile < config.rolloutPercentage;
  }

  /**
   * Update rollout configuration for a feature
   */
  public updateRolloutConfig(
    featureName: keyof FeatureRolloutFlags,
    config: Partial<RolloutConfig>
  ): void {
    this.rolloutFlags[featureName] = {
      ...this.rolloutFlags[featureName],
      ...config,
    };
  }

  /**
   * Get current rollout status for all features
   */
  public getRolloutStatus(): FeatureRolloutFlags {
    return { ...this.rolloutFlags };
  }

  /**
   * Get rollout statistics for a feature
   */
  public getRolloutStats(featureName: keyof FeatureRolloutFlags): {
    enabled: boolean;
    environment: string;
    excludeUserCount: number;
    rolloutPercentage: number;
    targetUserCount: number;
  } {
    const config = this.rolloutFlags[featureName];

    return {
      enabled: config.enabled,
      environment: config.environment || 'all',
      excludeUserCount: config.excludeUsers?.length || 0,
      rolloutPercentage: config.rolloutPercentage,
      targetUserCount: config.targetUsers?.length || 0,
    };
  }

  /**
   * Simple hash function for consistent user bucketing
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Gradual rollout helper - increase percentage over time
   */
  public scheduleGradualRollout(
    featureName: keyof FeatureRolloutFlags,
    targetPercentage: number,
    durationHours: number,
    stepPercentage: number = 10
  ): void {
    const config = this.rolloutFlags[featureName];
    const currentPercentage = config.rolloutPercentage;

    if (currentPercentage >= targetPercentage) {
      console.log(`Feature ${featureName} already at or above target percentage`);
      return;
    }

    const steps = Math.ceil((targetPercentage - currentPercentage) / stepPercentage);
    const intervalHours = durationHours / steps;

    console.log(`Scheduling gradual rollout for ${featureName}:`);
    console.log(`  From: ${currentPercentage}% to ${targetPercentage}%`);
    console.log(`  Steps: ${steps} (${stepPercentage}% each)`);
    console.log(`  Interval: ${intervalHours} hours`);

    // Note: In production, this would use a job scheduler like cron or queue system
    // For now, just log the schedule
  }
}

// Singleton instance
export const featureRolloutService = new FeatureRolloutService();

// Environment-based configuration
const getEnvironmentRolloutConfig = (): Partial<FeatureRolloutFlags> => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'development': {
      return {
        subscription_model_access: {
          enabled: true,
          // Full rollout in development
environment: 'development', 
          rolloutPercentage: 100,
        },
      };
    }

    case 'test': {
      return {
        subscription_model_access: {
          enabled: true,
          // 50% rollout in test
environment: 'test', 
          rolloutPercentage: 50,
        },
      };
    }

    case 'production': {
      return {
        subscription_model_access: {
          enabled: false, 
          environment: 'production',
          // Start disabled in production
rolloutPercentage: 0,
        },
      };
    }

    default: {
      return {};
    }
  }
};

// Initialize with environment-specific config
featureRolloutService.updateRolloutConfig(
  'subscription_model_access',
  getEnvironmentRolloutConfig().subscription_model_access || {}
);
