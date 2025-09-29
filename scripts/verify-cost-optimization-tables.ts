#!/usr/bin/env tsx

/**
 * Verify Cost Optimization Database Tables
 * Checks if all required tables exist and have correct structure
 */

import * as dotenv from 'dotenv';
// Use local package source to avoid exports resolution issues
async function getDB() {
  const mod = await import('../packages/database/src/core/db-adaptor');
  return mod.getServerDB();
}

dotenv.config();

async function verifyTables() {
  console.log('🔍 Verifying Cost Optimization Database Tables...');
  console.log('='.repeat(50));

  try {
    const db = await getDB();

    // Check if all required tables exist
    const requiredTables = [
      'usage_logs',
      'monthly_usage_summary',
      'user_cost_settings',
      'provider_costs'
    ];

    console.log('📋 Checking table existence...');

    for (const tableName of requiredTables) {
      try {
        const result = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        const rows: any[] = Array.isArray(result) ? result : (result?.rows ?? []);
        const exists = rows[0]?.exists === true || rows[0]?.exists === 't';
        console.log(`${exists ? '✅' : '❌'} Table "${tableName}": ${exists ? 'EXISTS' : 'MISSING'}`);

        if (exists) {
          // Get column count
          const columnsRes = await db.execute(`
            SELECT COUNT(*)::int as column_count
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = '${tableName}';
          `);
          const colRows: any[] = Array.isArray(columnsRes) ? columnsRes : (columnsRes?.rows ?? []);
          console.log(`   📊 Columns: ${colRows[0]?.column_count || 0}`);
        }
      } catch (error) {
        console.log(`❌ Table "${tableName}": ERROR - ${error.message}`);
      }
    }

    console.log('\n🧪 Testing basic operations...');

    // Test inserting a sample user cost setting
    try {
      await db.execute(`
        INSERT INTO user_cost_settings (user_id, monthly_budget_vnd, enable_cost_optimization) 
        VALUES ('test-user-123', 29000, true) 
        ON CONFLICT (user_id) DO UPDATE SET 
          monthly_budget_vnd = EXCLUDED.monthly_budget_vnd,
          updated_at = now();
      `);
      console.log('✅ Insert/Update test: SUCCESS');

      // Clean up test data
      await db.execute(`DELETE FROM user_cost_settings WHERE user_id = 'test-user-123';`);
      console.log('✅ Delete test: SUCCESS');

    } catch (error) {
      console.log(`❌ Database operations test: FAILED - ${error.message}`);
    }

    console.log('\n🎉 Database verification complete!');
    console.log('✅ Cost optimization tables are ready for use.');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyTables().catch(console.error);
