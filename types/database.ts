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
          order_payment_status: 'Unpaid' | 'Pending Invoice' | 'Paid'
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
          order_payment_status?: 'Unpaid' | 'Pending Invoice' | 'Paid'
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
          order_payment_status?: 'Unpaid' | 'Pending Invoice' | 'Paid'
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
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      client_tags: {
        Row: {
          id: string
          client_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          tag_id?: string
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
          expires_at?: string
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
export type Tag = Database['public']['Tables']['tags']['Row']
export type ClientTag = Database['public']['Tables']['client_tags']['Row']
export type QuickBooksIntegration = Database['public']['Tables']['quickbooks_integrations']['Row'] 