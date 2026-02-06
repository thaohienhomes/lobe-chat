#!/usr/bin/env node
/* eslint-disable unicorn/no-process-exit */
/**
 * PostHog Feature Flags Sync Script
 *
 * Automatically creates feature flags for Language Model providers in PostHog.
 * Run: node scripts/sync-posthog-flags.js
 *
 * Required env vars:
 * - POSTHOG_PERSONAL_API_KEY: Your PostHog personal API key
 * - POSTHOG_PROJECT_ID: Your PostHog project ID
 */
import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
// Also try .env as fallback
dotenv.config({ path: resolve(process.cwd(), '.env') });

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';

if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - POSTHOG_PERSONAL_API_KEY');
  console.error('   - POSTHOG_PROJECT_ID');
  process.exit(1);
}

// Feature flags to create
const FLAGS_TO_CREATE = [
  // Tier 1: Provider Groups
  {
    description: 'Controls visibility of premium providers: OpenAI, Anthropic, Google, VertexAI',
    key: 'llm-group-premium',
    name: 'LLM Group: Premium Providers',
  },
  {
    description: 'Controls visibility of fast inference providers: Groq, Cerebras, SambaNova',
    key: 'llm-group-fast',
    name: 'LLM Group: Fast Inference',
  },
  {
    description:
      'Controls visibility of open-source providers: Ollama, vLLM, HuggingFace, Xinference',
    key: 'llm-group-open-source',
    name: 'LLM Group: Open Source',
  },
  {
    description:
      'Controls visibility of China-based providers: Qwen, ZhiPu, DeepSeek, Baichuan, Moonshot, Hunyuan, Spark, Wenxin',
    key: 'llm-group-china',
    name: 'LLM Group: China Providers',
  },
  {
    description: 'Controls visibility of multi-model gateways: OpenRouter, TogetherAI, FireworksAI',
    key: 'llm-group-aggregators',
    name: 'LLM Group: API Aggregators',
  },

  // Tier 2: Individual Providers
  {
    description: 'Controls visibility of Groq provider in Language Models settings',
    key: 'llm-provider-groq',
    name: 'LLM Provider: Groq',
  },
  {
    description: 'Controls visibility of Google AI provider in Language Models settings',
    key: 'llm-provider-google',
    name: 'LLM Provider: Google AI',
  },
  {
    description: 'Controls visibility of Google Vertex AI provider in Language Models settings',
    key: 'llm-provider-vertexai',
    name: 'LLM Provider: Vertex AI',
  },
  {
    description: 'Controls visibility of OpenAI provider in Language Models settings',
    key: 'llm-provider-openai',
    name: 'LLM Provider: OpenAI',
  },
  {
    description: 'Controls visibility of Anthropic (Claude) provider in Language Models settings',
    key: 'llm-provider-anthropic',
    name: 'LLM Provider: Anthropic',
  },
  {
    description: 'Controls visibility of DeepSeek provider in Language Models settings',
    key: 'llm-provider-deepseek',
    name: 'LLM Provider: DeepSeek',
  },
];

/**
 * Fetch existing feature flags from PostHog
 */
async function getExistingFlags() {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/feature_flags/`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flags: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Create a new feature flag in PostHog
 */
async function createFlag(flag) {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/feature_flags/`;

  const payload = {
    active: true,

    ensure_experience_continuity: false,

    // Default to disabled (no rollout)
    filters: {
      groups: [
        {
          properties: [],
          rollout_percentage: 0, // Disabled by default
        },
      ],
    },
    key: flag.key,
    name: flag.name,
  };

  const response = await fetch(url, {
    body: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create flag ${flag.key}: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Main sync function
 */
async function syncFlags() {
  console.log('🚀 PostHog Feature Flags Sync');
  console.log(`   Project ID: ${POSTHOG_PROJECT_ID}`);
  console.log(`   Host: ${POSTHOG_HOST}`);
  console.log('');

  // Get existing flags
  console.log('📋 Fetching existing flags...');
  const existingFlags = await getExistingFlags();
  const existingKeys = new Set(existingFlags.map((f) => f.key));
  console.log(`   Found ${existingFlags.length} existing flags`);
  console.log('');

  // Create missing flags
  let created = 0;
  let skipped = 0;

  for (const flag of FLAGS_TO_CREATE) {
    if (existingKeys.has(flag.key)) {
      console.log(`⏭️  Skip: ${flag.key} (already exists)`);
      skipped++;
    } else {
      try {
        await createFlag(flag);
        console.log(`✅ Created: ${flag.key}`);
        created++;
      } catch (error) {
        console.error(`❌ Error: ${flag.key} - ${error.message}`);
      }
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total flags: ${FLAGS_TO_CREATE.length}`);
}

// Run with top-level await
try {
  await syncFlags();
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
