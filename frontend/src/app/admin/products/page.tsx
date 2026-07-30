'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/auth'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, AlertTriangle, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import ModalAlert from '@/components/admin/ModalAlert'
import RichTextEditor from '@/components/RichTextEditor'

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
    is_active: true,
    discount_price: '',
    flash_sale_end_date: '',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [linkAddresses, setLinkAddresses] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [attributes, setAttributes] = useState<{name: string, type: string, value: string}[]>([])  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_active: true,
    discount_price: '',
    flash_sale_end_date: '',
  })
  const [editImageFiles, setEditImageFiles] = useState<File[]>([])
  const [editLinkAddresses, setEditLinkAddresses] = useState<string[]>([])
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editAttributes, setEditAttributes] = useState<{name: string, type: string, value: string}[]>([])

  // Quick toggle active status directly from table row
  const handleToggleActive = async (product: any) => {
    try {
      const updatedStatus = !product.is_active
      await apiFetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: updatedStatus })
      })
      setToast({
        message: `Product "${product.name}" is now ${updatedStatus ? 'Active' : 'Inactive'}`,
        type: 'success'
      })
      fetchProducts()
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update product status', type: 'error' })
    }
  }

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Datatable States
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter products
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase()
    const nameMatch = p.name?.toLowerCase().includes(search)
    const descMatch = p.description?.toLowerCase().includes(search)
    const cat = categories.find(c => c.id === p.category_id)
    const catMatch = cat ? cat.name?.toLowerCase().includes(search) : false
    return nameMatch || descMatch || catMatch
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]

    if (sortField === 'price') {
      valA = parseFloat(valA) || 0
      valB = parseFloat(valB) || 0
    } else if (sortField === 'stock_quantity') {
      valA = parseInt(valA) || 0
      valB = parseInt(valB) || 0
    } else {
      valA = String(valA || '').toLowerCase()
      valB = String(valB || '').toLowerCase()
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginate products
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const indexOfLastProduct = currentPage * itemsPerPage
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

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
      is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
      discount_price: p.discount_price ? String(p.discount_price) : '',
      flash_sale_end_date: p.flash_sale_end_date ? new Date(p.flash_sale_end_date).toISOString().slice(0, 16) : '',
    })
    setEditImageFiles([])
    setEditLinkAddresses(p.image_urls || [])
    setEditAttributes(p.attributes || [])
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
          image_urls: urls,
          is_active: editForm.is_active,
          attributes: editAttributes,
          discount_price: editForm.discount_price ? parseFloat(editForm.discount_price) : null,
          flash_sale_end_date: editForm.flash_sale_end_date ? new Date(editForm.flash_sale_end_date).toISOString() : null,
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
          is_active: form.is_active,
          attributes: attributes,
          discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
          flash_sale_end_date: form.flash_sale_end_date ? new Date(form.flash_sale_end_date).toISOString() : null,
        })
      })

      setToast({ message: 'Product created successfully!', type: 'success' })
      setForm({ name: '', description: '', price: '', stock_quantity: '', category_id: '', is_active: true, discount_price: '', flash_sale_end_date: '' })
      setImageFiles([])
      setLinkAddresses([])
      setAttributes([])
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
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface/20 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search products..."
            className="input-glass pl-9 pr-4 py-2 w-full text-sm"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="flex gap-2 items-center text-xs text-muted w-full sm:w-auto justify-end">
          <span>Show</span>
          <select
            className="bg-surface border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/45 cursor-pointer text-foreground"
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface border-b border-border text-muted">
            <tr>
              <th className="p-4 font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Name
                  <ArrowUpDown size={12} className={`opacity-60 ${sortField === 'name' ? 'text-primary' : ''}`} />
                </div>
              </th>
              <th className="p-4 font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1">
                  Price
                  <ArrowUpDown size={12} className={`opacity-60 ${sortField === 'price' ? 'text-primary' : ''}`} />
                </div>
              </th>
              <th className="p-4 font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('stock_quantity')}>
                <div className="flex items-center gap-1">
                  Stock
                  <ArrowUpDown size={12} className={`opacity-60 ${sortField === 'stock_quantity' ? 'text-primary' : ''}`} />
                </div>
              </th>
              <th className="p-4 font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('is_active')}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown size={12} className={`opacity-60 ${sortField === 'is_active' ? 'text-primary' : ''}`} />
                </div>
              </th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentProducts.map(p => (
              <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">KES {p.price}</td>
                <td className="p-4">{p.stock_quantity}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleActive(p)}
                    title={`Click to set ${p.is_active ? 'Inactive' : 'Active'}`}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      p.is_active 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {p.is_active ? 'Active' : 'Inactive'}
                  </button>
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
            {currentProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-surface/10 rounded-xl border border-border/40 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-pill-outline text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-pill-outline text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted">
                Showing <span className="font-semibold text-foreground">{indexOfFirstProduct + 1}</span> to{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(indexOfLastProduct, sortedProducts.length)}
                </span>{' '}
                of <span className="font-semibold text-foreground">{sortedProducts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm gap-1" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-muted hover:text-foreground hover:bg-surface/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg border border-border/40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer font-semibold ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border/40 text-muted hover:text-foreground hover:bg-surface/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-muted hover:text-foreground hover:bg-surface/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-lg border border-border/40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

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

              {/* Flash Sales Section */}
              <div className="grid grid-cols-2 gap-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Flash Sale Price (KES)</label>
                  <input type="number" step="0.01" placeholder="Optional" className="input-field border-primary/30 focus:border-primary" value={form.discount_price} onChange={e => setForm({...form, discount_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Flash Sale End Date & Time</label>
                  <input type="datetime-local" className="input-field border-primary/30 focus:border-primary" value={form.flash_sale_end_date} onChange={e => setForm({...form, flash_sale_end_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Initial Status</label>
                <select 
                  className="input-field font-semibold"
                  value={form.is_active ? 'true' : 'false'}
                  onChange={e => setForm({...form, is_active: e.target.value === 'true'})}
                >
                  <option value="true">🟢 Active (Visible in Store)</option>
                  <option value="false">🔴 Inactive (Hidden from Store)</option>
                </select>
              </div>

              {/* Dynamic Attributes Section */}
              <div className="border-t border-border/40 pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-foreground">Dynamic Fields (Optional)</label>
                  <button 
                    type="button" 
                    onClick={() => setAttributes([...attributes, { name: '', type: 'text', value: '' }])}
                    className="text-xs flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                
                <div className="space-y-4">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="p-3 bg-surface/30 border border-border rounded-xl space-y-3 relative">
                      <button 
                        type="button" 
                        onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-muted hover:text-danger p-1 bg-background rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3 pr-6">
                        <div>
                          <label className="block text-xs font-semibold text-muted mb-1">Field Name (e.g. Specifications)</label>
                          <input 
                            type="text" 
                            className="input-field text-sm" 
                            value={attr.name} 
                            placeholder="Field Name"
                            onChange={e => {
                              const newAttrs = [...attributes]
                              newAttrs[idx].name = e.target.value
                              setAttributes(newAttrs)
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted mb-1">Field Type</label>
                          <select 
                            className="input-field text-sm"
                            value={attr.type}
                            onChange={e => {
                              const newAttrs = [...attributes]
                              newAttrs[idx].type = e.target.value
                              setAttributes(newAttrs)
                            }}
                          >
                            <option value="text">Plain Text</option>
                            <option value="rich_text">Rich Text / Table</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Field Content</label>
                        {attr.type === 'rich_text' ? (
                          <RichTextEditor 
                            value={attr.value} 
                            onChange={(val) => {
                              const newAttrs = [...attributes]
                              newAttrs[idx].value = val
                              setAttributes(newAttrs)
                            }} 
                          />
                        ) : (
                          <textarea 
                            className="input-field text-sm"
                            rows={3}
                            value={attr.value}
                            placeholder="Enter text..."
                            onChange={e => {
                              const newAttrs = [...attributes]
                              newAttrs[idx].value = e.target.value
                              setAttributes(newAttrs)
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {attributes.length === 0 && (
                    <div className="text-xs text-muted italic text-center p-4 border border-dashed border-border rounded-lg">
                      No dynamic fields added. Click 'Add Field' to include custom specifications or tables.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary bg-success hover:bg-success/90 border-none flex-1 justify-center">
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

              {/* Flash Sales Section */}
              <div className="grid grid-cols-2 gap-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Flash Sale Price (KES)</label>
                  <input type="number" step="0.01" placeholder="Optional" className="input-field border-primary/30 focus:border-primary" value={editForm.discount_price} onChange={e => setEditForm({...editForm, discount_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Flash Sale End Date & Time</label>
                  <input type="datetime-local" className="input-field border-primary/30 focus:border-primary" value={editForm.flash_sale_end_date} onChange={e => setEditForm({...editForm, flash_sale_end_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Product Status</label>
                <select 
                  className="input-field font-semibold"
                  value={editForm.is_active ? 'true' : 'false'}
                  onChange={e => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                >
                  <option value="true">🟢 Active (Visible in Store)</option>
                  <option value="false">🔴 Inactive (Hidden from Store)</option>
                </select>
              </div>

              {/* Dynamic Attributes Section for Edit Form */}
              <div className="border-t border-border/40 pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-foreground">Dynamic Fields (Optional)</label>
                  <button 
                    type="button" 
                    onClick={() => setEditAttributes([...editAttributes, { name: '', type: 'text', value: '' }])}
                    className="text-xs flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                
                <div className="space-y-4">
                  {editAttributes.map((attr, idx) => (
                    <div key={idx} className="p-3 bg-surface/30 border border-border rounded-xl space-y-3 relative">
                      <button 
                        type="button" 
                        onClick={() => setEditAttributes(editAttributes.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-muted hover:text-danger p-1 bg-background rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3 pr-6">
                        <div>
                          <label className="block text-xs font-semibold text-muted mb-1">Field Name</label>
                          <input 
                            type="text" 
                            className="input-field text-sm" 
                            value={attr.name} 
                            placeholder="Field Name"
                            onChange={e => {
                              const newAttrs = [...editAttributes]
                              newAttrs[idx].name = e.target.value
                              setEditAttributes(newAttrs)
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted mb-1">Field Type</label>
                          <select 
                            className="input-field text-sm"
                            value={attr.type}
                            onChange={e => {
                              const newAttrs = [...editAttributes]
                              newAttrs[idx].type = e.target.value
                              setEditAttributes(newAttrs)
                            }}
                          >
                            <option value="text">Plain Text</option>
                            <option value="rich_text">Rich Text / Table</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Field Content</label>
                        {attr.type === 'rich_text' ? (
                          <RichTextEditor 
                            value={attr.value} 
                            onChange={(val) => {
                              const newAttrs = [...editAttributes]
                              newAttrs[idx].value = val
                              setEditAttributes(newAttrs)
                            }} 
                          />
                        ) : (
                          <textarea 
                            className="input-field text-sm"
                            rows={3}
                            value={attr.value}
                            placeholder="Enter text..."
                            onChange={e => {
                              const newAttrs = [...editAttributes]
                              newAttrs[idx].value = e.target.value
                              setEditAttributes(newAttrs)
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {editAttributes.length === 0 && (
                    <div className="text-xs text-muted italic text-center p-4 border border-dashed border-border rounded-lg">
                      No dynamic fields added.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} className="btn-success flex-1 justify-center">
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
                className="btn-danger flex-1 justify-center"
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
