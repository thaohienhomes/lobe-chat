/**
 * Quick script to activate medical_beta plan for testing
 * Run: npx tsx scripts/activate-medical-beta.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in .env.local');
    process.exit(1);
}

async function main() {
    // Step 1: List recent users to find yours
    console.log('🔍 Fetching recent users...\n');

    const res = await fetch('https://api.clerk.com/v1/users?limit=10&order_by=-created_at', {
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        },
    });

    const users = await res.json();

    if (!Array.isArray(users)) {
        console.error('❌ Failed to fetch users:', users);
        process.exit(1);
    }

    console.log('📋 Recent users:');
    users.forEach((u: any, i: number) => {
        const email = u.email_addresses?.[0]?.email_address || 'N/A';
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'N/A';
        const currentPlan = u.public_metadata?.planId || 'free';
        console.log(`  ${i + 1}. ${name} (${email}) — plan: ${currentPlan} — id: ${u.id}`);
    });

    // Step 2: Get user ID from command line arg or prompt
    const targetUserId = process.argv[2];

    if (!targetUserId) {
        console.log('\n⚠️  Usage: npx tsx scripts/activate-medical-beta.ts <USER_ID>');
        console.log('   Copy the user ID from the list above and re-run');
        process.exit(0);
    }

    // Step 3: Activate medical_beta for the user
    console.log(`\n🏥 Activating medical_beta for user: ${targetUserId}...`);

    const updateRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}/metadata`, {
        body: JSON.stringify({
            public_metadata: {
                medical_beta: true,
                planId: 'medical_beta',
                promoActivatedAt: new Date().toISOString(),
                promoCode: 'BYPASS-TEST',
            },
        }),
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        method: 'PATCH',
    });

    const result = await updateRes.json();

    if (updateRes.ok) {
        console.log('✅ Medical Beta activated successfully!');
        console.log(`   User: ${result.first_name} ${result.last_name}`);
        console.log(`   Email: ${result.email_addresses?.[0]?.email_address}`);
        console.log(`   Plan: ${result.public_metadata?.planId}`);
        console.log(`   Medical Beta: ${result.public_metadata?.medical_beta}`);
        console.log('\n🔄 Refresh pho.chat (Ctrl+Shift+R) to see changes!');
    } else {
        console.error('❌ Failed to update:', result);
    }
}

main().catch(console.error);
