'use client'

import { formatCurrency } from '@/lib/utils'

interface TopService {
  name: string
  usage: number
  revenue: number
}

interface TopServicesTableProps {
  services: TopService[]
}

export function TopServicesTable({ services }: TopServicesTableProps) {
  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{index + 1}</span>
            </div>
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">{service.usage} times used</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(service.revenue)}</p>
          </div>
        </div>
      ))}
      {services.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No service data available
        </div>
      )}
    </div>
  )
} 