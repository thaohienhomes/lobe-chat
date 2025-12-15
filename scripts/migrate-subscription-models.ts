#!/usr/bin/env tsx

/**
 * Migration Script: Subscription-Based Model Access Control
 * 
 * This script migrates existing users from self-managed API keys to 
 * subscription-based model access control.
 * 
 * What it does:
 * 1. Backup current user settings
 * 2. Query users with custom provider configurations
 * 3. Map their subscription plans to allowed models
 * 4. Auto-enable appropriate models in ai_models table
 * 5. Clean up old provider settings (optional)
 * 6. Log all changes for audit trail
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-subscription-models.ts [--dry-run] [--backup-only] [--rollback]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { eq, and, isNotNull } from 'drizzle-orm';

// Load environment variables
dotenv.config();

interface MigrationOptions {
  dryRun: boolean;
  backupOnly: boolean;
  rollback: boolean;
  verbose: boolean;
}

interface UserMigrationData {
  userId: string;
  currentPlanId: string;
  subscriptionStatus: string;
  hasCustomProviders: boolean;
  customProviders: string[];
  languageModelSettings: any;
  keyVaults: any;
}

interface MigrationResult {
  totalUsers: number;
  usersWithCustomProviders: number;
  successfulMigrations: number;
  failedMigrations: number;
  errors: Array<{ userId: string; error: string }>;
}

class SubscriptionModelMigration {
  private db: any;
  private options: MigrationOptions;
  private backupDir: string;
  private logFile: string;

  constructor(options: MigrationOptions) {
    this.options = options;
    this.backupDir = path.join(__dirname, 'migration-backups', new Date().toISOString().split('T')[0]);
    this.logFile = path.join(this.backupDir, 'migration.log');

    // Ensure backup directory exists
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  private log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;

    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  private async initializeDatabase() {
    try {
      const { serverDB } = await import('../packages/database/src/server');
      this.db = serverDB;
      this.log('Database connection initialized');
    } catch (error) {
      this.log(`Failed to initialize database: ${error}`, 'ERROR');
      throw error;
    }
  }

  private async backupUserSettings(): Promise<void> {
    this.log('Starting user settings backup...');

    try {
      const { users, userSettings } = await import('../packages/database/src/schemas/user');

      // Backup users table
      const usersData = await this.db.select().from(users);
      const usersBackupPath = path.join(this.backupDir, 'users_backup.json');
      fs.writeFileSync(usersBackupPath, JSON.stringify(usersData, null, 2));

      // Backup user_settings table
      const settingsData = await this.db.select().from(userSettings);
      const settingsBackupPath = path.join(this.backupDir, 'user_settings_backup.json');
      fs.writeFileSync(settingsBackupPath, JSON.stringify(settingsData, null, 2));

      this.log(`Backup completed: ${usersData.length} users, ${settingsData.length} settings`);
    } catch (error) {
      this.log(`Backup failed: ${error}`, 'ERROR');
      throw error;
    }
  }

  private async getUsersWithCustomProviders(): Promise<UserMigrationData[]> {
    this.log('Querying users with custom provider configurations...');

    try {
      const { users, userSettings } = await import('../packages/database/src/schemas/user');

      const usersWithSettings = await this.db
        .select({
          userId: users.id,
          currentPlanId: users.currentPlanId,
          subscriptionStatus: users.subscriptionStatus,
          languageModel: userSettings.languageModel,
          keyVaults: userSettings.keyVaults,
        })
        .from(users)
        .leftJoin(userSettings, eq(users.id, userSettings.id))
        .where(
          and(
            isNotNull(userSettings.languageModel),
            isNotNull(userSettings.keyVaults)
          )
        );

      const migrationData: UserMigrationData[] = [];

      for (const user of usersWithSettings) {
        const languageModelSettings = user.languageModel as any;
        const keyVaults = user.keyVaults;

        // Check if user has custom provider configurations
        const hasCustomProviders = this.hasCustomProviderConfig(languageModelSettings, keyVaults);
        const customProviders = this.getCustomProviders(languageModelSettings, keyVaults);

        if (hasCustomProviders) {
          migrationData.push({
            userId: user.userId,
            currentPlanId: user.currentPlanId || 'vn_free',
            subscriptionStatus: user.subscriptionStatus || 'FREE',
            hasCustomProviders,
            customProviders,
            languageModelSettings,
            keyVaults,
          });
        }
      }

      this.log(`Found ${migrationData.length} users with custom provider configurations`);
      return migrationData;
    } catch (error) {
      this.log(`Failed to query users: ${error}`, 'ERROR');
      throw error;
    }
  }

  private hasCustomProviderConfig(languageModel: any, keyVaults: any): boolean {
    if (!languageModel || !keyVaults) return false;

    // Check for custom API keys in keyVaults
    const keyVaultsObj = typeof keyVaults === 'string' ? JSON.parse(keyVaults) : keyVaults;
    const hasApiKeys = keyVaultsObj && Object.keys(keyVaultsObj).some(key =>
      key.includes('apiKey') || key.includes('API_KEY')
    );

    // Check for enabled providers in languageModel
    const hasEnabledProviders = languageModel && Object.values(languageModel).some((config: any) =>
      config && config.enabled === true
    );

    return hasApiKeys || hasEnabledProviders;
  }

  private getCustomProviders(languageModel: any, keyVaults: any): string[] {
    const providers: string[] = [];

    if (languageModel) {
      Object.keys(languageModel).forEach(provider => {
        const config = languageModel[provider];
        if (config && config.enabled === true) {
          providers.push(provider);
        }
      });
    }

    return providers;
  }

  private async migrateUserModels(userData: UserMigrationData): Promise<void> {
    this.log(`Migrating user ${userData.userId} (plan: ${userData.currentPlanId})`);

    try {
      // Import required modules
      const { getAllowedModelsForPlan, getDefaultModelForPlan, getRequiredProvidersForPlan } =
        await import('../src/config/pricing');
      const { SubscriptionModelAccessService } =
        await import('../src/services/subscription/modelAccess');

      // Get allowed models for user's plan
      const allowedModels = getAllowedModelsForPlan(userData.currentPlanId);
      const defaultModel = getDefaultModelForPlan(userData.currentPlanId);
      const requiredProviders = getRequiredProvidersForPlan(userData.currentPlanId);

      if (this.options.dryRun) {
        this.log(`[DRY RUN] Would enable ${allowedModels.length} models for user ${userData.userId}`);
        this.log(`[DRY RUN] Default model: ${defaultModel.model} (${defaultModel.provider})`);
        this.log(`[DRY RUN] Required providers: ${requiredProviders.join(', ')}`);
        return;
      }

      // Auto-enable models for user's subscription plan
      const modelAccessService = new SubscriptionModelAccessService();
      await modelAccessService.autoEnableModelsForPlan(userData.userId, userData.currentPlanId);

      this.log(`Successfully migrated user ${userData.userId}: enabled ${allowedModels.length} models`);
    } catch (error) {
      this.log(`Failed to migrate user ${userData.userId}: ${error}`, 'ERROR');
      throw error;
    }
  }

  private async cleanupOldProviderSettings(userData: UserMigrationData): Promise<void> {
    if (this.options.dryRun) {
      this.log(`[DRY RUN] Would clean up provider settings for user ${userData.userId}`);
      return;
    }

    try {
      const { userSettings } = await import('../packages/database/src/schemas/user');

      // Clear language model settings (provider configurations)
      await this.db
        .update(userSettings)
        .set({
          languageModel: null,
          keyVaults: null,
        })
        .where(eq(userSettings.id, userData.userId));

      this.log(`Cleaned up provider settings for user ${userData.userId}`);
    } catch (error) {
      this.log(`Failed to cleanup settings for user ${userData.userId}: ${error}`, 'ERROR');
      throw error;
    }
  }

  public async run(): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalUsers: 0,
      usersWithCustomProviders: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      errors: [],
    };

    try {
      this.log('Starting subscription model migration...');
      this.log(`Options: ${JSON.stringify(this.options)}`);

      // Initialize database connection
      await this.initializeDatabase();

      // Backup current settings
      await this.backupUserSettings();

      if (this.options.backupOnly) {
        this.log('Backup completed. Exiting (backup-only mode).');
        return result;
      }

      // Get users with custom provider configurations
      const usersToMigrate = await this.getUsersWithCustomProviders();
      result.totalUsers = usersToMigrate.length;
      result.usersWithCustomProviders = usersToMigrate.length;

      if (usersToMigrate.length === 0) {
        this.log('No users found with custom provider configurations. Migration complete.');
        return result;
      }

      // Migrate each user
      for (const userData of usersToMigrate) {
        try {
          await this.migrateUserModels(userData);

          // Optionally clean up old provider settings
          // Commented out for safety - can be enabled later
          // await this.cleanupOldProviderSettings(userData);

          result.successfulMigrations++;
        } catch (error) {
          result.failedMigrations++;
          result.errors.push({
            userId: userData.userId,
            error: String(error),
          });
        }
      }

      this.log('Migration completed!');
      this.log(`Total users: ${result.totalUsers}`);
      this.log(`Successful migrations: ${result.successfulMigrations}`);
      this.log(`Failed migrations: ${result.failedMigrations}`);

      if (result.errors.length > 0) {
        this.log('Errors encountered:', 'WARN');
        result.errors.forEach(error => {
          this.log(`  User ${error.userId}: ${error.error}`, 'ERROR');
        });
      }

      return result;
    } catch (error) {
      this.log(`Migration failed: ${error}`, 'ERROR');
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    backupOnly: args.includes('--backup-only'),
    rollback: args.includes('--rollback'),
    verbose: args.includes('--verbose'),
  };

  if (args.includes('--help')) {
    console.log(`
Usage: pnpm tsx scripts/migrate-subscription-models.ts [options]

Options:
  --dry-run      Run migration without making changes (preview mode)
  --backup-only  Only create backup, don't run migration
  --rollback     Rollback to previous backup (not implemented yet)
  --verbose      Enable verbose logging
  --help         Show this help message

Examples:
  pnpm tsx scripts/migrate-subscription-models.ts --dry-run
  pnpm tsx scripts/migrate-subscription-models.ts --backup-only
  pnpm tsx scripts/migrate-subscription-models.ts
    `);
    process.exit(0);
  }

  try {
    const migration = new SubscriptionModelMigration(options);
    const result = await migration.run();

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${result.totalUsers}`);
    console.log(`Users with custom providers: ${result.usersWithCustomProviders}`);
    console.log(`Successful migrations: ${result.successfulMigrations}`);
    console.log(`Failed migrations: ${result.failedMigrations}`);

    if (result.failedMigrations > 0) {
      console.log('\nFailed migrations:');
      result.errors.forEach(error => {
        console.log(`  - User ${error.userId}: ${error.error}`);
      });
      process.exit(1);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Export the class for use in other scripts
export { SubscriptionModelMigration };

// Run if called directly
if (require.main === module) {
  main();
}
