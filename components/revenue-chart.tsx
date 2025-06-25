'use client'

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const height = 200

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-[200px] space-x-2">
        {data.map((item, index) => {
          const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * height : 0
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                style={{ height: `${barHeight}px` }}
              />
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {item.month}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${Math.min(...data.map(d => d.revenue)).toFixed(0)}</span>
        <span>${Math.max(...data.map(d => d.revenue)).toFixed(0)}</span>
      </div>
    </div>
  )
} 