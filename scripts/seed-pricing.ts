/**
 * Seed Model Pricing for Phở Points System
 * Based on PRICING_MASTERPLAN.md.md
 */
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { modelPricing } from '../packages/database/src/schemas/pricing';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Phở Points pricing based on PRICING_MASTERPLAN.md.md
const INITIAL_PRICING = [
  // Tier 1 - Cheap Models (5 points/msg)
  {
    id: 'gpt-4o-mini',
    inputCostPer1M: 150,
    inputPrice: 5000,
    modelId: 'gpt-4o-mini',
    outputCostPer1M: 600,
    outputPrice: 15_000,
    tier: 1,
  },
  {
    id: 'gemini-1.5-flash',
    inputCostPer1M: 75,
    inputPrice: 2500,
    modelId: 'gemini-1.5-flash',
    outputCostPer1M: 300,
    outputPrice: 7500,
    tier: 1,
  },
  {
    id: 'claude-3-haiku',
    inputCostPer1M: 250,
    inputPrice: 8000,
    modelId: 'claude-3-haiku-20240307',
    outputCostPer1M: 1250,
    outputPrice: 40_000,
    tier: 1,
  },
  // Tier 2 - Standard Models (150 points/msg)
  {
    id: 'gpt-4o',
    inputCostPer1M: 2500,
    inputPrice: 150_000,
    modelId: 'gpt-4o',
    outputCostPer1M: 10_000,
    outputPrice: 450_000,
    tier: 2,
  },
  {
    id: 'claude-3-5-sonnet',
    inputCostPer1M: 3000,
    inputPrice: 150_000,
    modelId: 'claude-3-5-sonnet-20240620',
    outputCostPer1M: 15_000,
    outputPrice: 450_000,
    tier: 2,
  },
  {
    id: 'gemini-1.5-pro',
    inputCostPer1M: 1250,
    inputPrice: 75_000,
    modelId: 'gemini-1.5-pro',
    outputCostPer1M: 5000,
    outputPrice: 225_000,
    tier: 2,
  },
  // Tier 3 - Expensive Models (1000 points/msg)
  {
    id: 'claude-3-opus',
    inputCostPer1M: 15_000,
    inputPrice: 500_000,
    modelId: 'claude-3-opus-20240229',
    outputCostPer1M: 75_000,
    outputPrice: 1_500_000,
    tier: 3,
  },
  {
    id: 'gpt-4-turbo',
    inputCostPer1M: 10_000,
    inputPrice: 400_000,
    modelId: 'gpt-4-turbo',
    outputCostPer1M: 30_000,
    outputPrice: 1_200_000,
    tier: 3,
  },
  {
    id: 'o1',
    inputCostPer1M: 15_000,
    inputPrice: 600_000,
    modelId: 'o1',
    outputCostPer1M: 60_000,
    outputPrice: 2_400_000,
    tier: 3,
  },
];

async function main() {
  console.log('Seeding model pricing for Phở Points system...');

  for (const price of INITIAL_PRICING) {
    await db.insert(modelPricing).values(price).onConflictDoUpdate({
      set: price,
      target: modelPricing.id,
    });
    console.log(`  ✅ ${price.id} (Tier ${price.tier})`);
  }

  console.log('Seeding completed.');
}

await main().catch((err) => {
  console.error('Seeding failed:', err);
  throw err;
});
