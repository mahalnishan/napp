-- Migration to add QuickBooks integration
-- Add QuickBooks-related columns to existing tables

-- Add quickbooks_customer_id to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS quickbooks_customer_id VARCHAR(255);

-- Add quickbooks_service_id to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS quickbooks_service_id TEXT;

-- Add quickbooks_invoice_id to work_orders table
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS quickbooks_invoice_id TEXT;

-- Create QuickBooks integrations table
CREATE TABLE IF NOT EXISTS public.quickbooks_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    state TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quickbooks_integrations_user_id ON public.quickbooks_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_quickbooks_customer_id ON public.clients(quickbooks_customer_id);
CREATE INDEX IF NOT EXISTS idx_services_quickbooks_service_id ON public.services(quickbooks_service_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_quickbooks_invoice_id ON public.work_orders(quickbooks_invoice_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quickbooks_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for QuickBooks integrations
CREATE POLICY "Users can view own QuickBooks integration" ON public.quickbooks_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own QuickBooks integration" ON public.quickbooks_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own QuickBooks integration" ON public.quickbooks_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own QuickBooks integration" ON public.quickbooks_integrations FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at column
CREATE TRIGGER update_quickbooks_integrations_updated_at BEFORE UPDATE ON public.quickbooks_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 