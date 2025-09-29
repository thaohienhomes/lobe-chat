-- Safely create pgvector extension when available; skip if not installed on host
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
    CREATE EXTENSION IF NOT EXISTS vector;
  ELSE
    RAISE NOTICE 'pgvector extension not installed on this server; skipping CREATE EXTENSION vector';
  END IF;
END$$;
