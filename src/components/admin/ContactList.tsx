import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  role: string | null
}

interface ContactListProps {
  clientId: string
}

export function ContactList({ clientId }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')
      .then(({ data }) => setContacts(data ?? []))
  }, [clientId])

  async function addContact() {
    if (!newName || !newEmail) return
    const { data, error } = await supabase
      .from('client_contacts')
      .insert({ client_id: clientId, name: newName, email: newEmail, role: newRole || null })
      .select()
      .single()

    if (!error && data) {
      setContacts(prev => [...prev, data])
      setNewName('')
      setNewEmail('')
      setNewRole('')
    }
  }

  async function removeContact(id: string) {
    await supabase.from('client_contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Contactos</h4>
      {contacts.map(contact => (
        <div key={contact.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{contact.name}</p>
            <p className="text-xs text-muted-foreground truncate">{contact.email} {contact.role && `· ${contact.role}`}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeContact(contact.id)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} className="text-sm" />
        <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="text-sm" />
        <Input placeholder="Rol (opcional)" value={newRole} onChange={e => setNewRole(e.target.value)} className="text-sm" />
        <Button size="sm" onClick={addContact} disabled={!newName || !newEmail} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
