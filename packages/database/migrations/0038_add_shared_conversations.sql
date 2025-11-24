-- Migration: Add shared_conversations table for public conversation sharing
-- This enables ChatGPT-like public share links with full conversation history

CREATE TABLE IF NOT EXISTS "shared_conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "title" text NOT NULL,
  "description" text,
  "avatar" text,
  "background_color" text,
  "tags" jsonb,
  
  -- Agent configuration
  "system_role" text,
  "model" text,
  "provider" text,
  "params" jsonb,
  "chat_config" jsonb,
  
  -- Messages (full conversation history)
  "messages" jsonb NOT NULL,
  
  -- Metadata
  "is_public" boolean DEFAULT true,
  "view_count" integer DEFAULT 0,
  "fork_count" integer DEFAULT 0,
  
  -- Timestamps
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "accessed_at" timestamp DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "shared_conversations_user_id_idx" ON "shared_conversations" ("user_id");
CREATE INDEX IF NOT EXISTS "shared_conversations_is_public_idx" ON "shared_conversations" ("is_public");
CREATE INDEX IF NOT EXISTS "shared_conversations_created_at_idx" ON "shared_conversations" ("created_at");

-- Foreign key constraint (optional - user might be deleted)
-- ALTER TABLE "shared_conversations" ADD CONSTRAINT "shared_conversations_user_id_fkey" 
-- FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

