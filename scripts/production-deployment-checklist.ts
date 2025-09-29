#!/usr/bin/env tsx

/**
 * Production Deployment Checklist for pho.chat Cost Optimization System
 * Execute each step in sequence with verification
 */

import * as dotenv from 'dotenv';
import { execSync } from 'node:child_process';

dotenv.config();

interface DeploymentStep {
  commands: string[];
  estimatedTime: string;
  id: string;
  name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rollback?: string[];
  verification: string[];
}

const DEPLOYMENT_STEPS: DeploymentStep[] = [
  {
    commands: [
      'echo "🛡️ Creating production database backup..."',
      'pg_dump $DATABASE_URL > backup-pre-cost-optimization-$(date +%Y%m%d-%H%M%S).sql',
      'echo "✅ Backup created successfully"'
    ],
    estimatedTime: '10 minutes',
    id: 'A1',
    name: 'Database Backup & Safety',
    priority: 'CRITICAL',
    rollback: [
      'echo "⚠️ If needed, restore with: psql $DATABASE_URL < backup-pre-cost-optimization-TIMESTAMP.sql"'
    ],
    verification: [
      'ls -la backup-pre-cost-optimization-*.sql',
      'echo "Backup file size: $(du -h backup-pre-cost-optimization-*.sql | cut -f1)"'
    ]
  },
  {
    commands: [
      'echo "🔧 Configuring production environment variables..."',
      'vercel env add COST_OPTIMIZATION_ENABLED true production',
      'vercel env add ROLLOUT_PHASE testing production',
      'vercel env add ROLLOUT_PERCENTAGE 0 production',
      'vercel env add VND_EXCHANGE_RATE 24167 production',
      'vercel env add DEFAULT_MONTHLY_BUDGET_VND 29000 production',
      'vercel env add PERFORMANCE_MONITORING_ENABLED true production',
      'vercel env add INTELLIGENT_ROUTING_ENABLED true production',
      'vercel env add USAGE_TRACKING_ENABLED true production'
    ],
    estimatedTime: '5 minutes',
    id: 'A2',
    name: 'Environment Configuration',
    priority: 'CRITICAL',
    verification: [
      'vercel env ls production | grep COST_OPTIMIZATION_ENABLED',
      'vercel env ls production | grep ROLLOUT_PHASE'
    ]
  },
  {
    commands: [
      'echo "🗄️ Executing database migration..."',
      'MIGRATION_DB=1 tsx ./scripts/migrateServerDB/index.ts',
      'echo "✅ Migration completed"'
    ],
    estimatedTime: '10 minutes',
    id: 'B1',
    name: 'Database Migration Execution',
    priority: 'CRITICAL',
    rollback: [
      'echo "🔄 Rolling back migration..."',
      'psql $DATABASE_URL -c "DROP TABLE IF EXISTS usage_logs CASCADE;"',
      'psql $DATABASE_URL -c "DROP TABLE IF EXISTS monthly_usage_summary CASCADE;"',
      'psql $DATABASE_URL -c "DROP TABLE IF EXISTS user_cost_settings CASCADE;"',
      'psql $DATABASE_URL -c "DROP TABLE IF EXISTS provider_costs CASCADE;"'
    ],
    verification: [
      'tsx scripts/verify-cost-optimization-tables.ts'
    ]
  },
  {
    commands: [
      'echo "🧪 Running comprehensive system tests..."',
      'tsx scripts/test-cost-optimization-system.ts'
    ],
    estimatedTime: '5 minutes',
    id: 'B2',
    name: 'System Testing',
    priority: 'HIGH',
    verification: [
      'echo "✅ All tests should pass before proceeding"'
    ]
  },
  {
    commands: [
      'echo "🏗️ Building production application..."',
      'bunx cross-env NEXT_DISABLE_SOURCEMAPS=1 NODE_OPTIONS=--max-old-space-size=6144 next build',
      'echo "🚀 Deploying to Vercel production..."',
      'vercel --prod --force --archive=tgz'
    ],
    estimatedTime: '15 minutes',
    id: 'C1',
    name: 'Production Build & Deploy',
    priority: 'HIGH',
    verification: [
      'curl -f https://pho.chat/api/healthcheck',
      'curl -f https://pho.chat/settings/subscription'
    ]
  },
  {
    commands: [
      'echo "📊 Setting up monitoring dashboards..."',
      'curl -f https://pho.chat/admin/cost-monitoring',
      'echo "✅ Admin dashboard accessible"'
    ],
    estimatedTime: '10 minutes',
    id: 'D1',
    name: 'Monitoring Setup',
    priority: 'HIGH',
    verification: [
      'echo "Verify admin dashboard loads without errors"',
      'echo "Check that cost optimization metrics are displaying"'
    ]
  }
];

