import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { fetchCampaigns, type CampaignInsight } from '@/lib/meta-api'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, DollarSign, Eye, MousePointerClick, Percent, Target, TrendingUp, Loader2, AlertCircle,
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

export default function AdminClientView() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    loadClientData()
  }, [clientId])

  async function loadClientData() {
    setLoading(true)
    setError(null)

    try {
      // Load client info
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

      // Load meta accounts
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
      for (const account of accounts) {
        try {
          const data = await fetchCampaigns(account.meta_account_id)
          allCampaigns.push(...data)
        } catch (err) {
          console.error(`Error fetching campaigns for ${account.meta_account_id}:`, err)
        }
      }

      setCampaigns(allCampaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard title="Gasto Total" value={`$${totals.spend.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`} icon={<DollarSign className="h-4 w-4" />} />
              <MetricCard title="Impresiones" value={totals.impressions.toLocaleString()} icon={<Eye className="h-4 w-4" />} />
              <MetricCard title="Clicks" value={totals.clicks.toLocaleString()} icon={<MousePointerClick className="h-4 w-4" />} />
              <MetricCard title="CTR" value={`${ctr.toFixed(2)}%`} icon={<Percent className="h-4 w-4" />} />
              <MetricCard title="Conversiones" value={totals.conversions.toLocaleString()} icon={<Target className="h-4 w-4" />} />
              <MetricCard title="ROAS" value={`${roas.toFixed(2)}x`} icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            {/* Campaigns table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campañas ({campaigns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignTable campaigns={campaigns} budgets={budgets} />
              </CardContent>
            </Card>

            {campaigns.length === 0 && !loading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No se encontraron campañas. Verifica que el token de Meta tenga permisos y que la cuenta tenga campañas.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
