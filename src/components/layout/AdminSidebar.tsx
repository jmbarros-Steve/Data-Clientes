import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Users, DollarSign, BookOpen, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

const adminLinks = [
  { to: '/admin', label: 'Clientes', icon: Users },
  { to: '/admin/budgets', label: 'Presupuestos', icon: DollarSign },
  { to: '/admin/glossary', label: 'Glosario', icon: BookOpen },
]

export function AdminSidebar() {
  const { signOut } = useAuth()
  const location = useLocation()

  return (
    <aside className="w-64 border-r border-border bg-sidebar min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-8 px-2">
        <img src="/logo-bg-consult.png" alt="BG Consult Hub" className="h-8 object-contain" />
        <span className="font-bold text-sm text-sidebar-foreground">BG Consult Hub</span>
      </div>

      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Administración
      </div>

      <nav className="space-y-1 flex-1">
        {adminLinks.map(link => (
          <Link key={link.to} to={link.to}>
            <Button
              variant={location.pathname === link.to ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Button>
          </Link>
        ))}

        <div className="border-t border-border my-4" />

        <Link to="/">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Ver como cliente
          </Button>
        </Link>
      </nav>

      <Button variant="ghost" onClick={signOut} className="justify-start gap-2 mt-auto">
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Button>
    </aside>
  )
}
