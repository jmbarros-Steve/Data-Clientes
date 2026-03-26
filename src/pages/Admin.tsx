import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LogoUpload } from '@/components/admin/LogoUpload'
import { ContactList } from '@/components/admin/ContactList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react'

interface Client {
  id: string
  user_id: string | null
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  logo_url: string | null
}

interface MetaAccount {
  id: string
  client_id: string
  meta_account_id: string
  meta_account_name: string | null
  access_token: string
}

export default function Admin() {
  const [clients, setClients] = useState<Client[]>([])
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [metaDialogOpen, setMetaDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '', password: '' })
  const [metaForm, setMetaForm] = useState({ meta_account_id: '', meta_account_name: '', access_token: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('meta_accounts').select('*'),
    ])
    setClients(c ?? [])
    setMetaAccounts(m ?? [])
    setLoading(false)
  }

  function openNewClient() {
    setEditingClient(null)
    setForm({ name: '', company: '', email: '', phone: '', notes: '', password: '' })
    setDialogOpen(true)
  }

  function openEditClient(client: Client) {
    setEditingClient(client)
    setForm({
      name: client.name,
      company: client.company ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
      password: '',
    })
    setDialogOpen(true)
  }

  async function saveClient() {
    setSaving(true)
    try {
      if (editingClient) {
        await supabase.from('clients').update({
          name: form.name,
          company: form.company || null,
          email: form.email || null,
          phone: form.phone || null,
          notes: form.notes || null,
        }).eq('id', editingClient.id)
      } else {
        // Create user via edge function, then create client
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token

        const { data, error } = await supabase.functions.invoke('admin-create-client', {
          body: {
            email: form.email,
            password: form.password,
            name: form.name,
            company: form.company,
            phone: form.phone,
            notes: form.notes,
          },
          headers: { Authorization: `Bearer ${token}` },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
      }
      await loadData()
      setDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error guardando cliente')
    } finally {
      setSaving(false)
    }
  }

  async function deleteClient(id: string) {
    if (!confirm('¿Eliminar este cliente y todos sus datos?')) return
    await supabase.from('clients').delete().eq('id', id)
    await loadData()
  }

  async function saveMetaAccount() {
    if (!selectedClientId) return
    setSaving(true)
    try {
      await supabase.from('meta_accounts').insert({
        client_id: selectedClientId,
        meta_account_id: metaForm.meta_account_id,
        meta_account_name: metaForm.meta_account_name || null,
        access_token: metaForm.access_token,
      })
      await loadData()
      setMetaDialogOpen(false)
      setMetaForm({ meta_account_id: '', meta_account_name: '', access_token: '' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMetaAccount(id: string) {
    if (!confirm('¿Eliminar esta cuenta de Meta?')) return
    await supabase.from('meta_accounts').delete().eq('id', id)
    await loadData()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gestiona clientes y sus cuentas de Meta Ads</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button onClick={openNewClient}><Plus className="h-4 w-4 mr-1" /> Nuevo Cliente</Button>} />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                {!editingClient && (
                  <div className="space-y-2">
                    <Label>Contraseña (para login del cliente) *</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button onClick={saveClient} disabled={saving || !form.name || !form.email} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client cards */}
        <div className="grid gap-6">
          {clients.map(client => {
            const clientMeta = metaAccounts.filter(m => m.client_id === client.id)
            return (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {client.logo_url ? (
                        <img src={client.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {client.name[0]}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {client.company && `${client.company} · `}{client.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditClient(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo upload */}
                  <LogoUpload
                    currentUrl={client.logo_url}
                    clientId={client.id}
                    onUploaded={url => {
                      setClients(prev => prev.map(c => c.id === client.id ? { ...c, logo_url: url } : c))
                    }}
                  />

                  <Separator />

                  {/* Contacts */}
                  <ContactList clientId={client.id} />

                  <Separator />

                  {/* Meta accounts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Cuentas de Meta Ads</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedClientId(client.id); setMetaDialogOpen(true) }}
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1" /> Agregar
                      </Button>
                    </div>
                    {clientMeta.map(ma => (
                      <div key={ma.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{ma.meta_account_name || ma.meta_account_id}</p>
                          <p className="text-xs text-muted-foreground">ID: {ma.meta_account_id}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMetaAccount(ma.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {clientMeta.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sin cuentas asignadas</p>
                    )}
                  </div>

                  {client.notes && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">{client.notes}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {clients.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay clientes. Crea el primero con el botón de arriba.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meta account dialog */}
        <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Cuenta de Meta Ads</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account ID de Meta *</Label>
                <Input
                  placeholder="Ej: act_123456789"
                  value={metaForm.meta_account_id}
                  onChange={e => setMetaForm(f => ({ ...f, meta_account_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre de la cuenta</Label>
                <Input
                  placeholder="Ej: Campaña Verano 2026"
                  value={metaForm.meta_account_name}
                  onChange={e => setMetaForm(f => ({ ...f, meta_account_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Token *</Label>
                <Input
                  type="password"
                  placeholder="Token de acceso de Meta"
                  value={metaForm.access_token}
                  onChange={e => setMetaForm(f => ({ ...f, access_token: e.target.value }))}
                />
              </div>
              <Button onClick={saveMetaAccount} disabled={saving || !metaForm.meta_account_id || !metaForm.access_token} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Agregar Cuenta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
