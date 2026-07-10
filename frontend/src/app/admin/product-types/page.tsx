'use client' 

import { useState, useEffect } from 'react'
import { Plus, Layers, ShieldAlert, Check, X } from 'lucide-react'
import { useAuth, apiFetch } from '@/lib/auth'
import ModalAlert from '@/components/admin/ModalAlert'

export default function AdminProductTypesPage() {
  const { user, loading: authLoading } = useAuth()
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState({
    name: '',
    schema_fields: [] as any[]
  })
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text', required: false })

  useEffect(() => {
    if (authLoading || !user) return
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const data = await apiFetch('/api/admin/product-types')
      setProductTypes(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error fetching schemas:', e)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddFieldToSchema = () => {
    if (!newField.name || !newField.label) return
    
    // Normalize field name to snake_case
    const name = newField.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    
    setNewType({
      ...newType,
      schema_fields: [...newType.schema_fields, { ...newField, name }]
    })
    setNewField({ name: '', label: '', type: 'text', required: false })
  }

  const handleRemoveField = (idx: number) => {
    const updated = [...newType.schema_fields]
    updated.splice(idx, 1)
    setNewType({ ...newType, schema_fields: updated })
  }

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newType.name || newType.schema_fields.length === 0) return
    setModalAlert(null)
    try {
      await apiFetch('/api/admin/product-types', {
        method: 'POST',
        body: JSON.stringify({
          name: newType.name,
          schema: newType.schema_fields
        })
      })
      setToast({ message: 'Schema created successfully!', type: 'success' })
      fetchData()
      setShowAddType(false)
      setNewType({ name: '', schema_fields: [] })
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to create schema', type: 'error' })
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
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Dynamic Schemas
          </h1>
          <p className="text-sm text-muted">Create custom attributes and schemas for products.</p>
        </div>
        {!showAddType && (
          <button onClick={() => { setModalAlert(null); setShowAddType(true); }} className="btn-pill-primary">
            <Plus size={16} /> Define Schema
          </button>
        )}
      </div>

      {showAddType && (
        <div className="glass rounded-2xl p-6 animate-slide-up space-y-5">
          <h3 className="text-lg font-bold">Create Product Schema</h3>
          <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">Schema Name</label>
              <input required type="text" className="input-glass" placeholder="e.g. Mattress, Smart Phone"
                value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} />
            </div>

            <div className="bg-primary-light/35 dark:bg-primary-light/5 p-4 rounded-xl border border-primary/20">
              <h4 className="text-sm font-bold text-primary mb-3">Define Fields</h4>
              
              {newType.schema_fields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {newType.schema_fields.map((f: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-card p-2.5 rounded-lg border border-border">
                      <span className="text-xs font-medium">
                        <strong className="font-bold text-foreground">{f.label}</strong> ({f.name}) — <em className="text-muted">{f.type}</em>
                        {f.required && <span className="text-danger ml-1 font-bold">*</span>}
                      </span>
                      <button type="button" onClick={() => handleRemoveField(idx)} className="text-danger hover:bg-danger/10 p-1 rounded transition-colors cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Field Label</label>
                  <input type="text" className="input-glass text-sm" placeholder="Firmness"
                    value={newField.label} onChange={e => {
                      const name = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_')
                      setNewField({ ...newField, label: e.target.value, name })
                    }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Field ID</label>
                  <input type="text" className="input-glass text-sm font-mono" placeholder="firmness_rating"
                    value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
                  <select className="input-glass text-sm" value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <input
                      type="checkbox"
                      id="field_req"
                      checked={newField.required}
                      onChange={e => setNewField({ ...newField, required: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                    />
                    <label htmlFor="field_req" className="text-xs font-semibold text-muted">Required</label>
                  </div>
                  <button type="button" onClick={handleAddFieldToSchema} className="btn-pill-outline w-full text-xs py-2 h-fit">
                    Add Field
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-pill-primary" disabled={newType.schema_fields.length === 0}>
                Save Schema
              </button>
              <button type="button" onClick={() => { setShowAddType(false); setNewType({ name: '', schema_fields: [] }) }} className="btn-pill-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schema Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productTypes.length === 0 ? (
          <div className="col-span-full text-center text-muted py-12 glass rounded-2xl flex flex-col items-center justify-center gap-2">
            <Layers size={32} className="text-muted/50" />
            <span>No schemas defined yet.</span>
          </div>
        ) : (
          productTypes.map(t => (
            <div key={t.id} className="glass rounded-2xl p-5 hover:border-primary/20 transition-all">
              <div className="font-bold text-foreground text-base">{t.name}</div>
              <div className="text-[10px] font-mono text-muted mt-1 leading-none">ID: {t.id}</div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {t.schema.map((f: any, idx: number) => (
                  <span key={idx} className="badge-pill bg-primary-light text-primary text-[10px] flex items-center gap-1">
                    <span>{f.label}</span>
                    <span className="text-[9px] text-primary/60 font-mono">({f.type}{f.required ? '*' : ''})</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
