DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cost_settings' AND column_name = 'budget_alert_thresholds') THEN
		ALTER TABLE "user_cost_settings" ALTER COLUMN "budget_alert_thresholds" SET DEFAULT '{"critical":90,"emergency":95,"warning":75}'::jsonb;
	END IF;
EXCEPTION WHEN others THEN NULL;
END $$;