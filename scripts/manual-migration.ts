import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

if (process.env.DATABASE_URL?.startsWith('psql')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^psql\s+/, '').replaceAll(
    /^["']|["']$/g,
    '',
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('Running manual migration...');

    // 1. Create model_pricing table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "model_pricing" (
        "id" text PRIMARY KEY NOT NULL,
        "model_id" text NOT NULL,
        "input_price" real NOT NULL,
        "output_price" real NOT NULL,
        "per_msg_fee" real DEFAULT 0,
        "tier" integer DEFAULT 1,
        "is_active" boolean DEFAULT true,
        "accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "model_pricing_model_id_unique" UNIQUE("model_id")
      );
    `);
    console.log('model_pricing table checked/created.');

    // 2. Add columns to users table
    const columns = [
      { name: 'pho_credit_balance', type: 'integer DEFAULT 0' },
      { name: 'lifetime_spent', type: 'integer DEFAULT 0' },
      { name: 'daily_tier1_usage', type: 'integer DEFAULT 0' },
      { name: 'last_usage_date', type: 'timestamp with time zone DEFAULT now()' },
    ];

    for (const col of columns) {
      // Check if column exists to avoid error
      const res = await client.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = $1
      `,
        [col.name],
      );

      if (res.rowCount === 0) {
        await client.query(`
          ALTER TABLE "users" ADD COLUMN "${col.name}" ${col.type};
        `);
        console.log(`Added column ${col.name} to users.`);
      } else {
        console.log(`Column ${col.name} already exists in users.`);
      }
    }

    console.log('Manual migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
