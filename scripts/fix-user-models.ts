#!/usr/bin/env tsx

/**
 * Script to fix models for specific user - enable correct models for vn_basic plan
 */

import * as dotenv from 'dotenv';
import { getServerDB } from '../packages/database/src/core/db-adaptor';

// Load environment variables
dotenv.config();

async function fixUserModels() {
  console.log(`[${new Date().toISOString()}] INFO: Fixing models for user...`);

  try {
    // Initialize database
    const db = await getServerDB();
    console.log(`[${new Date().toISOString()}] INFO: Database connected successfully`);

    const userId = 'user_32V7733qArI3DRSOxw6dJ6l1Idp'; // thaohienhomes@gmail.com

    // Models that should be enabled for vn_basic plan (using actual database model names)
    const requiredModels = [
      'openai/gpt-4o-audio-preview',
      'google/gemini-2.5-flash-image-preview',
      'anthropic/claude-haiku-4.5',
      'openai/gpt-5-mini',
      'google/gemini-2.5-flash-lite-preview-09-2025'
    ];

    console.log(`[${new Date().toISOString()}] INFO: Required models for vn_basic:`, requiredModels);

    // Enable required models
    for (const modelId of requiredModels) {
      console.log(`[${new Date().toISOString()}] INFO: Enabling model ${modelId}...`);

      // Update existing model to enabled=true
      const result = await db.execute(
        `UPDATE ai_models
         SET enabled = true, updated_at = NOW()
         WHERE user_id = '${userId}' AND id = '${modelId}'`
      );

      console.log(`[${new Date().toISOString()}] INFO: Updated ${result.rowCount} rows for ${modelId}`);
    }

    // Check final enabled models
    const enabledModels = await db.execute(
      `SELECT id, provider_id, enabled
       FROM ai_models
       WHERE user_id = '${userId}' AND enabled = true
       ORDER BY id`
    );

    console.log(`[${new Date().toISOString()}] INFO: Final enabled models:`, enabledModels.rows);
    console.log('\n✅ Models fixed successfully!');

  } catch (error) {
    console.error(`[${new Date().toISOString()}] FATAL: Failed to fix models:`, error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await fixUserModels();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
