#!/usr/bin/env tsx

/**
 * Comprehensive Cost Optimization System Test
 * Tests all components of the cost optimization system
 */

import * as dotenv from 'dotenv';

dotenv.config();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class CostOptimizationSystemTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 pho.chat Cost Optimization System - Comprehensive Test Suite');
    console.log('='.repeat(70));
    console.log(`📅 Test Run: ${new Date().toISOString()}`);
    console.log('');

    // Test 1: Environment Configuration
    await this.testEnvironmentConfiguration();

    // Test 2: Database Schema
    await this.testDatabaseSchema();

    // Test 3: Cost Optimization Engine
    await this.testCostOptimizationEngine();

    // Test 4: Feature Flags
    await this.testFeatureFlags();

    // Test 5: Model Router
    await this.testIntelligentModelRouter();

    // Test 6: Vietnamese Translations
    await this.testVietnameseTranslations();

    // Test 7: API Integration
    await this.testAPIIntegration();

    // Generate Test Report
    this.generateTestReport();
  }

  private async testEnvironmentConfiguration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔧 Testing Environment Configuration...');
      
      const requiredEnvVars = [
        'DATABASE_URL',
        'COST_OPTIMIZATION_ENABLED',
        'VND_EXCHANGE_RATE',
        'DEFAULT_MONTHLY_BUDGET_VND',
        'ROLLOUT_PHASE'
      ];

      let allPresent = true;
      const missing = [];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          allPresent = false;
          missing.push(envVar);
        }
      }

      if (allPresent) {
        this.addResult('Environment Configuration', 'PASS', 'All required environment variables are set', Date.now() - startTime);
        console.log('  ✅ All environment variables configured');
        console.log(`  📊 COST_OPTIMIZATION_ENABLED: ${process.env.COST_OPTIMIZATION_ENABLED}`);
        console.log(`  💰 VND_EXCHANGE_RATE: ${process.env.VND_EXCHANGE_RATE}`);
        console.log(`  🎯 ROLLOUT_PHASE: ${process.env.ROLLOUT_PHASE}`);
      } else {
        this.addResult('Environment Configuration', 'FAIL', `Missing variables: ${missing.join(', ')}`, Date.now() - startTime);
        console.log(`  ❌ Missing environment variables: ${missing.join(', ')}`);
      }
    } catch (error) {
      this.addResult('Environment Configuration', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private async testDatabaseSchema(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🗄️ Testing Database Schema...');
      
      // Import database modules
      const { getServerDB } = await import('@lobechat/database/core/db-adaptor');
      
      const db = await getServerDB();
      const requiredTables = ['usage_logs', 'monthly_usage_summary', 'user_cost_settings', 'provider_costs'];
      
      let allTablesExist = true;
      for (const table of requiredTables) {
        try {
          await db.execute(`SELECT 1 FROM ${table} LIMIT 1;`);
          console.log(`  ✅ Table "${table}" exists and accessible`);
        } catch (error) {
          allTablesExist = false;
          console.log(`  ❌ Table "${table}" missing or inaccessible`);
        }
      }

      if (allTablesExist) {
        this.addResult('Database Schema', 'PASS', 'All required tables exist and are accessible', Date.now() - startTime);
      } else {
        this.addResult('Database Schema', 'FAIL', 'Some required tables are missing', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Database Schema', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Database connection error: ${error.message}`);
    }
    console.log('');
  }

  private async testCostOptimizationEngine(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⚙️ Testing Cost Optimization Engine...');
      
      // Import cost optimization modules
      const { CostOptimizationEngine } = await import('../src/server/modules/CostOptimization');
      
      const engine = new CostOptimizationEngine();
      
      // Test cost calculation
      const testCost = engine.calculateCost({
        inputTokens: 100,
        outputTokens: 50,
        model: 'gpt-4o-mini',
        userId: 'test-user',
        sessionId: 'test-session'
      });

      if (testCost > 0) {
        console.log(`  ✅ Cost calculation working: $${testCost.toFixed(6)} USD`);
        console.log(`  💰 VND equivalent: ${(testCost * 24167).toFixed(0)} VND`);
        this.addResult('Cost Optimization Engine', 'PASS', `Cost calculation successful: $${testCost.toFixed(6)}`, Date.now() - startTime);
      } else {
        this.addResult('Cost Optimization Engine', 'FAIL', 'Cost calculation returned zero or negative value', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Cost Optimization Engine', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private async testFeatureFlags(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🚩 Testing Feature Flags...');
      
      // Import feature flag system
      const { featureFlags } = await import('../src/server/services/FeatureFlags');
      
      const testUserId = 'test-user-123';
      
      // Test feature flag checks
      const costOptEnabled = featureFlags.isEnabledForUser(testUserId, 'costOptimizationEnabled');
      const routingEnabled = featureFlags.isEnabledForUser(testUserId, 'intelligentRoutingEnabled');
      
      console.log(`  📊 Cost optimization enabled for test user: ${costOptEnabled}`);
      console.log(`  🎯 Intelligent routing enabled for test user: ${routingEnabled}`);
      
      // Get rollout stats
      const stats = featureFlags.getRolloutStats();
      console.log(`  📈 Rollout phase: ${stats.phase}`);
      console.log(`  👥 Estimated affected users: ${stats.estimatedUsers}`);
      
      this.addResult('Feature Flags', 'PASS', `Feature flags working, phase: ${stats.phase}`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Feature Flags', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private async testIntelligentModelRouter(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 Testing Intelligent Model Router...');
      
      // Import model router
      const { IntelligentModelRouter } = await import('../src/server/modules/IntelligentModelRouter');
      
      const router = new IntelligentModelRouter();
      
      // Test simple query routing
      const simpleResult = await router.routeRequest({
        query: 'Hello, how are you?',
        userId: 'test-user',
        sessionId: 'test-session',
        remainingBudgetVND: 25000,
        subscriptionTier: 'starter',
        features: { requiresVision: false, requiresStreaming: true, requiresFunctionCalling: false }
      });

      console.log(`  ✅ Simple query routed to: ${simpleResult.selectedModel}`);
      console.log(`  💡 Reasoning: ${simpleResult.reasoning}`);
      
      // Test complex query routing
      const complexResult = await router.routeRequest({
        query: 'Analyze this complex business scenario and provide detailed recommendations with multiple options and risk assessments.',
        userId: 'test-user',
        sessionId: 'test-session',
        remainingBudgetVND: 25000,
        subscriptionTier: 'premium',
        features: { requiresVision: false, requiresStreaming: true, requiresFunctionCalling: true }
      });

      console.log(`  ✅ Complex query routed to: ${complexResult.selectedModel}`);
      console.log(`  💡 Reasoning: ${complexResult.reasoning}`);
      
      this.addResult('Intelligent Model Router', 'PASS', 'Model routing working for different query types', Date.now() - startTime);
    } catch (error) {
      this.addResult('Intelligent Model Router', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private async testVietnameseTranslations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🇻🇳 Testing Vietnamese Translations...');
      
      // Check if Vietnamese translation files exist
      const fs = await import('fs');
      const path = await import('path');
      
      const viTranslationPath = path.join(process.cwd(), 'locales/vi-VN/setting.json');
      
      if (fs.existsSync(viTranslationPath)) {
        const translations = JSON.parse(fs.readFileSync(viTranslationPath, 'utf-8'));
        
        // Check for cost optimization translations
        const hasCostOptimization = translations.subscription?.costOptimization;
        
        if (hasCostOptimization) {
          console.log('  ✅ Vietnamese cost optimization translations found');
          console.log(`  📝 Translation keys: ${Object.keys(translations.subscription.costOptimization).length}`);
          this.addResult('Vietnamese Translations', 'PASS', 'Cost optimization translations available in Vietnamese', Date.now() - startTime);
        } else {
          this.addResult('Vietnamese Translations', 'FAIL', 'Cost optimization translations missing in Vietnamese', Date.now() - startTime);
        }
      } else {
        this.addResult('Vietnamese Translations', 'FAIL', 'Vietnamese translation file not found', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Vietnamese Translations', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private async testAPIIntegration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔌 Testing API Integration...');
      
      // Check if the enhanced chat API file exists and has cost optimization
      const fs = await import('fs');
      const path = await import('path');
      
      const chatAPIPath = path.join(process.cwd(), 'src/app/(backend)/webapi/chat/[provider]/route.ts');
      
      if (fs.existsSync(chatAPIPath)) {
        const apiContent = fs.readFileSync(chatAPIPath, 'utf-8');
        
        const hasCostOptimization = apiContent.includes('CostOptimizationEngine');
        const hasFeatureFlags = apiContent.includes('isCostOptimizationEnabled');
        const hasModelRouter = apiContent.includes('IntelligentModelRouter');
        
        if (hasCostOptimization && hasFeatureFlags && hasModelRouter) {
          console.log('  ✅ Chat API enhanced with cost optimization');
          console.log('  ✅ Feature flags integrated');
          console.log('  ✅ Model router integrated');
          this.addResult('API Integration', 'PASS', 'Chat API successfully enhanced with cost optimization', Date.now() - startTime);
        } else {
          this.addResult('API Integration', 'FAIL', 'Chat API missing some cost optimization components', Date.now() - startTime);
        }
      } else {
        this.addResult('API Integration', 'FAIL', 'Chat API file not found', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('API Integration', 'FAIL', error.message, Date.now() - startTime);
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  private addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration?: number): void {
    this.results.push({ name, status, message, duration });
  }

  private generateTestReport(): void {
    console.log('📊 TEST REPORT');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;
    
    console.log(`📈 Summary: ${passed}/${total} tests passed`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log('');
    
    console.log('📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${index + 1}. ${icon} ${result.name}${duration}`);
      console.log(`   ${result.message}`);
    });
    
    console.log('');
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Cost optimization system is ready for deployment.');
    } else {
      console.log(`⚠️ ${failed} test(s) failed. Please review and fix issues before deployment.`);
    }
    
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Fix any failing tests');
    console.log('2. Run database migration if needed');
    console.log('3. Start gradual rollout (testing phase)');
    console.log('4. Monitor performance metrics');
    console.log('5. Expand to full rollout');
  }
}

// Run tests
async function main() {
  const tester = new CostOptimizationSystemTest();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CostOptimizationSystemTest };
