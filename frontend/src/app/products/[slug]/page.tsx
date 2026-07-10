import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-fetch'
import ProductActions from './ProductActions'
import ProductGallery from './ProductGallery'

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

  const customFields = product.custom_fields || {}
  const hasSpecs = Object.keys(customFields).length > 0
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
            <p className="text-2xl font-extrabold text-primary mt-4">
              KES {Number(product.price).toLocaleString()}
            </p>
          </div>

          <p className="text-sm text-muted dark:text-muted-dark leading-relaxed">
            {product.description}
          </p>

          {/* Dynamic Specifications */}
          {hasSpecs && (
            <div className="border-t border-border dark:border-border-dark pt-6">
              <h3 className="text-sm font-bold mb-4 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
                Specifications
              </h3>
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(customFields).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-primary-light/30 dark:bg-primary-light/5'}>
                        <td className="px-4 py-3 font-semibold text-muted dark:text-muted-dark capitalize w-1/3">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-foreground dark:text-foreground-dark font-medium">
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
