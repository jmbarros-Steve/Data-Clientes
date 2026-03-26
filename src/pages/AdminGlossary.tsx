import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Loader2, Save } from 'lucide-react'

interface MetricEntry {
  id: string
  metric_key: string
  display_name: string
  description: string
  icon: string | null
  category: string
  sort_order: number
}

const categoryLabels: Record<string, string> = {
  engagement: 'Interacción',
  cost: 'Costos',
  conversion: 'Conversiones',
  general: 'General',
}

const categoryColors: Record<string, string> = {
  engagement: 'bg-blue-100 text-blue-700',
  cost: 'bg-yellow-100 text-yellow-700',
  conversion: 'bg-green-100 text-green-700',
  general: 'bg-gray-100 text-gray-700',
}

export default function AdminGlossary() {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MetricEntry | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    description: '',
    icon: '',
    category: 'general',
  })

  useEffect(() => {
    supabase
      .from('metric_glossary')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        setMetrics(data ?? [])
        setLoading(false)
      })
  }, [])

  function openEdit(metric: MetricEntry) {
    setEditing(metric)
    setForm({
      display_name: metric.display_name,
      description: metric.description,
      icon: metric.icon ?? '',
      category: metric.category,
    })
  }

  async function saveMetric() {
    if (!editing) return
    setSaving(true)
    await supabase.from('metric_glossary').update({
      display_name: form.display_name,
      description: form.description,
      icon: form.icon || null,
      category: form.category,
    }).eq('id', editing.id)

    setMetrics(prev => prev.map(m =>
      m.id === editing.id ? { ...m, ...form, icon: form.icon || null } : m
    ))
    setEditing(null)
    setSaving(false)
  }

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
        <div>
          <h1 className="text-2xl font-bold">Glosario de Métricas</h1>
          <p className="text-muted-foreground">Edita las explicaciones que ven tus clientes</p>
        </div>

        <div className="grid gap-4">
          {metrics.map(metric => (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{metric.display_name}</h3>
                      <Badge className={`text-xs ${categoryColors[metric.category] ?? ''}`}>
                        {categoryLabels[metric.category] ?? metric.category}
                      </Badge>
                      <code className="text-xs text-muted-foreground bg-muted px-1 rounded">{metric.metric_key}</code>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{metric.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(metric)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar: {editing?.metric_key}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre visible</Label>
                <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descripción (lo que ve el cliente)</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícono (lucide)</Label>
                  <Input placeholder="Ej: TrendingUp" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v ?? 'general' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Interacción</SelectItem>
                      <SelectItem value="cost">Costos</SelectItem>
                      <SelectItem value="conversion">Conversiones</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveMetric} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
