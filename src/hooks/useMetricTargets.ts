import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { MetricKey } from '@/lib/metric-utils'

export interface MetricTarget {
  metric_key: MetricKey
  target_value: number
}

export function useMetricTargets(metaAccountId: string | null) {
  const [targets, setTargets] = useState<MetricTarget[]>([])

  useEffect(() => {
    if (!metaAccountId) return
    supabase
      .from('campaign_metric_targets')
      .select('metric_key, target_value')
      .eq('meta_account_id', metaAccountId)
      .then(({ data }) => {
        if (data) setTargets(data as MetricTarget[])
      })
      .catch(() => { /* targets table may not exist yet */ })
  }, [metaAccountId])

  const targetMap = useMemo(() => {
    const map = new Map<MetricKey, number>()
    for (const t of targets) map.set(t.metric_key, t.target_value)
    return map
  }, [targets])

  function getTarget(metric: MetricKey): number | undefined {
    return targetMap.get(metric)
  }

  return { targets, getTarget, targetMap }
}
