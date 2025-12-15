#!/usr/bin/env tsx

/**
 * Script to enable models for a specific user based on their subscription plan
 */

import * as dotenv from 'dotenv';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { getAllowedModelsForPlan } from '../src/config/pricing';

// Load environment variables
dotenv.config();

async function enableModelsForUser(userId: string, planId: string) {
  console.log(`[${new Date().toISOString()}] INFO: Enabling models for user ${userId} with plan ${planId}...`);

  try {
    // Initialize database
    const db = await getServerDB();
    console.log(`[${new Date().toISOString()}] INFO: Database connected successfully`);

    // Get allowed models for this plan
    const allowedModels = getAllowedModelsForPlan(planId);
    console.log(`[${new Date().toISOString()}] INFO: Allowed models for ${planId}:`, allowedModels);

    // Check current enabled models for user
    const currentModels = await db.execute(`
      SELECT id, enabled
      FROM ai_models
      WHERE user_id = $1
    `, [userId]);

    console.log(`[${new Date().toISOString()}] INFO: Current models for user:`, currentModels.rows);

    // Enable allowed models for this user
    for (const modelId of allowedModels) {
      console.log(`[${new Date().toISOString()}] INFO: Enabling model ${modelId} for user ${userId}...`);

      // Insert or update model for user
      await db.execute(`
        INSERT INTO ai_models (user_id, id, provider_id, enabled, created_at, updated_at)
        VALUES ($1, $2, 'openai', true, NOW(), NOW())
        ON CONFLICT (id, provider_id, user_id)
        DO UPDATE SET enabled = true, updated_at = NOW()
      `, [userId, modelId]);
    }

    // Check final state
    const finalModels = await db.execute(`
      SELECT id, enabled
      FROM ai_models
      WHERE user_id = $1 AND enabled = true
    `, [userId]);

    console.log(`[${new Date().toISOString()}] INFO: Final enabled models:`, finalModels.rows);
    console.log('\n✅ Models enabled successfully!');

  } catch (error) {
    console.error(`[${new Date().toISOString()}] FATAL: Failed to enable models:`, error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    // Enable models for the user having issues
    const userId = 'user_32V7733qArI3DRSOxw6dJ6l1Idp'; // thaohienhomes@gmail.com
    const planId = 'vn_basic';

    await enableModelsForUser(userId, planId);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
