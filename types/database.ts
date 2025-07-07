export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          client_type: string
          is_active: boolean
          quickbooks_customer_id: string | null
          // New QuickBooks-aligned fields
          display_name: string | null
          company_name: string | null
          given_name: string | null
          family_name: string | null
          fully_qualified_name: string | null
          bill_addr_line1: string | null
          bill_addr_city: string | null
          bill_addr_state: string | null
          bill_addr_postal_code: string | null
          bill_addr_country: string | null
          primary_phone_free_form_number: string | null
          primary_email_address: string | null
          notes: string | null
          preferred_delivery_method: string | null
          taxable: boolean | null
          job: boolean | null
          bill_with_parent: boolean | null
          balance: number | null
          open_balance_date: string | null
          quickbooks_sync_token: string | null
          quickbooks_meta_data: any | null
          last_quickbooks_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          client_type?: string
          is_active?: boolean
          quickbooks_customer_id?: string | null
          // New QuickBooks-aligned fields
          display_name?: string | null
          company_name?: string | null
          given_name?: string | null
          family_name?: string | null
          fully_qualified_name?: string | null
          bill_addr_line1?: string | null
          bill_addr_city?: string | null
          bill_addr_state?: string | null
          bill_addr_postal_code?: string | null
          bill_addr_country?: string | null
          primary_phone_free_form_number?: string | null
          primary_email_address?: string | null
          notes?: string | null
          preferred_delivery_method?: string | null
          taxable?: boolean | null
          job?: boolean | null
          bill_with_parent?: boolean | null
          balance?: number | null
          open_balance_date?: string | null
          quickbooks_sync_token?: string | null
          quickbooks_meta_data?: any | null
          last_quickbooks_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          client_type?: string
          is_active?: boolean
          quickbooks_customer_id?: string | null
          // New QuickBooks-aligned fields
          display_name?: string | null
          company_name?: string | null
          given_name?: string | null
          family_name?: string | null
          fully_qualified_name?: string | null
          bill_addr_line1?: string | null
          bill_addr_city?: string | null
          bill_addr_state?: string | null
          bill_addr_postal_code?: string | null
          bill_addr_country?: string | null
          primary_phone_free_form_number?: string | null
          primary_email_address?: string | null
          notes?: string | null
          preferred_delivery_method?: string | null
          taxable?: boolean | null
          job?: boolean | null
          bill_with_parent?: boolean | null
          balance?: number | null
          open_balance_date?: string | null
          quickbooks_sync_token?: string | null
          quickbooks_meta_data?: any | null
          last_quickbooks_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          price: number
          quickbooks_service_id: string | null
          // New QuickBooks-aligned fields
          qb_type: string | null
          qb_income_account_ref: string | null
          qb_expense_account_ref: string | null
          qb_asset_account_ref: string | null
          qb_sku: string | null
          qb_track_qty_on_hand: boolean | null
          qb_qty_on_hand: number | null
          qb_reorder_point: number | null
          qb_taxable: boolean | null
          qb_sales_tax_included: boolean | null
          qb_purchase_tax_included: boolean | null
          qb_purchase_cost: number | null
          qb_sync_token: string | null
          qb_meta_data: any | null
          last_quickbooks_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          price: number
          quickbooks_service_id?: string | null
          // New QuickBooks-aligned fields
          qb_type?: string | null
          qb_income_account_ref?: string | null
          qb_expense_account_ref?: string | null
          qb_asset_account_ref?: string | null
          qb_sku?: string | null
          qb_track_qty_on_hand?: boolean | null
          qb_qty_on_hand?: number | null
          qb_reorder_point?: number | null
          qb_taxable?: boolean | null
          qb_sales_tax_included?: boolean | null
          qb_purchase_tax_included?: boolean | null
          qb_purchase_cost?: number | null
          qb_sync_token?: string | null
          qb_meta_data?: any | null
          last_quickbooks_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          price?: number
          quickbooks_service_id?: string | null
          // New QuickBooks-aligned fields
          qb_type?: string | null
          qb_income_account_ref?: string | null
          qb_expense_account_ref?: string | null
          qb_asset_account_ref?: string | null
          qb_sku?: string | null
          qb_track_qty_on_hand?: boolean | null
          qb_qty_on_hand?: number | null
          qb_reorder_point?: number | null
          qb_taxable?: boolean | null
          qb_sales_tax_included?: boolean | null
          qb_purchase_tax_included?: boolean | null
          qb_purchase_cost?: number | null
          qb_sync_token?: string | null
          qb_meta_data?: any | null
          last_quickbooks_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          user_id: string
          client_id: string
          assigned_to_type: 'Self' | 'Worker'
          assigned_to_id: string | null
          status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'
          schedule_date_time: string
          order_amount: number
          order_payment_status: string
          quickbooks_invoice_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          assigned_to_type: 'Self' | 'Worker'
          assigned_to_id?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'
          schedule_date_time: string
          order_amount: number
          order_payment_status?: string
          quickbooks_invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          assigned_to_type?: 'Self' | 'Worker'
          assigned_to_id?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'
          schedule_date_time?: string
          order_amount?: number
          order_payment_status?: string
          quickbooks_invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_order_services: {
        Row: {
          id: string
          work_order_id: string
          service_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          service_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          service_id?: string
          quantity?: number
          created_at?: string
        }
      }
      quickbooks_integrations: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          realm_id: string
          state: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          realm_id: string
          state?: string | null
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          realm_id?: string
          state?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      // New subscription-related tables
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'professional' | 'enterprise'
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'free' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'free' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month_year: string
          work_orders_count: number
          team_members_count: number
          api_calls_count: number
          storage_used_mb: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          work_orders_count?: number
          team_members_count?: number
          api_calls_count?: number
          storage_used_mb?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          work_orders_count?: number
          team_members_count?: number
          api_calls_count?: number
          storage_used_mb?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          custom_branding_enabled: boolean
          custom_logo_url: string | null
          custom_company_name: string | null
          custom_primary_color: string | null
          custom_secondary_color: string | null
          white_label_enabled: boolean
          custom_domain: string | null
          api_access_enabled: boolean
          api_key: string | null
          webhook_url: string | null
          advanced_automation_enabled: boolean
          auto_invoice_generation: boolean
          auto_payment_reminders: boolean
          auto_status_updates: boolean
          multi_location_enabled: boolean
          default_location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          custom_branding_enabled?: boolean
          custom_logo_url?: string | null
          custom_company_name?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          white_label_enabled?: boolean
          custom_domain?: string | null
          api_access_enabled?: boolean
          api_key?: string | null
          webhook_url?: string | null
          advanced_automation_enabled?: boolean
          auto_invoice_generation?: boolean
          auto_payment_reminders?: boolean
          auto_status_updates?: boolean
          multi_location_enabled?: boolean
          default_location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          custom_branding_enabled?: boolean
          custom_logo_url?: string | null
          custom_company_name?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          white_label_enabled?: boolean
          custom_domain?: string | null
          api_access_enabled?: boolean
          api_key?: string | null
          webhook_url?: string | null
          advanced_automation_enabled?: boolean
          auto_invoice_generation?: boolean
          auto_payment_reminders?: boolean
          auto_status_updates?: boolean
          multi_location_enabled?: boolean
          default_location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string
          phone: string | null
          email: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'revenue' | 'performance' | 'customer' | 'inventory' | 'custom'
          parameters: any | null
          schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual' | null
          last_generated: string | null
          next_generation: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'revenue' | 'performance' | 'customer' | 'inventory' | 'custom'
          parameters?: any | null
          schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual' | null
          last_generated?: string | null
          next_generation?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'revenue' | 'performance' | 'customer' | 'inventory' | 'custom'
          parameters?: any | null
          schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual' | null
          last_generated?: string | null
          next_generation?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          permissions: any
          last_used: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          permissions?: any
          last_used?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          permissions?: any
          last_used?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          events: string[]
          secret: string | null
          is_active: boolean
          last_triggered: string | null
          failure_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          events: string[]
          secret?: string | null
          is_active?: boolean
          last_triggered?: string | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          events?: string[]
          secret?: string | null
          is_active?: boolean
          last_triggered?: string | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      automation_rules: {
        Row: {
          id: string
          user_id: string
          name: string
          trigger_type: 'work_order_created' | 'work_order_completed' | 'payment_received' | 'client_created' | 'schedule_reminder'
          conditions: any | null
          actions: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          trigger_type: 'work_order_created' | 'work_order_completed' | 'payment_received' | 'client_created' | 'schedule_reminder'
          conditions?: any | null
          actions: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          trigger_type?: 'work_order_created' | 'work_order_completed' | 'payment_received' | 'client_created' | 'schedule_reminder'
          conditions?: any | null
          actions?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Worker = Database['public']['Tables']['workers']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type WorkOrder = Database['public']['Tables']['work_orders']['Row']
export type WorkOrderService = Database['public']['Tables']['work_order_services']['Row']
export type QuickBooksIntegration = Database['public']['Tables']['quickbooks_integrations']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type AutomationRule = Database['public']['Tables']['automation_rules']['Row'] 