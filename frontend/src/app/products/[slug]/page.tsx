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

          {/* Add to Cart (client component) */}
          <div className="mt-auto pt-6 border-t border-border dark:border-border-dark">
            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
