#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_DRIVER:', process.env.DATABASE_DRIVER);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  try {
    const { serverDB } = await import('../packages/database/src/server');
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await serverDB.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', result);
    
    // Check if usage tables exist
    const tables = await serverDB.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usage_logs', 'monthly_usage_summary', 'user_cost_settings', 'provider_costs')
    `);
    
    console.log('📋 Usage tables status:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
