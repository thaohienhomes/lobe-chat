import { NextRequest, NextResponse } from 'next/server';

import { migrationMonitor } from '@/services/monitoring/migrationMonitor';
import { featureRolloutService } from '@/services/featureFlags/rolloutService';

/**
 * Admin API endpoint for monitoring migration status
 * 
 * GET /api/admin/migration/status
 * - Returns current migration progress and system health
 * 
 * POST /api/admin/migration/status
 * - Update rollout configuration
 */

interface MigrationStatusResponse {
  data: {
    alerts: Array<{
      id: string;
      message: string;
      timestamp: string;
      type: string;
    }>;
    migration: {
      failedMigrations: number;
      migratedUsers: number;
      progress: number;
      status: 'not_started' | 'in_progress' | 'completed' | 'failed';
      totalUsers: number;
    };
    rollout: {
      enabled: boolean;
      environment: string;
      excludeUsers: number;
      percentage: number;
      targetUsers: number;
    };
    system: {
      activeAlerts: number;
      apiResponseTime: number;
      errorRate: number;
      health: 'healthy' | 'warning' | 'critical';
    };
  };
  success: boolean;
  timestamp: string;
}

interface UpdateRolloutRequest {
  enabled?: boolean;
  environment?: 'development' | 'staging' | 'production' | 'all';
  excludeUsers?: string[];
  rolloutPercentage?: number;
  targetUsers?: string[];
}

export async function GET(): Promise<NextResponse<MigrationStatusResponse>> {
  try {
    // Get monitoring data
    const report = migrationMonitor.generateReport();
    const rolloutStats = featureRolloutService.getRolloutStats('subscription_model_access');

    // Determine migration status
    let migrationStatus: 'not_started' | 'in_progress' | 'completed' | 'failed' = 'not_started';

    if (report.summary.migrationProgress === 0) {
      migrationStatus = 'not_started';
    } else if (report.summary.migrationProgress === 100) {
      migrationStatus = 'completed';
    } else if (report.summary.failedMigrations > report.summary.totalUsers * 0.1) {
      migrationStatus = 'failed'; // More than 10% failure rate
    } else {
      migrationStatus = 'in_progress';
    }

    const response: MigrationStatusResponse = {
      data: {
        alerts: migrationMonitor.getActiveAlerts().map(alert => ({
          id: alert.id,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          type: alert.type,
        })),
        migration: {
          failedMigrations: report.summary.failedMigrations,
          migratedUsers: report.summary.migratedUsers,
          progress: report.summary.migrationProgress,
          status: migrationStatus,
          totalUsers: report.summary.totalUsers,
        },
        rollout: {
          enabled: rolloutStats.enabled,
          environment: rolloutStats.environment,
          excludeUsers: rolloutStats.excludeUserCount,
          percentage: rolloutStats.rolloutPercentage,
          targetUsers: rolloutStats.targetUserCount,
        },
        system: {
          activeAlerts: report.summary.activeAlerts,
          apiResponseTime: report.metrics.at(-1)?.averageApiResponseTime || 0,
          errorRate: report.metrics.at(-1)?.apiErrorRate || 0,
          health: report.summary.systemHealth,
        },
      },
      success: true,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get migration status:', error);

    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to get migration status',
        success: false,
      } as any,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateRolloutRequest = await request.json();

    // Validate request
    if (body.rolloutPercentage !== undefined && (body.rolloutPercentage < 0 || body.rolloutPercentage > 100)) {
      return NextResponse.json(
        {
          error: 'Invalid rollout percentage. Must be between 0 and 100.',
          success: false,
        },
        { status: 400 }
      );
    }

    // Update rollout configuration
    const updateConfig: any = {};

    if (body.enabled !== undefined) updateConfig.enabled = body.enabled;
    if (body.rolloutPercentage !== undefined) updateConfig.rolloutPercentage = body.rolloutPercentage;
    if (body.environment !== undefined) updateConfig.environment = body.environment;
    if (body.targetUsers !== undefined) updateConfig.targetUsers = body.targetUsers;
    if (body.excludeUsers !== undefined) updateConfig.excludeUsers = body.excludeUsers;

    featureRolloutService.updateRolloutConfig('subscription_model_access', updateConfig);

    // Log the change
    console.log('Rollout configuration updated:', updateConfig);

    // Get updated status
    const rolloutStats = featureRolloutService.getRolloutStats('subscription_model_access');

    return NextResponse.json({
      data: {
        rollout: {
          enabled: rolloutStats.enabled,
          environment: rolloutStats.environment,
          excludeUsers: rolloutStats.excludeUserCount,
          percentage: rolloutStats.rolloutPercentage,
          targetUsers: rolloutStats.targetUserCount,
        },
      },
      message: 'Rollout configuration updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to update rollout configuration:', error);

    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to update rollout configuration',
        success: false,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
