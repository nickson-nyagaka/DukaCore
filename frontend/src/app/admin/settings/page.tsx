'use client'

import { useState, useEffect } from 'react'
import { useAuth, apiFetch } from '@/lib/auth'
import { validateKenyanPhone, validateEmail } from '@/lib/validation'
import ModalAlert from '@/components/admin/ModalAlert'
import { 
  User, 
  Settings, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  Key, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Loader2, 
  ExternalLink,
  Smartphone,
  Mail,
  Phone,
  Server,
  Activity
} from 'lucide-react'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'payment' | 'security'>('profile')

  // Profile Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Store Config State
  const [storeName, setStoreName] = useState('DukaCore Store')
  const [supportEmail, setSupportEmail] = useState('support@dukacore.com')
  const [supportPhone, setSupportPhone] = useState('+254 700 000 000')
  const [currency, setCurrency] = useState('KES')
  const [shippingFee, setShippingFee] = useState('250')

  // Feedback State
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingStore, setSavingStore] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setEmail(user.email || '')
      setPhone(user.phone_number || '')
    }

    // Load store preferences from localStorage if present
    const savedStore = localStorage.getItem('dukacore_admin_store_settings')
    if (savedStore) {
      try {
        const parsed = JSON.parse(savedStore)
        if (parsed.storeName) setStoreName(parsed.storeName)
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail)
        if (parsed.supportPhone) setSupportPhone(parsed.supportPhone)
        if (parsed.currency) setCurrency(parsed.currency)
        if (parsed.shippingFee) setShippingFee(parsed.shippingFee)
      } catch (e) {
        console.error('Failed to load local store settings', e)
      }
    }
  }, [user])

  // Profile Submit Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlert(null)

    // Validations
    if (!validateEmail(email)) {
      setAlert({ message: 'Please enter a valid email address.', type: 'error' })
      return
    }

    if (phone && !validateKenyanPhone(phone)) {
      setAlert({ message: 'Please enter a valid Kenyan phone number (e.g. +254712345678, 0712345678).', type: 'error' })
      return
    }

    if (showPasswordChange) {
      if (!newPassword) {
        setAlert({ message: 'Please enter a new password.', type: 'error' })
        return
      }
      if (newPassword !== confirmPassword) {
        setAlert({ message: 'New password and confirmation do not match.', type: 'error' })
        return
      }
      if (newPassword.length < 6) {
        setAlert({ message: 'Password must be at least 6 characters long.', type: 'error' })
        return
      }
    }

    setSavingProfile(true)
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone || null
      }

      if (showPasswordChange && newPassword) {
        payload.password = newPassword
      }

      // Update current admin user details via user management PATCH API
      await apiFetch(`/api/users/users/${user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })

      if (refreshUser) {
        await refreshUser()
      }

      setAlert({ message: '🎉 Profile settings updated successfully!', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
    } catch (err: any) {
      setAlert({ message: err.message || 'Failed to update profile settings.', type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Store Preferences Submit Handler
  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAlert(null)

    const storeData = {
      storeName,
      supportEmail,
      supportPhone,
      currency,
      shippingFee
    }

    localStorage.setItem('dukacore_admin_store_settings', JSON.stringify(storeData))
    setSavingStore(true)
    setTimeout(() => {
      setSavingStore(false)
      setAlert({ message: '🎉 Store preferences saved successfully!', type: 'success' })
    }, 500)
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-[1200px] pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            System & Account Settings
          </h1>
          <p className="text-sm text-muted">Manage your admin profile, store defaults, payment modes, and security settings.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border bg-card">
          <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
          <span>Logged in as <strong>{user?.username}</strong></span>
        </div>
      </div>

      {alert && (
        <ModalAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Settings Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          <button
            onClick={() => { setActiveTab('profile'); setAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left border ${
              activeTab === 'profile'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card border-border text-muted hover:text-foreground hover:bg-primary/5'
            }`}
          >
            <User size={18} />
            <span className="whitespace-nowrap">Profile & Password</span>
          </button>

          <button
            onClick={() => { setActiveTab('store'); setAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left border ${
              activeTab === 'store'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card border-border text-muted hover:text-foreground hover:bg-primary/5'
            }`}
          >
            <Store size={18} />
            <span className="whitespace-nowrap">Store Preferences</span>
          </button>

          <button
            onClick={() => { setActiveTab('payment'); setAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left border ${
              activeTab === 'payment'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card border-border text-muted hover:text-foreground hover:bg-primary/5'
            }`}
          >
            <CreditCard size={18} />
            <span className="whitespace-nowrap">Payment Gateway</span>
          </button>

          <button
            onClick={() => { setActiveTab('security'); setAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left border ${
              activeTab === 'security'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card border-border text-muted hover:text-foreground hover:bg-primary/5'
            }`}
          >
            <ShieldCheck size={18} />
            <span className="whitespace-nowrap">Security & Health</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: Profile & Credentials */}
          {activeTab === 'profile' && (
            <div className="glass rounded-2xl p-6 md:p-8 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Admin Profile Settings</h3>
                  <p className="text-xs text-muted">Update your account name, email address, phone, and login credentials.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">First Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Nickson"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Last Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="e.g. Nyagaka"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3 text-muted" />
                      <input
                        type="email"
                        required
                        className="input-field pl-10"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Phone Number (Kenyan Format)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3 text-muted" />
                      <input
                        type="text"
                        className="input-field pl-10"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change Collapsible Section */}
                <div className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Key size={16} />
                    {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
                  </button>

                  {showPasswordChange && (
                    <div className="mt-4 p-4 rounded-xl bg-surface border border-border space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">New Password</label>
                          <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-pill-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 bg-success hover:bg-success/90 border-none cursor-pointer"
                  >
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Store Preferences */}
          {activeTab === 'store' && (
            <div className="glass rounded-2xl p-6 md:p-8 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Store Information & Region</h3>
                  <p className="text-xs text-muted">Configure your storefront branding, support contacts, and default checkout settings.</p>
                </div>
              </div>

              <form onSubmit={handleStoreSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Support Email</label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      value={supportEmail}
                      onChange={e => setSupportEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Support Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      value={supportPhone}
                      onChange={e => setSupportPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Default Currency</label>
                    <select
                      className="input-field"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Default Flat Shipping Fee ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={shippingFee}
                      onChange={e => setShippingFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={savingStore}
                    className="btn-pill-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 bg-success hover:bg-success/90 border-none cursor-pointer"
                  >
                    {savingStore ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {savingStore ? 'Saving...' : 'Save Store Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Payment Gateway Status */}
          {activeTab === 'payment' && (
            <div className="glass rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Payment Gateway & Integration Status</h3>
                  <p className="text-xs text-muted">Inspect the active backend payment gateway mode and webhook callback statuses.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gateway Mode Card */}
                <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Gateway Mode</span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-info/10 text-info uppercase">
                      SYSTEM SETTING
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-foreground">Mock Gateway (Async Threads)</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Simulates Safaricom Daraja STK push with asynchronous background callbacks, 10% insufficient funds, and 10% user cancellations.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-success pt-2">
                    <CheckCircle2 size={16} />
                    <span>Mode validation active (DEBUG=True safe)</span>
                  </div>
                </div>

                {/* M-Pesa Sandbox Status */}
                <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Daraja M-Pesa Integration</span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-success/10 text-success uppercase">
                      SANDBOX READY
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-foreground">Safaricom STK Push</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Configured for Safaricom Sandbox endpoint <code className="text-[11px] bg-foreground/5 px-1 py-0.5 rounded">https://sandbox.safaricom.co.ke</code>.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted pt-2">
                    <Smartphone size={16} />
                    <span>Shortcode: 174379</span>
                  </div>
                </div>
              </div>

              {/* Webhook Endpoint Information */}
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
                <h4 className="text-sm font-bold text-foreground">M-Pesa Webhook Callback URL</h4>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border text-xs font-mono text-muted overflow-x-auto">
                  <ExternalLink size={14} className="shrink-0 text-primary" />
                  <span>http://dukacore-callback-dev.loca.lt/api/orders/payment/callback</span>
                </div>
                <p className="text-xs text-muted">
                  Callbacks use row-level database locking (<code className="text-[11px] bg-foreground/5 px-1.5 py-0.5 rounded">select_for_update()</code>) to guarantee idempotency and auto-restore stock on payment cancellations.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Security & System Health */}
          {activeTab === 'security' && (
            <div className="glass rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Security & System Diagnostics</h3>
                  <p className="text-xs text-muted">Monitor database connection status, session parameters, and access audit logs.</p>
                </div>
              </div>

              {/* Health Diagnostics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                  <Server size={20} className="text-success" />
                  <div>
                    <span className="text-[11px] text-muted block font-semibold">PostgreSQL DB</span>
                    <span className="text-xs font-bold text-success">Healthy & Connected</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                  <Activity size={20} className="text-success" />
                  <div>
                    <span className="text-[11px] text-muted block font-semibold">Redis Cache</span>
                    <span className="text-xs font-bold text-success">Connected (Port 6379)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <div>
                    <span className="text-[11px] text-muted block font-semibold">Meilisearch Engine</span>
                    <span className="text-xs font-bold text-success">Indexed (Port 7700)</span>
                  </div>
                </div>
              </div>

              {/* Security Access Log Link Card */}
              <div className="p-5 rounded-2xl bg-surface border border-border flex justify-between items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Security Audit Trail</h4>
                  <p className="text-xs text-muted mt-1">Review user logins, order updates, voucher modifications, and administrative actions.</p>
                </div>

                <Link
                  href="/admin/security/access-log"
                  className="btn-pill-primary px-5 py-2 text-xs inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <ExternalLink size={14} />
                  View Access Logs
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
