#!/usr/bin/env tsx
/**
 * PostHog Usage Alert Script
 *
 * Queries PostHog API to detect heavy usage patterns and potential abuse.
 * Run via: bunx tsx scripts/posthog-usage-alert.ts
 *
 * Alerts:
 * 1. Any user with > 50 Tier 3 calls/week
 * 2. Any user at > 80% daily T3 quota for 3+ consecutive days
 * 3. Total weekly T3 cost exceeding revenue threshold
 *
 * Requires env vars:
 *   POSTHOG_API_KEY    - PostHog personal API key
 *   POSTHOG_PROJECT_ID - PostHog project ID (default: 306983)
 */

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '306983';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';

// ─── Thresholds ─────────────────────────────────────────────────────
const WEEKLY_T3_CALL_THRESHOLD = 50;
const DAILY_QUOTA_PERCENT_THRESHOLD = 0.8; // 80%
const CONSECUTIVE_DAYS_THRESHOLD = 3;
const WEEKLY_T3_COST_THRESHOLD_USD = 25; // Alert if total T3 API cost > $25/week

// ─── Model Tier & Cost Config ───────────────────────────────────────
// Tier 3 models and their approximate API costs (USD per message, avg ~2K tokens)
const TIER3_MODELS = [
  'pho-smart',
  'google/gemini-3.1-pro-preview',
  'google/gemini-3-pro-preview',
  'gemini-3.1-pro-preview',
  'gemini-3-pro-preview',
  'anthropic/claude-opus-4-6',
  'anthropic/claude-opus-4-20250514',
  'claude-opus-4-6',
  'claude-3-opus',
  'openai/o3-mini',
  'o1',
  'o1-preview',
  'o1-pro',
  'o3',
  'gpt-4-turbo',
];

// Approximate cost per message (avg 1.5K input + 1K output tokens)
const MODEL_COST_PER_MSG: Record<string, number> = {
  'anthropic/claude-opus-4-6': 0.15,
  'anthropic/claude-opus-4-20250514': 0.15,
  'claude-3-opus': 0.12,
  'claude-opus-4-6': 0.15,
  'gemini-3-pro-preview': 0.04,
  'gemini-3.1-pro-preview': 0.05,
  'google/gemini-3-pro-preview': 0.04,
  'google/gemini-3.1-pro-preview': 0.05,
  'gpt-4-turbo': 0.06,
  'o1': 0.10,
  'o1-preview': 0.10,
  'o1-pro': 0.20,
  'o3': 0.15,
  'openai/o3-mini': 0.04,
  'pho-smart': 0.02, // Cerebras Llama — cheap
};

// Daily T3 limits per plan (from src/config/pricing.ts)
const PLAN_DAILY_T3_LIMITS: Record<string, number> = {
  medical_beta: 10,
  vn_premium: 20,
  vn_pro: 50,
  vn_ultimate: 100,
  gl_premium: 50,
  lifetime_early_bird: 50,
  lifetime_standard: 50,
  lifetime_last_call: 50,
};

// ─── API Helper ─────────────────────────────────────────────────────

interface HogQLResult {
  columns: string[];
  results: any[][];
}

async function queryHogQL(sql: string): Promise<HogQLResult> {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: { kind: 'HogQLQuery', query: sql },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { columns: data.columns, results: data.results };
}

// ─── Alert Checks ───────────────────────────────────────────────────

interface Alert {
  severity: 'WARNING' | 'CRITICAL';
  type: string;
  message: string;
  details: Record<string, any>;
}

const alerts: Alert[] = [];

async function checkWeeklyT3Usage(): Promise<void> {
  console.log('\n📊 Check 1: Weekly T3 call volume per user...');

  const tier3ModelFilter = TIER3_MODELS.map((m) => `'${m}'`).join(',');
  const sql = `
    SELECT
      person.properties.email as email,
      properties.selected_model as model,
      count() as calls
    FROM events
    WHERE timestamp >= now() - INTERVAL 7 DAY
      AND event = 'send_message'
      AND properties.selected_model IN (${tier3ModelFilter})
    GROUP BY email, model
    ORDER BY calls DESC
    LIMIT 50
  `;

  const result = await queryHogQL(sql);
  const userTotals: Record<string, { calls: number; models: Record<string, number>; cost: number }> = {};

  for (const [email, model, calls] of result.results) {
    if (!email) continue;
    if (!userTotals[email]) userTotals[email] = { calls: 0, models: {}, cost: 0 };
    userTotals[email].calls += calls;
    userTotals[email].models[model] = calls;
    userTotals[email].cost += calls * (MODEL_COST_PER_MSG[model] || 0.05);
  }

  let totalWeeklyCost = 0;

  for (const [email, data] of Object.entries(userTotals)) {
    totalWeeklyCost += data.cost;

    if (data.calls >= WEEKLY_T3_CALL_THRESHOLD) {
      alerts.push({
        severity: data.calls >= WEEKLY_T3_CALL_THRESHOLD * 2 ? 'CRITICAL' : 'WARNING',
        type: 'HIGH_T3_WEEKLY',
        message: `${email}: ${data.calls} T3 calls/week (threshold: ${WEEKLY_T3_CALL_THRESHOLD})`,
        details: { email, totalCalls: data.calls, models: data.models, estimatedCost: `$${data.cost.toFixed(2)}` },
      });
    }
  }

  // Check total cost threshold
  if (totalWeeklyCost > WEEKLY_T3_COST_THRESHOLD_USD) {
    alerts.push({
      severity: totalWeeklyCost > WEEKLY_T3_COST_THRESHOLD_USD * 2 ? 'CRITICAL' : 'WARNING',
      type: 'HIGH_TOTAL_T3_COST',
      message: `Total weekly T3 API cost: $${totalWeeklyCost.toFixed(2)} (threshold: $${WEEKLY_T3_COST_THRESHOLD_USD})`,
      details: { totalCost: `$${totalWeeklyCost.toFixed(2)}`, userBreakdown: userTotals },
    });
  }

  console.log(`   Found ${Object.keys(userTotals).length} users with T3 usage, total cost: $${totalWeeklyCost.toFixed(2)}`);
}

