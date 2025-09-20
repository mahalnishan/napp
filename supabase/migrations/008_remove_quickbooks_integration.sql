-- Migration 008: Remove QuickBooks integration
-- This migration removes all QuickBooks-related columns and tables

-- Drop QuickBooks integrations table
DROP TABLE IF EXISTS public.quickbooks_integrations CASCADE;

-- Remove QuickBooks columns from clients table
ALTER TABLE public.clients 
  DROP COLUMN IF EXISTS quickbooks_customer_id,
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS company_name,
  DROP COLUMN IF EXISTS given_name,
  DROP COLUMN IF EXISTS family_name,
  DROP COLUMN IF EXISTS fully_qualified_name,
  DROP COLUMN IF EXISTS primary_email_address,
  DROP COLUMN IF EXISTS primary_phone_free_form_number,
  DROP COLUMN IF EXISTS quickbooks_sync_token,
  DROP COLUMN IF EXISTS quickbooks_meta_data,
  DROP COLUMN IF EXISTS last_quickbooks_sync;

-- Remove QuickBooks columns from services table
ALTER TABLE public.services 
  DROP COLUMN IF EXISTS quickbooks_service_id,
  DROP COLUMN IF EXISTS qb_type,
  DROP COLUMN IF EXISTS qb_income_account_ref,
  DROP COLUMN IF EXISTS qb_sync_token,
  DROP COLUMN IF EXISTS last_quickbooks_sync;

-- Remove QuickBooks columns from work_orders table
ALTER TABLE public.work_orders 
  DROP COLUMN IF EXISTS quickbooks_invoice_id,
  DROP COLUMN IF EXISTS qb_doc_number,
  DROP COLUMN IF EXISTS qb_txn_date,
  DROP COLUMN IF EXISTS qb_due_date,
  DROP COLUMN IF EXISTS qb_sync_token,
  DROP COLUMN IF EXISTS quickbooks_payment_id,
  DROP COLUMN IF EXISTS quickbooks_sync_token,
  DROP COLUMN IF EXISTS last_quickbooks_sync;

-- Remove QuickBooks columns from work_order_services table
ALTER TABLE public.work_order_services 
  DROP COLUMN IF EXISTS quickbooks_line_id,
  DROP COLUMN IF EXISTS quickbooks_item_id;

-- Drop QuickBooks-related indexes
DROP INDEX IF EXISTS idx_quickbooks_integrations_user_id;
DROP INDEX IF EXISTS idx_clients_quickbooks_customer_id;
DROP INDEX IF EXISTS idx_services_quickbooks_service_id;
DROP INDEX IF EXISTS idx_work_orders_quickbooks_invoice_id;
DROP INDEX IF EXISTS idx_clients_quickbooks_sync_token;
DROP INDEX IF EXISTS idx_clients_last_quickbooks_sync;
DROP INDEX IF EXISTS idx_services_last_quickbooks_sync;
DROP INDEX IF EXISTS idx_work_order_services_qb_line_id;
DROP INDEX IF EXISTS idx_work_orders_qb_invoice_id;
DROP INDEX IF EXISTS idx_work_orders_qb_payment_id;

-- Add comment about QuickBooks as upcoming feature
COMMENT ON SCHEMA public IS 'QuickBooks integration is planned as an upcoming feature';
