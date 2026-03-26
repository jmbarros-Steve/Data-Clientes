import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  type MetricKey,
  METRICS,
  getTargetStatus,
  getTargetColor,
  getTargetBorderColor,
  getTargetBgColor,
  getProgressPercent,
  type TargetStatus,
} from '@/lib/metric-utils'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  tooltipText?: string
  metricKey?: string
  target?: number
}

export function MetricCard({ title, value, icon, subtitle, trend, tooltipText, metricKey, target }: MetricCardProps) {
  // Try to use the bold design if we have a valid metricKey
  const def = metricKey && metricKey in METRICS ? METRICS[metricKey as MetricKey] : null

  if (def) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0
    const status: TargetStatus = target ? getTargetStatus(numValue, target, def.higherIsBetter) : 'none'
    const borderColor = getTargetBorderColor(status)
    const progress = target ? getProgressPercent(numValue, target, def.higherIsBetter) : 0

    return (
      <Card className={cn(
        'border-l-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-gradient-to-br to-transparent',
        borderColor,
        def.bgGradient,
      )}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              {title}
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
            </span>
            <div className={cn('p-2 rounded-xl', status === 'none' ? 'bg-muted' : `${getTargetBgColor(status)}/10`)}>
              <span className={cn(status === 'none' ? 'text-muted-foreground' : getTargetColor(status))}>
                {icon}
              </span>
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          {target !== undefined && target > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={cn('w-2 h-2 rounded-full', getTargetBgColor(status))} />
                <span className={cn('font-medium', getTargetColor(status))}>
                  Meta: {def.format(target)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getTargetBgColor(status))}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {subtitle && <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>}
        </CardContent>
      </Card>
    )
  }

  // Fallback: original simple design for cards without a known metricKey
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
          {subtitle && <p className={`text-sm mt-1 ${trendColor}`}>{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
