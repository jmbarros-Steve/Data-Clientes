import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Budget {
  id: string
  meta_account_id: string
  campaign_id: string | null
  adset_id: string | null
  budget_amount: number
  budget_period: string
  start_date: string | null
  end_date: string | null
}

export function useBudgets(metaAccountId: string | null) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!metaAccountId) return
    setLoading(true)
    supabase
      .from('campaign_budgets')
      .select('*')
      .eq('meta_account_id', metaAccountId)
      .then(({ data }) => {
        setBudgets(data ?? [])
        setLoading(false)
      })
  }, [metaAccountId])

  function getBudgetForCampaign(campaignId: string): Budget | null {
    return budgets.find(b => b.campaign_id === campaignId && !b.adset_id) ?? null
  }

  function getBudgetForAdSet(adsetId: string): Budget | null {
    return budgets.find(b => b.adset_id === adsetId) ?? null
  }

  function getAccountBudget(): Budget | null {
    return budgets.find(b => !b.campaign_id && !b.adset_id) ?? null
  }

  async function saveBudget(budget: Omit<Budget, 'id'> & { id?: string }) {
    if (budget.id) {
      const { error } = await supabase
        .from('campaign_budgets')
        .update(budget)
        .eq('id', budget.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('campaign_budgets')
        .insert(budget)
      if (error) throw error
    }
    // Refresh
    const { data } = await supabase
      .from('campaign_budgets')
      .select('*')
      .eq('meta_account_id', metaAccountId!)
    setBudgets(data ?? [])
  }

  async function deleteBudget(id: string) {
    await supabase.from('campaign_budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  return {
    budgets,
    loading,
    getBudgetForCampaign,
    getBudgetForAdSet,
    getAccountBudget,
    saveBudget,
    deleteBudget,
  }
}
