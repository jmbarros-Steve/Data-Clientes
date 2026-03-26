import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  clientId: string | null
  clientData: ClientData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

interface ClientData {
  id: string
  name: string
  company: string | null
  logo_url: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  async function checkRole(userId: string) {
    // Check if admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (adminData) {
      setIsAdmin(true)
      setClientId(null)
      setClientData(null)
      return
    }

    // Check if client
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, company, logo_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (client) {
      setClientId(client.id)
      setClientData(client)
    }
    setIsAdmin(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        checkRole(s.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        checkRole(s.user.id).finally(() => setLoading(false))
      } else {
        setIsAdmin(false)
        setClientId(null)
        setClientData(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setIsAdmin(false)
    setClientId(null)
    setClientData(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, clientId, clientData, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
