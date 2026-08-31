import { notFound } from 'next/navigation'
import { Zap } from 'lucide-react'
import { serverFetch } from '@/lib/server-fetch'
import ProductActions from './ProductActions'
import ProductGallery from './ProductGallery'
import FlashSaleBanner from '@/components/FlashSaleBanner'

async function getProduct(slug: string) {
  try {
    return await serverFetch(`/api/catalog/products/${slug}`)
  } catch {
    return null
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : (product.image_url ? [product.image_url] : [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Gallery */}
        <ProductGallery images={images} name={product.name} />

        {/* Details */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground dark:text-foreground-dark tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {product.name}
            </h1>
            
            {(() => {
              const isFlashSale = product.discount_price && product.flash_sale_end_date && new Date(product.flash_sale_end_date) > new Date()
              const currentPrice = isFlashSale ? Number(product.discount_price) : Number(product.price)
              const discountPct = isFlashSale ? Math.round(((Number(product.price) - currentPrice) / Number(product.price)) * 100) : 0
              
              return (
                <div className="mt-4">
                  {isFlashSale && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white text-xs font-black uppercase mb-3 shadow-md shadow-pink-500/20 border border-pink-400/40 animate-pulse">
                      <Zap size={14} className="fill-white text-amber-200" />
                      <span>⚡ Flash Sale!!!</span>
                      <span className="bg-white text-pink-600 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                        SAVE {discountPct}% OFF
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-3 flex-wrap">
                    <p className={`text-3xl font-black ${isFlashSale ? 'text-pink-400' : 'text-primary'}`}>
                      KES {currentPrice.toLocaleString()}
                    </p>
                    {isFlashSale && (
                      <p className="text-lg text-muted line-through font-medium">
                        KES {Number(product.price).toLocaleString()}
                      </p>
                    )}
                    {isFlashSale && (
                      <span className="text-xs font-bold text-pink-300 bg-pink-950/60 border border-pink-500/30 px-2.5 py-1 rounded-xl">
                        Save KES {(Number(product.price) - currentPrice).toLocaleString()} ({discountPct}% cut)
                      </span>
                    )}
                  </div>
                  {isFlashSale && <FlashSaleBanner endDate={product.flash_sale_end_date} />}
                </div>
              )
            })()}

            {/* Heavy Item Badge */}
            {product.is_heavy_item && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-mv-teal-800/10 text-mv-teal-600 border border-mv-teal-600/20">
                <span>🚛 Bulky / Heavy Item Delivery</span>
              </div>
            )}

            {/* Bulk / Tiered Pricing Table */}
            {product.price_tiers && product.price_tiers.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl glass border border-primary/20 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">📦 Bulk Volume Savings</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {product.price_tiers.map((tier: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                      <span className="font-semibold text-muted">{tier.min_quantity}+ units</span>
                      <span className="font-black text-primary">KES {Number(tier.unit_price).toLocaleString()}/ea</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-muted dark:text-muted-dark leading-relaxed">
            {product.description}
          </p>

          {/* Dynamic Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              {product.attributes.map((attr: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{attr.name}</h3>
                  {attr.type === 'rich_text' ? (
                    <div 
                      className="dynamic-content"
                      dangerouslySetInnerHTML={{ __html: attr.value }}
                    />
                  ) : (
                    <p className="text-sm text-muted whitespace-pre-wrap">{attr.value}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart (client component) */}
          <div className="mt-auto pt-6 border-t border-border dark:border-border-dark">
            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
