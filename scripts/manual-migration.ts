#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

async function runManualMigration() {
  console.log('🚀 Running manual migration for cost optimization tables...');
  
  try {
    // Read the migration SQL
    const migrationPath = join(__dirname, '../packages/database/migrations/0034_dear_avengers.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    console.log('🔗 Connecting to database...');
    
    // Import database connection
    const { serverDB } = await import('../packages/database/src/server');
    
    console.log('✅ Database connected');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await serverDB.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error);
        console.log('Statement content:', statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    console.log('🎉 All migration statements executed successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usage_logs', 'monthly_usage_summary', 'user_cost_settings', 'provider_costs')
      ORDER BY table_name
    `;
    
    const tables = await serverDB.execute(verifyQuery);
    console.log('📋 Created tables:', tables);
    
    if (tables.length === 4) {
      console.log('✅ All 4 cost optimization tables created successfully!');
    } else {
      console.log('⚠️ Expected 4 tables, but found:', tables.length);
    }
    
    console.log('🏁 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runManualMigration();
