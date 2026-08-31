'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Heart, Bell, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth, apiFetch } from '@/lib/auth'
import LoginPromptModal from '@/components/LoginPromptModal'

export default function ProductActions({ product }: { product: any }) {
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { addItem } = useCartStore()
  const { user } = useAuth()

  const [wishlisted, setWishlisted] = useState(!!product.is_wishlisted)
  const [notifying, setNotifying] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const handleAdd = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    setAdding(true)
    try {
      await addItem(product.id, qty)
      setToast(`✅ Added to cart!`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Failed to add — please try again')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setAdding(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    setWishlistLoading(true)
    try {
      const res = await apiFetch('/api/catalog/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id })
      })
      setWishlisted(res.status === 'added')
    } catch {
      alert('Failed to toggle wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleStockAlert = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    setNotifying(true)
    try {
      await apiFetch(`/api/catalog/products/${product.id}/stock-alert`, {
        method: 'POST'
      })
      setToast('🔔 Alert created! We will notify you in your Account Dashboard when back in stock.')
      setTimeout(() => setToast(''), 4000)
    } catch {
      setToast('Failed to create alert — please try again')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setNotifying(false)
    }
  }

  const isUnavailable = product.is_active === false || product.stock_quantity === 0

  return (
    <>
      {isUnavailable ? (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-2xl p-4 flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 text-amber-500" />
            <span>
              {product.is_active === false
                ? 'This product is currently deactivated / awaiting restock. Set an alert to be notified in your account when it returns.'
                : 'This product is currently out of stock. You can set an alert to be notified when it returns.'}
            </span>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleStockAlert}
              disabled={notifying}
              className="btn-pill-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bell size={16} />
              {notifying ? 'Setting alert...' : 'Notify Me When Back in Stock'}
            </button>
            
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`p-3 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                wishlisted 
                  ? 'bg-danger/10 border-danger/20 text-danger' 
                  : 'glass border-border/40 text-muted hover:text-foreground'
              }`}
            >
              <Heart size={20} className={wishlisted ? 'fill-danger' : ''} />
            </button>
          </div>
        </div>
      ) : (
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
            className="btn-pill-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>

          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`p-3 rounded-full border transition-all flex items-center justify-center shrink-0 ${
              wishlisted 
                ? 'bg-danger/10 border-danger/20 text-danger' 
                : 'glass border-border/40 text-muted hover:text-foreground'
            }`}
          >
            <Heart size={20} className={wishlisted ? 'fill-danger' : ''} />
          </button>
        </div>
      )}

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {toast && (
        <div className="mt-3 text-sm font-semibold text-primary animate-fade-in">{toast}</div>
      )}
    </>
  )
}
