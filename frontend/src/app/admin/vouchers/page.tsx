'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ShieldAlert, RefreshCw, X } from 'lucide-react'
import { useAuth, apiFetch } from '@/lib/auth'
import DataTable from '@/components/admin/DataTable'
import ModalAlert from '@/components/admin/ModalAlert'

export default function AdminVouchersPage() {
  const { user, loading: authLoading } = useAuth()
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  
  // Form states
  const [formData, setFormData] = useState<any>({
    code: '',
    discount_type: 'PERCENT',
    value: 0,
    min_order_value: 0,
    usage_limit_total: '',
    is_unlimited: true,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!authLoading && user) {
      fetchVouchers()
    }
  }, [authLoading, user])

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/vouchers')
      setVouchers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setFormData({
      code: '',
      discount_type: 'PERCENT',
      value: 0,
      min_order_value: 0,
      usage_limit_total: '',
      is_unlimited: true,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      is_active: true
    })
    setSelectedVoucher(null)
    setShowFormModal(true)
  }

  const handleEdit = (v: any) => {
    setFormData({
      ...v,
      valid_from: new Date(v.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(v.valid_until).toISOString().slice(0, 16),
      is_unlimited: v.usage_limit_total === null,
      usage_limit_total: v.usage_limit_total || ''
    })
    setSelectedVoucher(v)
    setShowFormModal(true)
  }

  const handleDeleteClick = (v: any) => {
    setSelectedVoucher(v)
    setShowDeleteModal(true)
  }

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    setFormData({ ...formData, code })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (payload.is_unlimited) {
        payload.usage_limit_total = null
      } else {
        payload.usage_limit_total = parseInt(payload.usage_limit_total)
      }
      if (payload.discount_type === 'FREE_SHIPPING') {
        payload.value = null
      } else {
        payload.value = parseFloat(payload.value)
      }
      payload.min_order_value = parseFloat(payload.min_order_value)
      payload.valid_from = new Date(payload.valid_from).toISOString()
      payload.valid_until = new Date(payload.valid_until).toISOString()
      
      delete payload.is_unlimited

      if (selectedVoucher) {
        await apiFetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
        setToast({ message: 'Voucher updated successfully', type: 'success' })
      } else {
        await apiFetch('/api/admin/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setToast({ message: 'Voucher created successfully', type: 'success' })
      }
      
      setShowFormModal(false)
      fetchVouchers()
    } catch (err: any) {
      alert(err.message || 'Failed to save voucher')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedVoucher || !isAdmin) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE'
      })
      setToast({ message: 'Voucher deleted successfully', type: 'success' })
      setShowDeleteModal(false)
      fetchVouchers()
    } catch (e: any) {
      alert(e.message || 'Failed to delete')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    if (!isAdmin) return
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

  const columns = [
    { key: 'code', label: 'Code', render: (val: any) => <span className="font-bold font-mono text-primary">{val}</span> },
    { key: 'discount_type', label: 'Type' },
    { 
      key: 'value', 
      label: 'Value', 
      render: (val: any, row: any) => row.discount_type === 'PERCENT' ? `${val}%` : (row.discount_type === 'FIXED' ? `KES ${val}` : 'Free') 
    },
    { 
      key: 'usage', 
      label: 'Usage', 
      render: (_: any, row: any) => `${row.usage_count} / ${row.usage_limit_total || '∞'}` 
    },
    { 
      key: 'valid_until', 
      label: 'Valid Until', 
      render: (val: any, row: any) => (
        <span>
          {new Date(val).toLocaleDateString()}
          {!row.is_active && <span className="ml-2 px-2 py-1 rounded-full text-[10px] font-bold bg-danger/10 text-danger uppercase tracking-wider">Deactivated</span>}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, v: any) => (
        <div className="flex justify-end gap-1.5">
          {isAdmin ? (
            <>
              <button onClick={() => toggleStatus(v.id, v.is_active)} className="px-2 py-1 bg-surface border border-border rounded-lg text-xs font-semibold hover:bg-border transition-colors">
                {v.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleEdit(v)} className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-primary transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDeleteClick(v)} className="p-1.5 rounded-lg bg-surface border border-border text-danger hover:bg-danger/10 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <span className="text-xs text-muted italic">View Only</span>
          )}
        </div>
      )
    }
  ]

  if (authLoading || loading) return null

  return (
    <div className="animate-fade-in space-y-6 max-w-[1200px] pb-12">
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Vouchers & Discounts
          </h1>
          <p className="text-sm text-muted">Manage promotional codes and discounts.</p>
        </div>
        {isAdmin && (
          <button onClick={handleCreateNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Voucher
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-warning/10 text-warning p-4 rounded-xl text-sm flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>You are logged in as STAFF. You can view voucher performance and usage metrics, but creation, modification, and deletion are restricted to ADMIN roles.</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={vouchers}
        searchKeys={['code', 'discount_type']}
        searchPlaceholder="Search by code or type..."
      />

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl my-8">
            <button 
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-4 font-heading">{selectedVoucher ? 'Edit Voucher' : 'Create Voucher'}</h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-muted mb-1">Voucher Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      className="input-field uppercase font-mono" 
                      value={formData.code} 
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. SUMMER2026"
                    />
                    <button type="button" onClick={handleGenerateCode} className="btn-secondary px-3" title="Generate Random">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Discount Type</label>
                  <select 
                    className="input-field" 
                    value={formData.discount_type}
                    onChange={e => setFormData({...formData, discount_type: e.target.value})}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (KES)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>

                {formData.discount_type !== 'FREE_SHIPPING' && (
                  <div>
                    <label className="block text-sm font-semibold text-muted mb-1">Value</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required 
                      className="input-field" 
                      value={formData.value} 
                      onChange={e => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Min Order Value (KES)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={formData.min_order_value} 
                    onChange={e => setFormData({...formData, min_order_value: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Usage Limit</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      disabled={formData.is_unlimited}
                      className="input-field" 
                      placeholder="Total allowed"
                      value={formData.usage_limit_total} 
                      onChange={e => setFormData({...formData, usage_limit_total: e.target.value})}
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="rounded bg-surface border-border text-primary focus:ring-primary"
                        checked={formData.is_unlimited}
                        onChange={e => setFormData({...formData, is_unlimited: e.target.checked})}
                      />
                      Unlimited
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Valid From</label>
                  <input 
                    type="datetime-local" 
                    required 
                    className="input-field" 
                    value={formData.valid_from} 
                    onChange={e => setFormData({...formData, valid_from: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Valid Until</label>
                  <input 
                    type="datetime-local" 
                    required 
                    className="input-field" 
                    value={formData.valid_until} 
                    onChange={e => setFormData({...formData, valid_until: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary bg-success hover:bg-success/90 border-none flex-1 justify-center">
                  {submitting ? 'Saving...' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl p-6 relative border border-border shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl font-heading mb-1">Delete Voucher?</h3>
                <p className="text-sm text-muted">
                  Are you sure you want to hard-delete the voucher <strong className="text-foreground">{selectedVoucher.code}</strong>?
                </p>
              </div>
              
              <div className="w-full bg-surface p-3 rounded-lg border border-border text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted">Total Usages:</span>
                  <span className="font-bold">{selectedVoucher.usage_count}</span>
                </div>
                <p className="text-xs text-muted text-left mt-2 italic">
                  Note: Hard deletion is safe because past orders have frozen discount snapshots.
                </p>
              </div>

              <div className="w-full flex gap-3 pt-2">
                <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={submitting} className="bg-danger text-white hover:bg-danger/90 px-4 py-2.5 rounded-xl font-semibold transition-all flex-1 justify-center">
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
