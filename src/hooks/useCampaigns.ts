import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCampaigns, type CampaignInsight } from '@/lib/meta-api'
import { DATE_PRESETS } from '@/lib/metric-utils'

export function useCampaigns(_clientId: string | null) {
  const { metaAccounts } = useAuth()
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datePreset, setDatePreset] = useState('30d')

  // Set selected account from auth context meta accounts
  useEffect(() => {
    if (metaAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(metaAccounts[0].meta_account_id)
    }
  }, [metaAccounts, selectedAccount])

  const loadCampaigns = useCallback(async (preset?: string) => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)

    const metaPreset = DATE_PRESETS.find(p => p.key === (preset || datePreset))?.metaPreset || 'last_30d'

    try {
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
