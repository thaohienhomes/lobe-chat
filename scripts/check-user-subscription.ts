#!/usr/bin/env tsx
/**
 * Check user subscription and usage
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { getServerDB } from '../packages/database/src/core/db-adaptor';

async function main() {
  const db = await getServerDB();
  const userId = 'user_32V7733qArI3DRSOxw6dJ6l1Idp';

  // Find user thaohienhomes@gmail.com
  const userResult = await db.execute(`
    SELECT u.id, u.email, s.plan_id, s.status, s.current_period_start, s.current_period_end
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE u.id = '${userId}'
    ORDER BY s.current_period_start DESC
    LIMIT 5
  `);
  console.log('User subscriptions:', JSON.stringify(userResult.rows, null, 2));

  // Get enabled models for this user from ai_models table
  const modelsResult = await db.execute(`
    SELECT id, provider_id, enabled, display_name, type
    FROM ai_models
    WHERE user_id = '${userId}'
    ORDER BY enabled DESC, id
    LIMIT 20
  `);
  console.log('User ai_models:', JSON.stringify(modelsResult.rows, null, 2));

  // Count enabled models
  const enabledCount = await db.execute(`
    SELECT COUNT(*) as count
    FROM ai_models
    WHERE user_id = '${userId}' AND enabled = true
  `);
  console.log('Enabled models count:', JSON.stringify(enabledCount.rows, null, 2));
}

main().catch(console.error);

