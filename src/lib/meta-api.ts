import { supabase } from './supabase'

export interface CampaignInsight {
  campaign_id: string
  campaign_name: string
  status: string
  objective: string
  impressions: number
  reach: number
  clicks: number
  ctr: number
  spend: number
  cpc: number
  cpm: number
  conversions: number
  cost_per_conversion: number
  roas: number
  frequency: number
  date_start: string
  date_stop: string
}

export interface AdSetInsight {
  adset_id: string
  adset_name: string
  status: string
  impressions: number
  reach: number
  clicks: number
  ctr: number
  spend: number
  cpc: number
  conversions: number
  roas: number
}

export interface AdInsight {
  ad_id: string
  ad_name: string
  status: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  conversions: number
  creative_thumbnail_url?: string
}

export async function fetchCampaigns(metaAccountId: string, datePreset = 'last_30d'): Promise<CampaignInsight[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token

  const { data, error } = await supabase.functions.invoke('meta-fetch-campaigns', {
    body: { meta_account_id: metaAccountId, date_preset: datePreset },
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw error
  return data?.campaigns ?? []
}

export async function fetchAdSets(metaAccountId: string, campaignId: string): Promise<AdSetInsight[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token

  const { data, error } = await supabase.functions.invoke('meta-fetch-adsets', {
    body: { meta_account_id: metaAccountId, campaign_id: campaignId },
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw error
  return data?.adsets ?? []
}

export async function fetchAds(metaAccountId: string, adsetId: string): Promise<AdInsight[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token

  const { data, error } = await supabase.functions.invoke('meta-fetch-ads', {
    body: { meta_account_id: metaAccountId, adset_id: adsetId },
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw error
  return data?.ads ?? []
}
