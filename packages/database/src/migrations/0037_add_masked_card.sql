-- Migration: Add masked card number field to sepay_payments table
-- Purpose: Store masked credit card reference for payment records
-- Date: 2025-01-15

-- Add masked_card_number column to sepay_payments table
ALTER TABLE "sepay_payments" ADD COLUMN "masked_card_number" TEXT;

-- Add comment to document the column
COMMENT ON COLUMN "sepay_payments"."masked_card_number" IS 'Masked credit card number (e.g., ****-****-****-0366) for reference only. Never stores full card data.';

-- Create index for faster lookups if needed
CREATE INDEX IF NOT EXISTS "idx_sepay_payments_masked_card" ON "sepay_payments"("masked_card_number");

