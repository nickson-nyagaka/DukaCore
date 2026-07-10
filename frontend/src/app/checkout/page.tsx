'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MapPin, CreditCard, Smartphone, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth, apiFetch } from '@/lib/auth'

type PaymentMethod = 'MOCK' | 'MPESA'
type CheckoutStatus = 'form' | 'processing' | 'polling' | 'success' | 'failed'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, total, itemCount, clearCart } = useCartStore()

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOCK')
  const [status, setStatus] = useState<CheckoutStatus>('form')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const delivery = total >= 2000 ? 0 : 200
  const grandTotal = total + delivery

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && status === 'form') {
      router.push('/cart')
    }
  }, [items, status])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }

    setError('')
    setStatus('processing')

    try {
      const data = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phone,
          shipping_address: address,
          payment_method: paymentMethod,
        }),
      })

      if (paymentMethod === 'MPESA') {
        setOrderId(data.order_group_id || data.id)
        setStatus('polling')
        startPolling(data.order_group_id || data.id)
      } else {
        setStatus('success')
        clearCart()
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setStatus('form')
    }
  }

  const startPolling = (oid: number) => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/orders/${oid}/status`)
        if (data.status === 'PAID' || data.status === 'PROCESSING') {
          clearInterval(pollRef.current!)
          setStatus('success')
          clearCart()
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          clearInterval(pollRef.current!)
          setStatus('failed')
        }
      } catch {
        // keep polling
      }
    }, 3000)
  }

  // ── Success State ──
  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light dark:bg-primary-light/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
            Order Placed!
          </h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-2">
            Your order has been placed successfully. You&apos;ll receive a confirmation shortly.
          </p>
          <Link href="/" className="btn-pill-primary mt-6 inline-flex">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  // ── Failed State ──
  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-danger/10 flex items-center justify-center">
            <XCircle size={32} className="text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Failed
          </h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-2">
            The M-Pesa payment was not completed. Your order has been cancelled.
          </p>
          <button onClick={() => setStatus('form')} className="btn-pill-primary mt-6 inline-flex">Try Again</button>
        </div>
      </div>
    )
  }

  // ── Polling State (M-Pesa waiting) ──
  if (status === 'polling') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light dark:bg-primary-light/10 flex items-center justify-center animate-pulse-soft">
            <Smartphone size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
            Waiting for M-Pesa...
          </h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-2">
            An STK Push has been sent to <strong className="text-foreground dark:text-foreground-dark">{phone}</strong>. 
            Please check your phone and enter your M-Pesa PIN.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted">
            <Loader2 size={14} className="animate-spin" />
            Checking payment status...
          </div>
        </div>
      </div>
    )
  }

  // ── Checkout Form ──
  return (
    <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-danger/10 text-danger text-sm font-medium p-3 rounded-xl">
              ❌ {error}
            </div>
          )}

          {/* Shipping */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
              Shipping Details
            </h2>

            <div>
              <label className="text-xs font-semibold text-muted dark:text-muted-dark mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  required type="tel" placeholder="+254712345678"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-glass pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted dark:text-muted-dark mb-1.5 block">Shipping Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted" />
                <textarea
                  required placeholder="Nairobi, CBD, Kimathi Street..."
                  value={address} onChange={e => setAddress(e.target.value)}
                  className="input-glass pl-10 min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
              Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'MOCK' as PaymentMethod, icon: <CreditCard size={20} />, label: 'Mock Payment', desc: 'Simulate payment' },
                { value: 'MPESA' as PaymentMethod, icon: <Smartphone size={20} />, label: 'M-Pesa', desc: 'STK Push to your phone' },
              ]).map(opt => (
                <label
                  key={opt.value}
                  className={`glass rounded-xl p-4 cursor-pointer transition-all ${
                    paymentMethod === opt.value
                      ? 'border-primary ring-2 ring-primary/20 bg-primary-light/30 dark:bg-primary-light/5'
                      : 'hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio" name="payment" value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="sr-only"
                  />
                  <div className={`mb-2 ${paymentMethod === opt.value ? 'text-primary' : 'text-muted'}`}>
                    {opt.icon}
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-foreground-dark">{opt.label}</div>
                  <div className="text-[11px] text-muted dark:text-muted-dark">{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'processing'}
            className="btn-pill-accent w-full py-3.5 text-sm"
          >
            {status === 'processing' ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              `Place Order — KES ${grandTotal.toLocaleString()}`
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24">
            <h3 className="text-base font-bold mb-4 text-foreground dark:text-foreground-dark" style={{ fontFamily: 'var(--font-heading)' }}>
              Order Summary
            </h3>

            <div className="space-y-3 text-sm mb-4">
              {items.map(item => (
                <div key={item.product_id} className="flex justify-between">
                  <span className="text-muted dark:text-muted-dark truncate mr-2">{item.name} × {item.quantity}</span>
                  <span className="font-semibold text-foreground dark:text-foreground-dark shrink-0">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-border dark:border-border-dark my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted dark:text-muted-dark">
                <span>Subtotal</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted dark:text-muted-dark">
                <span>Delivery</span>
                <span className={delivery === 0 ? 'text-primary font-semibold' : ''}>
                  {delivery === 0 ? 'FREE' : `KES ${delivery}`}
                </span>
              </div>
              <hr className="border-border dark:border-border-dark" />
              <div className="flex justify-between font-bold text-base text-foreground dark:text-foreground-dark">
                <span>Total</span>
                <span>KES {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
