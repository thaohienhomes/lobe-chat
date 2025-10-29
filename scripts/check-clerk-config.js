#!/usr/bin/env node

/**
 * Clerk Configuration Diagnostic Script
 * Run this to verify Clerk is properly configured
 */

console.log('🔍 Checking Clerk Configuration...\n');

const requiredEnvVars = {
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ENABLE_CLERK_AUTH: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH,
};

const optionalEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : undefined,
  NEXT_PUBLIC_SERVICE_MODE: process.env.NEXT_PUBLIC_SERVICE_MODE,
};

let hasErrors = false;

console.log('📋 Required Environment Variables:');
console.log('─'.repeat(60));

for (const [key, value] of Object.entries(requiredEnvVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = value
    ? key.includes('SECRET') || key.includes('KEY')
      ? `${value.slice(0, 10)}...`
      : value
    : 'NOT SET';

  console.log(`${status} ${key}: ${displayValue}`);

  if (!value && key !== 'NEXT_PUBLIC_ENABLE_CLERK_AUTH') {
    hasErrors = true;
  }
}

console.log('\n📋 Optional Environment Variables:');
console.log('─'.repeat(60));

for (const [key, value] of Object.entries(optionalEnvVars)) {
  const status = value ? '✅' : '⚠️';
  console.log(`${status} ${key}: ${value || 'NOT SET'}`);
}

console.log('\n🔧 Configuration Analysis:');
console.log('─'.repeat(60));

// Check if Clerk will be enabled
const clerkEnabled =
  process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true' ||
  process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === '1' ||
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log(`Clerk Enabled: ${clerkEnabled ? '✅ YES' : '❌ NO'}`);

if (!clerkEnabled) {
  console.log('\n⚠️  WARNING: Clerk will NOT be enabled!');
  console.log('   To fix: Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Vercel');
  hasErrors = true;
}

// Check publishable key format
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isLive = key.startsWith('pk_live_');
  const isTest = key.startsWith('pk_test_');

  if (isLive) {
    console.log('Environment: ✅ PRODUCTION (pk_live_)');
  } else if (isTest) {
    console.log('Environment: ⚠️  DEVELOPMENT (pk_test_)');
    console.log('   WARNING: Using test keys in production!');
  } else {
    console.log('Environment: ❌ INVALID KEY FORMAT');
    hasErrors = true;
  }
}

// Check domain configuration
console.log('\n🌐 Domain Configuration:');
console.log('─'.repeat(60));
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'NOT SET'}`);
console.log(`NEXT_PUBLIC_WEBSITE_URL: ${process.env.NEXT_PUBLIC_WEBSITE_URL || 'NOT SET'}`);

console.log('\n📝 Next Steps:');
console.log('─'.repeat(60));

if (hasErrors) {
  console.log('❌ Configuration has errors. Please fix the issues above.');
  console.log('\n1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Add the missing environment variables');
  console.log('3. Make sure to set them for "Production" environment');
  console.log('4. Redeploy your application');
  console.log('\n📚 Clerk Dashboard: https://dashboard.clerk.com');
  console.log('   - Get your keys from: API Keys section');
  console.log('   - Configure allowed domains: pho.chat');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good!');
  console.log("\nIf you're still having issues:");
  console.log('1. Check Clerk Dashboard → Domains');
  console.log('2. Ensure pho.chat is in the allowed domains list');
  console.log('3. Check browser console for specific errors');
  console.log('4. Verify deployment logs in Vercel');
  process.exit(0);
}
