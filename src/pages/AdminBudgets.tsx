import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import type { Budget } from '@/hooks/useBudgets'

interface Client {
  id: string
  name: string
  company: string | null
}

interface MetaAccount {
  id: string
  client_id: string
  meta_account_id: string
  meta_account_name: string | null
}

export default function AdminBudgets() {
  const [clients, setClients] = useState<Client[]>([])
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    meta_account_id: '',
    campaign_id: '',
    adset_id: '',
    budget_amount: '',
    budget_period: 'monthly',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id, name, company'),
      supabase.from('meta_accounts').select('id, client_id, meta_account_id, meta_account_name'),
      supabase.from('campaign_budgets').select('*').order('created_at', { ascending: false }),
    ]).then(([c, m, b]) => {
      setClients(c.data ?? [])
      setMetaAccounts(m.data ?? [])
      setBudgets(b.data ?? [])
      setLoading(false)
    })
  }, [])

  function getClientForAccount(metaAccountId: string) {
    const ma = metaAccounts.find(m => m.meta_account_id === metaAccountId)
    if (!ma) return null
    return clients.find(c => c.id === ma.client_id)
  }

  function getAccountName(metaAccountId: string) {
    const ma = metaAccounts.find(m => m.meta_account_id === metaAccountId)
    return ma?.meta_account_name || metaAccountId
  }

  async function saveBudget() {
    setSaving(true)
    try {
      await supabase.from('campaign_budgets').insert({
        meta_account_id: form.meta_account_id,
        campaign_id: form.campaign_id || null,
        adset_id: form.adset_id || null,
        budget_amount: parseFloat(form.budget_amount),
        budget_period: form.budget_period,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      const { data } = await supabase.from('campaign_budgets').select('*').order('created_at', { ascending: false })
      setBudgets(data ?? [])
      setDialogOpen(false)
      setForm({ meta_account_id: '', campaign_id: '', adset_id: '', budget_amount: '', budget_period: 'monthly', start_date: '', end_date: '' })
    } catch {
      alert('Error guardando presupuesto')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBudget(id: string) {
    await supabase.from('campaign_budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  function getBudgetLevel(b: Budget) {
    if (b.adset_id) return 'Ad Set'
    if (b.campaign_id) return 'Campaña'
    return 'Cuenta'
  }

  const periodLabels: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Presupuestos</h1>
            <p className="text-muted-foreground">Configura presupuestos para comparar vs gasto real</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-1" /> Nuevo Presupuesto</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Presupuesto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cuenta de Meta *</Label>
                  <Select value={form.meta_account_id} onValueChange={v => setForm(f => ({ ...f, meta_account_id: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger>
                    <SelectContent>
                      {metaAccounts.map(ma => (
                        <SelectItem key={ma.id} value={ma.meta_account_id}>
                          {ma.meta_account_name || ma.meta_account_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Campaign ID (dejar vacío = cuenta completa)</Label>
                  <Input placeholder="Ej: 23851234567890" value={form.campaign_id} onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ad Set ID (opcional)</Label>
                  <Input placeholder="Ej: 23851234567891" value={form.adset_id} onChange={e => setForm(f => ({ ...f, adset_id: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto *</Label>
                    <Input type="number" placeholder="100000" value={form.budget_amount} onChange={e => setForm(f => ({ ...f, budget_amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select value={form.budget_period} onValueChange={v => setForm(f => ({ ...f, budget_period: v ?? 'monthly' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha inicio</Label>
                    <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha fin</Label>
                    <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={saveBudget} disabled={saving || !form.meta_account_id || !form.budget_amount} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Crear Presupuesto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Presupuestos Configurados</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map(b => {
                    const client = getClientForAccount(b.meta_account_id)
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{client?.name ?? '—'}</TableCell>
                        <TableCell className="text-sm">{getAccountName(b.meta_account_id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getBudgetLevel(b)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(b.budget_amount).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>{periodLabels[b.budget_period] ?? b.budget_period}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {b.start_date && b.end_date ? `${b.start_date} → ${b.end_date}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteBudget(b.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {budgets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay presupuestos configurados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
