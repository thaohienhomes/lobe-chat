#!/usr/bin/env tsx

/**
 * Step 1.4 - Staging (Preview) Environment Setup for Cost Optimization
 * This script prints safe, manual commands to configure Vercel Preview env
 * without executing them, per safety policy.
 */

import * as dotenv from 'dotenv';
dotenv.config();

function main() {
  console.log('🧪 Staging/Preview Environment Setup (Cost Optimization ENABLED)');
  console.log('='.repeat(72));
  console.log('\nRun the following commands manually to configure Vercel Preview env:');

  const cmds = [
    'vercel env add COST_OPTIMIZATION_ENABLED true preview',
    'vercel env add ROLLOUT_PHASE testing preview',
    'vercel env add ROLLOUT_PERCENTAGE 10 preview',
    'vercel env add DEFAULT_MONTHLY_BUDGET_VND 29000 preview',
    'vercel env add VND_EXCHANGE_RATE 24167 preview',
    'vercel env add INTELLIGENT_ROUTING_ENABLED true preview',
    'vercel env add USAGE_TRACKING_ENABLED true preview',
    'vercel env add PERFORMANCE_MONITORING_ENABLED true preview',
  ];

  for (const c of cmds) console.log(`   $ ${c}`);

  console.log('\nThen deploy a preview build:');
  console.log('   $ vercel --prebuilt');
  console.log('\nValidate in preview:');
  console.log('   - /api/healthcheck returns 200');
  console.log('   - Cost Optimization section shows 29,000 VND default budget');
  console.log('   - Events recorded into usage_logs when chatting in preview');
}

if (require.main === module) main();

