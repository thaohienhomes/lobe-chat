import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, or } from 'drizzle-orm';
import { Pool } from 'pg';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle(pool);
    const { users } = await import('../packages/database/src/schemas/user');

    const result = await db.select().from(users).where(
        or(
            eq(users.id, 'user_39Wt4xutv8Z5pyXStK2gdhxpBqr'),
            eq(users.email, 'drbathanhbvqy175@gmail.com')
        )
    );

    console.log('DB Users found:');
    console.log(JSON.stringify(result, null, 2));

    await pool.end();
}

main().catch(console.error);
