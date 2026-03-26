import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useBudgets } from '@/hooks/useBudgets'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { DatePresetSelector } from '@/components/dashboard/DatePresetSelector'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'

export default function Campaigns() {
  const { clientId } = useAuth()
  const { campaigns, loading, selectedAccount, datePreset, setDatePreset } = useCampaigns(clientId)
  const { budgets } = useBudgets(selectedAccount)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = campaigns.filter(c => {
    const matchName = c.campaign_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status?.toUpperCase() === statusFilter.toUpperCase()
    return matchName && matchStatus
  })

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Campañas</h1>
            <p className="text-muted-foreground">Todas tus campañas de Meta Ads</p>
          </div>
          <DatePresetSelector value={datePreset} onChange={setDatePreset} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campaña..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="PAUSED">Pausadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CampaignTable campaigns={filtered} budgets={budgets} />
      </div>
    </ClientLayout>
  )
}
