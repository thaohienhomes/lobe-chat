#!/usr/bin/env tsx

/**
 * Step 1.1 - Database Schema Verification
 * - Lists public tables
 * - Verifies presence of core tables (users, sessions, messages)
 * - Writes a JSON report at scripts/output/db-schema-report.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const startedAt = new Date().toISOString();
  console.log('🧭 Verifying production database schema...');
  console.log('='.repeat(60));

  try {
    const { getServerDB } = await import('../packages/database/src/core/db-adaptor');
    const db = await getServerDB();

    const tablesRes = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const rows: any[] = Array.isArray(tablesRes)
      ? tablesRes
      : (tablesRes?.rows ?? []);

    const tableNames = rows.map((t: any) => t.table_name) as string[];

    const checks = {
      users: tableNames.includes('users'),
      sessions: tableNames.includes('sessions'),
      messages: tableNames.includes('messages'),
      agents: tableNames.includes('agents'),
    };

    console.log('📋 Tables in public schema:', tableNames.length);
    console.log('🧾 Sample:', tableNames.slice(0, 10).join(', ') || '(none)');

    console.log(`\n🔎 Core Tables:`);
    console.log(`   - users:     ${checks.users ? '✅ present' : '❌ missing'}`);
    console.log(`   - sessions:  ${checks.sessions ? '✅ present' : '❌ missing'}`);
    console.log(`   - messages:  ${checks.messages ? '✅ present' : '❌ missing'}`);
    console.log(`   - agents:    ${checks.agents ? '✅ present' : '❌ missing'}`);

    const report = {
      startedAt,
      finishedAt: new Date().toISOString(),
      databaseUrlMasked: (process.env.DATABASE_URL || '').replace(/:.+@/, ':***@'),
      tableCount: tableNames.length,
      tableNames,
      coreChecks: checks,
      success: true,
    };

    const outDir = path.join(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const reportPath = path.join(outDir, 'db-schema-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Wrote report: ${reportPath}`);

    if (!checks.users) {
      console.log('\n❗ users table missing — base schema migration required (Step 1.2)');
      process.exitCode = 2; // special code to indicate missing core tables
    } else {
      console.log('\n✅ Core users table exists. Ready to proceed to Step 1.3 if other checks pass.');
    }
  } catch (error: any) {
    const outDir = path.join(__dirname, 'output');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
    const errPath = path.join(outDir, 'db-schema-report.error.log');
    const msg = typeof error?.stack === 'string' ? error.stack : (error?.message || String(error));
    try { fs.writeFileSync(errPath, `[${new Date().toISOString()}] ${msg}`); } catch { }
    console.error('\n❌ Database verification failed:', msg);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

