'use client'

import { formatCurrency } from '@/lib/utils'

interface TopClient {
  name: string
  revenue: number
  orders: number
}

interface TopClientsTableProps {
  clients: TopClient[]
}

export function TopClientsTable({ clients }: TopClientsTableProps) {
  return (
    <div className="space-y-3">
      {clients.map((client, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{index + 1}</span>
            </div>
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-muted-foreground">{client.orders} orders</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(client.revenue)}</p>
          </div>
        </div>
      ))}
      {clients.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No client data available
        </div>
      )}
    </div>
  )
} 