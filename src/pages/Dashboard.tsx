import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useBudgets } from '@/hooks/useBudgets'
import { useMetricTargets } from '@/hooks/useMetricTargets'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { DatePresetSelector } from '@/components/dashboard/DatePresetSelector'
import { SpendDonutChart } from '@/components/dashboard/SpendDonutChart'
import { TopCampaignsBarChart } from '@/components/dashboard/TopCampaignsBarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  DollarSign, Eye, MousePointerClick, Percent, Target, TrendingUp, Loader2, Layers,
} from 'lucide-react'

export default function Dashboard() {
  const { clientId } = useAuth()
  const { campaigns, loading, totals, selectedAccount, datePreset, setDatePreset } = useCampaigns(clientId)
  const { getAccountBudget } = useBudgets(selectedAccount)
  const { getTarget } = useMetricTargets(selectedAccount)

  const accountBudget = getAccountBudget()

  // Generate trend data from campaigns
  const trendData = campaigns
    .filter(c => c.date_start)
    .map(c => ({
      date: new Date(c.date_start).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
      value: c.spend || 0,
    }))
    .slice(0, 30)

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando datos...</span>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* ═══ Header + Date Preset Selector ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resumen General</h1>
            <p className="text-muted-foreground text-sm">Vista general del rendimiento de tus campañas</p>
          </div>
          <DatePresetSelector value={datePreset} onChange={setDatePreset} />
        </div>

        {/* Budget bar */}
        {accountBudget && (
          <Card>
            <CardContent className="p-6">
              <BudgetBar spent={totals.spend} budget={accountBudget.budget_amount} label="Presupuesto General" />
            </CardContent>
          </Card>
        )}

        {/* ═══ 8 Bold Metric Cards — 4x2 grid ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            title="Gasto Total"
            value={`$${totals.spend.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
            icon={<DollarSign className="h-4 w-4" />}
            metricKey="spend"
            tooltipText="Total invertido en anuncios"
            target={getTarget('spend')}
          />
          <MetricCard
            title="Impresiones"
            value={totals.impressions.toLocaleString()}
            icon={<Eye className="h-4 w-4" />}
            metricKey="impressions"
            tooltipText="Veces que se mostraron tus anuncios"
            target={getTarget('impressions')}
          />
          <MetricCard
            title="Clicks"
            value={totals.clicks.toLocaleString()}
            icon={<MousePointerClick className="h-4 w-4" />}
            metricKey="clicks"
            tooltipText="Clicks en tus anuncios"
            target={getTarget('clicks')}
          />
          <MetricCard
            title="CTR"
            value={`${totals.ctr.toFixed(2)}%`}
            icon={<Percent className="h-4 w-4" />}
            metricKey="ctr"
            tooltipText="Porcentaje de personas que hicieron click"
            target={getTarget('ctr')}
          />
          <MetricCard
            title="CPC"
            value={`$${Math.round(totals.cpc).toLocaleString('es-CL')}`}
            icon={<MousePointerClick className="h-4 w-4" />}
            metricKey="cpc"
            tooltipText="Costo promedio por cada click"
            target={getTarget('cpc')}
          />
          <MetricCard
            title="CPM"
            value={`$${Math.round(totals.cpm).toLocaleString('es-CL')}`}
            icon={<Layers className="h-4 w-4" />}
            metricKey="cpm"
            tooltipText="Costo por cada 1.000 impresiones"
            target={getTarget('cpm')}
          />
          <MetricCard
            title="Conversiones"
            value={totals.conversions.toLocaleString()}
            icon={<Target className="h-4 w-4" />}
            metricKey="conversions"
            tooltipText="Acciones valiosas completadas"
            target={getTarget('conversions')}
          />
          <MetricCard
            title="ROAS"
            value={`${totals.roas.toFixed(2)}x`}
            icon={<TrendingUp className="h-4 w-4" />}
            metricKey="roas"
            tooltipText="Retorno por cada $1 invertido"
            target={getTarget('roas')}
          />
        </div>

        {/* ═══ Donut + Bar Charts side by side ═══ */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendDonutChart
              campaigns={campaigns.map(c => ({ campaign_name: c.campaign_name, spend: c.spend }))}
            />
            <TopCampaignsBarChart
              campaigns={campaigns.map(c => ({ campaign_name: c.campaign_name, spend: c.spend }))}
            />
          </div>
        )}

        {/* ═══ Trend Area Chart with gradient ═══ */}
        {trendData.length > 0 && (
          <TrendChart
            title="Tendencia de Gasto"
            data={trendData}
            valuePrefix="$"
            targetValue={getTarget('spend')}
          />
        )}

        {/* ═══ Active Campaigns Table ═══ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Campañas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Campaña</th>
                      <th className="text-right py-2 px-2 font-medium">Gasto</th>
                      <th className="text-right py-2 px-2 font-medium">CPC</th>
                      <th className="text-right py-2 px-2 font-medium">CPM</th>
                      <th className="text-right py-2 px-2 font-medium">CTR</th>
                      <th className="text-right py-2 px-2 font-medium">ROAS</th>
                      <th className="text-right py-2 pl-2 font-medium">Conv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns
                      .filter(c => c.status?.toUpperCase() === 'ACTIVE')
                      .slice(0, 5)
                      .map(c => (
                        <tr key={c.campaign_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4">
                            <Link to={`/campaigns/${c.campaign_id}`} className="font-medium text-primary hover:underline truncate max-w-[200px] block">
                              {c.campaign_name}
                            </Link>
                          </td>
                          <td className="text-right py-2.5 px-2 tabular-nums">${c.spend?.toLocaleString('es-CL')}</td>
                          <td className="text-right py-2.5 px-2 tabular-nums">${c.cpc?.toFixed(0)}</td>
                          <td className="text-right py-2.5 px-2 tabular-nums">${c.cpm?.toFixed(0)}</td>
                          <td className="text-right py-2.5 px-2 tabular-nums">{c.ctr?.toFixed(2)}%</td>
                          <td className={`text-right py-2.5 px-2 tabular-nums font-medium ${c.roas >= 3 ? 'text-green-600' : c.roas >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {c.roas?.toFixed(2)}x
                          </td>
                          <td className="text-right py-2.5 pl-2 tabular-nums">{c.conversions}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay campañas activas</p>
            )}
            {campaigns.length > 0 && (
              <Link to="/campaigns">
                <p className="text-center text-primary text-sm mt-4 hover:underline">
                  Ver todas las campañas →
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}
