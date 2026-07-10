'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth'

export default function CartPage() {
  const { user } = useAuth()
  const { items, total, itemCount, removeItem, updateQuantity, syncFromServer, localRemoveItem, localUpdateQuantity } = useCartStore()

  useEffect(() => {
    if (user) syncFromServer()
  }, [user])

  const handleRemove = (pid: number) => {
    if (user) removeItem(pid)
    else localRemoveItem(pid)
  }

  const handleQty = (pid: number, qty: number) => {
    if (user) updateQuantity(pid, qty)
    else localUpdateQuantity(pid, qty)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>Your cart is empty</h2>
        <p className="text-sm text-muted dark:text-muted-dark mt-2">Add products to your cart and they&apos;ll appear here</p>
        <Link href="/" className="btn-pill-primary mt-6 inline-flex">
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    )
  }

  const delivery = total >= 2000 ? 0 : 200
  const grandTotal = total + delivery

  return (
    <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
        Shopping Cart <span className="text-base font-normal text-muted ml-2">({itemCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="glass rounded-2xl p-4 flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-card-dark shrink-0 overflow-hidden flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-muted/30">📦</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-foreground dark:text-foreground-dark hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <div className="text-lg font-extrabold text-primary mt-1">
                  KES {(item.price * item.quantity).toLocaleString()}
                </div>
                <div className="text-xs text-muted dark:text-muted-dark">
                  KES {item.price.toLocaleString()} each
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <div className="flex items-center gap-2 glass rounded-full px-2 py-1">
                  <button onClick={() => handleQty(item.product_id, item.quantity - 1)} className="text-muted hover:text-primary p-0.5">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-foreground dark:text-foreground-dark">{item.quantity}</span>
                  <button onClick={() => handleQty(item.product_id, item.quantity + 1)} className="text-muted hover:text-primary p-0.5">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => handleRemove(item.product_id)} className="text-danger text-xs font-medium flex items-center gap-1 hover:underline">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24">
            <h3 className="text-base font-bold mb-4 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted dark:text-muted-dark">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-foreground dark:text-foreground-dark">KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted dark:text-muted-dark">
                <span>Delivery</span>
                <span className={`font-semibold ${delivery === 0 ? 'text-primary' : 'text-foreground dark:text-foreground-dark'}`}>
                  {delivery === 0 ? 'FREE' : `KES ${delivery}`}
                </span>
              </div>

              {total < 2000 && (
                <div className="text-xs text-primary bg-primary-light dark:bg-primary-light/10 p-3 rounded-lg">
                  Add KES {(2000 - total).toLocaleString()} more for free delivery!
                </div>
              )}

              <hr className="border-border dark:border-border-dark" />

              <div className="flex justify-between font-bold text-base text-foreground dark:text-foreground-dark">
                <span>Total</span>
                <span>KES {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-pill-accent w-full mt-5 py-3 text-sm">
              Proceed to Checkout
            </Link>
            <Link href="/" className="btn-pill-outline w-full mt-3 py-2.5 text-xs">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
