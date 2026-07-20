'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Users, Ticket, ShieldAlert, 
  Box, ListOrdered, Store, Tags, Menu
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, permission: null, exact: true },
  { href: '/admin/products', label: 'Products', icon: Box, permission: 'product.edit', exact: false },
  { href: '/admin/categories', label: 'Categories', icon: Tags, permission: 'product.edit', exact: false },
  { href: '/admin/orders', label: 'Orders', icon: ListOrdered, permission: 'order.view_all', exact: false },
  { href: '/admin/team', label: 'User Management', icon: Users, permission: 'user.manage', exact: false },
  { href: '/admin/vouchers', label: 'Vouchers', icon: Ticket, permission: 'voucher.create', exact: false },
  { href: '/admin/security/access-log', label: 'Access Log', icon: ShieldAlert, permission: 'user.manage', exact: false },
]

export default function AdminSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Sync state to CSS variable via data attribute
  useEffect(() => {
    if (collapsed) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true')
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed')
    }
  }, [collapsed])

  const filtered = navItems.filter(item => {
    if (!item.permission) return true
    return user?.permissions?.includes(item.permission)
  })

  return (
    <aside
      id="admin-sidebar"
      className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300"
      style={{ width: 'var(--admin-sidebar-w)', background: 'var(--card)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-1 select-none overflow-hidden whitespace-nowrap">
            <span className="text-xl font-black tracking-tight text-primary" style={{ fontFamily: 'var(--font-heading)' }}>Duka</span>
            <span className="text-xl font-black tracking-tight text-accent" style={{ fontFamily: 'var(--font-heading)' }}>Core</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase" 
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              Admin
            </span>
          </Link>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`p-2 rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden" style={{ color: 'var(--muted)' }}>
            Navigation
          </p>
        )}
        {filtered.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'hover:bg-primary/5 hover:text-primary'
              }`}
              style={isActive
                ? { background: 'var(--primary)', color: 'white' }
                : { color: 'var(--muted)' }
              }
            >
              <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:text-primary transition-colors'}`} />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`px-5 py-4 shrink-0 flex ${collapsed ? 'justify-center px-2' : 'flex-col'}`} style={{ borderTop: '1px solid var(--border)' }}>
        <Link
          href="/"
          title={collapsed ? "View Storefront" : undefined}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} text-xs font-semibold transition-colors hover:text-primary`}
          style={{ color: 'var(--muted)' }}
        >
          <Store size={collapsed ? 20 : 14} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap overflow-hidden">View Storefront</span>}
        </Link>
        {!collapsed && <p className="mt-2 text-[10px] whitespace-nowrap overflow-hidden" style={{ color: 'var(--muted)' }}>DukaCore v1.0</p>}
      </div>
    </aside>
  )
}
