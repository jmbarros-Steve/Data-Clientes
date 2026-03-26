import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCampaigns, type CampaignInsight } from '@/lib/meta-api'

interface MetaAccount {
  id: string
  meta_account_id: string
  meta_account_name: string | null
}

export function useCampaigns(clientId: string | null) {
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load meta accounts for this client
  useEffect(() => {
    if (!clientId) return
    supabase
      .from('meta_accounts')
      .select('id, meta_account_id, meta_account_name')
      .eq('client_id', clientId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMetaAccounts(data)
          setSelectedAccount(data[0].meta_account_id)
        }
      })
  }, [clientId])

  const loadCampaigns = useCallback(async (datePreset = 'last_30d') => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)
    try {
      // Try cache first
      const { data: cached } = await supabase
        .from('campaign_cache')
        .select('data, fetched_at')
        .eq('meta_account_id', selectedAccount)
        .eq('cache_type', 'campaigns')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const cacheAge = cached ? (Date.now() - new Date(cached.fetched_at).getTime()) / 1000 / 60 : Infinity

      if (cached && cacheAge < 30) {
        setCampaigns(cached.data as CampaignInsight[])
      } else {
        const data = await fetchCampaigns(selectedAccount, datePreset)
        setCampaigns(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando campañas')
    } finally {
      setLoading(false)
    }
  }, [selectedAccount])

  useEffect(() => {
    if (selectedAccount) loadCampaigns()
  }, [selectedAccount, loadCampaigns])

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + (c.spend || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      conversions: acc.conversions + (c.conversions || 0),
      reach: acc.reach + (c.reach || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 }
  )

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const roas = totals.spend > 0 ? (campaigns.reduce((sum, c) => sum + (c.roas || 0) * (c.spend || 0), 0) / totals.spend) : 0

  return {
    metaAccounts,
    selectedAccount,
    setSelectedAccount,
    campaigns,
    loading,
    error,
    loadCampaigns,
    totals: { ...totals, ctr, roas },
  }
}
