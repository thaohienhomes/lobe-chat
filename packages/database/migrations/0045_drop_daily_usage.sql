-- Drop unused daily_usage table
-- Daily tier tracking is handled by users.daily_tier1_usage / daily_tier2_usage / daily_tier3_usage columns
-- The daily_usage table was never written to in production
DROP TABLE IF EXISTS "daily_usage";
