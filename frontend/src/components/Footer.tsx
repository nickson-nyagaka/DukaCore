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
              <span className="text-primary">Mavine</span> <span className="text-accent">Households</span>
            </div>
            <p className="text-sm text-muted leading-relaxed font-medium">
              Your trusted home goods destination. Kitchenware, bedding, home appliances, storage, and furniture delivered to your doorstep.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-foreground">Shop</h4>
            <ul className="space-y-2">
              {['Kitchenware & Dining', 'Home Appliances', 'Bedding & Bedroom', 'Carpets & Flooring', 'Furniture & Storage'].map(c => (
                <li key={c}>
                  <Link href="/" className="text-sm text-muted hover:text-primary transition-colors font-medium">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-foreground">Help & Orders</h4>
            <ul className="space-y-2">
              {['Track My Order', 'Delivery Info & Rates', 'Bulk / Event Orders', 'M-Pesa Payment Help'].map(i => (
                <li key={i}>
                  <Link href="/" className="text-sm text-muted hover:text-primary transition-colors font-medium">{i}</Link>
                </li>
              ))}
              <li>
                <a 
                  href="https://wa.me/254715454643" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#25D366] hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💬 WhatsApp: 0715 454643</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted font-medium">
          &copy; {new Date().getFullYear()} Mavine Households. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
