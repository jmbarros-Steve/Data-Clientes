import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TOOLTIP_STYLE } from '@/lib/metric-utils'

interface DataPoint {
  date: string
  value: number
}

interface TrendChartProps {
  title: string
  data: DataPoint[]
  color?: string
  valuePrefix?: string
  valueSuffix?: string
  targetValue?: number
}

export function TrendChart({ title, data, color = '#1E3A7B', valuePrefix = '', valueSuffix = '', targetValue }: TrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v: number) => `${valuePrefix}${v.toLocaleString()}${valueSuffix}`}
                width={70}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${valuePrefix}${Number(v).toLocaleString()}${valueSuffix}`, title]}
              />
              {targetValue && (
                <ReferenceLine
                  y={targetValue}
                  stroke="#EF4444"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: `Meta: ${valuePrefix}${targetValue.toLocaleString()}${valueSuffix}`, position: 'insideTopRight', fontSize: 10, fill: '#EF4444' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
