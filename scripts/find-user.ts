import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function main() {
    const email = 'drbathanhbvqy175@gmail.com';
    const res = await fetch(`https://api.clerk.com/v1/users?email_address=${email}`, {
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        },
    });

    const users = await res.json();
    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
