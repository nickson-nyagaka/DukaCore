'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/auth'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import ModalAlert from '@/components/admin/ModalAlert'

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [linkAddresses, setLinkAddresses] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)



  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
  })
  const [editImageFiles, setEditImageFiles] = useState<File[]>([])
  const [editLinkAddresses, setEditLinkAddresses] = useState<string[]>([])
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/api/admin/categories')
      setCategories(data)
    } catch (e) {
      console.error(e)
    }
  }



  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/products')
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (p: any) => {
    setModalAlert(null)
    setSelectedProductId(p.id)
    setEditForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price) || '',
      stock_quantity: String(p.stock_quantity) || '',
      category_id: p.category_id ? String(p.category_id) : '',
    })
    setEditImageFiles([])
    setEditLinkAddresses(p.image_urls || [])
    setShowEditModal(true)
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return
    setModalAlert(null)

    const activeLinks = editLinkAddresses.filter(l => l.trim() !== '')
    if (editImageFiles.length === 0 && activeLinks.length === 0) {
      setModalAlert({ message: 'Please provide at least one product picture (upload or link)!', type: 'error' })
      return
    }

    setSubmittingEdit(true)
    try {
      const urls: string[] = []

      // 1. Upload new image files if selected
      for (const file of editImageFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await apiFetch('/api/admin/products/upload', {
          method: 'POST',
          body: formData
        })
        if (uploadRes && uploadRes.url) {
          urls.push(uploadRes.url)
        }
      }

      // 2. Add external link/existing addresses
      urls.push(...activeLinks)

      // 3. Update product
      await apiFetch(`/api/admin/products/${selectedProductId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          stock_quantity: parseInt(editForm.stock_quantity),
          category_id: editForm.category_id ? parseInt(editForm.category_id) : null,
          image_urls: urls
        })
      })

      setToast({ message: 'Product updated successfully!', type: 'success' })
      setShowEditModal(false)
      setSelectedProductId(null)
      setModalAlert(null)
      fetchProducts()
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to update product', type: 'error' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setModalAlert(null)
    setProductToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    setSubmittingDelete(true)
    setModalAlert(null)
    try {
      await apiFetch(`/api/admin/products/${productToDelete}`, { method: 'DELETE' })
      setToast({ message: 'Product deleted successfully!', type: 'success' })
      setShowDeleteModal(false)
      setProductToDelete(null)
      fetchProducts()
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete product', type: 'error' })
      setShowDeleteModal(false)
      setProductToDelete(null)
    } finally {
      setSubmittingDelete(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalAlert(null)
    
    const activeLinks = linkAddresses.filter(l => l.trim() !== '')
    if (imageFiles.length === 0 && activeLinks.length === 0) {
      setModalAlert({ message: 'Please provide at least one product picture (upload or link)!', type: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const urls: string[] = []
      
      // Upload files
      for (const file of imageFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await apiFetch('/api/admin/products/upload', {
          method: 'POST',
          body: formData
        })
        if (uploadRes && uploadRes.url) {
          urls.push(uploadRes.url)
        }
      }

      // Add link addresses
      urls.push(...activeLinks)

      // Create product
      await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock_quantity: parseInt(form.stock_quantity),
          category_id: form.category_id ? parseInt(form.category_id) : null,
          image_urls: urls,
          is_active: true
        })
      })

      setToast({ message: 'Product created successfully!', type: 'success' })
      setForm({ name: '', description: '', price: '', stock_quantity: '', category_id: '' })
      setImageFiles([])
      setLinkAddresses([])
      fetchProducts()
      setShowModal(false)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to add product', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null // triggers loading.tsx

  return (
    <div className="space-y-6 relative animate-fade-in">
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Products</h1>
        <button onClick={() => { setModalAlert(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface border-b border-border text-muted">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Stock</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">KES {p.price}</td>
                <td className="p-4">{p.stock_quantity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEditClick(p)} className="p-2 text-muted hover:text-primary transition-colors cursor-pointer">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteClick(p.id)} className="p-2 text-muted hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Add New Product</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">
                  Upload Product Pictures
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-surface/50 hover:bg-surface transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={e => e.target.files && setImageFiles(Array.from(e.target.files))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imageFiles.length > 0 ? (
                    <div className="text-center w-full px-4">
                      <ImageIcon className="mx-auto text-primary mb-2 animate-pulse" size={32} />
                      <p className="text-sm font-semibold text-primary">{imageFiles.length} file(s) selected</p>
                      <div className="text-[10px] text-muted max-h-16 overflow-y-auto mt-2 space-y-0.5 divide-y divide-border/30 bg-card/50 p-2 rounded-lg border border-border">
                        {imageFiles.map((file, idx) => (
                          <div key={idx} className="truncate text-left py-0.5">{file.name}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-muted mb-2 group-hover:text-primary transition-colors" size={32} />
                      <p className="text-sm text-muted">Click to select files (Supports multiple)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Picture Link Addresses */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <label className="block text-sm font-semibold text-muted">Or Add Picture Link Addresses</label>
                {linkAddresses.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="https://example.com/image.jpg" 
                      className="input-field text-xs flex-1" 
                      value={link}
                      onChange={e => {
                        const copy = [...linkAddresses]
                        copy[idx] = e.target.value
                        setLinkAddresses(copy)
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setLinkAddresses(linkAddresses.filter((_, i) => i !== idx))} 
                      className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setLinkAddresses([...linkAddresses, ''])}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1 mt-1"
                >
                  + Add Picture URL
                </button>
              </div>



              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" required className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Description</label>
                <textarea rows={3} className="input-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Category</label>
                <select 
                  className="input-field" 
                  value={form.category_id} 
                  onChange={e => setForm({...form, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Price (KES) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Stock Quantity <span className="text-red-500">*</span></label>
                  <input type="number" required className="input-field" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Uploading & Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Edit Product</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleEditProduct} className="space-y-4">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">
                  Upload Product Pictures
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-surface/50 hover:bg-surface transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={e => e.target.files && setEditImageFiles(Array.from(e.target.files))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {editImageFiles.length > 0 ? (
                    <div className="text-center w-full px-4">
                      <ImageIcon className="mx-auto text-primary mb-2 animate-pulse" size={32} />
                      <p className="text-sm font-semibold text-primary">{editImageFiles.length} file(s) selected</p>
                      <div className="text-[10px] text-muted max-h-16 overflow-y-auto mt-2 space-y-0.5 divide-y divide-border/30 bg-card/50 p-2 rounded-lg border border-border">
                        {editImageFiles.map((file, idx) => (
                          <div key={idx} className="truncate text-left py-0.5">{file.name}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-muted mb-2 group-hover:text-primary transition-colors" size={32} />
                      <p className="text-sm text-muted">Click to select files to replace current pictures</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Picture Link Addresses */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <label className="block text-sm font-semibold text-muted">Or Edit Picture Link Addresses</label>
                {editLinkAddresses.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="https://example.com/image.jpg" 
                      className="input-field text-xs flex-1" 
                      value={link}
                      onChange={e => {
                        const copy = [...editLinkAddresses]
                        copy[idx] = e.target.value
                        setEditLinkAddresses(copy)
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setEditLinkAddresses(editLinkAddresses.filter((_, i) => i !== idx))} 
                      className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setEditLinkAddresses([...editLinkAddresses, ''])}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1 mt-1"
                >
                  + Add Picture URL
                </button>
              </div>



              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" required className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Description</label>
                <textarea rows={3} className="input-field" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Category</label>
                <select 
                  className="input-field" 
                  value={editForm.category_id} 
                  onChange={e => setEditForm({...editForm, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Price (KES) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required className="input-field" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Stock Quantity <span className="text-red-500">*</span></label>
                  <input type="number" required className="input-field" value={editForm.stock_quantity} onChange={e => setEditForm({...editForm, stock_quantity: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="btn-primary flex-1 justify-center">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative border border-border shadow-2xl">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-3 font-heading text-red-500 flex items-center gap-2">
              <AlertTriangle size={24} /> Delete Product
            </h3>
            <p className="text-sm text-muted mb-6">Are you sure you want to delete this product? This action cannot be undone and will hide the product from the marketplace.</p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)} 
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
