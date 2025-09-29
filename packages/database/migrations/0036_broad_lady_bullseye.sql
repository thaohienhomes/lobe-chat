ALTER TABLE "sepay_payments" DROP CONSTRAINT "sepay_payments_order_id_pk";--> statement-breakpoint
CREATE UNIQUE INDEX "sepay_payments_order_id_key" ON "sepay_payments" USING btree ("order_id");