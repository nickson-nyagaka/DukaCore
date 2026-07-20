'use client'

import { useState, useEffect } from 'react'
import { ListOrdered, CheckCircle2, AlertCircle, Clock, Edit2, Search, X } from 'lucide-react'
import { useAuth, apiFetch } from '@/lib/auth'
import DataTable from '@/components/admin/DataTable'
import ModalAlert from '@/components/admin/ModalAlert'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  "PENDING": ["PROCESSING", "CANCELLED"],
  "PROCESSING": ["SHIPPED", "CANCELLED"],
  "SHIPPED": ["DELIVERED"],
  "DELIVERED": [],
  "CANCELLED": []
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal State
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [submittingStatus, setSubmittingStatus] = useState(false)
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (authLoading || !user) return
    fetchData()
  }, [user, authLoading, debouncedSearch])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const url = debouncedSearch ? `/api/orders?q=${encodeURIComponent(debouncedSearch)}` : '/api/orders'
      const data = await apiFetch(url)
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoadingData(false)
    }
  }

  const handleUpdateStatusClick = (order: any) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setModalAlert(null)
    setShowStatusModal(true)
  }

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) return
    
    setSubmittingStatus(true)
    setModalAlert(null)
    try {
      await apiFetch(`/api/orders/admin/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      setToast({ message: 'Order status updated!', type: 'success' })
      fetchData()
      setShowStatusModal(false)
      setSelectedOrder(null)
      setTimeout(() => setToast(null), 5000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to update status', type: 'error' })
    } finally {
      setSubmittingStatus(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Order ID', render: (val: any) => <span className="font-bold">#{val}</span> },
    { key: 'customer_email', label: 'Customer' },
    { key: 'total_amount', label: 'Total', render: (val: any) => `KES ${Number(val).toLocaleString()}` },
    { key: 'created_at', label: 'Date', render: (val: any) => new Date(val).toLocaleDateString() },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <span className={`badge-pill flex items-center gap-1 w-max ${
          status === 'DELIVERED' || status === 'SHIPPED'
            ? 'bg-success/10 text-success'
            : status === 'PROCESSING'
            ? 'bg-info/10 text-info'
            : status === 'PENDING'
            ? 'bg-warning/10 text-warning'
            : 'bg-danger/10 text-danger'
        }`}>
          {status === 'DELIVERED' || status === 'SHIPPED' ? (
            <CheckCircle2 size={12} />
          ) : status === 'PENDING' || status === 'PROCESSING' ? (
            <Clock size={12} />
          ) : (
            <AlertCircle size={12} />
          )}
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, o: any) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleUpdateStatusClick(o)}
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
            title="Update Status"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )
    }
  ]

  if (authLoading) return null

  return (
    <div className="animate-fade-in space-y-6 max-w-[1200px] pb-12">
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Customer Orders
        </h1>
        <p className="text-sm text-muted">Track and process orders placed in your store.</p>
      </div>

      {/* Server-Side Search Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <Search size={16} />
        </span>
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search by Order ID, Email, or Status..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {loadingData && (
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        // Disabling client side search keys because we do server-side
        searchKeys={[]}
      />

      {/* Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <button 
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-4 font-heading">Update Order #{selectedOrder.id}</h3>
            
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Status History</h4>
              <div className="space-y-3">
                {selectedOrder.status_history && selectedOrder.status_history.length > 0 ? (
                  selectedOrder.status_history.map((h: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        {i !== selectedOrder.status_history.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                      </div>
                      <div>
                        <p className="font-semibold">{h.from_status} → {h.to_status}</p>
                        <p className="text-xs text-muted">{new Date(h.changed_at).toLocaleString()} by {h.changed_by_email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">No history available.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">New Status</label>
                <select 
                  className="input-field"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value={selectedOrder.status}>{selectedOrder.status} (Current)</option>
                  {(ALLOWED_TRANSITIONS[selectedOrder.status] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {(ALLOWED_TRANSITIONS[selectedOrder.status] || []).length === 0 && (
                  <p className="text-xs text-danger mt-2">This order has reached a terminal state and cannot be changed.</p>
                )}
                {newStatus === 'CANCELLED' && (
                  <div className="mt-2 p-3 bg-danger/10 text-danger rounded-lg border border-danger/20 text-xs">
                    <AlertCircle size={14} className="inline mb-0.5 mr-1" />
                    <strong>Warning:</strong> If this order has been paid for, this action will be rejected. Process a refund instead. Unpaid cancelled orders will have their stock automatically restored.
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingStatus || newStatus === selectedOrder.status || (ALLOWED_TRANSITIONS[selectedOrder.status] || []).length === 0} 
                  className="btn-primary bg-success hover:bg-success/90 border-none flex-1 justify-center"
                >
                  {submittingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
