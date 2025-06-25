'use client'

interface AnalyticsChartProps {
  data: Record<string, number>
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([status, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        const color = colors[index % colors.length]
        
        return (
          <div key={status} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{status}</span>
              <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
} 