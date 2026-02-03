-- Add recommendation_selections column to users table
-- This stores the user's selected recommendations from onboarding

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recommendation_selections" jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "users_recommendation_selections_idx" ON "users" USING gin ("recommendation_selections");
