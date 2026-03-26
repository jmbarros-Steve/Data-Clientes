import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useBudgets } from '@/hooks/useBudgets'
import { useMetricTargets } from '@/hooks/useMetricTargets'
import { fetchAdSets, fetchAds, type AdSetInsight, type AdInsight } from '@/lib/meta-api'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, MousePointerClick, Target, TrendingUp, Loader2, Layers, Percent } from 'lucide-react'

export default function CampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { clientId } = useAuth()
  const { campaigns, selectedAccount } = useCampaigns(clientId)
  const { getBudgetForCampaign, getBudgetForAdSet } = useBudgets(selectedAccount)
  const { getTarget } = useMetricTargets(selectedAccount)

  const [adSets, setAdSets] = useState<AdSetInsight[]>([])
  const [ads, setAds] = useState<Record<string, AdInsight[]>>({})
  const [loadingAdSets, setLoadingAdSets] = useState(false)
  const [expandedAdSet, setExpandedAdSet] = useState<string | null>(null)

  const campaign = campaigns.find(c => c.campaign_id === campaignId)
  const budget = campaignId ? getBudgetForCampaign(campaignId) : null

  useEffect(() => {
    if (!selectedAccount || !campaignId) return
    setLoadingAdSets(true)
    fetchAdSets(selectedAccount, campaignId)
      .then(setAdSets)
      .catch(console.error)
      .finally(() => setLoadingAdSets(false))
  }, [selectedAccount, campaignId])

  async function loadAds(adsetId: string) {
    if (ads[adsetId]) {
      setExpandedAdSet(expandedAdSet === adsetId ? null : adsetId)
      return
    }
    if (!selectedAccount) return
    try {
      const data = await fetchAds(selectedAccount, adsetId)
      setAds(prev => ({ ...prev, [adsetId]: data }))
      setExpandedAdSet(adsetId)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a campañas
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{campaign?.campaign_name ?? 'Campaña'}</h1>
          {campaign?.status && (
            <Badge className={campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}>
              {campaign.status === 'ACTIVE' ? 'Activa' : campaign.status}
            </Badge>
          )}
        </div>

        {budget && campaign && (
          <Card>
            <CardContent className="p-6">
              <BudgetBar spent={campaign.spend} budget={budget.budget_amount} label="Presupuesto de Campaña" />
            </CardContent>
          </Card>
        )}

        {/* 6 Metric Cards: Gasto, CPC, CPM, Clicks, Conversiones, ROAS */}
        {campaign && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard title="Gasto" value={`$${campaign.spend?.toLocaleString('es-CL')}`} icon={<DollarSign className="h-4 w-4" />} metricKey="spend" target={getTarget('spend')} />
            <MetricCard title="CPC" value={`$${campaign.cpc?.toFixed(0)}`} icon={<MousePointerClick className="h-4 w-4" />} metricKey="cpc" target={getTarget('cpc')} tooltipText="Costo por click" />
            <MetricCard title="CPM" value={`$${campaign.cpm?.toFixed(0)}`} icon={<Layers className="h-4 w-4" />} metricKey="cpm" target={getTarget('cpm')} tooltipText="Costo por 1.000 impresiones" />
            <MetricCard title="Clicks" value={campaign.clicks?.toLocaleString()} icon={<MousePointerClick className="h-4 w-4" />} metricKey="clicks" target={getTarget('clicks')} />
            <MetricCard title="Conversiones" value={campaign.conversions?.toLocaleString()} icon={<Target className="h-4 w-4" />} metricKey="conversions" target={getTarget('conversions')} />
            <MetricCard title="ROAS" value={`${campaign.roas?.toFixed(2)}x`} icon={<TrendingUp className="h-4 w-4" />} metricKey="roas" target={getTarget('roas')} />
          </div>
        )}

        {/* Ad Sets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Conjuntos de Anuncios</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdSets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Presupuesto</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">CPC</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adSets.map(adset => {
                      const adsetBudget = getBudgetForAdSet(adset.adset_id)
                      return (
                        <>
                          <TableRow
                            key={adset.adset_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => loadAds(adset.adset_id)}
                          >
                            <TableCell className="font-medium">{adset.adset_name}</TableCell>
                            <TableCell>
                              <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {adset.status === 'ACTIVE' ? 'Activo' : adset.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {adsetBudget ? <BudgetBar spent={adset.spend} budget={adsetBudget.budget_amount} compact /> : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">${adset.spend?.toLocaleString('es-CL')}</TableCell>
                            <TableCell className="text-right tabular-nums">${adset.cpc?.toFixed(0)}</TableCell>
                            <TableCell className="text-right tabular-nums">{adset.clicks?.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{adset.ctr?.toFixed(2)}%</TableCell>
                            <TableCell className="text-right tabular-nums">{adset.conversions}</TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${adset.roas >= 3 ? 'text-green-600' : adset.roas >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {adset.roas?.toFixed(2)}x
                            </TableCell>
                          </TableRow>
                          {expandedAdSet === adset.adset_id && ads[adset.adset_id]?.map(ad => (
                            <TableRow key={ad.ad_id} className="bg-muted/30">
                              <TableCell className="pl-8 text-sm text-muted-foreground">
                                {ad.creative_thumbnail_url && (
                                  <img src={ad.creative_thumbnail_url} alt="" className="inline h-6 w-6 rounded mr-2 object-cover" />
                                )}
                                {ad.ad_name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{ad.status}</Badge>
                              </TableCell>
                              <TableCell />
                              <TableCell className="text-right text-sm tabular-nums">${ad.spend?.toLocaleString('es-CL')}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">${ad.cpc?.toFixed(0)}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{ad.clicks?.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{ad.ctr?.toFixed(2)}%</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{ad.conversions}</TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                        </>
                      )
                    })}
                    {adSets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No hay conjuntos de anuncios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}
