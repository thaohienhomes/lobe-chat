const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function check() {
    const result = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'support_tickets';
  `;
    console.log('Table exists?', result.length > 0 ? 'YES' : 'NO');

    if (result.length === 0) {
        console.log('Creating table...');
        await sql`
      CREATE TABLE support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        source VARCHAR(20) NOT NULL DEFAULT 'voice',
        transcript TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;
        console.log('✅ Table created!');
    }

    const count = await sql`SELECT COUNT(*) as cnt FROM support_tickets;`;
    console.log('Row count:', count[0].cnt);
}

check().catch(e => console.error(e));
