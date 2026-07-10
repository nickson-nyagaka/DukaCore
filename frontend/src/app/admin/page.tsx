'use client' 

import { useState, useEffect } from 'react'
import { useAuth, apiFetch } from '@/lib/auth'
import { ShoppingBag, DollarSign, TrendingUp, Users, Box, AlertTriangle, RefreshCw } from 'lucide-react'

function KPICard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:scale-[1.015] hover:shadow-lg">
      <div className="p-3 rounded-xl shrink-0" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-2xl font-black mt-1 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    setLoadingData(true)
    setError(null)
    try {
      const data = await apiFetch('/api/admin/metrics/dashboard')
      setMetrics(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load metrics')
    } finally {
      setLoadingData(false)
    }
  }

  if (authLoading || loadingData) return null // triggers loading.tsx

  return (
    <div className="space-y-8 pb-12 max-w-[1200px]">

      {/* Welcome Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Good {getGreeting()}, {user?.first_name}!
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Here is a live snapshot of your store's performance.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-primary/10 hover:text-primary"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--danger)/10', color: 'var(--danger)', border: '1px solid var(--danger)/20' }}>
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard
          icon={<DollarSign size={22} />}
          label="Revenue Today"
          value={`KES ${(metrics?.revenue_today ?? 0).toLocaleString()}`}
          sub={metrics?.revenue_trend_pct !== undefined ? `${metrics.revenue_trend_pct >= 0 ? '+' : ''}${metrics.revenue_trend_pct}% vs yesterday` : undefined}
          color="var(--primary)"
        />
        <KPICard
          icon={<ShoppingBag size={22} />}
          label="Orders Today"
          value={String(metrics?.orders_today ?? 0)}
          sub={metrics?.orders_trend_pct !== undefined ? `${metrics.orders_trend_pct >= 0 ? '+' : ''}${metrics.orders_trend_pct}% vs yesterday` : undefined}
          color="var(--accent)"
        />
        <KPICard
          icon={<TrendingUp size={22} />}
          label="Avg Order Value"
          value={`KES ${(metrics?.average_order_value ?? 0).toLocaleString()}`}
          sub="Rolling 30 days"
          color="#3B82F6"
        />
        <KPICard
          icon={<Users size={22} />}
          label="Conversion Rate"
          value={`${metrics?.conversion_rate ?? 0}%`}
          sub="Rolling 30 days"
          color="#8B5CF6"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Products */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Box size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Top Products — Last 7 Days</h3>
          </div>
          {metrics?.top_products?.length > 0 ? (
            <div className="space-y-2">
              {metrics.top_products.map((p: any, i: number) => (
                <div
                  key={p.product__id}
                  className="flex justify-between items-center px-4 py-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{ background: 'var(--primary)' }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold">{p.product__name}</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {p.units_sold} sold
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
              <Box size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No sales data for the last 7 days.</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Store Stats */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Store Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center px-3 py-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{metrics?.active_products ?? 0}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: 'var(--muted)' }}>Active Products</p>
              </div>
              <div className="text-center px-3 py-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{metrics?.repeat_purchase_rate ?? 0}%</p>
                <p className="text-xs font-semibold mt-1" style={{ color: 'var(--muted)' }}>Repeat Rate</p>
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="glass rounded-2xl p-5" style={{ border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
              <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--danger)' }}>Low Stock Alerts</h3>
            </div>
            {metrics?.low_stock_alerts?.length > 0 ? (
              <div className="space-y-2">
                {metrics.low_stock_alerts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center px-3 py-2.5 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--danger) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 15%, transparent)' }}
                  >
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: 'var(--danger)' }}>{p.stock_quantity} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>All products are well stocked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
