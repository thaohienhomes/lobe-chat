#!/usr/bin/env tsx

/**
 * Simple script to test user subscriptions and model activation
 */

import * as dotenv from 'dotenv';
import { getServerDB } from '../packages/database/src/core/db-adaptor';

// Load environment variables
dotenv.config();

async function testUserSubscriptions() {
  console.log(`[${new Date().toISOString()}] INFO: Testing user subscriptions...`);

  try {
    // Initialize database
    const db = await getServerDB();
    console.log(`[${new Date().toISOString()}] INFO: Database connected successfully`);

    // Test simple query
    const result = await db.execute('SELECT COUNT(*) as user_count FROM users');
    console.log(`[${new Date().toISOString()}] INFO: Total users:`, result);

    // Test subscriptions query
    const subsResult = await db.execute(`
      SELECT u.id, u.email, s.plan_id, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LIMIT 5
    `);
    console.log(`[${new Date().toISOString()}] INFO: Sample users with subscriptions:`, subsResult);

    // Test ai_models query
    const modelsResult = await db.execute(`
      SELECT COUNT(*) as model_count FROM ai_models
    `);
    console.log(`[${new Date().toISOString()}] INFO: Total AI models:`, modelsResult);

    // Check models for specific user
    const userModelsResult = await db.execute(`
      SELECT id, provider_id, enabled
      FROM ai_models
      WHERE user_id = 'user_32V7733qArI3DRSOxw6dJ6l1Idp'
      AND (id LIKE '%gpt%' OR id LIKE '%gemini%' OR id LIKE '%claude%')
      LIMIT 20
    `);
    console.log(`[${new Date().toISOString()}] INFO: Available GPT/Gemini/Claude models for user:`, userModelsResult);

    console.log('\n✅ Database test completed successfully!');

  } catch (error) {
    console.error(`[${new Date().toISOString()}] FATAL: Test failed:`, error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await testUserSubscriptions();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
