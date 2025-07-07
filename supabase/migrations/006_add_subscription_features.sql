-- Migration to add subscription features and premium functionality
-- Supports Free, Professional, and Enterprise tiers

-- Add subscription management table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  work_orders_count INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Add user settings table for premium features
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  custom_branding_enabled BOOLEAN DEFAULT false,
  custom_logo_url TEXT,
  custom_company_name TEXT,
  custom_primary_color TEXT,
  custom_secondary_color TEXT,
  white_label_enabled BOOLEAN DEFAULT false,
  custom_domain TEXT,
  api_access_enabled BOOLEAN DEFAULT false,
  api_key TEXT,
  webhook_url TEXT,
  advanced_automation_enabled BOOLEAN DEFAULT false,
  auto_invoice_generation BOOLEAN DEFAULT false,
  auto_payment_reminders BOOLEAN DEFAULT false,
  auto_status_updates BOOLEAN DEFAULT false,
  multi_location_enabled BOOLEAN DEFAULT false,
  default_location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add locations table for multi-location support
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add advanced reporting table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'performance', 'customer', 'inventory', 'custom')),
  parameters JSONB,
  schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'manual')),
  last_generated TIMESTAMP WITH TIME ZONE,
  next_generation TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add API keys table for API access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add webhooks table for custom integrations
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to listen for
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add automation rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('work_order_created', 'work_order_completed', 'payment_received', 'client_created', 'schedule_reminder')),
  conditions JSONB,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month_year ON public.usage_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON public.automation_rules(user_id);

-- Add RLS policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Locations policies
CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can view own api keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Webhooks policies
CREATE POLICY "Users can view own webhooks" ON public.webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks" ON public.webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks" ON public.webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks" ON public.webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- Automation rules policies
CREATE POLICY "Users can view own automation rules" ON public.automation_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation rules" ON public.automation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation rules" ON public.automation_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation rules" ON public.automation_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Add functions for usage tracking
CREATE OR REPLACE FUNCTION increment_work_order_count(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year, work_orders_count)
  VALUES (user_uuid, to_char(CURRENT_DATE, 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    work_orders_count = public.usage_tracking.work_orders_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create work order (free tier limit)
CREATE OR REPLACE FUNCTION can_create_work_order(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_month_orders INTEGER;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM public.subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to free if no subscription found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- If professional or enterprise, unlimited
  IF user_plan IN ('professional', 'enterprise') THEN
    RETURN TRUE;
  END IF;
  
  -- For free tier, check limit
  SELECT COALESCE(work_orders_count, 0) INTO current_month_orders
  FROM public.usage_tracking
  WHERE user_id = user_uuid AND month_year = to_char(CURRENT_DATE, 'YYYY-MM');
  
  RETURN current_month_orders < 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check team member limit
CREATE OR REPLACE FUNCTION can_add_team_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_team_count INTEGER;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM public.subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to free if no subscription found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- If professional or enterprise, unlimited
  IF user_plan IN ('professional', 'enterprise') THEN
    RETURN TRUE;
  END IF;
  
  -- For free tier, check limit
  SELECT COUNT(*) INTO current_team_count
  FROM public.workers
  WHERE user_id = user_uuid;
  
  RETURN current_team_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for usage tracking
CREATE OR REPLACE FUNCTION track_work_order_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_work_order_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER work_order_created_trigger
  AFTER INSERT ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_work_order_creation();

-- Add comments for documentation
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and billing information';
COMMENT ON TABLE public.usage_tracking IS 'Monthly usage tracking for work orders, team members, etc.';
COMMENT ON TABLE public.user_settings IS 'User-specific settings for premium features';
COMMENT ON TABLE public.locations IS 'Multi-location support for enterprise users';
COMMENT ON TABLE public.reports IS 'Advanced reporting and analytics';
COMMENT ON TABLE public.api_keys IS 'API access keys for enterprise users';
COMMENT ON TABLE public.webhooks IS 'Webhook configurations for custom integrations';
COMMENT ON TABLE public.automation_rules IS 'Automation rules for advanced workflows'; 