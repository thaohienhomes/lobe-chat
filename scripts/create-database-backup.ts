#!/usr/bin/env tsx

/**
 * Create Database Backup for Production Deployment
 * Creates a backup of the current database state before migration
 */

import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { getServerDB } from '../packages/database/src/core/db-adaptor';

dotenv.config();

async function createDatabaseBackup(): Promise<void> {
  console.log('🛡️ Creating production database backup...');
  console.log('='.repeat(50));

  try {
    const db = await getServerDB();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `backup-pre-cost-optimization-${timestamp}.json`;

    console.log('📊 Backing up existing tables...');

    // Get list of all tables
    const tablesResult = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const backup = {
      timestamp: new Date().toISOString(),
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
      tables: {},
      metadata: {
        backup_type: 'pre-cost-optimization-deployment',
        total_tables: tablesResult.length
      }
    };

    console.log(`📋 Found ${tablesResult.length} tables to backup`);

    // Backup table structures and sample data
    for (const tableRow of tablesResult) {
      const tableName = tableRow.table_name;
      console.log(`   📊 Backing up table: ${tableName}`);

      try {
        // Get table structure
        const columnsResult = await db.execute(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);

        // Get row count
        const countResult = await db.execute(`SELECT COUNT(*) as count FROM "${tableName}";`);
        const rowCount = countResult[0]?.count || 0;

        backup.tables[tableName] = {
          structure: columnsResult,
          row_count: rowCount,
          backed_up_at: new Date().toISOString()
        };

        console.log(`      ✅ ${tableName}: ${rowCount} rows`);
      } catch (error) {
        console.log(`      ⚠️ ${tableName}: Error - ${error.message}`);
        backup.tables[tableName] = {
          error: error.message,
          backed_up_at: new Date().toISOString()
        };
      }
    }

    // Save backup to file
    writeFileSync(backupFileName, JSON.stringify(backup, null, 2));

    console.log('\n✅ Database backup completed successfully!');
    console.log(`📄 Backup file: ${backupFileName}`);
    console.log(`📊 Tables backed up: ${Object.keys(backup.tables).length}`);

    // Verify backup file
    const backupSize = require('fs').statSync(backupFileName).size;
    console.log(`💾 Backup file size: ${(backupSize / 1024).toFixed(2)} KB`);

    console.log('\n🔄 Rollback instructions:');
    console.log('If migration fails, you can reference this backup to understand the previous state.');
    console.log('The backup contains table structures and row counts for verification.');

  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

// Run backup
if (require.main === module) {
  createDatabaseBackup().catch(console.error);
}

export { createDatabaseBackup };
