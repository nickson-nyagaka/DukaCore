'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="border-t border-border bg-card mt-20 transition-colors">
      <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-black tracking-tight mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="text-primary">Duka</span>
              <span className="text-accent">Core</span>
            </div>
            <p className="text-sm text-muted leading-relaxed font-medium">
              E-commerce platform. Launch your store in seconds.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-foreground">Shop</h4>
            <ul className="space-y-2">
              {['Phones & Tablets', 'Computing', 'Electronics', 'Fashion', 'Home & Living'].map(c => (
                <li key={c}>
                  <Link href="/" className="text-sm text-muted hover:text-primary transition-colors font-medium">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-foreground">Help</h4>
            <ul className="space-y-2">
              {['Track My Order', 'Returns Policy', 'Delivery Info', 'FAQs', 'Contact Us'].map(i => (
                <li key={i}>
                  <Link href="/" className="text-sm text-muted hover:text-primary transition-colors font-medium">{i}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted font-medium">
          © {new Date().getFullYear()} DukaCore. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
