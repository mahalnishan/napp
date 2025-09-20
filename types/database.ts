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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          price?: number
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
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type AutomationRule = Database['public']['Tables']['automation_rules']['Row']