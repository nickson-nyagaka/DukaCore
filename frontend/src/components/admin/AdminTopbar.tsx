'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import ThemeToggle from '@/components/ThemeToggle'

const pageTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/product-types': 'Product Schemas',
  '/admin/orders': 'Orders',
  '/admin/team': 'User Management',
  '/admin/vouchers': 'Vouchers',
  '/admin/security/access-log': 'Access Log',
}

export default function AdminTopbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Get page title — exact match first, then prefix match
  const title = pageTitles[pathname] 
    ?? Object.entries(pageTitles).find(([k]) => k !== '/admin' && pathname.startsWith(k))?.[1]
    ?? 'Admin'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user 
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : '?'

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        left: 'var(--admin-sidebar-w)',
        background: 'var(--navbar)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}>
          {title}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User Button */}
        <div className="relative" ref={ref}>
          <button
            id="admin-user-btn"
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:bg-primary/5"
            style={{ color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {initials}
            </div>
            <span className="hidden sm:block">{user?.username ?? user?.first_name ?? 'Admin'}</span>
            <ChevronDown
              size={14}
              className="transition-transform duration-200"
              style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div
              id="admin-user-dropdown"
              className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl overflow-hidden shadow-2xl z-50"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{user?.email}</p>
                <span
                  className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                >
                  {user?.role}
                </span>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <Link
                  href="/admin/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary"
                  style={{ color: 'var(--muted)' }}
                >
                  <Settings size={15} />
                  Settings
                </Link>
                <button
                  onClick={() => { setOpen(false); logout() }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
