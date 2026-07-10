'use client'

import { useState, useEffect } from 'react'
import { ListOrdered, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useAuth, apiFetch } from '@/lib/auth'

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const data = await apiFetch('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoadingData(false)
    }
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Customer Orders
        </h1>
        <p className="text-sm text-muted">Track and process orders placed in your store.</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center text-muted py-12 glass rounded-2xl flex flex-col items-center justify-center gap-2">
            <ListOrdered size={32} className="text-muted/50" />
            <span>No orders placed yet.</span>
          </div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="glass rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/20 transition-all">
              <div className="space-y-1">
                <div className="font-bold text-foreground text-base">Order #{o.id}</div>
                <div className="text-xs text-muted">
                  Customer: <strong className="text-foreground">{o.customer_email}</strong> | Total: <strong className="text-foreground">KES {Number(o.total_amount).toLocaleString()}</strong>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`badge-pill flex items-center gap-1 ${
                  o.status === 'PROCESSING' || o.status === 'PAID' || o.status === 'DELIVERED'
                    ? 'bg-success/10 text-success'
                    : o.status === 'PENDING'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {o.status === 'DELIVERED' || o.status === 'PAID' ? (
                    <CheckCircle2 size={12} />
                  ) : o.status === 'PENDING' ? (
                    <Clock size={12} />
                  ) : (
                    <AlertCircle size={12} />
                  )}
                  {o.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
