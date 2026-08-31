'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ChevronRight, Zap, TrendingUp, Shield, Truck, Bell, Sparkles } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth, apiFetch } from '@/lib/auth'

import LoginPromptModal from '@/components/LoginPromptModal'

const PERKS = [
  { icon: <Truck size={20} />, title: 'Reliable Delivery', desc: 'Fast & safe delivery to your doorstep' },
  { icon: <Shield size={20} />, title: 'Secure M-Pesa', desc: 'Instant Lipa Na M-Pesa at checkout' },
  { icon: <Zap size={20} />, title: 'Flash Deals', desc: 'Special household discounts every 24h' },
  { icon: <TrendingUp size={20} />, title: 'Bulk & Event Pricing', desc: 'Volume savings on chairs & home goods' },
]

function ProductCard({ 
  product, 
  onAddToCart, 
  onNotifyMe 
}: { 
  product: any; 
  onAddToCart: (p: any) => void;
  onNotifyMe: (p: any) => void;
}) {
  const [adding, setAdding] = useState(false)
  const [settingAlert, setSettingAlert] = useState(false)
  const [alertSet, setAlertSet] = useState(false)
  
  const isDeactivated = product.is_active === false
  const isFlashSale = !isDeactivated && product.discount_price && product.flash_sale_end_date && new Date(product.flash_sale_end_date) > new Date()
  const currentPrice = isFlashSale ? Number(product.discount_price) : Number(product.price)
  const discountPct = isFlashSale ? Math.round(((Number(product.price) - currentPrice) / Number(product.price)) * 100) : 0

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    await onAddToCart(product)
    setTimeout(() => setAdding(false), 800)
  }

  const handleNotify = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSettingAlert(true)
    await onNotifyMe(product)
    setAlertSet(true)
    setSettingAlert(false)
  }

  return (
    <Link 
      href={`/products/${product.slug}`} 
      className={`group glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${
        isDeactivated ? 'border-amber-500/20 bg-surface/30' : ''
      }`}
    >
      {/* Image */}
      <div className="aspect-square relative bg-gray-100 dark:bg-card-dark overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isDeactivated 
                ? 'filter blur-[2.5px] scale-105 opacity-65 grayscale-[35%]' 
                : 'group-hover:scale-105'
            }`} 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted/40">📦</div>
        )}

        {isDeactivated ? (
          <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
            <div className="backdrop-blur-md bg-black/60 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5 animate-fade-in">
              <Bell size={12} className="animate-pulse text-amber-400" />
              <span>Awaiting Restock</span>
            </div>
          </div>
        ) : isFlashSale ? (
          <span className="absolute top-2.5 left-2.5">
            <span className="badge-pill bg-danger text-white shadow-sm flex items-center gap-1">
              <Zap size={10} fill="currentColor" />
              SALE -{discountPct}%
            </span>
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-warning">★★★★</span>
          <span className="text-muted/40">★</span>
          <span className="text-muted text-[10px]">(42)</span>
        </div>
        <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isDeactivated ? 'text-foreground/75' : 'text-foreground dark:text-foreground-dark'}`}>
          {product.name}
        </p>
        <div className="mt-auto flex items-baseline gap-2">
          <span className={`text-base font-extrabold ${isDeactivated ? 'text-muted' : 'text-primary'}`}>
            KES {currentPrice.toLocaleString()}
          </span>
          {isFlashSale && (
            <span className="text-xs text-muted line-through">
              KES {Number(product.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        {isDeactivated ? (
          <button
            onClick={handleNotify}
            disabled={settingAlert}
            className={`w-full text-xs py-2 px-3 rounded-full font-bold transition-all flex items-center justify-center gap-1.5 border shadow-sm cursor-pointer ${
              alertSet 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95'
            }`}
          >
            <Bell size={14} />
            {settingAlert ? 'Setting alert...' : alertSet ? '🔔 Alert Set' : 'Notify When Restocked'}
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-pill-primary w-full text-xs py-2 cursor-pointer"
          >
            <ShoppingCart size={14} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        )}
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

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
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    try {
      await addItem(product.id)
      showToast(`✅ ${product.name.substring(0, 20)}... added!`)
    } catch {
      showToast('Failed to add item — please try again')
    }
  }

  const handleNotifyMe = async (product: any) => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    try {
      await apiFetch(`/api/catalog/products/${product.id}/stock-alert`, {
        method: 'POST'
      })
      showToast(`🔔 We'll notify you in your Account Dashboard when "${product.name.substring(0, 20)}..." is back!`)
    } catch {
      showToast('Failed to set restock alert — please try again')
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const isFiltered = search || category
  const activeCategory = categories.find(c => c.slug === category)

  return (
    <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-6">
      {/* Hero Banner with Horizontal Products Ribbon */}
      {!isFiltered && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-indigo-700 to-indigo-900 p-6 sm:p-8 md:p-10 lg:p-12 mb-10 shadow-2xl border border-white/10">
          {/* Subtle radial backdrop accent */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_65%)] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side: Brand Text & Action Button */}
            <div className="lg:col-span-5 flex flex-col justify-center shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest text-white/90 bg-white/10 backdrop-blur-md mb-3 border border-white/20 w-fit">
                <Sparkles size={13} className="text-amber-300 animate-pulse" />
                Mavine Households
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Quality Home Essentials.<br />Delivered To You.
              </h1>
              <p className="text-white/80 mt-3 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg">
                Explore our wide collection of kitchenware, home appliances, bedding, carpets, storage, travel bags, bicycles & furniture.
              </p>
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('products')
                    if (el) {
                      const yOffset = -90
                      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
                      window.scrollTo({ top: y, behavior: 'smooth' })
                    }
                  }}
                  className="btn-pill-accent mt-3 inline-flex items-center gap-2 shadow-xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all font-extrabold px-6 py-3 text-sm"
                >
                  Shop Home Essentials <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Side: Seamless Horizontal Scrolling Showcase of Available Products */}
            <div className="lg:col-span-7 overflow-hidden relative w-full pt-2 lg:pt-0">
              {/* Subtle edge fade masks for seamless background blending */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 bg-gradient-to-r from-primary/85 via-primary/35 to-transparent z-20 hidden sm:block" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 bg-gradient-to-l from-indigo-900/90 via-indigo-900/40 to-transparent z-20 hidden sm:block" />

              {products.length > 0 ? (
                <div className="overflow-x-auto flex gap-4 scrollbar-hide py-3 px-1 pause-hover">
                  <div className="flex gap-4 animate-marquee shrink-0">
                    {/* First copy for smooth continuous scroll */}
                    {products.map((p) => {
                      const isFlashSale = p.discount_price && p.flash_sale_end_date && new Date(p.flash_sale_end_date) > new Date()
                      const currentPrice = isFlashSale ? Number(p.discount_price) : Number(p.price)
                      return (
                        <Link
                          key={`hero-p1-${p.id}`}
                          href={`/products/${p.slug}`}
                          className="w-48 sm:w-56 md:w-60 shrink-0 rounded-2xl p-3 sm:p-3.5 bg-white/12 hover:bg-white/20 border border-white/25 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col group cursor-pointer"
                        >
                          {/* Elevated Card Image */}
                          <div className="h-40 sm:h-48 md:h-52 w-full rounded-xl overflow-hidden bg-black/30 mb-3 relative shrink-0">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl">📦</div>
                            )}
                            {isFlashSale && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-lg flex items-center gap-1">
                                <Zap size={10} fill="currentColor" /> SALE
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors min-h-[2rem]">
                            {p.name}
                          </h3>

                          <div className="mt-auto pt-2 flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-black text-amber-300">
                              KES {currentPrice.toLocaleString()}
                            </span>
                            {isFlashSale && (
                              <span className="text-xs text-white/60 line-through font-medium">
                                KES {Number(p.price).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quick action hint */}
                          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
                            <span>View & Order</span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-amber-300" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Duplicate array for continuous infinite marquee loop */}
                  <div className="flex gap-4 animate-marquee shrink-0" aria-hidden="true">
                    {products.map((p) => {
                      const isFlashSale = p.discount_price && p.flash_sale_end_date && new Date(p.flash_sale_end_date) > new Date()
                      const currentPrice = isFlashSale ? Number(p.discount_price) : Number(p.price)
                      return (
                        <Link
                          key={`hero-p2-${p.id}`}
                          href={`/products/${p.slug}`}
                          className="w-48 sm:w-56 md:w-60 shrink-0 rounded-2xl p-3 sm:p-3.5 bg-white/12 hover:bg-white/20 border border-white/25 backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col group cursor-pointer"
                        >
                          {/* Elevated Card Image */}
                          <div className="h-40 sm:h-48 md:h-52 w-full rounded-xl overflow-hidden bg-black/30 mb-3 relative shrink-0">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl">📦</div>
                            )}
                            {isFlashSale && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-lg flex items-center gap-1">
                                <Zap size={10} fill="currentColor" /> SALE
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors min-h-[2rem]">
                            {p.name}
                          </h3>

                          <div className="mt-auto pt-2 flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-black text-amber-300">
                              KES {currentPrice.toLocaleString()}
                            </span>
                            {isFlashSale && (
                              <span className="text-xs text-white/60 line-through font-medium">
                                KES {Number(p.price).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quick action hint */}
                          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
                            <span>View & Order</span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-amber-300" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-hidden py-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-48 sm:w-56 md:w-60 h-72 rounded-2xl bg-white/5 border border-white/10 animate-pulse shrink-0" />
                  ))}
                </div>
              )}
            </div>
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
      <div id="products" className="mb-10 scroll-mt-24">
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
              <ProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={handleAddToCart} 
                onNotifyMe={handleNotifyMe}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

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
