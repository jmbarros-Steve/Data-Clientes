import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BudgetBar } from '@/components/dashboard/BudgetBar'
import type { CampaignInsight } from '@/lib/meta-api'
import type { Budget } from '@/hooks/useBudgets'

interface CampaignTableProps {
  campaigns: CampaignInsight[]
  budgets: Budget[]
}

function getStatusBadge(status: string) {
  const s = status?.toUpperCase()
  if (s === 'ACTIVE') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>
  if (s === 'PAUSED') return <Badge variant="secondary">Pausada</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export function CampaignTable({ campaigns, budgets }: CampaignTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaña</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Presupuesto</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">CPM</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Conv.</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map(campaign => {
            const budget = budgets.find(b => b.campaign_id === campaign.campaign_id && !b.adset_id)
            return (
              <TableRow key={campaign.campaign_id} className="hover:bg-muted/50">
                <TableCell>
                  <Link to={`/campaigns/${campaign.campaign_id}`} className="font-medium text-primary hover:underline">
                    {campaign.campaign_name}
                  </Link>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell className="text-right">
                  {budget ? <BudgetBar spent={campaign.spend} budget={budget.budget_amount} compact /> : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  ${campaign.spend?.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${campaign.cpc?.toFixed(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${campaign.cpm?.toFixed(0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{campaign.clicks?.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{campaign.ctr?.toFixed(2)}%</TableCell>
                <TableCell className="text-right tabular-nums">{campaign.conversions?.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium tabular-nums ${campaign.roas >= 3 ? 'text-green-600' : campaign.roas >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {campaign.roas?.toFixed(2)}x
                </TableCell>
              </TableRow>
            )
          })}
          {campaigns.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No hay campañas disponibles
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
