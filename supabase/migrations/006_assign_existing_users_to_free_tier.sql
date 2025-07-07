-- Migration to assign existing users to free tier
-- This migration ensures all existing users have a free subscription and usage tracking

-- Function to create free subscription for a user
CREATE OR REPLACE FUNCTION create_free_subscription_for_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user already has an active subscription
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = create_free_subscription_for_user.user_id 
    AND status = 'active'
  ) THEN
    -- Create free subscription
    INSERT INTO subscriptions (
      user_id,
      plan_type,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    ) VALUES (
      create_free_subscription_for_user.user_id,
      'free',
      'active',
      NOW(),
      NOW() + INTERVAL '1 month',
      false
    );
  END IF;

  -- Initialize user settings if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_settings.user_id = create_free_subscription_for_user.user_id
  ) THEN
    INSERT INTO user_settings (
      user_id,
      custom_branding_enabled,
      white_label_enabled,
      api_access_enabled,
      advanced_automation_enabled,
      multi_location_enabled,
      advanced_reporting_enabled,
      webhooks_enabled,
      custom_integrations_enabled
    ) VALUES (
      create_free_subscription_for_user.user_id,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    );
  END IF;

  -- Initialize usage tracking for current month if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM usage_tracking 
    WHERE usage_tracking.user_id = create_free_subscription_for_user.user_id 
    AND month_year = TO_CHAR(NOW(), 'YYYY-MM')
  ) THEN
    INSERT INTO usage_tracking (
      user_id,
      month_year,
      work_orders_count,
      api_calls_count,
      storage_mb_used
    ) VALUES (
      create_free_subscription_for_user.user_id,
      TO_CHAR(NOW(), 'YYYY-MM'),
      0,
      0,
      0
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Assign free tier to all existing users who don't have a subscription
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (
      SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active'
    )
  LOOP
    PERFORM create_free_subscription_for_user(user_record.id);
  END LOOP;
END $$;

-- Update existing users who have subscriptions but no usage tracking
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT s.user_id 
    FROM subscriptions s
    WHERE s.status = 'active'
    AND s.user_id NOT IN (
      SELECT DISTINCT user_id FROM usage_tracking WHERE month_year = TO_CHAR(NOW(), 'YYYY-MM')
    )
  LOOP
    -- Initialize usage tracking for current month
    INSERT INTO usage_tracking (
      user_id,
      month_year,
      work_orders_count,
      api_calls_count,
      storage_mb_used
    ) VALUES (
      user_record.user_id,
      TO_CHAR(NOW(), 'YYYY-MM'),
      0,
      0,
      0
    );
  END LOOP;
END $$;

-- Update existing users who have subscriptions but no user settings
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT s.user_id 
    FROM subscriptions s
    WHERE s.status = 'active'
    AND s.user_id NOT IN (
      SELECT DISTINCT user_id FROM user_settings
    )
  LOOP
    -- Initialize user settings
    INSERT INTO user_settings (
      user_id,
      custom_branding_enabled,
      white_label_enabled,
      api_access_enabled,
      advanced_automation_enabled,
      multi_location_enabled,
      advanced_reporting_enabled,
      webhooks_enabled,
      custom_integrations_enabled
    ) VALUES (
      user_record.user_id,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    );
  END LOOP;
END $$;

-- Clean up the function
DROP FUNCTION IF EXISTS create_free_subscription_for_user(UUID);

-- Add a trigger to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create free subscription
  INSERT INTO subscriptions (
    user_id,
    plan_type,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    false
  );

  -- Initialize user settings
  INSERT INTO user_settings (
    user_id,
    custom_branding_enabled,
    white_label_enabled,
    api_access_enabled,
    advanced_automation_enabled,
    multi_location_enabled,
    advanced_reporting_enabled,
    webhooks_enabled,
    custom_integrations_enabled
  ) VALUES (
    NEW.id,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  );

  -- Initialize usage tracking for current month
  INSERT INTO usage_tracking (
    user_id,
    month_year,
    work_orders_count,
    api_calls_count,
    storage_mb_used
  ) VALUES (
    NEW.id,
    TO_CHAR(NOW(), 'YYYY-MM'),
    0,
    0,
    0
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 