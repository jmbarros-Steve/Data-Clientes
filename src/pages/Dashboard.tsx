import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useBudgets } from '@/hooks/useBudgets'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  DollarSign, Eye, MousePointerClick, Percent, Target, TrendingUp, Loader2,
} from 'lucide-react'

export default function Dashboard() {
  const { clientId } = useAuth()
  const { campaigns, loading, totals, selectedAccount } = useCampaigns(clientId)
  const { getAccountBudget } = useBudgets(selectedAccount)

  const accountBudget = getAccountBudget()

  // Generate trend data from campaigns (grouped by date if available)
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumen General</h1>
          <p className="text-muted-foreground">Vista general del rendimiento de tus campañas</p>
        </div>

        {/* Budget bar */}
        {accountBudget && (
          <Card>
            <CardContent className="p-6">
              <BudgetBar
                spent={totals.spend}
                budget={accountBudget.budget_amount}
                label="Presupuesto General"
              />
            </CardContent>
          </Card>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Gasto Total"
            value={`$${totals.spend.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
            icon={<DollarSign className="h-4 w-4" />}
            metricKey="spend"
            tooltipText="Total invertido en anuncios"
          />
          <MetricCard
            title="Impresiones"
            value={totals.impressions.toLocaleString()}
            icon={<Eye className="h-4 w-4" />}
            metricKey="impressions"
            tooltipText="Veces que se mostraron tus anuncios"
          />
          <MetricCard
            title="Clicks"
            value={totals.clicks.toLocaleString()}
            icon={<MousePointerClick className="h-4 w-4" />}
            metricKey="clicks"
            tooltipText="Clicks en tus anuncios"
          />
          <MetricCard
            title="CTR"
            value={`${totals.ctr.toFixed(2)}%`}
            icon={<Percent className="h-4 w-4" />}
            metricKey="ctr"
            tooltipText="Porcentaje de personas que hicieron click"
          />
          <MetricCard
            title="Conversiones"
            value={totals.conversions.toLocaleString()}
            icon={<Target className="h-4 w-4" />}
            metricKey="conversions"
            tooltipText="Acciones valiosas completadas"
          />
          <MetricCard
            title="ROAS"
            value={`${totals.roas.toFixed(2)}x`}
            icon={<TrendingUp className="h-4 w-4" />}
            metricKey="roas"
            tooltipText="Retorno por cada $1 invertido"
          />
        </div>

        {/* Trend chart */}
        {trendData.length > 0 && (
          <TrendChart
            title="Tendencia de Gasto"
            data={trendData}
            valuePrefix="$"
          />
        )}

        {/* Active campaigns quick list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campañas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns
                .filter(c => c.status?.toUpperCase() === 'ACTIVE')
                .slice(0, 5)
                .map(c => (
                  <Link
                    key={c.campaign_id}
                    to={`/campaigns/${c.campaign_id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{c.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.clicks.toLocaleString()} clicks &middot; {c.conversions} conv.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${c.spend.toLocaleString('es-CL')}</p>
                      <Badge variant="outline" className="text-xs">
                        {c.roas.toFixed(1)}x ROAS
                      </Badge>
                    </div>
                  </Link>
                ))}
              {campaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay campañas activas</p>
              )}
            </div>
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
