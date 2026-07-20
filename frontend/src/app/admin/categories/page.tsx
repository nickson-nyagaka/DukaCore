'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/auth'
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'
import ModalAlert from '@/components/admin/ModalAlert'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal alert state
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    icon: '🏷️',
    description: ''
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    icon: '',
    description: ''
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/categories')
      setCategories(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingAdd(true)
    setModalAlert(null)
    try {
      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(addForm)
      })
      setToast({ message: 'Category created successfully!', type: 'success' })
      setAddForm({ name: '', slug: '', icon: '🏷️', description: '' })
      fetchCategories()
      setShowAddModal(false)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to add category', type: 'error' })
    } finally {
      setSubmittingAdd(false)
    }
  }

  const handleEditClick = (c: any) => {
    setModalAlert(null)
    setSelectedCategoryId(c.id)
    setEditForm({
      name: c.name || '',
      slug: c.slug || '',
      icon: c.icon || '🏷️',
      description: c.description || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategoryId) return
    setSubmittingEdit(true)
    setModalAlert(null)
    try {
      await apiFetch(`/api/admin/categories/${selectedCategoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      })
      setToast({ message: 'Category updated successfully!', type: 'success' })
      fetchCategories()
      setShowEditModal(false)
      setSelectedCategoryId(null)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to update category', type: 'error' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setModalAlert(null)
    setCategoryToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    setSubmittingDelete(true)
    setModalAlert(null)
    try {
      await apiFetch(`/api/admin/categories/${categoryToDelete}`, { method: 'DELETE' })
      setToast({ message: 'Category deleted successfully!', type: 'success' })
      fetchCategories()
      setShowDeleteModal(false)
      setCategoryToDelete(null)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to delete category', type: 'error' })
    } finally {
      setSubmittingDelete(false)
    }
  }

  if (loading) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-[1200px] pb-12">
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">Categories</h1>
          <p className="text-sm text-muted mt-0.5">Manage store categories displayed on the marketplace.</p>
        </div>
        <button 
          onClick={() => { setModalAlert(null); setShowAddModal(true) }} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden border border-border">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface border-b border-border text-muted">
            <tr className="text-xs font-bold uppercase tracking-wider">
              <th className="p-4 pl-6">Icon</th>
              <th className="p-4">Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-primary-light/5 transition-colors">
                <td className="p-4 pl-6 text-2xl">{c.icon || '🏷️'}</td>
                <td className="p-4 font-bold text-foreground">{c.name}</td>
                <td className="p-4 font-mono text-xs text-muted">{c.slug}</td>
                <td className="p-4 text-muted max-w-xs truncate">{c.description || '—'}</td>
                <td className="p-4 text-right pr-6">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => handleEditClick(c)}
                      className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(c.id)}
                      className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted">
                  No categories found. Click "Add Category" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Add New Category</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-muted mb-1">Category Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={addForm.name} 
                    onChange={e => setAddForm({ ...addForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Emoji Icon</label>
                  <input 
                    type="text" 
                    maxLength={10} 
                    className="input-field text-center text-lg" 
                    value={addForm.icon} 
                    onChange={e => setAddForm({ ...addForm, icon: e.target.value })} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Slug (URL string)</label>
                <input 
                  type="text" 
                  required 
                  className="input-field font-mono text-xs" 
                  value={addForm.slug} 
                  onChange={e => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Description</label>
                <textarea 
                  rows={3} 
                  className="input-field text-sm" 
                  value={addForm.description} 
                  onChange={e => setAddForm({ ...addForm, description: e.target.value })} 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAdd} className="btn-primary bg-success hover:bg-success/90 border-none flex-1 justify-center">
                  {submittingAdd ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <button 
              onClick={() => { setShowEditModal(false); setSelectedCategoryId(null) }}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Edit Category</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-muted mb-1">Category Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Emoji Icon</label>
                  <input 
                    type="text" 
                    maxLength={10} 
                    className="input-field text-center text-lg" 
                    value={editForm.icon} 
                    onChange={e => setEditForm({ ...editForm, icon: e.target.value })} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Slug (URL string)</label>
                <input 
                  type="text" 
                  required 
                  className="input-field font-mono text-xs" 
                  value={editForm.slug} 
                  onChange={e => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Description</label>
                <textarea 
                  rows={3} 
                  className="input-field text-sm" 
                  value={editForm.description} 
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedCategoryId(null) }} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="btn-primary bg-success hover:bg-success/90 border-none flex-1 justify-center">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-danger/10 text-danger mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-xl mb-2 font-heading text-center">Delete Category?</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            <p className="text-muted text-center text-sm mb-6">
              Are you sure you want to delete this category? This action will not delete associated products, but they will be uncategorized.
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null) }} 
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                disabled={submittingDelete} 
                className="btn-primary flex-1 justify-center bg-danger hover:bg-danger/90 text-white border-none"
              >
                {submittingDelete ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
