'use client' 

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/auth'
import DataTable from '@/components/admin/DataTable'
import ModalAlert from '@/components/admin/ModalAlert'
import { Plus, Trash2, Edit2, X, AlertTriangle } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'TEAM' | 'GENERAL'>('TEAM')

  // Modal alert state
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Create Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'STAFF',
    password: ''
  })
  const [submittingAdd, setSubmittingAdd] = useState(false)

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'STAFF',
    password: ''
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/team')
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingAdd(true)
    setModalAlert(null)
    try {
      await apiFetch('/api/admin/team/add', {
        method: 'POST',
        body: JSON.stringify(addForm)
      })
      setToast({ message: 'User created successfully!', type: 'success' })
      setAddForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        role: 'STAFF',
        password: ''
      })
      fetchUsers()
      setShowAddModal(false)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to add user', type: 'error' })
    } finally {
      setSubmittingAdd(false)
    }
  }

  const handleEditUserClick = (u: any) => {
    setModalAlert(null)
    setSelectedUserId(u.id)
    setEditForm({
      username: u.username || '',
      email: u.email || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone_number: u.phone_number || '',
      role: u.role || 'STAFF',
      password: '' // Keep empty unless updating password
    })
    setShowEditModal(true)
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    setSubmittingEdit(true)
    setModalAlert(null)

    // Only send password if it's filled
    const payload: any = { ...editForm }
    if (!payload.password) {
      delete payload.password
    }

    try {
      await apiFetch(`/api/admin/team/${selectedUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
      setToast({ message: 'User updated successfully!', type: 'success' })
      fetchUsers()
      setShowEditModal(false)
      setSelectedUserId(null)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to update user', type: 'error' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setModalAlert(null)
    setUserToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!userToDelete) return
    setSubmittingDelete(true)
    setModalAlert(null)
    try {
      await apiFetch(`/api/admin/team/${userToDelete}`, { method: 'DELETE' })
      setToast({ message: 'User deactivated!', type: 'success' })
      fetchUsers()
      setShowDeleteModal(false)
      setUserToDelete(null)
      setModalAlert(null)
      setTimeout(() => {
        setToast(null)
      }, 10000)
    } catch (err: any) {
      setModalAlert({ message: err.message || 'Failed to deactivate user', type: 'error' })
    } finally {
      setSubmittingDelete(false)
    }
  }

  // Split into Team and General
  const teamMembers = users.filter(u => u.role === 'ADMIN' || u.role === 'STAFF')
  const generalUsers = users.filter(u => u.role === 'CUSTOMER')

  // Datatable Columns
  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Name', render: (_: any, u: any) => `${u.first_name} ${u.last_name}` },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone', render: (val: any) => val || '—' },
    {
      key: 'role',
      label: 'Role',
      render: (role: string) => {
        const colors: Record<string, string> = {
          ADMIN: 'bg-primary/10 text-primary border-primary/20',
          STAFF: 'bg-accent/10 text-accent border-accent/20',
          CUSTOMER: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[role] || 'bg-muted/10 text-muted'}`}>
            {role}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, u: any) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleEditUserClick(u)}
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-primary hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            title="Edit User"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(u.id)}
            className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            title="Deactivate/Delete User"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  if (loading) return null // triggers loading.tsx

  return (
    <div className="space-y-6 relative animate-fade-in max-w-[1200px] pb-12">
      {toast && (
        <ModalAlert message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">User Management</h1>
          <p className="text-sm text-muted mt-0.5">Manage access levels, admin accounts, and customer details.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('TEAM')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'TEAM'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Team Members ({teamMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          General Users ({generalUsers.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'TEAM' ? (
        <DataTable
          columns={columns}
          data={teamMembers}
          searchPlaceholder="Search admins & staff..."
          searchKeys={['username', 'email', 'first_name', 'last_name']}
        />
      ) : (
        <DataTable
          columns={columns}
          data={generalUsers}
          searchPlaceholder="Search customers..."
          searchKeys={['username', 'email', 'first_name', 'last_name']}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Add New User</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">First Name</label>
                  <input type="text" required className="input-field" value={addForm.first_name} onChange={e => setAddForm({...addForm, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Last Name</label>
                  <input type="text" required className="input-field" value={addForm.last_name} onChange={e => setAddForm({...addForm, last_name: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Username</label>
                <input type="text" required className="input-field" value={addForm.username} onChange={e => setAddForm({...addForm, username: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Email</label>
                <input type="email" required className="input-field" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Phone Number</label>
                  <input type="text" className="input-field" value={addForm.phone_number} onChange={e => setAddForm({...addForm, phone_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Role</label>
                  <select className="input-field" value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})}>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Password</label>
                <input type="password" required className="input-field" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAdd} className="btn-primary flex-1 justify-center">
                  {submittingAdd ? 'Adding...' : 'Add User'}
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
            <h3 className="font-bold text-xl mb-2 font-heading text-center">Delete User?</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            <p className="text-muted text-center text-sm mb-6">
              This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null) }} 
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeactivateConfirm}
                disabled={submittingDelete} 
                className="btn-primary flex-1 justify-center bg-danger hover:bg-danger/90 text-white border-none"
              >
                {submittingDelete ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowEditModal(false); setSelectedUserId(null) }}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl mb-6 font-heading">Edit User</h3>
            <ModalAlert message={modalAlert?.message || null} type={modalAlert?.type || null} onClose={() => setModalAlert(null)} />
            
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">First Name</label>
                  <input type="text" required className="input-field" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Last Name</label>
                  <input type="text" required className="input-field" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Username</label>
                <input type="text" required className="input-field" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Email</label>
                <input type="email" required className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Phone Number</label>
                  <input type="text" className="input-field" value={editForm.phone_number} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Role</label>
                  <select className="input-field" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted mb-1">Password <span className="text-xs text-muted font-normal">(Leave blank to keep current)</span></label>
                <input type="password" className="input-field" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedUserId(null) }} className="btn-secondary flex-1 justify-center">
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
    </div>
  )
}
