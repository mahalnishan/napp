-- Migration 007: enhance QuickBooks alignment for deeper sync

-- Add QuickBooks fields to work_order_services for per-line sync
ALTER TABLE public.work_order_services
  ADD COLUMN IF NOT EXISTS quickbooks_line_id TEXT,
  ADD COLUMN IF NOT EXISTS quickbooks_item_id TEXT;

-- Add QuickBooks payment tracking
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS quickbooks_payment_id TEXT;

-- Add sync metadata
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS quickbooks_sync_token TEXT,
  ADD COLUMN IF NOT EXISTS last_quickbooks_sync TIMESTAMP WITH TIME ZONE;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_work_order_services_qb_line_id ON public.work_order_services(quickbooks_line_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_qb_invoice_id ON public.work_orders(quickbooks_invoice_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_qb_payment_id ON public.work_orders(quickbooks_payment_id);

-- Optional: policy remains unchanged (inherits from parent tables)

-- Update comment documentation
COMMENT ON COLUMN public.work_order_services.quickbooks_line_id IS 'QuickBooks Line.Id for this service line';
COMMENT ON COLUMN public.work_order_services.quickbooks_item_id IS 'QuickBooks Item.Id for linked service';
COMMENT ON COLUMN public.work_orders.quickbooks_payment_id IS 'QuickBooks Payment.Id linked to this order';
COMMENT ON COLUMN public.work_orders.quickbooks_sync_token IS 'QuickBooks SyncToken for optimistic concurrency';
COMMENT ON COLUMN public.work_orders.last_quickbooks_sync IS 'Timestamp of last successful QuickBooks sync'; 