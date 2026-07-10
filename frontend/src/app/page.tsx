'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ChevronRight, Zap, TrendingUp, Shield, Truck } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth'



const PERKS = [
  { icon: <Truck size={20} />, title: 'Free Delivery', desc: 'On orders over KES 2,000' },
  { icon: <Shield size={20} />, title: 'Secure Payments', desc: 'M-Pesa & Card protected' },
  { icon: <Zap size={20} />, title: 'Flash Deals', desc: 'New deals every 24 hours' },
  { icon: <TrendingUp size={20} />, title: 'Best Prices', desc: 'Price match guaranteed' },
]

function ProductCard({ product, onAddToCart }: { product: any; onAddToCart: (p: any) => void }) {
  const [adding, setAdding] = useState(false)
  const discountPct = Math.floor(Math.random() * 20) + 10

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    await onAddToCart(product)
    setTimeout(() => setAdding(false), 800)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
      {/* Image */}
      <div className="aspect-square relative bg-gray-100 dark:bg-card-dark overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted/40">📦</div>
        )}
        <span className="absolute top-2.5 left-2.5">
          <span className="badge-pill bg-danger/10 text-danger">-{discountPct}%</span>
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-warning">★★★★</span>
          <span className="text-muted/40">★</span>
          <span className="text-muted text-[10px]">(42)</span>
        </div>
        <p className="text-sm font-semibold text-foreground dark:text-foreground-dark leading-snug line-clamp-2">{product.name}</p>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-extrabold text-primary">KES {Number(product.price).toLocaleString()}</span>
          <span className="text-xs text-muted line-through">
            KES {Math.floor(product.price * (1 + discountPct / 100)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          disabled={adding}
          className="btn-pill-primary w-full text-xs py-2"
        >
          <ShoppingCart size={14} />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden pointer-events-none">
      <div className="aspect-square bg-gray-200 dark:bg-card-dark animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-card-dark rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-200 dark:bg-card-dark rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-card-dark rounded animate-pulse" />
      </div>
    </div>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, localAddItem } = useCartStore()
  const { user } = useAuth()
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    params.set('limit', '24')

    fetch(`/api/catalog/products?${params}`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setProducts([]); setLoading(false) })
  }, [search, category])

  const handleAddToCart = async (product: any) => {
    if (user) {
      try {
        await addItem(product.id)
      } catch {
        showToast('Please login to add items')
        return
      }
    } else {
      localAddItem({
        product_id: product.id, quantity: 1, name: product.name,
        price: product.price, image_url: product.image_url, slug: product.slug
      })
    }
    showToast(`✅ ${product.name.substring(0, 20)}... added!`)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const isFiltered = search || category
  const activeCategory = categories.find(c => c.slug === category)

  return (
    <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-6">
      {/* Hero */}
      {!isFiltered && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-indigo-700 to-indigo-900 p-10 md:p-16 mb-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
          <div className="relative z-10 max-w-lg">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Shop Everything.<br />Delivered to You.
            </h1>
            <p className="text-white/80 mt-4 text-base md:text-lg">
              Best deals on phones, electronics, fashion & more — powered by DukaCore.
            </p>
            <Link href="/?category=phones-tablets" className="btn-pill-accent mt-6 inline-flex">
              Shop Now <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Perks */}
      {!isFiltered && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {PERKS.map(p => (
            <div key={p.title} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-light dark:bg-primary-light/10 text-primary shrink-0">
                {p.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground dark:text-foreground-dark">{p.title}</div>
                <div className="text-[11px] text-muted dark:text-muted-dark">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      {!isFiltered && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
            Shop by Category
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className="glass rounded-2xl px-5 py-4 flex flex-col items-center gap-2 min-w-[120px] hover:-translate-y-1 transition-all"
              >
                <span className="text-2xl">{cat.icon || '🏷️'}</span>
                <span className="text-xs font-semibold text-center text-foreground dark:text-foreground-dark">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeCategory ? activeCategory.name
              : search ? `Results for "${search}"`
              : '🔥 Featured Products'}
          </h2>
          {!isFiltered && (
            <span className="text-xs text-muted">{products.length} products</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-foreground dark:text-foreground-dark">No products found</h3>
            <p className="text-sm text-muted mt-1">Try a different category or search term</p>
            <Link href="/" className="btn-pill-primary mt-5 inline-flex">Browse All Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass rounded-xl px-5 py-3 text-sm font-semibold text-foreground dark:text-foreground-dark animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
