'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/auth'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/vouchers')
      setVouchers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/admin/vouchers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      })
      fetchVouchers()
    } catch (e) {
      console.error(e)
      alert('Failed to update voucher')
    }
  }

  if (loading) return null // triggers loading.tsx

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Vouchers</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Voucher
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface border-b border-border text-muted">
            <tr>
              <th className="p-4 font-semibold">Code</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Value</th>
              <th className="p-4 font-semibold">Usage</th>
              <th className="p-4 font-semibold">Valid Until</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vouchers.map(v => (
              <tr key={v.id} className="hover:bg-surface/50 transition-colors">
                <td className="p-4 font-bold font-mono text-primary">{v.code}</td>
                <td className="p-4">{v.discount_type}</td>
                <td className="p-4">{v.discount_type === 'PERCENT' ? `${v.value}%` : (v.discount_type === 'FIXED' ? `KES ${v.value}` : 'Free')}</td>
                <td className="p-4">
                  {v.usage_count} / {v.usage_limit_total || '∞'}
                </td>
                <td className="p-4">
                  {new Date(v.valid_until).toLocaleDateString()}
                  {!v.is_active && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500">Disabled</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleStatus(v.id, v.is_active)} className="px-3 py-1 bg-surface border border-border rounded-lg text-xs font-semibold hover:bg-border transition-colors">
                    {v.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">No vouchers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
