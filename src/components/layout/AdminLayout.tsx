import type { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}
