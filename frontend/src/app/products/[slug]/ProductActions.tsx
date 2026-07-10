'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth'

export default function ProductActions({ product }: { product: any }) {
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState('')
  const { addItem, localAddItem } = useCartStore()
  const { user } = useAuth()

  const handleAdd = async () => {
    setAdding(true)
    try {
      if (user) {
        await addItem(product.id, qty)
      } else {
        localAddItem({
          product_id: product.id,
          quantity: qty,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          slug: product.slug,
        })
      }
      setToast(`✅ Added to cart!`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Failed to add — please try again')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Quantity */}
        <div className="flex items-center gap-3 glass rounded-full px-3 py-2">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-muted hover:text-primary transition-colors">
            <Minus size={16} />
          </button>
          <span className="text-sm font-bold w-6 text-center text-foreground dark:text-foreground-dark">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="text-muted hover:text-primary transition-colors">
            <Plus size={16} />
          </button>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={adding}
          className="btn-pill-primary flex-1 py-3 text-sm"
        >
          <ShoppingCart size={16} />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>

      {toast && (
        <div className="mt-3 text-sm font-semibold text-primary animate-fade-in">{toast}</div>
      )}
    </>
  )
}
