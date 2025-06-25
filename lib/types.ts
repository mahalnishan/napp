export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Client {
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

export interface Service {
  id: string
  user_id: string
  name: string
  description: string | null
  price: number
  quickbooks_service_id?: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: string
  user_id: string
  client_id: string
  assigned_to_type: 'Self' | 'Worker'
  assigned_to_id?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Archived'
  schedule_date_time: string
  order_amount: number
  order_payment_status: 'Unpaid' | 'Pending Invoice' | 'Paid'
  quickbooks_invoice_id?: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderService {
  id: string
  work_order_id: string
  service_id: string
  quantity: number
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface ClientTag {
  id: string
  client_id: string
  tag_id: string
  created_at: string
}

export interface QuickBooksIntegration {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  realm_id: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalOrders: number
  totalClients: number
  totalServices: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

export interface WorkOrderWithDetails extends WorkOrder {
  client: Client
  worker?: Worker
  services: (WorkOrderService & { service: Service })[]
  tags: Tag[]
} 