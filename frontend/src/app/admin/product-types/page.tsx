'use client' 

import { useState, useEffect } from 'react'
import { Plus, Layers, ShieldAlert, Check, X, Edit2, Trash2 } from 'lucide-react'
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

  // Edit Schema State
  const [showEditType, setShowEditType] = useState(false)
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)
  const [editTypeForm, setEditTypeForm] = useState({
    name: '',
    schema_fields: [] as any[]
  })
  const [editNewField, setEditNewField] = useState({ name: '', label: '', type: 'text', required: false })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete Schema State
  const [showDeleteType, setShowDeleteType] = useState(false)
  const [schemaToDelete, setSchemaToDelete] = useState<any>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

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

  const handleEditClick = (pt: any) => {
    setModalAlert(null)
    setSelectedSchemaId(pt.id)
    setEditTypeForm({
      name: pt.name || '',
      schema_fields: pt.schema || []
    })
    setEditNewField({ name: '', label: '', type: 'text', required: false })
    setShowEditType(true)
  }

  const handleAddEditField = () => {
    if (!editNewField.name || !editNewField.label) return
    const name = editNewField.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    setEditTypeForm({
      ...editTypeForm,
      schema_fields: [...editTypeForm.schema_fields, { ...editNewField, name }]
    })
    setEditNewField({ name: '', label: '', type: 'text', required: false })
  }

  const handleRemoveEditField = (idx: number) => {
    const updated = [...editTypeForm.schema_fields]
    updated.splice(idx, 1)
    setEditTypeForm({ ...editTypeForm, schema_fields: updated })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchemaId || !editTypeForm.name || editTypeForm.schema_fields.length === 0) return
    setModalAlert(null)
    setSubmittingEdit(true)
    try {
      await apiFetch(`/api/admin/product-types/${selectedSchemaId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editTypeForm.name,
          schema: editTypeForm.schema_fields
        })
      })
      setToast({ message: 'Schema updated successfully!', type: 'success' })
      fetchData()
      setShowEditType(false)
      setSelectedSchemaId(null)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to update schema', type: 'error' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDeleteClick = (pt: any) => {
    setModalAlert(null)
    setSchemaToDelete(pt)
    setShowDeleteType(true)
  }

  const handleDeleteConfirm = async () => {
    if (!schemaToDelete) return
    setSubmittingDelete(true)
    try {
      await apiFetch(`/api/admin/product-types/${schemaToDelete.id}`, { method: 'DELETE' })
      setToast({ message: 'Schema deleted successfully!', type: 'success' })
      fetchData()
      setShowDeleteType(false)
      setSchemaToDelete(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete schema', type: 'error' })
      setShowDeleteType(false)
      setSchemaToDelete(null)
    } finally {
      setSubmittingDelete(false)
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
            <div key={t.id} className="glass rounded-2xl p-5 hover:border-primary/20 transition-all relative group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-foreground text-base">{t.name}</div>
                  <div className="text-[10px] font-mono text-muted mt-1 leading-none">ID: {t.id}</div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(t)} className="p-1.5 text-muted hover:text-primary transition-colors cursor-pointer rounded-lg bg-surface hover:bg-surface-light border border-border">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteClick(t)} className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer rounded-lg bg-surface hover:bg-surface-light border border-border">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              
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
      {showEditType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditType(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Edit Product Schema</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted mb-1.5 block">Schema Name</label>
                <input required type="text" className="input-glass" placeholder="e.g. Mattress, Smart Phone"
                  value={editTypeForm.name} onChange={e => setEditTypeForm({ ...editTypeForm, name: e.target.value })} />
              </div>

              <div className="bg-primary-light/35 dark:bg-primary-light/5 p-4 rounded-xl border border-primary/20">
                <h4 className="text-sm font-bold text-primary mb-3">Modify Fields</h4>
                
                {editTypeForm.schema_fields.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {editTypeForm.schema_fields.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-card p-2.5 rounded-lg border border-border">
                        <span className="text-xs font-medium">
                          <strong className="font-bold text-foreground">{f.label}</strong> ({f.name}) — <em className="text-muted">{f.type}</em>
                          {f.required && <span className="text-danger ml-1 font-bold">*</span>}
                        </span>
                        <button type="button" onClick={() => handleRemoveEditField(idx)} className="text-danger hover:bg-danger/10 p-1 rounded transition-colors cursor-pointer">
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
                      value={editNewField.label} onChange={e => {
                        const name = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_')
                        setEditNewField({ ...editNewField, label: e.target.value, name })
                      }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Field ID</label>
                    <input type="text" className="input-glass text-sm font-mono" placeholder="firmness_rating"
                      value={editNewField.name} onChange={e => setEditNewField({ ...editNewField, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
                    <select className="input-glass text-sm" value={editNewField.type} onChange={e => setEditNewField({ ...editNewField, type: e.target.value })}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <input
                        type="checkbox"
                        id="field_req_edit"
                        checked={editNewField.required}
                        onChange={e => setEditNewField({ ...editNewField, required: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                      />
                      <label htmlFor="field_req_edit" className="text-xs font-semibold text-muted">Required</label>
                    </div>
                    <button type="button" onClick={handleAddEditField} className="btn-pill-outline w-full text-xs py-2 h-fit">
                      Add Field
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditType(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit || editTypeForm.schema_fields.length === 0} className="btn-primary flex-1 justify-center">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <button 
              onClick={() => setShowDeleteType(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-3 font-heading text-danger flex items-center gap-2">
              <ShieldAlert size={24} /> Delete Product Schema
            </h3>
            <p className="text-sm text-muted mb-6">Are you sure you want to delete the schema <strong>{schemaToDelete?.name}</strong>? This action cannot be undone and will affect products linked to it.</p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowDeleteType(false)} 
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                disabled={submittingDelete}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1 justify-center border-none text-white font-bold"
              >
                {submittingDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
