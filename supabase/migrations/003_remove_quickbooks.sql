-- Migration to remove QuickBooks integration
-- Remove QuickBooks-related columns from existing tables

-- Remove quickbooks_customer_id from clients table
ALTER TABLE public.clients DROP COLUMN IF EXISTS quickbooks_customer_id;

-- Remove quickbooks_service_id from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS quickbooks_service_id;

-- Remove quickbooks_invoice_id from work_orders table
ALTER TABLE public.work_orders DROP COLUMN IF EXISTS quickbooks_invoice_id;

-- Drop the quickbooks_integrations table
DROP TABLE IF EXISTS public.quickbooks_integrations;

-- Drop QuickBooks-related policies (they will be automatically dropped with the table)
-- No need to explicitly drop them as they're tied to the table

-- Drop QuickBooks-related trigger
-- The trigger will be automatically dropped with the table 