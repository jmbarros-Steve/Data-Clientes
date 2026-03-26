import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  tooltipText?: string
  metricKey?: string
}

export function MetricCard({ title, value, icon, subtitle, trend, tooltipText, metricKey }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            {icon}
            <span>{title}</span>
            {tooltipText && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link to={metricKey ? `/metrics#${metricKey}` : '/metrics'}>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary cursor-help" />
                    </Link>
                  }
                />
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className={`text-sm mt-1 ${trendColor}`}>{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
