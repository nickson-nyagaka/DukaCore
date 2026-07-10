'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Search, Filter, RefreshCw, X, AlertCircle } from 'lucide-react'
import { useAuth, apiFetch } from '@/lib/auth'

export default function AdminAccessLogPage() {
  const { user, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')

  useEffect(() => {
    if (authLoading || !user) return
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const data = await apiFetch('/api/admin/security/impersonation-log')
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error fetching audit logs:', e)
    } finally {
      setLoadingData(false)
    }
  }

  // Formatting helpers
  const formatDetails = (action: string, details: any) => {
    if (!details) return '—'
    switch (action) {
      case 'product.create':
        return `Created product "${details.name}" with price KES ${Number(details.price).toLocaleString()}`
      case 'product.update':
        return `Updated product ID #${details.product_id} ("${details.name || 'Unknown'}")`
      case 'product.delete':
        return `Deleted product ID #${details.product_id} ("${details.name || 'Unknown'}")`
      case 'category.create':
        return `Created category "${details.name}"`
      case 'category.update':
        return `Updated category ID #${details.category_id} to "${details.name}"`
      case 'category.delete':
        return `Deleted category ID #${details.category_id} ("${details.name || 'Unknown'}")`
      case 'user.login':
        return `Logged in successfully (Session Role: ${details.role})`
      case 'user.logout':
        return `Logged out successfully`
      case 'order.checkout':
        return `Placed order #${details.order_id} for KES ${Number(details.total_amount).toLocaleString()}`
      case 'team.add_member':
        return `Added team member "${details.email}" with role "${details.role}"`
      case 'team.update_member':
        return `Updated team member ID #${details.user_id} (${details.email})`
      case 'team.change_role':
        return `Changed role of user "${details.email}" to "${details.role}"`
      case 'team.deactivate_member':
        return `Deactivated team member ID #${details.user_id} (${details.email})`
      default:
        return typeof details === 'object' ? JSON.stringify(details) : String(details)
    }
  }

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('user.')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (action.startsWith('product.')) return 'bg-violet-500/10 text-violet-500 border-violet-500/20'
    if (action.startsWith('category.')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    if (action.startsWith('order.')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    if (action.startsWith('team.')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    return 'bg-muted/10 text-muted border-border'
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('ALL')
    setActionFilter('ALL')
  }

  // Filtering Logic
  const filteredLogs = logs.filter(log => {
    // 1. Search term match (checks email, username, action name, or formatted details)
    const actorEmail = log.user?.email || 'System'
    const actorUsername = log.user?.username || 'System'
    const formattedDetails = formatDetails(log.action, log.details).toLowerCase()
    
    const searchMatch = 
      actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actorUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedDetails.includes(searchTerm.toLowerCase())

    // 2. Role match
    const actorRole = log.user?.role || 'SYSTEM'
    const roleMatch = roleFilter === 'ALL' || actorRole === roleFilter

    // 3. Action prefix match
    const actionMatch = actionFilter === 'ALL' || log.action.startsWith(actionFilter + '.') || log.action === actionFilter

    return searchMatch && roleMatch && actionMatch
  })

  // Extract unique action prefixes for selection dropdown
  const uniqueActionPrefixes = Array.from(
    new Set(logs.map(log => log.action.split('.')[0]))
  )

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-[1200px] pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">Security & Access Logs</h1>
          <p className="text-sm text-muted mt-0.5">Auditable history of all security events and system activity log.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="btn-secondary flex items-center gap-1.5 text-xs py-2 shadow-sm"
          title="Refresh Logs"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-sm text-amber-500 font-semibold mb-6">
        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
        <div>
          <div className="text-foreground">Audited System Access Log Policy</div>
          <div className="text-xs font-normal text-muted mt-0.5">
            MVE enforces zero-trust audit policies. Every write operation (add/edit/delete) on products, categories, team permissions, and logins is logged permanently for security auditing.
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search user, action or details..." 
              className="input-field pl-9 text-xs" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-48">
            <select 
              className="input-field text-xs"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SYSTEM">System Action</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="w-full sm:w-48">
            <select 
              className="input-field text-xs"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              {uniqueActionPrefixes.map(prefix => (
                <option key={prefix} value={prefix}>{prefix.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || roleFilter !== 'ALL' || actionFilter !== 'ALL') && (
          <button 
            onClick={clearFilters}
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer shrink-0 mt-2 md:mt-0"
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="glass rounded-2xl overflow-hidden border border-border">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-muted py-16 flex flex-col items-center justify-center gap-2 bg-surface/30">
            <AlertCircle size={32} className="text-muted" />
            <span className="font-semibold text-foreground">No Logs Found</span>
            <span className="text-xs text-muted">Try adjusting your filters or search terms.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Activity Details</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredLogs.map(log => {
                  const actorRole = log.user?.role || 'SYSTEM'
                  const roleColors: Record<string, string> = {
                    ADMIN: 'bg-primary/10 text-primary border-primary/20',
                    STAFF: 'bg-accent/10 text-accent border-accent/20',
                    CUSTOMER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                    SYSTEM: 'bg-muted text-muted border-border'
                  }
                  
                  return (
                    <tr key={log.id} className="hover:bg-primary-light/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{log.user?.username || 'System'}</span>
                          <span className="text-xs text-muted">{log.user?.email || 'automatic_system@mve.com'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[actorRole] || 'bg-muted/10 text-muted'}`}>
                          {actorRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border font-mono ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted font-medium max-w-sm break-words">
                        {formatDetails(log.action, log.details)}
                      </td>
                      <td className="px-6 py-4 text-muted font-mono text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
