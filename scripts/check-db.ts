import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = await pool.connect();
try {
  console.log('Checking database state...');

  // Check model_pricing table
  const resTable = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'model_pricing';
  `);
  console.log('model_pricing exists:', (resTable.rowCount ?? 0) > 0);

  // Check pho_points_balance in users
  const resCol = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'pho_points_balance';
  `);
  console.log('pho_points_balance exists:', (resCol.rowCount ?? 0) > 0);

  // Check shared_conversations
  const resShared = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'shared_conversations';
  `);
  console.log('shared_conversations exists:', (resShared.rowCount ?? 0) > 0);
} finally {
  client.release();
  await pool.end();
}
