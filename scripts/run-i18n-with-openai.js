#!/usr/bin/env node

/**
 * Wrapper script to run i18n CLI with a real OpenAI API key
 * 
 * The @lobehub/i18n-cli requires a real OpenAI API key for translation.
 * This script temporarily sets OPENAI_API_KEY from OPENAI_API_KEY_I18N
 * environment variable to avoid conflicts with OpenRouter configuration.
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY_I18N in your .env.local file
 * 2. Run: node scripts/run-i18n-with-openai.js
 * 
 * Or run directly with the key:
 * OPENAI_API_KEY_I18N=sk-proj-xxx node scripts/run-i18n-with-openai.js
 */

const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Check if OPENAI_API_KEY_I18N is set
const openaiKeyI18n = process.env.OPENAI_API_KEY_I18N;

if (!openaiKeyI18n) {
  console.error('\n❌ ERROR: OPENAI_API_KEY_I18N environment variable is not set!\n');
  console.error('The @lobehub/i18n-cli tool requires a real OpenAI API key for translation.');
  console.error('Your current OPENAI_API_KEY is configured for OpenRouter, which won\'t work.\n');
  console.error('To fix this:\n');
  console.error('1. Get a free OpenAI API key from: https://platform.openai.com/api-keys');
  console.error('   (New accounts get $5 free credit)\n');
  console.error('2. Add it to your .env.local file:');
  console.error('   OPENAI_API_KEY_I18N=sk-proj-YOUR_REAL_OPENAI_KEY_HERE\n');
  console.error('3. Run this script again: node scripts/run-i18n-with-openai.js\n');
  console.error('Or run directly with the key:');
  console.error('   OPENAI_API_KEY_I18N=sk-proj-xxx node scripts/run-i18n-with-openai.js\n');
  process.exit(1);
}

// Validate the key format (should start with sk-proj- or sk-)
if (!openaiKeyI18n.startsWith('sk-')) {
  console.error('\n❌ ERROR: Invalid OpenAI API key format!\n');
  console.error('The key should start with "sk-" or "sk-proj-"');
  console.error('Current value starts with:', openaiKeyI18n.substring(0, 10) + '...\n');
  process.exit(1);
}

console.log('\n✅ Found OPENAI_API_KEY_I18N environment variable');
console.log('🔑 Using OpenAI API key:', openaiKeyI18n.substring(0, 20) + '...\n');

// Temporarily set OPENAI_API_KEY to the i18n-specific key
process.env.OPENAI_API_KEY = openaiKeyI18n;

// Remove OPENAI_PROXY_URL to ensure direct OpenAI API access
delete process.env.OPENAI_PROXY_URL;

console.log('🚀 Running i18n workflow...\n');

try {
  // Run the i18n command
  execSync('npm run i18n', {
    stdio: 'inherit',
    env: process.env,
  });
  
  console.log('\n✅ i18n translation completed successfully!\n');
} catch (error) {
  console.error('\n❌ i18n translation failed!\n');
  console.error('Error:', error.message);
  process.exit(1);
}