async function checkConsecutiveDailyQuotaUsage(): Promise<void> {
  console.log('\n📊 Check 2: Users at >80% daily T3 quota for 3+ consecutive days...');

  const tier3ModelFilter = TIER3_MODELS.map((m) => `'${m}'`).join(',');
  const sql = `
    SELECT
      person.properties.email as email,
      toDate(timestamp) as day,
      count() as daily_calls
    FROM events
    WHERE timestamp >= now() - INTERVAL 7 DAY
      AND event = 'send_message'
      AND properties.selected_model IN (${tier3ModelFilter})
    GROUP BY email, day
    ORDER BY email, day
  `;

  const result = await queryHogQL(sql);

  // Group by user
  const userDays: Record<string, { day: string; calls: number }[]> = {};
  for (const [email, day, calls] of result.results) {
    if (!email) continue;
    if (!userDays[email]) userDays[email] = [];
    userDays[email].push({ day: String(day), calls });
  }

  for (const [email, days] of Object.entries(userDays)) {
    // Default to medical_beta limit if unknown
    const dailyLimit = PLAN_DAILY_T3_LIMITS['medical_beta']; // 10
    const threshold = dailyLimit * DAILY_QUOTA_PERCENT_THRESHOLD;

    // Sort by day and check consecutive
    days.sort((a, b) => a.day.localeCompare(b.day));

    let consecutiveCount = 0;
    let maxConsecutive = 0;

    for (const { calls } of days) {
      if (calls >= threshold) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 0;
      }
    }

    if (maxConsecutive >= CONSECUTIVE_DAYS_THRESHOLD) {
      alerts.push({
        severity: 'WARNING',
        type: 'CONSECUTIVE_HIGH_QUOTA',
        message: `${email}: ≥${Math.round(DAILY_QUOTA_PERCENT_THRESHOLD * 100)}% T3 quota for ${maxConsecutive} consecutive days`,
        details: {
          email,
          consecutiveDays: maxConsecutive,
          dailyLimit,
          dailyBreakdown: days,
        },
      });
    }
  }
}

async function checkOverallStats(): Promise<void> {
  console.log('\n📊 Check 3: Overall usage stats...');

  const sql = `
    SELECT
      count() as total_messages,
      uniq(person_id) as unique_users,
      uniq(properties.selected_model) as unique_models,
      countIf(properties.selected_model IN ('pho-auto')) as auto_messages
    FROM events
    WHERE timestamp >= now() - INTERVAL 7 DAY
      AND event = 'send_message'
  `;

  const result = await queryHogQL(sql);
  if (result.results.length > 0) {
    const [total, users, models, auto] = result.results[0];
    console.log(`   Total messages: ${total}`);
    console.log(`   Unique users: ${users}`);
    console.log(`   Unique models: ${models}`);
    console.log(`   Pho-auto messages: ${auto} (${((auto / total) * 100).toFixed(1)}%)`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🔍 PostHog Usage Alert — pho.chat');
  console.log(`   Period: Last 7 days`);
  console.log(`   Project: ${POSTHOG_PROJECT_ID}`);
  console.log('='.repeat(60));

  if (!POSTHOG_API_KEY) {
    console.error('❌ Missing POSTHOG_API_KEY environment variable');
    console.error('   Set it via: export POSTHOG_API_KEY=phx_...');
    process.exit(1);
  }

  await checkOverallStats();
  await checkWeeklyT3Usage();
  await checkConsecutiveDailyQuotaUsage();

  // ─── Report ─────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));

  if (alerts.length === 0) {
    console.log('✅ No alerts — all usage within thresholds.');
  } else {
    const criticals = alerts.filter((a) => a.severity === 'CRITICAL');
    const warnings = alerts.filter((a) => a.severity === 'WARNING');

    console.log(`\n🚨 ${alerts.length} ALERT(S) DETECTED`);
    console.log(`   ${criticals.length} CRITICAL, ${warnings.length} WARNING\n`);

    for (const alert of alerts) {
      const icon = alert.severity === 'CRITICAL' ? '🔴' : '🟡';
      console.log(`${icon} [${alert.severity}] ${alert.type}`);
      console.log(`   ${alert.message}`);
      if (alert.details.models) {
        console.log(`   Models: ${JSON.stringify(alert.details.models)}`);
      }
      if (alert.details.estimatedCost) {
        console.log(`   Est. cost: ${alert.details.estimatedCost}`);
      }
      console.log('');
    }
  }

  // Exit with error code if critical alerts
  const hasCritical = alerts.some((a) => a.severity === 'CRITICAL');
  process.exit(hasCritical ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(2);
});
