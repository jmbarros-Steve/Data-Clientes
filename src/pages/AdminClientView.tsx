import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { fetchCampaigns, fetchAdSets, fetchAds, type CampaignInsight, type AdSetInsight, type AdInsight } from '@/lib/meta-api'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, DollarSign, Eye, MousePointerClick, Percent, Target, TrendingUp, Loader2, AlertCircle,
  ChevronRight, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Budget } from '@/hooks/useBudgets'

interface Client {
  id: string
  name: string
  company: string | null
  logo_url: string | null
  email: string | null
}

interface MetaAccount {
  id: string
  meta_account_id: string
  meta_account_name: string | null
  access_token: string
}

function getStatusBadge(status: string) {
  const s = status?.toUpperCase()
  if (s === 'ACTIVE') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>
  if (s === 'PAUSED') return <Badge variant="secondary">Pausada</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export default function AdminClientView() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expandable state
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const [adSets, setAdSets] = useState<Record<string, AdSetInsight[]>>({})
  const [ads, setAds] = useState<Record<string, AdInsight[]>>({})
  const [expandedAdSet, setExpandedAdSet] = useState<string | null>(null)
  const [loadingAdSets, setLoadingAdSets] = useState<string | null>(null)
  const [loadingAds, setLoadingAds] = useState<string | null>(null)

  // Track which meta_account_id each campaign belongs to
  const [campaignAccountMap, setCampaignAccountMap] = useState<Record<string, string>>({})
  const [showAllCampaigns, setShowAllCampaigns] = useState(false)

  useEffect(() => {
    if (!clientId) return
    loadClientData()
  }, [clientId])

  async function loadClientData() {
    setLoading(true)
    setError(null)

    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, company, logo_url, email')
        .eq('id', clientId)
        .single()

      if (!clientData) {
        setError('Cliente no encontrado')
        setLoading(false)
        return
      }
      setClient(clientData)

      const { data: accounts } = await supabase
        .from('meta_accounts')
        .select('id, meta_account_id, meta_account_name, access_token')
        .eq('client_id', clientId)

      setMetaAccounts(accounts ?? [])

      if (!accounts || accounts.length === 0) {
        setLoading(false)
        return
      }

      // Load budgets
      const accountIds = accounts.map(a => a.meta_account_id)
      const { data: budgetData } = await supabase
        .from('campaign_budgets')
        .select('*')
        .in('meta_account_id', accountIds)

      setBudgets(budgetData ?? [])

      // Fetch campaigns for each account
      const allCampaigns: CampaignInsight[] = []
      const accountMap: Record<string, string> = {}

      for (const account of accounts) {
        try {
          const data = await fetchCampaigns(account.meta_account_id)
          for (const c of data) {
            accountMap[c.campaign_id] = account.meta_account_id
          }
          allCampaigns.push(...data)
        } catch (err) {
          console.error(`Error fetching campaigns for ${account.meta_account_id}:`, err)
        }
      }

      setCampaigns(allCampaigns)
      setCampaignAccountMap(accountMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  async function toggleCampaign(campaignId: string) {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null)
      setExpandedAdSet(null)
      return
    }
    setExpandedCampaign(campaignId)
    setExpandedAdSet(null)

    if (adSets[campaignId]) return // already loaded

    const accountId = campaignAccountMap[campaignId]
    if (!accountId) return

    setLoadingAdSets(campaignId)
    try {
      const data = await fetchAdSets(accountId, campaignId)
      setAdSets(prev => ({ ...prev, [campaignId]: data }))
    } catch (err) {
      console.error('Error fetching ad sets:', err)
    } finally {
      setLoadingAdSets(null)
    }
  }

  async function toggleAdSet(adsetId: string) {
    if (expandedAdSet === adsetId) {
      setExpandedAdSet(null)
      return
    }
    setExpandedAdSet(adsetId)

    if (ads[adsetId]) return

    const campaignId = expandedCampaign
    if (!campaignId) return
    const accountId = campaignAccountMap[campaignId]
    if (!accountId) return

    setLoadingAds(adsetId)
    try {
      const data = await fetchAds(accountId, adsetId)
      setAds(prev => ({ ...prev, [adsetId]: data }))
    } catch (err) {
      console.error('Error fetching ads:', err)
    } finally {
      setLoadingAds(null)
    }
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + (c.spend || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      conversions: acc.conversions + (c.conversions || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  )
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
  const roas = totals.spend > 0 ? campaigns.reduce((sum, c) => sum + (c.roas || 0) * (c.spend || 0), 0) / totals.spend : 0

  const accountBudget = budgets.find(b => !b.campaign_id && !b.adset_id)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando datos del cliente...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            {client?.logo_url ? (
              <img src={client.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                {client?.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{client?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client?.company && `${client.company} · `}{client?.email}
              </p>
            </div>
          </div>
          <Badge variant="outline">{metaAccounts.length} cuenta{metaAccounts.length !== 1 ? 's' : ''} Meta</Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {metaAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Este cliente no tiene cuentas de Meta asignadas.
              <Link to="/admin" className="block mt-2 text-primary hover:underline">
                Asignar una cuenta
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Budget bar */}
            {accountBudget && (
              <Card>
                <CardContent className="p-6">
                  <BudgetBar spent={totals.spend} budget={accountBudget.budget_amount} label="Presupuesto General" />
                </CardContent>
              </Card>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <MetricCard title="Gasto Total" value={`$${totals.spend.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`} icon={<DollarSign className="h-4 w-4" />} />
              <MetricCard title="Impresiones" value={totals.impressions.toLocaleString()} icon={<Eye className="h-4 w-4" />} />
              <MetricCard title="Clicks" value={totals.clicks.toLocaleString()} icon={<MousePointerClick className="h-4 w-4" />} />
              <MetricCard title="CTR" value={`${ctr.toFixed(2)}%`} icon={<Percent className="h-4 w-4" />} />
              <MetricCard title="CPC" value={`$${cpc.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<MousePointerClick className="h-4 w-4" />} />
              <MetricCard title="CPM" value={`$${cpm.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<Eye className="h-4 w-4" />} />
              <MetricCard title="Conversiones" value={totals.conversions.toLocaleString()} icon={<Target className="h-4 w-4" />} />
              <MetricCard title="ROAS" value={`${roas.toFixed(2)}x`} icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            {/* Campaigns table with expandable ad sets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campañas ({campaigns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Campaña</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Gasto</TableHead>
                        <TableHead className="text-right">Impresiones</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                        <TableHead className="text-right">CPM</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(showAllCampaigns ? campaigns : campaigns.slice(0, 5)).map(campaign => {
                        const budget = budgets.find(b => b.campaign_id === campaign.campaign_id && !b.adset_id)
                        const isExpanded = expandedCampaign === campaign.campaign_id
                        const campaignAdSets = adSets[campaign.campaign_id] || []

                        return (
                          <CampaignRows
                            key={campaign.campaign_id}
                            campaign={campaign}
                            budget={budget}
                            isExpanded={isExpanded}
                            onToggle={() => toggleCampaign(campaign.campaign_id)}
                            loadingAdSets={loadingAdSets === campaign.campaign_id}
                            campaignAdSets={campaignAdSets}
                            expandedAdSet={expandedAdSet}
                            onToggleAdSet={toggleAdSet}
                            loadingAds={loadingAds}
                            ads={ads}
                            budgets={budgets}
                          />
                        )
                      })}
                      {campaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                            No se encontraron campañas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {campaigns.length > 5 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCampaigns(!showAllCampaigns)}
                    >
                      {showAllCampaigns ? 'Mostrar menos' : `Ver más (${campaigns.length - 5} campañas más)`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

// Extracted component to avoid fragments-in-map issues
function CampaignRows({
  campaign, budget, isExpanded, onToggle, loadingAdSets,
  campaignAdSets, expandedAdSet, onToggleAdSet, loadingAds, ads, budgets,
}: {
  campaign: CampaignInsight
  budget: Budget | undefined
  isExpanded: boolean
  onToggle: () => void
  loadingAdSets: boolean
  campaignAdSets: AdSetInsight[]
  expandedAdSet: string | null
  onToggleAdSet: (id: string) => void
  loadingAds: string | null
  ads: Record<string, AdInsight[]>
  budgets: Budget[]
}) {
  return (
    <>
      {/* Campaign row */}
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="w-8 pr-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {campaign.campaign_name || `Campaña ${campaign.campaign_id}`}
        </TableCell>
        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
        <TableCell className="text-right">
          <div className="font-medium">${campaign.spend?.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
          {budget && <BudgetBar spent={campaign.spend} budget={budget.budget_amount} compact />}
        </TableCell>
        <TableCell className="text-right">{campaign.impressions?.toLocaleString()}</TableCell>
        <TableCell className="text-right">{campaign.clicks?.toLocaleString()}</TableCell>
        <TableCell className="text-right">{campaign.ctr?.toFixed(2)}%</TableCell>
        <TableCell className="text-right">${campaign.cpc?.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
        <TableCell className="text-right">${campaign.cpm?.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
        <TableCell className="text-right">{campaign.conversions?.toLocaleString()}</TableCell>
        <TableCell className="text-right font-medium">{campaign.roas?.toFixed(2)}x</TableCell>
      </TableRow>

      {/* Expanded ad sets */}
      {isExpanded && (
        <>
          {loadingAdSets ? (
            <TableRow>
              <TableCell colSpan={11} className="bg-muted/20">
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Cargando conjuntos de anuncios...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : campaignAdSets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="bg-muted/20 text-center text-sm text-muted-foreground py-4">
                Sin conjuntos de anuncios
              </TableCell>
            </TableRow>
          ) : (
            campaignAdSets.map(adset => {
              const adsetBudget = budgets.find(b => b.adset_id === adset.adset_id)
              const isAdSetExpanded = expandedAdSet === adset.adset_id
              const adsetAds = ads[adset.adset_id] || []

              return (
                <AdSetRows
                  key={adset.adset_id}
                  adset={adset}
                  adsetBudget={adsetBudget}
                  isExpanded={isAdSetExpanded}
                  onToggle={() => onToggleAdSet(adset.adset_id)}
                  loadingAds={loadingAds === adset.adset_id}
                  adsetAds={adsetAds}
                />
              )
            })
          )}
        </>
      )}
    </>
  )
}

function AdSetRows({
  adset, adsetBudget, isExpanded, onToggle, loadingAds, adsetAds,
}: {
  adset: AdSetInsight
  adsetBudget: Budget | undefined
  isExpanded: boolean
  onToggle: () => void
  loadingAds: boolean
  adsetAds: AdInsight[]
}) {
  return (
    <>
      {/* Ad set row */}
      <TableRow
        className="cursor-pointer hover:bg-blue-50/50 bg-muted/20"
        onClick={onToggle}
      >
        <TableCell className="w-8 pr-0 pl-6">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-sm">
          <span className="text-muted-foreground mr-1">↳</span>
          {adset.adset_name}
        </TableCell>
        <TableCell>
          <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'} className={`text-xs ${adset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}`}>
            {adset.status === 'ACTIVE' ? 'Activo' : adset.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right text-sm">
          <div>${adset.spend?.toLocaleString('es-CL')}</div>
          {adsetBudget && <BudgetBar spent={adset.spend} budget={adsetBudget.budget_amount} compact />}
        </TableCell>
        <TableCell className="text-right text-sm">{adset.impressions?.toLocaleString()}</TableCell>
        <TableCell className="text-right text-sm">{adset.clicks?.toLocaleString()}</TableCell>
        <TableCell className="text-right text-sm">{adset.ctr?.toFixed(2)}%</TableCell>
        <TableCell className="text-right text-sm">${adset.cpc?.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
        <TableCell className="text-right text-sm">—</TableCell>
        <TableCell className="text-right text-sm">{adset.conversions}</TableCell>
        <TableCell className="text-right text-sm">{adset.roas?.toFixed(2)}x</TableCell>
      </TableRow>

      {/* Expanded ads */}
      {isExpanded && (
        <>
          {loadingAds ? (
            <TableRow>
              <TableCell colSpan={11} className="bg-muted/10">
                <div className="flex items-center justify-center py-3 gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Cargando anuncios...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : adsetAds.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="bg-muted/10 text-center text-xs text-muted-foreground py-3">
                Sin anuncios
              </TableCell>
            </TableRow>
          ) : (
            adsetAds.map(ad => (
              <TableRow key={ad.ad_id} className="bg-muted/10">
                <TableCell className="w-8" />
                <TableCell className="pl-10 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {ad.creative_thumbnail_url && (
                      <img src={ad.creative_thumbnail_url} alt="" className="h-6 w-6 rounded object-cover" />
                    )}
                    <span className="text-muted-foreground mr-1">↳</span>
                    {ad.ad_name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {ad.status === 'ACTIVE' ? 'Activo' : ad.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs">${ad.spend?.toLocaleString('es-CL')}</TableCell>
                <TableCell className="text-right text-xs">{ad.impressions?.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs">{ad.clicks?.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs">{ad.ctr?.toFixed(2)}%</TableCell>
                <TableCell className="text-right text-xs">${ad.cpc?.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                <TableCell className="text-right text-xs">—</TableCell>
                <TableCell className="text-right text-xs">{ad.conversions}</TableCell>
                <TableCell />
              </TableRow>
            ))
          )}
        </>
      )}
    </>
  )
}
