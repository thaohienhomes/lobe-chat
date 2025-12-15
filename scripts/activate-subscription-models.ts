#!/usr/bin/env tsx

/**
 * Script: Activate Models for All Users Based on Subscription Plans
 * 
 * This script auto-enables appropriate AI models for ALL users based on their
 * current subscription plans, not just users with custom provider configs.
 * 
 * Usage:
 *   pnpm tsx scripts/activate-subscription-models.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { users, subscriptions } from '../packages/database/src/schemas';
import { aiModels } from '../packages/database/src/schemas';
import { SubscriptionModelAccessService } from '../src/services/subscription/modelAccess';
import { getAllowedModelsForPlan } from '../src/config/pricing';

// Load environment variables
dotenv.config();

interface ActivationOptions {
  dryRun: boolean;
  verbose: boolean;
}

interface UserActivationData {
  userId: string;
  email: string;
  planCode: string;
  allowedModels: string[];
  currentEnabledModels: string[];
}

async function parseOptions(): Promise<ActivationOptions> {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

async function activateModelsForAllUsers(options: ActivationOptions) {
  console.log(`[${new Date().toISOString()}] INFO: Starting model activation for all users...`);
  console.log(`[${new Date().toISOString()}] INFO: Options:`, JSON.stringify(options));

  // Initialize database
  const db = await getServerDB();
  const modelAccessService = new SubscriptionModelAccessService();

  try {
    // Get all users with their subscription plans
    const allUsers = await db
      .select({
        userId: users.id,
        email: users.email,
        planCode: subscriptions.planCode,
        status: subscriptions.status,
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId));

    console.log(`[${new Date().toISOString()}] INFO: Found ${allUsers.length} users`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        // Default to free plan if no subscription
        const planCode = user.planCode || 'vn_free';
        const allowedModels = getAllowedModelsForPlan(planCode);

        console.log(`[${new Date().toISOString()}] INFO: Processing user ${user.email} (${planCode})`);

        if (options.verbose) {
          console.log(`  - Allowed models: ${allowedModels.join(', ')}`);
        }

        if (!options.dryRun) {
          // Auto-enable models for this user's plan
          await modelAccessService.autoEnableModelsForPlan(user.userId, planCode);
        }

        successCount++;
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR: Failed to activate models for user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log('\n============================================================');
    console.log('MODEL ACTIVATION SUMMARY');
    console.log('============================================================');
    console.log(`Total users processed: ${allUsers.length}`);
    console.log(`Successful activations: ${successCount}`);
    console.log(`Failed activations: ${errorCount}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);

    if (options.dryRun) {
      console.log('\n⚠️  This was a dry run. No changes were made.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Model activation completed!');
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] FATAL: Migration failed:`, error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    const options = await parseOptions();
    await activateModelsForAllUsers(options);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
