import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Link2, Check, AlertCircle } from 'lucide-react'

interface MetaAdAccount {
  id: string
  account_id: string
  name: string
  status: string
  currency: string
  timezone: string
  business_name?: string
}

interface Business {
  id: string
  name: string
}

interface MetaAccountPickerProps {
  clientId: string
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

export function MetaAccountPicker({ clientId, clientName, open, onOpenChange, onAssigned }: MetaAccountPickerProps) {
  const [step, setStep] = useState<'token' | 'select'>('token')
  const [accessToken, setAccessToken] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedToken, setSavedToken] = useState<string | null>(null)

  // Check if we already have a saved token
  useEffect(() => {
    if (!open) return
    supabase
      .from('admin_meta_tokens')
      .select('access_token, business_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.access_token) {
          setSavedToken(data.access_token)
          setAccessToken(data.access_token)
          if (data.business_id) setSelectedBusiness(data.business_id)
        }
      })
  }, [open])

  async function loadAccounts() {
    setLoading(true)
    setError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      const res = await supabase.functions.invoke('meta-list-accounts', {
        body: { access_token: accessToken, business_id: selectedBusiness },
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log('meta-list-accounts response:', res)

      if (res.error) throw res.error

      const responseData = res.data
      if (responseData?.error) throw new Error(responseData.error)

      const accts = responseData?.accounts || []
      const biz = responseData?.businesses || []

      console.log('Accounts found:', accts.length, 'Businesses:', biz.length)

      setAccounts(accts)
      setBusinesses(biz)
      setStep('select')

      // Save token for future use
      if (!savedToken || savedToken !== accessToken) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .single()

        if (adminData) {
          await supabase.from('admin_meta_tokens').upsert({
            admin_id: adminData.id,
            access_token: accessToken,
            business_id: selectedBusiness,
          })
          setSavedToken(accessToken)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error conectando con Meta')
    } finally {
      setLoading(false)
    }
  }

  async function assignAccount(account: MetaAdAccount) {
    setAssigning(true)
    try {
      await supabase.from('meta_accounts').insert({
        client_id: clientId,
        meta_account_id: account.id.replace('act_', ''),
        meta_account_name: account.name,
        access_token: accessToken,
      })
      onAssigned()
      onOpenChange(false)
      resetState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error asignando cuenta')
    } finally {
      setAssigning(false)
    }
  }

  function resetState() {
    setStep('token')
    setAccounts([])
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Cuenta Meta Ads a {clientName}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 'token' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Token de Meta</Label>
              <Input
                type="password"
                placeholder="Pega tu access token aquí"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtén tu token en{' '}
                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-primary underline">
                  Graph API Explorer
                </a>
                {' '}con permisos: ads_read, ads_management, business_management
              </p>
            </div>

            {savedToken && (
              <p className="text-xs text-green-600">Token guardado anteriormente detectado</p>
            )}

            <Button onClick={loadAccounts} disabled={!accessToken || loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
              Conectar y Listar Cuentas
            </Button>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-4">
            {/* Business selector */}
            {businesses.length > 0 && (
              <div className="space-y-2">
                <Label>Business Manager (opcional)</Label>
                <Select value={selectedBusiness ?? 'none'} onValueChange={v => {
                  setSelectedBusiness(v === 'none' ? null : v)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas mis cuentas</SelectItem>
                    {businesses.map(bm => (
                      <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadAccounts} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Filtrar por Business
                </Button>
              </div>
            )}

            {/* Account list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <Label>Selecciona una cuenta para asignar</Label>
              {accounts.map(account => (
                <Card key={account.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {account.account_id} &middot; {account.currency} &middot; {account.timezone}
                          {account.business_name && ` · ${account.business_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'} className={account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}>
                          {account.status === 'ACTIVE' ? 'Activa' : account.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => assignAccount(account)}
                          disabled={assigning}
                        >
                          {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                          Asignar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {accounts.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No se encontraron cuentas de anuncios</p>
              )}
            </div>

            <Button variant="outline" onClick={resetState} className="w-full">
              Volver
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
