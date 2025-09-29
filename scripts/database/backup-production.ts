#!/usr/bin/env tsx

/**
 * Production Database Backup Script for pho.chat
 * Creates a complete backup before deploying cost optimization system
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BACKUP_DIR = join(process.cwd(), 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = join(BACKUP_DIR, `pho-chat-backup-${TIMESTAMP}.sql`);

interface BackupConfig {
  databaseUrl: string;
  backupPath: string;
  includeData: boolean;
  compressionLevel: number;
}

class DatabaseBackup {
  private config: BackupConfig;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.config = {
      databaseUrl,
      backupPath: BACKUP_FILE,
      includeData: true,
      compressionLevel: 6,
    };

    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Create a complete database backup
   */
  async createBackup(): Promise<void> {
    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup location: ${this.config.backupPath}`);

    try {
      // Parse database URL to extract connection details
      const dbUrl = new URL(this.config.databaseUrl);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const database = dbUrl.pathname.slice(1); // Remove leading slash
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Set PGPASSWORD environment variable for pg_dump
      process.env.PGPASSWORD = password;

      // Create pg_dump command
      const dumpCommand = [
        'pg_dump',
        `--host=${host}`,
        `--port=${port}`,
        `--username=${username}`,
        `--dbname=${database}`,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=plain',
        '--encoding=UTF8',
        '--no-owner',
        '--no-privileges',
      ];

      if (this.config.includeData) {
        dumpCommand.push('--data-only', '--inserts');
      }

      console.log('🔧 Running pg_dump...');
      const backupData = execSync(dumpCommand.join(' '), {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      });

      // Write backup to file
      writeFileSync(this.config.backupPath, backupData);

      // Create backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        databaseUrl: this.config.databaseUrl.replace(/:[^:@]*@/, ':***@'), // Hide password
        backupSize: backupData.length,
        tables: this.extractTableNames(backupData),
        version: this.getDatabaseVersion(),
      };

      writeFileSync(
        this.config.backupPath.replace('.sql', '.meta.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log('✅ Database backup completed successfully!');
      console.log(`📊 Backup size: ${(backupData.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📋 Tables backed up: ${metadata.tables.length}`);

    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    } finally {
      // Clean up environment variable
      delete process.env.PGPASSWORD;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(): Promise<boolean> {
    console.log('🔍 Verifying backup integrity...');

    try {
      const backupContent = require('fs').readFileSync(this.config.backupPath, 'utf8');
      
      // Basic integrity checks
      const checks = [
        { name: 'File not empty', test: () => backupContent.length > 0 },
        { name: 'Contains CREATE statements', test: () => backupContent.includes('CREATE TABLE') },
        { name: 'Contains user table', test: () => backupContent.includes('users') },
        { name: 'No corruption markers', test: () => !backupContent.includes('ERROR') },
      ];

      let allPassed = true;
      for (const check of checks) {
        const passed = check.test();
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
      }

      if (allPassed) {
        console.log('✅ Backup verification passed!');
      } else {
        console.log('❌ Backup verification failed!');
      }

      return allPassed;
    } catch (error) {
      console.error('❌ Backup verification error:', error);
      return false;
    }
  }

  /**
   * Create rollback script
   */
  createRollbackScript(): void {
    const rollbackScript = `#!/bin/bash
# Rollback script for pho.chat cost optimization deployment
# Generated on: ${new Date().toISOString()}

echo "🔄 Starting database rollback..."

# Restore from backup
psql "$DATABASE_URL" < "${this.config.backupPath}"

if [ $? -eq 0 ]; then
    echo "✅ Database rollback completed successfully!"
else
    echo "❌ Database rollback failed!"
    exit 1
fi

echo "🧹 Cleaning up cost optimization tables..."
psql "$DATABASE_URL" -c "
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS monthly_usage_summary CASCADE;
DROP TABLE IF EXISTS user_cost_settings CASCADE;
DROP TABLE IF EXISTS provider_costs CASCADE;
"

echo "✅ Rollback completed!"
`;

    const rollbackPath = this.config.backupPath.replace('.sql', '-rollback.sh');
    writeFileSync(rollbackPath, rollbackScript);
    
    // Make script executable
    try {
      execSync(`chmod +x "${rollbackPath}"`);
    } catch (error) {
      console.warn('⚠️ Could not make rollback script executable:', error);
    }

    console.log(`📝 Rollback script created: ${rollbackPath}`);
  }

  private extractTableNames(backupData: string): string[] {
    const tableMatches = backupData.match(/CREATE TABLE [^(]+/g) || [];
    return tableMatches.map(match => 
      match.replace('CREATE TABLE ', '').replace(/"/g, '').trim()
    );
  }

  private getDatabaseVersion(): string {
    try {
      const version = execSync('psql --version', { encoding: 'utf8' });
      return version.trim();
    } catch {
      return 'Unknown';
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 pho.chat Database Backup Tool');
  console.log('==================================');

  const backup = new DatabaseBackup();

  try {
    // Create backup
    await backup.createBackup();

    // Verify backup
    const isValid = await backup.verifyBackup();
    if (!isValid) {
      throw new Error('Backup verification failed');
    }

    // Create rollback script
    backup.createRollbackScript();

    console.log('\n✅ All backup operations completed successfully!');
    console.log('🔒 Your database is now safely backed up before cost optimization deployment.');
    
  } catch (error) {
    console.error('\n❌ Backup process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseBackup };
