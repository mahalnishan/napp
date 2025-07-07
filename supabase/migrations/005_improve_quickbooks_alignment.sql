-- Migration to improve QuickBooks alignment
-- Add missing fields and improve existing ones to match QuickBooks structure

-- Add new columns to clients table for better QuickBooks alignment
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS given_name TEXT,
ADD COLUMN IF NOT EXISTS family_name TEXT,
ADD COLUMN IF NOT EXISTS fully_qualified_name TEXT,
ADD COLUMN IF NOT EXISTS bill_addr_line1 TEXT,
ADD COLUMN IF NOT EXISTS bill_addr_city TEXT,
ADD COLUMN IF NOT EXISTS bill_addr_state TEXT,
ADD COLUMN IF NOT EXISTS bill_addr_postal_code TEXT,
ADD COLUMN IF NOT EXISTS bill_addr_country TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS primary_phone_free_form_number TEXT,
ADD COLUMN IF NOT EXISTS primary_email_address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS preferred_delivery_method TEXT DEFAULT 'Print',
ADD COLUMN IF NOT EXISTS taxable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS job BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bill_with_parent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS open_balance_date DATE,
ADD COLUMN IF NOT EXISTS quickbooks_sync_token TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_meta_data JSONB,
ADD COLUMN IF NOT EXISTS last_quickbooks_sync TIMESTAMP WITH TIME ZONE;

-- Update existing phone column to match QuickBooks format
UPDATE public.clients 
SET primary_phone_free_form_number = phone 
WHERE phone IS NOT NULL AND primary_phone_free_form_number IS NULL;

-- Update existing email column to match QuickBooks format
UPDATE public.clients 
SET primary_email_address = email 
WHERE email IS NOT NULL AND primary_email_address IS NULL;

-- Update existing address column to match QuickBooks format
UPDATE public.clients 
SET bill_addr_line1 = address 
WHERE address IS NOT NULL AND bill_addr_line1 IS NULL;

-- Set display_name to name for existing records
UPDATE public.clients 
SET display_name = name 
WHERE display_name IS NULL;

-- Set company_name to name for business clients
UPDATE public.clients 
SET company_name = name 
WHERE client_type != 'Individual' AND company_name IS NULL;

-- For individual clients, try to split name into given_name and family_name
UPDATE public.clients 
SET 
  given_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from 1 for position(' ' in name) - 1)
    ELSE name
  END,
  family_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE client_type = 'Individual' AND given_name IS NULL;

-- Set fully_qualified_name (QuickBooks uses this for display)
UPDATE public.clients 
SET fully_qualified_name = COALESCE(display_name, name)
WHERE fully_qualified_name IS NULL;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_clients_display_name ON public.clients(display_name);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_primary_email_address ON public.clients(primary_email_address);
CREATE INDEX IF NOT EXISTS idx_clients_quickbooks_sync_token ON public.clients(quickbooks_sync_token);
CREATE INDEX IF NOT EXISTS idx_clients_last_quickbooks_sync ON public.clients(last_quickbooks_sync);

-- Add services table improvements for QuickBooks alignment
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS qb_type TEXT DEFAULT 'Service',
ADD COLUMN IF NOT EXISTS qb_income_account_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_expense_account_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_asset_account_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_sku TEXT,
ADD COLUMN IF NOT EXISTS qb_track_qty_on_hand BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_qty_on_hand DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS qb_reorder_point DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS qb_taxable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS qb_sales_tax_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_purchase_tax_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_purchase_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS qb_sync_token TEXT,
ADD COLUMN IF NOT EXISTS qb_meta_data JSONB,
ADD COLUMN IF NOT EXISTS last_quickbooks_sync TIMESTAMP WITH TIME ZONE;