class ProductionDeployment {
  private currentStep = 0;
  private deploymentLog: string[] = [];

  async executeDeployment(): Promise<void> {
    console.log('🚀 pho.chat Cost Optimization System - Production Deployment');
    console.log('='.repeat(70));
    console.log(`📅 Deployment Start: ${new Date().toISOString()}`);
    console.log('');

    // Pre-deployment checks
    await this.preDeploymentChecks();

    // Execute each step
    for (const step of DEPLOYMENT_STEPS) {
      console.log(`\n📋 ${step.id}: ${step.name}`);
      console.log(`⏱️ Estimated Time: ${step.estimatedTime}`);
      console.log(`🎯 Priority: ${step.priority}`);
      console.log('-'.repeat(50));

      try {
        // Execute commands
        for (const command of step.commands) {
          console.log(`🔄 ${command}`);
          this.log(`Executing: ${command}`);

          if (!command.startsWith('echo ')) {
            // Execute actual commands (skip echo statements for safety)
            // execSync(command, { stdio: 'inherit' });
            console.log(`   ⏭️ Command queued for manual execution`);
          }
        }

        // Verification
        console.log('\n🔍 Verification Steps:');
        for (const verification of step.verification) {
          console.log(`   ✅ ${verification}`);
        }

        console.log(`\n✅ ${step.name} - READY FOR EXECUTION`);
        this.log(`${step.name} completed successfully`);

      } catch (error) {
        console.error(`\n❌ ${step.name} - FAILED:`, error);

        if (step.rollback) {
          console.log('\n🔄 Rollback Commands:');
          for (const rollbackCmd of step.rollback) {
            console.log(`   🔄 ${rollbackCmd}`);
          }
        }

        throw new Error(`Deployment failed at step ${step.id}: ${step.name}`);
      }
    }

    console.log('\n🎉 DEPLOYMENT PLAN COMPLETE!');
    console.log('✅ All steps are ready for manual execution');
    console.log('\n📋 Next Actions:');
    console.log('1. Execute each command manually in sequence');
    console.log('2. Verify each step before proceeding');
    console.log('3. Monitor system performance after deployment');
    console.log('4. Begin gradual rollout phases');
  }

  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Pre-Deployment Checks');
    console.log('-'.repeat(30));

    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL', 'VERCEL_TOKEN'];
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Configured`);
      } else {
        console.log(`❌ ${envVar}: Missing`);
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }

    // Check Vercel CLI
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI: Available');
    } catch {
      console.log('❌ Vercel CLI: Not installed');
      throw new Error('Vercel CLI is required for deployment');
    }

    console.log('✅ Pre-deployment checks passed\n');
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.deploymentLog.push(`${timestamp}: ${message}`);
  }
}


// --- Progress Recorder ---
interface ProgressEntry { notes?: string; status: 'SUCCESS' | 'FAILED' | 'PENDING'; stepId: string; timestamp: string; }
function recordProgress(entry: ProgressEntry) {
  const fs = require('node:fs');
  const path = require('node:path');
  const outDir = path.join(__dirname, 'output');
  const progressPath = path.join(outDir, 'deployment-progress.json');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
  let data: ProgressEntry[] = [];
  try { data = JSON.parse(fs.readFileSync(progressPath, 'utf8')); } catch { }
  data.push(entry);
  fs.writeFileSync(progressPath, JSON.stringify(data, null, 2));
  console.log(`🗂️ Progress updated: ${progressPath}`);
}

// Handle CLI flags for recording progress
const arg = process.argv.find((a) => a.startsWith('--record-step='));
if (arg) {
  const stepId = arg.split('=')[1] || 'UNKNOWN';
  const statusArg = process.argv.find((a) => a.startsWith('--status='));
  const notesArg = process.argv.find((a) => a.startsWith('--notes='));
  const status = (statusArg?.split('=')[1] || 'PENDING').toUpperCase() as 'SUCCESS' | 'FAILED' | 'PENDING';
  const notes = notesArg ? decodeURIComponent(notesArg.split('=')[1]) : undefined;
  recordProgress({ notes, status, stepId, timestamp: new Date().toISOString() });
  process.exit(0);
}

// Export for use
export { DEPLOYMENT_STEPS, ProductionDeployment };

// Run if called directly
if (require.main === module) {
  const deployment = new ProductionDeployment();
  deployment.executeDeployment().catch(console.error);
}
