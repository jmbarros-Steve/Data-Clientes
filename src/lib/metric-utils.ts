import { DollarSign, Eye, MousePointerClick, Percent, Target, TrendingUp, Layers } from 'lucide-react'

export type MetricKey = 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc' | 'cpm' | 'conversions' | 'roas'

export interface MetricDef {
  key: MetricKey
  label: string
  icon: typeof DollarSign
  color: string
  bgGradient: string
  format: (v: number) => string
  higherIsBetter: boolean
}

const fmtCurrency = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${Math.round(v).toLocaleString('es-CL')}`
}

const fmtNumber = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return Math.round(v).toLocaleString('es-CL')
}

const fmtPercent = (v: number) => `${v.toFixed(2)}%`
const fmtRoas = (v: number) => `${v.toFixed(2)}x`

export const METRICS: Record<MetricKey, MetricDef> = {
  spend: { key: 'spend', label: 'Gasto Total', icon: DollarSign, color: 'border-red-500', bgGradient: 'from-red-500/8', format: fmtCurrency, higherIsBetter: false },
  impressions: { key: 'impressions', label: 'Impresiones', icon: Eye, color: 'border-blue-500', bgGradient: 'from-blue-500/8', format: fmtNumber, higherIsBetter: true },
  clicks: { key: 'clicks', label: 'Clicks', icon: MousePointerClick, color: 'border-indigo-500', bgGradient: 'from-indigo-500/8', format: fmtNumber, higherIsBetter: true },
  ctr: { key: 'ctr', label: 'CTR', icon: Percent, color: 'border-cyan-500', bgGradient: 'from-cyan-500/8', format: fmtPercent, higherIsBetter: true },
  cpc: { key: 'cpc', label: 'CPC', icon: MousePointerClick, color: 'border-orange-500', bgGradient: 'from-orange-500/8', format: fmtCurrency, higherIsBetter: false },
  cpm: { key: 'cpm', label: 'CPM', icon: Layers, color: 'border-purple-500', bgGradient: 'from-purple-500/8', format: fmtCurrency, higherIsBetter: false },
  conversions: { key: 'conversions', label: 'Conversiones', icon: Target, color: 'border-amber-500', bgGradient: 'from-amber-500/8', format: fmtNumber, higherIsBetter: true },
  roas: { key: 'roas', label: 'ROAS', icon: TrendingUp, color: 'border-green-500', bgGradient: 'from-green-500/8', format: fmtRoas, higherIsBetter: true },
}

export const METRIC_ORDER: MetricKey[] = ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'conversions', 'roas']

export interface DatePreset { key: string; label: string; metaPreset: string }

export const DATE_PRESETS: DatePreset[] = [
  { key: '7d', label: '7d', metaPreset: 'last_7d' },
  { key: '14d', label: '14d', metaPreset: 'last_14d' },
  { key: '30d', label: '30d', metaPreset: 'last_30d' },
  { key: '60d', label: '60d', metaPreset: 'last_60d' },
  { key: '90d', label: '90d', metaPreset: 'last_90d' },
]

export type TargetStatus = 'good' | 'warning' | 'danger' | 'none'

export function getTargetStatus(actual: number, target: number, higherIsBetter: boolean): TargetStatus {
  if (target <= 0) return 'none'
  const ratio = actual / target
  if (higherIsBetter) {
    if (ratio >= 0.8) return 'good'
    if (ratio >= 0.5) return 'warning'
    return 'danger'
  }
  if (ratio <= 1.0) return 'good'
  if (ratio <= 1.2) return 'warning'
  return 'danger'
}

export function getTargetColor(s: TargetStatus) {
  return s === 'good' ? 'text-green-500' : s === 'warning' ? 'text-yellow-500' : s === 'danger' ? 'text-red-500' : 'text-blue-500'
}
export function getTargetBorderColor(s: TargetStatus) {
  return s === 'good' ? 'border-l-green-500' : s === 'warning' ? 'border-l-yellow-500' : s === 'danger' ? 'border-l-red-500' : 'border-l-blue-500'
}
export function getTargetBgColor(s: TargetStatus) {
  return s === 'good' ? 'bg-green-500' : s === 'warning' ? 'bg-yellow-500' : s === 'danger' ? 'bg-red-500' : 'bg-blue-500'
}
export function getProgressPercent(actual: number, target: number, higherIsBetter: boolean): number {
  if (target <= 0) return 0
  if (higherIsBetter) return Math.min((actual / target) * 100, 100)
  return Math.max(0, Math.min(100, (1 - actual / (target * 2)) * 100))
}

export const DONUT_COLORS = ['#1E3A7B', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#8B5CF6', '#A78BFA', '#C4B5FD']

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  padding: '12px 16px',
}
