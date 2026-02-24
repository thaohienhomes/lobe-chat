/* eslint-disable unicorn/no-process-exit, unicorn/prefer-top-level-await */
/**
 * Quick script to send a welcome email only (no Clerk/DB activation)
 * Usage: npx tsx scripts/send-welcome-email.ts <EMAIL> <PLAN_ID> [NAME]
 */
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    const email = process.argv[2];
    const planId = process.argv[3] || 'lifetime_early_bird';
    const name = process.argv[4] || 'there';

    if (!email) {
        console.log('⚠️  Usage: npx tsx scripts/send-welcome-email.ts <EMAIL> <PLAN_ID> [NAME]');
        process.exit(0);
    }

    console.log(`📧 Sending welcome email to: ${email} (plan: ${planId})...`);

    const { sendWelcomeEmail } = await import('../src/libs/email/index');
    const res = await sendWelcomeEmail({ email, name, planId });

    if (res.success) {
        console.log(`✅ Welcome email sent successfully! (ID: ${res.emailId})`);
    } else {
        console.error('❌ Failed to send email:', res.error);
        process.exit(1);
    }
}

main().catch(console.error);
