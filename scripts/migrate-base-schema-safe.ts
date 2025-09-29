#!/usr/bin/env tsx

/**
 * Step 1.2 - Base Schema Migration (Safe)
 * - Applies 0000_init.sql only (idempotent) to establish core tables
 * - Skips pgvector extension (0005)
 * - Verifies core tables exist after migration
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('🗄️ Running base schema migration (0000_init.sql)...');
  console.log('='.repeat(60));

  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const { getServerDB } = await import('../packages/database/src/core/db-adaptor');
    const db = await getServerDB();

    const sqlPath = path.join(__dirname, '../packages/database/migrations/0000_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    let executed = 0;
    for (const stmt of statements) {
      try {
        await db.execute(stmt);
        executed++;
      } catch (e: any) {
        // Many statements are IF NOT EXISTS or wrapped in DO blocks, skip errors
        console.warn('⚠️ Statement failed (continuing):', (e?.message || '').slice(0, 120));
      }
    }

    console.log(`✅ Executed ${executed}/${statements.length} statements from 0000_init.sql`);

    // Verify core tables
    const res = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('users','sessions','messages','agents')
      ORDER BY table_name;
    `);

    const rows: any[] = Array.isArray(res) ? res : (res?.rows ?? []);
    const names = rows.map((r: any) => r.table_name);

    console.log('🔎 Verification:');
    for (const t of ['users', 'sessions', 'messages', 'agents']) {
      console.log(`   - ${t}: ${names.includes(t) ? '✅ present' : '❌ missing'}`);
    }

    const allPresent = ['users', 'sessions', 'messages', 'agents'].every((t) => names.includes(t));

    fs.writeFileSync(
      path.join(outDir, 'base-migration-result.json'),
      JSON.stringify({ executed, total: statements.length, verifiedTables: names, success: allPresent }, null, 2),
    );

    if (!allPresent) {
      console.error('❌ Base schema migration incomplete.');
      process.exitCode = 1;
      return;
    }

    console.log('✅ Base schema migration completed successfully.');
  } catch (error: any) {
    const msg = typeof error?.stack === 'string' ? error.stack : (error?.message || String(error));
    fs.writeFileSync(path.join(outDir, 'base-migration.error.log'), msg);
    console.error('❌ Base schema migration failed:', msg);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

