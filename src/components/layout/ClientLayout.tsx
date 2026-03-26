import type { ReactNode } from 'react'
import { ClientNavbar } from './ClientNavbar'

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
