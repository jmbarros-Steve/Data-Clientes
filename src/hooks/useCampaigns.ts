import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCampaigns, type CampaignInsight } from '@/lib/meta-api'
import { DATE_PRESETS } from '@/lib/metric-utils'

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
  const [datePreset, setDatePreset] = useState('30d')

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

  const loadCampaigns = useCallback(async (preset?: string) => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)

    // Convert our preset key to Meta's date_preset format
    const metaPreset = DATE_PRESETS.find(p => p.key === (preset || datePreset))?.metaPreset || 'last_30d'

    try {
      // Bypass cache when date preset changes
      const data = await fetchCampaigns(selectedAccount, metaPreset)
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando campañas')
    } finally {
      setLoading(false)
    }
  }, [selectedAccount, datePreset])

  useEffect(() => {
    if (selectedAccount) loadCampaigns()
  }, [selectedAccount, loadCampaigns])

  const handleDatePresetChange = useCallback((preset: string) => {
    setDatePreset(preset)
  }, [])

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
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0

  return {
    metaAccounts,
    selectedAccount,
    setSelectedAccount,
    campaigns,
    loading,
    error,
    loadCampaigns,
    datePreset,
    setDatePreset: handleDatePresetChange,
    totals: { ...totals, ctr, roas, cpc, cpm },
  }
}
