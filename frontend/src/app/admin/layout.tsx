'use client'

import RoleGuard from '@/components/RoleGuard'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'STAFF']}>
      <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
        {/* Fixed Sidebar */}
        <AdminSidebar />

        {/* Main area: offset by sidebar width */}
        <div className="transition-all duration-300" style={{ marginLeft: 'var(--admin-sidebar-w)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Fixed Topbar */}
          <AdminTopbar />

          {/* Scrollable Content — offset by topbar height */}
          <main
            className="flex-1 p-6 pt-8 animate-fade-in"
            style={{ marginTop: '4rem' }}
          >
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