-- Add work_orders table improvements for QuickBooks invoice alignment
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS qb_doc_number TEXT,
ADD COLUMN IF NOT EXISTS qb_txn_date DATE,
ADD COLUMN IF NOT EXISTS qb_due_date DATE,
ADD COLUMN IF NOT EXISTS qb_ship_date DATE,
ADD COLUMN IF NOT EXISTS qb_tracking_num TEXT,
ADD COLUMN IF NOT EXISTS qb_class_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_sales_term_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_bill_email TEXT,
ADD COLUMN IF NOT EXISTS qb_reply_email TEXT,
ADD COLUMN IF NOT EXISTS qb_delivery_info JSONB,
ADD COLUMN IF NOT EXISTS qb_invoice_link TEXT,
ADD COLUMN IF NOT EXISTS qb_deposit_to_account_ref TEXT,
ADD COLUMN IF NOT EXISTS qb_total_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS qb_apply_tax_after_discount BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_print_status TEXT DEFAULT 'NotSet',
ADD COLUMN IF NOT EXISTS qb_email_status TEXT DEFAULT 'NotSet',
ADD COLUMN IF NOT EXISTS qb_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS qb_deposit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS qb_allow_ipn_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_allow_online_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_allow_online_credit_card_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_allow_online_ach_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qb_sync_token TEXT,
ADD COLUMN IF NOT EXISTS qb_meta_data JSONB;

-- Add indexes for new QuickBooks fields
CREATE INDEX IF NOT EXISTS idx_services_qb_type ON public.services(qb_type);
CREATE INDEX IF NOT EXISTS idx_services_qb_sync_token ON public.services(qb_sync_token);
CREATE INDEX IF NOT EXISTS idx_services_last_quickbooks_sync ON public.services(last_quickbooks_sync);
CREATE INDEX IF NOT EXISTS idx_work_orders_qb_doc_number ON public.work_orders(qb_doc_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_qb_sync_token ON public.work_orders(qb_sync_token);

-- Add comments for documentation
COMMENT ON COLUMN public.clients.display_name IS 'QuickBooks DisplayName field - how customer appears in lists';
COMMENT ON COLUMN public.clients.company_name IS 'QuickBooks CompanyName field - for business customers';
COMMENT ON COLUMN public.clients.given_name IS 'QuickBooks GivenName field - first name for individual customers';
COMMENT ON COLUMN public.clients.family_name IS 'QuickBooks FamilyName field - last name for individual customers';
COMMENT ON COLUMN public.clients.fully_qualified_name IS 'QuickBooks FullyQualifiedName field - complete name for display';
COMMENT ON COLUMN public.clients.primary_email_address IS 'QuickBooks PrimaryEmailAddr.Address field';
COMMENT ON COLUMN public.clients.primary_phone_free_form_number IS 'QuickBooks PrimaryPhone.FreeFormNumber field';
COMMENT ON COLUMN public.clients.quickbooks_sync_token IS 'QuickBooks SyncToken for optimistic locking';
COMMENT ON COLUMN public.clients.quickbooks_meta_data IS 'QuickBooks MetaData object (CreateTime, LastUpdatedTime)';
COMMENT ON COLUMN public.clients.last_quickbooks_sync IS 'Timestamp of last successful sync with QuickBooks';

COMMENT ON COLUMN public.services.qb_type IS 'QuickBooks Item Type (Service, Inventory, NonInventory)';
COMMENT ON COLUMN public.services.qb_income_account_ref IS 'QuickBooks IncomeAccountRef for service items';
COMMENT ON COLUMN public.services.qb_sync_token IS 'QuickBooks SyncToken for optimistic locking';

COMMENT ON COLUMN public.work_orders.qb_doc_number IS 'QuickBooks DocNumber field - invoice number';
COMMENT ON COLUMN public.work_orders.qb_txn_date IS 'QuickBooks TxnDate field - transaction date';
COMMENT ON COLUMN public.work_orders.qb_due_date IS 'QuickBooks DueDate field - payment due date';
COMMENT ON COLUMN public.work_orders.qb_sync_token IS 'QuickBooks SyncToken for optimistic locking'; 