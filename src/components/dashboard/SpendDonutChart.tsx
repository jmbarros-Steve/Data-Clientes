import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DONUT_COLORS, TOOLTIP_STYLE } from '@/lib/metric-utils'

interface SpendDonutChartProps {
  campaigns: { campaign_name: string; spend: number }[]
}

export function SpendDonutChart({ campaigns }: SpendDonutChartProps) {
  const { chartData, totalSpend } = useMemo(() => {
    const sorted = [...campaigns].sort((a, b) => b.spend - a.spend)
    const top6 = sorted.slice(0, 6)
    const rest = sorted.slice(6)
    const restTotal = rest.reduce((sum, c) => sum + c.spend, 0)

    const data = top6.map((c) => ({
      name: c.campaign_name.length > 25 ? c.campaign_name.slice(0, 22) + '...' : c.campaign_name,
      value: c.spend,
    }))
    if (restTotal > 0) data.push({ name: 'Otros', value: restTotal })

    return { chartData: data, totalSpend: data.reduce((s, d) => s + d.value, 0) }
  }, [campaigns])

  if (chartData.length === 0) return null

  const fmt = (v: number) => `$${Math.round(v).toLocaleString('es-CL')}`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Distribución de Gasto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                {chartData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [fmt(Number(value)), 'Gasto']} contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{fmt(totalSpend)}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="truncate text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
