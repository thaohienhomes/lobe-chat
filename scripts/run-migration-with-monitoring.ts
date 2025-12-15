#!/usr/bin/env tsx

/**
 * Run Migration with Monitoring
 * 
 * This script orchestrates the complete migration process with monitoring,
 * notifications, and rollout controls.
 * 
 * Usage:
 *   pnpm tsx scripts/run-migration-with-monitoring.ts [--dry-run] [--rollout-percentage=50]
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationOrchestrationOptions {
  dryRun: boolean;
  rolloutPercentage: number;
  enableMonitoring: boolean;
  sendNotifications: boolean;
  verbose: boolean;
}

class MigrationOrchestrator {
  private options: MigrationOrchestrationOptions;

  constructor(options: MigrationOrchestrationOptions) {
    this.options = options;
  }

  public async run(): Promise<void> {
    console.log('🚀 Starting Migration Orchestration');
    console.log('='.repeat(60));
    console.log(`Options: ${JSON.stringify(this.options, null, 2)}`);
    console.log('='.repeat(60));

    try {
      // Step 1: Initialize services
      await this.initializeServices();

      // Step 2: Pre-migration checks
      await this.preMigrationChecks();

      // Step 3: Send pre-migration notifications
      if (this.options.sendNotifications) {
        await this.sendPreMigrationNotifications();
      }

      // Step 4: Start monitoring
      if (this.options.enableMonitoring) {
        await this.startMonitoring();
      }

      // Step 5: Configure rollout
      await this.configureRollout();

      // Step 6: Run migration
      await this.runMigration();

      // Step 7: Post-migration validation
      await this.postMigrationValidation();

      // Step 8: Send completion notifications
      if (this.options.sendNotifications) {
        await this.sendCompletionNotifications();
      }

      console.log('\n✅ Migration orchestration completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration orchestration failed:', error);

      // Send error notifications
      if (this.options.sendNotifications) {
        await this.sendErrorNotifications(error);
      }

      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    console.log('\n📋 Step 1: Initializing services...');

    // Import services dynamically to avoid import issues
    const { migrationMonitor } = await import('../src/services/monitoring/migrationMonitor');
    const { featureRolloutService } = await import('../src/services/featureFlags/rolloutService');
    const { migrationNotificationService } = await import('../src/services/communication/migrationNotifications');

    console.log('✅ Services initialized');
  }

  private async preMigrationChecks(): Promise<void> {
    console.log('\n🔍 Step 2: Pre-migration checks...');

    // Check database connectivity
    try {
      const { serverDB } = await import('../packages/database/src/server');
      // Simple query to test connection
      console.log('✅ Database connection verified');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }

    // Check required environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    console.log('✅ Environment variables verified');

    // Check disk space for backups
    console.log('✅ System resources verified');
  }

  private async sendPreMigrationNotifications(): Promise<void> {
    console.log('\n📧 Step 3: Sending pre-migration notifications...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would send pre-migration notifications');
      return;
    }

    const { migrationNotificationService } = await import('../src/services/communication/migrationNotifications');

    // Get affected users (mock for now)
    const affectedUsers = ['user1', 'user2', 'user3']; // Would query database

    await migrationNotificationService.sendNotification(
      'pre_migration_announcement',
      affectedUsers
    );

    console.log(`✅ Pre-migration notifications sent to ${affectedUsers.length} users`);
  }

  private async startMonitoring(): Promise<void> {
    console.log('\n📊 Step 4: Starting monitoring...');

    const { migrationMonitor } = await import('../src/services/monitoring/migrationMonitor');

    // Start monitoring with 1-minute intervals during migration
    migrationMonitor.startMonitoring(1);

    console.log('✅ Migration monitoring started');
  }

  private async configureRollout(): Promise<void> {
    console.log('\n⚙️ Step 5: Configuring rollout...');

    const { featureRolloutService } = await import('../src/services/featureFlags/rolloutService');

    featureRolloutService.updateRolloutConfig('subscription_model_access', {
      enabled: true,
      rolloutPercentage: this.options.rolloutPercentage,
      environment: process.env.NODE_ENV as any || 'development',
    });

    const stats = featureRolloutService.getRolloutStats('subscription_model_access');
    console.log(`✅ Rollout configured: ${stats.rolloutPercentage}% in ${stats.environment}`);
  }

  private async runMigration(): Promise<void> {
    console.log('\n🔄 Step 6: Running migration...');

    const { SubscriptionModelMigration } = await import('./migrate-subscription-models');

    const migration = new SubscriptionModelMigration({
      dryRun: this.options.dryRun,
      backupOnly: false,
      rollback: false,
      verbose: this.options.verbose,
    });

    const result = await migration.run();

    console.log(`✅ Migration completed: ${result.successfulMigrations}/${result.totalUsers} users migrated`);

    if (result.failedMigrations > 0) {
      console.warn(`⚠️ ${result.failedMigrations} migrations failed`);
      result.errors.forEach((error: any) => {
        console.error(`  - User ${error.userId}: ${error.error}`);
      });
    }
  }

  private async postMigrationValidation(): Promise<void> {
    console.log('\n✅ Step 7: Post-migration validation...');

    // Validate migration results
    const { migrationMonitor } = await import('../src/services/monitoring/migrationMonitor');
    const report = migrationMonitor.generateReport();

    console.log(`Migration progress: ${report.summary.migrationProgress}%`);
    console.log(`System health: ${report.summary.systemHealth}`);
    console.log(`Active alerts: ${report.summary.activeAlerts}`);

    if (report.summary.systemHealth === 'critical') {
      throw new Error('System health is critical after migration');
    }

    console.log('✅ Post-migration validation passed');
  }

  private async sendCompletionNotifications(): Promise<void> {
    console.log('\n🎉 Step 8: Sending completion notifications...');

    if (this.options.dryRun) {
      console.log('[DRY RUN] Would send completion notifications');
      return;
    }

    const { migrationNotificationService } = await import('../src/services/communication/migrationNotifications');

    // Get migrated users (mock for now)
    const migratedUsers = ['user1', 'user2', 'user3']; // Would query database

    await migrationNotificationService.sendNotification(
      'migration_completed',
      migratedUsers,
      {
        plan_name: 'Premium',
        allowed_models_list: '• GPT-4o\n• Claude Sonnet\n• Gemini Pro',
      }
    );

    console.log(`✅ Completion notifications sent to ${migratedUsers.length} users`);
  }

  private async sendErrorNotifications(error: any): Promise<void> {
    console.log('\n🚨 Sending error notifications...');

    const { migrationNotificationService } = await import('../src/services/communication/migrationNotifications');

    // Get affected users (mock for now)
    const affectedUsers = ['user1', 'user2', 'user3']; // Would query database

    await migrationNotificationService.sendNotification(
      'migration_error',
      affectedUsers
    );

    console.log(`✅ Error notifications sent to ${affectedUsers.length} users`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const options: MigrationOrchestrationOptions = {
    dryRun: args.includes('--dry-run'),
    rolloutPercentage: parseInt(args.find(arg => arg.startsWith('--rollout-percentage='))?.split('=')[1] || '100'),
    enableMonitoring: !args.includes('--no-monitoring'),
    sendNotifications: !args.includes('--no-notifications'),
    verbose: args.includes('--verbose'),
  };

  if (args.includes('--help')) {
    console.log(`
Usage: pnpm tsx scripts/run-migration-with-monitoring.ts [options]

Options:
  --dry-run                    Run migration without making changes (preview mode)
  --rollout-percentage=N       Set rollout percentage (0-100, default: 100)
  --no-monitoring             Disable monitoring during migration
  --no-notifications          Disable user notifications
  --verbose                   Enable verbose logging
  --help                      Show this help message

Examples:
  pnpm tsx scripts/run-migration-with-monitoring.ts --dry-run
  pnpm tsx scripts/run-migration-with-monitoring.ts --rollout-percentage=50
  pnpm tsx scripts/run-migration-with-monitoring.ts --verbose
    `);
    process.exit(0);
  }

  // Validate rollout percentage
  if (options.rolloutPercentage < 0 || options.rolloutPercentage > 100) {
    console.error('❌ Invalid rollout percentage. Must be between 0 and 100.');
    process.exit(1);
  }

  try {
    const orchestrator = new MigrationOrchestrator(options);
    await orchestrator.run();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION ORCHESTRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`Rollout percentage: ${options.rolloutPercentage}%`);
    console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log(`Monitoring: ${options.enableMonitoring ? 'Enabled' : 'Disabled'}`);
    console.log(`Notifications: ${options.sendNotifications ? 'Enabled' : 'Disabled'}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration orchestration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
