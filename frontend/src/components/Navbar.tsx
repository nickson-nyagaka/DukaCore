'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, User, Search, Package, LogOut, ChevronDown, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useCartStore } from '@/lib/cart-store'
import ThemeToggle from './ThemeToggle'



export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const { user, logout } = useAuth()
  const cartCount = useCartStore(s => s.itemCount)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/?search=${encodeURIComponent(query)}`)
  }

  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return null
  }

  return (
    <>
      {/* ── Main Navbar ── */}
      <nav className="sticky top-0 z-50 glass-surface">
        <div className="max-w-[var(--max-w-page)] mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-1 text-2xl font-black tracking-tight shrink-0" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="text-primary">Duka</span>
            <span className="text-accent">Core</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
            <div className="flex w-full rounded-full overflow-hidden border border-border bg-card focus-within:ring-2 focus-within:ring-primary/30 shadow-sm transition-all">
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted font-medium"
              />
              <button
                type="submit"
                className="px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2.5 ml-auto shrink-0">
            <ThemeToggle />

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                    text-foreground bg-card border border-border shadow-sm
                    hover:border-primary hover:text-primary transition-all cursor-pointer"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User size={18} className="text-primary" />
                  <span className="hidden md:inline">{user.first_name || 'Account'}</span>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl glass p-2 z-50 animate-fade-in shadow-xl">
                    <Link href="/account" prefetch={true} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary-light hover:text-primary transition-colors">
                      <User size={16} /> My Account
                    </Link>
                    <Link href="/orders" prefetch={true} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-primary-light hover:text-primary transition-colors">
                      <Package size={16} /> My Orders
                    </Link>
                    <hr className="my-1.5 border-border" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 transition-colors w-full cursor-pointer"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                prefetch={true}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold
                  text-white bg-primary hover:bg-primary-hover
                  shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <User size={17} />
                <span>Login</span>
              </Link>
            )}

            <Link 
              href="/cart" 
              prefetch={true}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                text-foreground bg-card border border-border
                hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all"
            >
              <ShoppingCart size={19} className="text-foreground" />
              <span className="hidden md:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-accent text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ml-0.5">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Category Bar ── */}
      <div className="glass-surface border-t border-border/50 overflow-hidden">
        <div className="max-w-[var(--max-w-page)] mx-auto px-4 flex items-center gap-2 h-11 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              prefetch={true}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold 
                text-muted hover:text-primary hover:bg-primary-light transition-all shrink-0"
            >
              <span className="text-sm">{cat.icon || '🏷️'}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
