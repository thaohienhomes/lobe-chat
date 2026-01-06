import * as dotenv from 'dotenv';
import { migrate as neonMigrate } from 'drizzle-orm/neon-serverless/migrator';
import { migrate as nodeMigrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'node:path';

// @ts-ignore tsgo handle esm import cjs and compatibility issues
import { DB_FAIL_INIT_HINT, PGVECTOR_HINT } from './errorHint';

// Read the `.env` file if it exists, or a file specified by the
// dotenv_config_path parameter that's passed to Node.js
// Use `override: true` so that local .env values (like DATABASE_URL / DATABASE_DRIVER)
// take precedence over any existing shell environment when running migrations.
dotenv.config({ override: true });

const migrationsFolder = join(__dirname, '../../packages/database/migrations');

const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';

const runMigrations = async () => {
  const { serverDB } = await import('../../packages/database/src/server');

  if (process.env.DATABASE_DRIVER === 'node') {
    await nodeMigrate(serverDB, { migrationsFolder });
  } else {
    await neonMigrate(serverDB, { migrationsFolder });
  }

  console.log('✅ database migration pass.');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
};

let connectionString = process.env.DATABASE_URL;

if (connectionString?.startsWith('psql')) {
  connectionString = connectionString.replace(/^psql\s+/, '').replaceAll(/^["']|["']$/g, '');
  process.env.DATABASE_URL = connectionString;
}

// only migrate database if the connection string is available
if (!isDesktop && connectionString) {
  // Prefer Neon driver when using Neon connection string,
  // regardless of any pre-set DATABASE_DRIVER in the shell.
  if (connectionString.includes('neon.tech')) {
    process.env.DATABASE_DRIVER = 'neon';
  }

  console.log(
    '[db:migrate] using driver:',
    process.env.DATABASE_DRIVER || 'neon',
    'url:',
    connectionString,
  );

  // eslint-disable-next-line unicorn/prefer-top-level-await
  runMigrations().catch((err) => {
    const error = err as any;
    const errMsg = (error as Error)?.message || String(error);

    // Some drivers (pg / neon) expose a sqlState or code field with the
    // PostgreSQL error code. 42P07 == duplicate_table.
    const pgCode = error?.code || error?.sqlState;

    const normalizedMsg = errMsg.toLowerCase();
    const isDuplicateTableError =
      pgCode === '42P07' ||
      normalizedMsg.includes('already exists') ||
      normalizedMsg.includes('duplicate table') ||
      normalizedMsg.includes('already a relation');

    // Treat benign duplicate-table / already-exists errors as a successful,
    // idempotent migration so Vercel builds don't fail when the schema is
    // already in place.
    if (isDuplicateTableError) {
      console.warn(
        '[db:migrate] Detected existing database objects (duplicate_table / "already exists"), treating migration as already applied.',
      );
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    }

    console.error('❌ Database migrate failed:', error);

    if (errMsg.includes('extension "vector" is not available')) {
      console.info(PGVECTOR_HINT);
    } else if (errMsg.includes(`Cannot read properties of undefined (reading 'migrate')`)) {
      console.info(DB_FAIL_INIT_HINT);
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
} else {
  console.log('🟢 not find database env or in desktop mode, migration skipped');
}
