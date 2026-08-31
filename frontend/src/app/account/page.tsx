'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth, apiFetch } from '@/lib/auth'
import { useCartStore } from '@/lib/cart-store'
import { 
  Heart, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Star, 
  ShoppingCart, 
  Trash2, 
  AlertCircle, 
  Bell, 
  MessageSquarePlus, 
  ChevronRight, 
  MapPin, 
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  Settings,
  Lock,
  Home,
  Building2,
  Plus,
  Edit2,
  Check,
  X
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LoginPromptModal from '@/components/LoginPromptModal'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_slug: string
  product_price: number
  quantity: number
  image_url: string
}

const formatPrice = (val: any) => {
  const num = typeof val === 'number' ? val : parseFloat(val)
  return isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Order {
  id: number
  created_at: string
  status: OrderStatus
  shipping_address?: string
  total_amount?: number
  total_price?: number
  items: OrderItem[]
  status_history: {
    id: number
    status: OrderStatus
    changed_at: string
    changed_by_email: string
  }[]
}

interface WishlistItem {
  id: number
  name: string
  slug: string
  price: number
  image_url?: string
  stock_quantity: number
  is_active: boolean
}

interface StockAlert {
  id: number
  product_id: number
  product_name: string
  product_slug?: string
  is_notified: boolean
  notified_at?: string
}

function AccountContent() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { addItem, localAddItem } = useCartStore()

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'alerts' | 'profile' | 'addresses'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Review Modal State
  const [reviewProduct, setReviewProduct] = useState<{ id: number; name: string } | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Toast / Fade-out modal state
  const [cartSuccessNotice, setCartSuccessNotice] = useState<{ message: string; visible: boolean } | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const triggerCartSuccessNotice = (msg: string) => {
    setCartSuccessNotice({ message: msg, visible: true })
    setTimeout(() => {
      setCartSuccessNotice(prev => prev ? { ...prev, visible: false } : null)
      setTimeout(() => setCartSuccessNotice(null), 350)
    }, 2800)
  }

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingWishlist, setLoadingWishlist] = useState(false)
  const [loadingAlerts, setLoadingAlerts] = useState(false)

  // Profile state
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone_number: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change state
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Addresses state
  interface UserAddress {
    id: number
    label: string
    full_address: string
    city: string
    county: string
    phone: string
    is_default: boolean
  }
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Partial<UserAddress> | null>(null)
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrMsg, setAddrMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [detectingAddrGps, setDetectingAddrGps] = useState(false)

  // Read ?tab= from URL to deep-link
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['orders', 'wishlist', 'alerts', 'profile', 'addresses'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchOrders()
      fetchWishlist()
      fetchAlerts()
      fetchAddresses()
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
      })
    }
  }, [user])

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const data = await apiFetch('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch orders', e)
    } finally {
      setLoadingOrders(false)
    }
  }

  const fetchWishlist = async () => {
    setLoadingWishlist(true)
    try {
      const data = await apiFetch('/api/catalog/wishlist')
      setWishlist(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch wishlist', e)
    } finally {
      setLoadingWishlist(false)
    }
  }

  const fetchAlerts = async () => {
    setLoadingAlerts(true)
    try {
      const data = await apiFetch('/api/catalog/stock-alerts')
      setAlerts(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch alerts', e)
    } finally {
      setLoadingAlerts(false)
    }
  }

  const handleToggleWishlist = async (productId: number) => {
    try {
      await apiFetch('/api/catalog/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId })
      })
      fetchWishlist()
    } catch (e) {
      console.error('Failed to toggle wishlist', e)
    }
  }

  const handleAddWishlistToCart = async (item: WishlistItem) => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    // 1. Add to Cart (with fallback if server/network fails)
    try {
      try {
        await addItem(item.id, 1)
      } catch (serverErr) {
        console.warn('addItem API call failed, falling back to localAddItem:', serverErr)
        localAddItem({
          product_id: item.id,
          quantity: 1,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          slug: item.slug
        })
      }

      // 2. Remove item from local wishlist state & server
      setWishlist(prev => prev.filter(w => w.id !== item.id))
      try {
        await apiFetch('/api/catalog/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ product_id: item.id })
        })
      } catch (e) {
        console.error('Failed to remove item from wishlist backend', e)
      }

      // 3. Show smooth fade-out success modal notification
      triggerCartSuccessNotice(`"${item.name}" added to cart & removed from wishlist!`)
    } catch (e) {
      console.error('Failed to add wishlist item to cart', e)
    }
  }

  const fetchAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const data = await apiFetch('/api/auth/addresses')
      setAddresses(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch addresses', e)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      })
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (pwdForm.new_password.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }
    setPwdSaving(true)
    setPwdMsg(null)
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }),
      })
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' })
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to change password' })
    } finally {
      setPwdSaving(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress) return
    setAddrSaving(true)
    setAddrMsg(null)
    try {
      if (editingAddress.id) {
        await apiFetch(`/api/auth/addresses/${editingAddress.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editingAddress),
        })
        setAddrMsg({ type: 'success', text: 'Address updated!' })
      } else {
        await apiFetch('/api/auth/addresses', {
          method: 'POST',
          body: JSON.stringify(editingAddress),
        })
        setAddrMsg({ type: 'success', text: 'Address added!' })
      }
      fetchAddresses()
      setShowAddressForm(false)
      setEditingAddress(null)
    } catch (err: any) {
      setAddrMsg({ type: 'error', text: err.message || 'Failed to save address' })
    } finally {
      setAddrSaving(false)
    }
  }

  const handleDetectAddressGps = () => {
    if (!navigator.geolocation) {
      setAddrMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' })
      return
    }
    setDetectingAddrGps(true)
    setAddrMsg(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const data = await res.json()
          if (data?.address) {
            const addr = data.address
            const road = [addr.road, addr.pedestrian, addr.building, addr.neighbourhood].filter(Boolean).join(', ')
            const city = addr.town || addr.suburb || addr.city_district || addr.city || ''
            const county = addr.county || addr.state || ''
            setEditingAddress(prev => ({
              ...prev,
              full_address: road || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
              city: city,
              county: county,
            }))
            setAddrMsg({ type: 'success', text: `GPS location detected: ${city}${county ? ', ' + county : ''}` })
          } else {
            setAddrMsg({ type: 'error', text: 'Could not resolve address. Fill in manually.' })
          }
        } catch {
          setAddrMsg({ type: 'error', text: 'GPS reverse geocoding failed. Fill in manually.' })
        } finally {
          setDetectingAddrGps(false)
        }
      },
      () => {
        setAddrMsg({ type: 'error', text: 'Location access denied. Please allow location access and try again.' })
        setDetectingAddrGps(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await apiFetch(`/api/auth/addresses/${id}`, { method: 'DELETE' })
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete address')
    }
  }

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await apiFetch(`/api/auth/addresses/${id}/set-default`, { method: 'POST' })
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
    } catch (err: any) {
      alert(err.message || 'Failed to set default address')
    }
  }

  const handleDismissAlert = async (alertId: number) => {
    try {
      await apiFetch(`/api/catalog/stock-alerts/${alertId}/dismiss`, {
        method: 'POST'
      })
      fetchAlerts()
    } catch (e) {
      console.error('Failed to dismiss alert', e)
    }
  }

  const handleOpenReviewModal = (productId: number, productName: string) => {
    setReviewProduct({ id: productId, name: productName })
    setRating(5)
    setComment('')
    setReviewError('')
    setReviewSuccess('')
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewProduct) return
    setSubmittingReview(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      await apiFetch('/api/orders/reviews', {
        method: 'POST',
        body: JSON.stringify({
          product_id: reviewProduct.id,
          rating,
          comment
        })
      })
      setReviewSuccess('🎉 Review submitted successfully!')
      setTimeout(() => {
        setReviewProduct(null)
      }, 2000)
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted text-sm">Verifying session details...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass text-center rounded-2xl border border-border/50">
        <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted text-sm mb-6">Please log in to your account to track your orders, view wishlists, and manage alerts.</p>
        <Link href="/login" className="btn-pill-primary px-8 py-3 text-sm inline-flex items-center gap-2">
          Sign In Now
        </Link>
      </div>
    )
  }

  // Visual Order Progress mapping helper
  const getProgressState = (status: OrderStatus) => {
    const states = [
      { name: 'Confirmed', statusList: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      { name: 'Processing', statusList: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
      { name: 'Shipped', statusList: ['SHIPPED', 'DELIVERED'] },
      { name: 'Delivered', statusList: ['DELIVERED'] }
    ]

    return states.map(state => ({
      name: state.name,
      done: state.statusList.includes(status) && status !== 'CANCELLED'
    }))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Account Info Header Banner */}
      <div className="glass rounded-3xl p-6 md:p-8 mb-8 border border-border/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <UserIcon size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {user.first_name ? `${user.first_name} ${user.last_name}` : 'My Account'}
            </h1>
            <p className="text-sm text-muted capitalize mt-1 flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-success"></span>
              {user.role} Dashboard
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-4 text-sm w-full md:w-auto">
          {user.phone_number && (
            <div className="flex items-center gap-2 text-muted bg-foreground/5 dark:bg-foreground-dark/5 px-4 py-2 rounded-xl">
              <Phone size={16} />
              <span>{user.phone_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted bg-foreground/5 dark:bg-foreground-dark/5 px-4 py-2 rounded-xl">
            <Mail size={16} />
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">

          {/* Account Details */}
          <button
            onClick={() => { setActiveTab('profile'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border shrink-0 ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'glass border-border/40 text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Settings size={18} />
            <span className="whitespace-nowrap">Account Details</span>
          </button>

          {/* Address Book */}
          <button
            onClick={() => { setActiveTab('addresses'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border shrink-0 ${
              activeTab === 'addresses'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'glass border-border/40 text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <MapPin size={18} />
            <span className="whitespace-nowrap">Address Book</span>
            {addresses.length > 0 && (
              <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'addresses' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/10 text-muted'
              }`}>{addresses.length}</span>
            )}
          </button>

          {/* My Orders */}
          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border shrink-0 ${
              activeTab === 'orders'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'glass border-border/40 text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Package size={18} />
            <span className="whitespace-nowrap">My Orders</span>
            {orders.length > 0 && (
              <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'orders' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/10 text-muted'
              }`}>{orders.length}</span>
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={() => { setActiveTab('wishlist'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border shrink-0 ${
              activeTab === 'wishlist'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'glass border-border/40 text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Heart size={18} />
            <span className="whitespace-nowrap">Wishlist</span>
            {wishlist.length > 0 && (
              <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'wishlist' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/10 text-muted'
              }`}>{wishlist.length}</span>
            )}
          </button>

          {/* Stock Alerts */}
          <button
            onClick={() => { setActiveTab('alerts'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'glass border-border/40 text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Bell size={18} />
            <span className="whitespace-nowrap">Stock Alerts</span>
            {alerts.some(a => a.is_notified) && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-3">

          {/* ── TAB: Account Details ── */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Settings size={22} className="text-primary" />
                Account Details
              </h2>

              {/* ── Profile Edit Card ── */}
              <div className="glass rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm">
                <h3 className="text-base font-extrabold text-foreground mb-1 flex items-center gap-2">
                  <UserIcon size={18} className="text-primary" /> Personal Information
                </h3>
                <p className="text-xs text-muted mb-6">Update your name and phone number. Your email and username cannot be changed.</p>

                {/* Read-only Identity Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">Username</label>
                    <div className="glass rounded-xl px-4 py-2.5 text-sm text-muted border border-border/30 select-all">{user.username}</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">Email</label>
                    <div className="glass rounded-xl px-4 py-2.5 text-sm text-muted border border-border/30 select-all">{user.email}</div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={profileForm.first_name}
                        onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={e => setProfileForm(f => ({ ...f, phone_number: e.target.value }))}
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>

                  {profileMsg && (
                    <div className={`text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 ${
                      profileMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                    }`}>
                      {profileMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button type="submit" disabled={profileSaving}
                      className="btn-pill-primary px-8 py-2.5 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60">
                      {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Change Password Card ── */}
              <div className="glass rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm">
                <h3 className="text-base font-extrabold text-foreground mb-1 flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Change Password
                </h3>
                <p className="text-xs text-muted mb-6">Choose a strong password of at least 8 characters.</p>

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={pwdForm.current_password}
                      onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))}
                      required
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={pwdForm.new_password}
                        onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))}
                        required minLength={8}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="At least 8 characters"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={pwdForm.confirm_password}
                        onChange={e => setPwdForm(f => ({ ...f, confirm_password: e.target.value }))}
                        required
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  {pwdMsg && (
                    <div className={`text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 ${
                      pwdMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                    }`}>
                      {pwdMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                      {pwdMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button type="submit" disabled={pwdSaving}
                      className="btn-pill-primary px-8 py-2.5 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60">
                      {pwdSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      {pwdSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB: Address Book ── */}
          {activeTab === 'addresses' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <MapPin size={22} className="text-primary" />
                  Address Book
                </h2>
                {!showAddressForm && (
                  <button
                    onClick={() => { setEditingAddress({ label: 'Home', full_address: '', city: '', county: '', phone: '', is_default: false }); setShowAddressForm(true); setAddrMsg(null) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-extrabold hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                )}
              </div>

              {/* Address Form (Add / Edit) */}
              {showAddressForm && editingAddress && (
                <div className="glass rounded-3xl border border-border/40 p-6 shadow-sm animate-slide-up">
                  <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
                    {editingAddress.id ? <Edit2 size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
                    {editingAddress.id ? 'Edit Address' : 'New Address'}
                  </h3>
                  <form onSubmit={handleSaveAddress} className="flex flex-col gap-4">
                    {/* GPS Auto-detect */}
                    <button
                      type="button"
                      onClick={handleDetectAddressGps}
                      disabled={detectingAddrGps}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/8 transition-all text-xs font-extrabold cursor-pointer disabled:opacity-60 w-fit"
                    >
                      {detectingAddrGps ? (
                        <><Loader2 size={14} className="animate-spin" /> Detecting GPS...</>
                      ) : (
                        <><MapPin size={14} className="text-primary" /> Auto-Detect My Location (GPS)</>
                      )}
                    </button>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Home', 'Office', 'Other'].map(lbl => (
                        <button type="button" key={lbl}
                          onClick={() => setEditingAddress(a => ({ ...a, label: lbl }))}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            editingAddress.label === lbl ? 'bg-primary text-white border-primary' : 'glass border-border/40 text-muted hover:text-foreground'
                          }`}
                        >
                          {lbl === 'Home' ? '🏠' : lbl === 'Office' ? '🏢' : '📍'} {lbl}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Full Address / Street</label>
                      <textarea rows={2}
                        value={editingAddress.full_address || ''}
                        onChange={e => setEditingAddress(a => ({ ...a, full_address: e.target.value }))}
                        required
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                        placeholder="e.g. House No. 42, Moi Avenue"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">City / Town</label>
                        <input type="text"
                          value={editingAddress.city || ''}
                          onChange={e => setEditingAddress(a => ({ ...a, city: e.target.value }))}
                          required
                          className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          placeholder="e.g. Nairobi"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">County (optional)</label>
                        <input type="text"
                          value={editingAddress.county || ''}
                          onChange={e => setEditingAddress(a => ({ ...a, county: e.target.value }))}
                          className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          placeholder="e.g. Nairobi County"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">Phone for Delivery (optional)</label>
                      <input type="tel"
                        value={editingAddress.phone || ''}
                        onChange={e => setEditingAddress(a => ({ ...a, phone: e.target.value }))}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                      <input type="checkbox"
                        checked={!!editingAddress.is_default}
                        onChange={e => setEditingAddress(a => ({ ...a, is_default: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="text-xs font-bold text-foreground">Set as default address</span>
                    </label>

                    {addrMsg && (
                      <div className={`text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 ${
                        addrMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                      }`}>
                        {addrMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                        {addrMsg.text}
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <button type="button"
                        onClick={() => { setShowAddressForm(false); setEditingAddress(null); setAddrMsg(null) }}
                        className="px-5 py-2.5 rounded-full text-xs font-extrabold glass border border-border/40 text-muted hover:text-foreground transition-all cursor-pointer">
                        <X size={13} className="inline mr-1" /> Cancel
                      </button>
                      <button type="submit" disabled={addrSaving}
                        className="btn-pill-primary px-7 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60">
                        {addrSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        {addrSaving ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address List */}
              {loadingAddresses ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="glass border-border/40 rounded-2xl p-10 text-center">
                  <MapPin size={36} className="text-muted mx-auto mb-3" />
                  <p className="text-sm text-muted font-medium mb-1">No saved addresses yet</p>
                  <p className="text-xs text-muted/70">Add an address to speed up checkout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`relative glass rounded-2xl p-5 border transition-all ${
                      addr.is_default ? 'border-primary/50 shadow-sm shadow-primary/10' : 'border-border/40'
                    }`}>
                      {addr.is_default && (
                        <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Default
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{addr.label === 'Home' ? '🏠' : addr.label === 'Office' ? '🏢' : '📍'}</span>
                        <span className="text-sm font-extrabold text-foreground">{addr.label}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{addr.full_address}</p>
                      <p className="text-xs text-muted mt-0.5">{addr.city}{addr.county ? `, ${addr.county}` : ''}</p>
                      {addr.phone && <p className="text-xs text-muted mt-0.5 flex items-center gap-1"><Phone size={11} /> {addr.phone}</p>}

                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {!addr.is_default && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] font-extrabold px-3 py-1.5 rounded-full glass border border-border/40 text-muted hover:text-primary hover:border-primary/40 transition-all cursor-pointer">
                            <Check size={11} className="inline mr-1" /> Set Default
                          </button>
                        )}
                        <button onClick={() => { setEditingAddress({ ...addr }); setShowAddressForm(true); setAddrMsg(null) }}
                          className="text-[11px] font-extrabold px-3 py-1.5 rounded-full glass border border-border/40 text-muted hover:text-foreground transition-all cursor-pointer">
                          <Edit2 size={11} className="inline mr-1" /> Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)}
                          className="text-[11px] font-extrabold px-3 py-1.5 rounded-full text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all cursor-pointer">
                          <Trash2 size={11} className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Orders */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
              {!selectedOrder ? (
                <>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Package size={22} className="text-primary" />
                    Order History
                  </h2>

                  {loadingOrders ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : orders.length === 0 ? (
                    <div className="glass border-border/40 rounded-2xl p-8 text-center">
                      <p className="text-muted text-sm mb-4">You have not placed any orders yet.</p>
                      <Link href="/store" className="btn-pill-primary px-6 py-2 text-sm inline-flex items-center">
                        Go Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {orders.map(order => (
                        <div 
                          key={order.id}
                          className="glass border-border/30 hover:border-primary/30 rounded-2xl p-5 cursor-pointer transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-extrabold text-foreground">Order #{order.id}</span>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                                order.status === 'DELIVERED' ? 'bg-success/10 text-success' :
                                order.status === 'SHIPPED' ? 'bg-success/10 text-success' :
                                order.status === 'PROCESSING' ? 'bg-info/10 text-info' :
                                order.status === 'CANCELLED' ? 'bg-danger/10 text-danger' :
                                'bg-warning/10 text-warning'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-1">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-muted mt-1 truncate max-w-sm"><MapPin size={10} className="inline mr-1" /> {order.shipping_address}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div>
                              <span className="text-xs text-muted block md:text-right">Total Price</span>
                              <span className="text-sm font-black text-primary">KES {formatPrice(order.total_amount ?? order.total_price)}</span>
                            </div>
                            <ChevronRight size={18} className="text-muted hidden md:block" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Single Order Detail Tracker View */
                <div className="glass border-border/40 rounded-3xl p-6 md:p-8 flex flex-col gap-8">
                  <div className="flex justify-between items-center pb-4 border-b border-border/40">
                    <div>
                      <button 
                        onClick={() => setSelectedOrder(null)}
                        className="text-xs font-bold text-muted hover:text-foreground mb-2 flex items-center gap-1"
                      >
                        ← Back to Orders
                      </button>
                      <h2 className="text-xl font-extrabold">Order #{selectedOrder.id}</h2>
                      <p className="text-xs text-muted mt-0.5">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                    
                    <span className={`px-4 py-1.5 text-xs font-extrabold rounded-full uppercase ${
                      selectedOrder.status === 'DELIVERED' ? 'bg-success/15 text-success' :
                      selectedOrder.status === 'SHIPPED' ? 'bg-success/15 text-success' :
                      selectedOrder.status === 'PROCESSING' ? 'bg-info/15 text-info' :
                      selectedOrder.status === 'CANCELLED' ? 'bg-danger/15 text-danger' :
                      'bg-warning/15 text-warning'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Progress Tracker Stepper */}
                  {selectedOrder.status !== 'CANCELLED' ? (
                    <div>
                      <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-6">Delivery Progress</h3>
                      <div className="grid grid-cols-4 gap-2 relative">
                        {/* Stepper Lines */}
                        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-border dark:bg-border-dark -z-10">
                          <div 
                            className="h-full bg-success transition-all duration-500" 
                            style={{ 
                              width: selectedOrder.status === 'DELIVERED' ? '100%' :
                                     selectedOrder.status === 'SHIPPED' ? '66.6%' :
                                     selectedOrder.status === 'PROCESSING' ? '33.3%' : '0%' 
                            }}
                          />
                        </div>

                        {/* Tracker Steps */}
                        {getProgressState(selectedOrder.status).map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              step.done 
                                ? 'bg-success border-success text-success-foreground' 
                                : 'bg-background dark:bg-foreground-dark border-border text-muted'
                            }`}>
                              {idx === 0 && <CheckCircle2 size={18} />}
                              {idx === 1 && <Clock size={18} />}
                              {idx === 2 && <Truck size={18} />}
                              {idx === 3 && <Package size={18} />}
                            </div>
                            <span className="text-xs font-bold mt-2 text-foreground">{step.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-danger/5 border border-danger/10 text-danger rounded-2xl p-4 flex items-center gap-3 text-sm">
                      <AlertCircle size={18} />
                      <span>This order has been cancelled and its items returned to stock.</span>
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div>
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Products Purchased</h3>
                    <div className="flex flex-col gap-4">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-foreground/5 dark:bg-foreground-dark/5 rounded-2xl">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} className="w-14 h-14 object-cover rounded-xl border border-border/20 bg-background" />
                          ) : (
                            <div className="w-14 h-14 bg-muted/20 rounded-xl flex items-center justify-center text-xs">🏷️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.product_slug}`} className="text-sm font-bold hover:underline block truncate text-foreground">
                              {item.product_name}
                            </Link>
                            <span className="text-xs text-muted block mt-0.5">Quantity: {item.quantity} • Price: KES {formatPrice(item.product_price)}</span>
                          </div>

                          {/* Write Review Button - only for Shipped or Delivered orders */}
                          {(selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED') && (
                            <button
                              onClick={() => handleOpenReviewModal(item.product_id, item.product_name)}
                              className="px-4 py-2 bg-success text-success-foreground hover:bg-success/90 text-xs font-extrabold rounded-full flex items-center gap-1.5 transition-colors border-none"
                            >
                              <MessageSquarePlus size={14} />
                              Review
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order History Timeline Log */}
                  <div>
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Status Log</h3>
                    <div className="flex flex-col gap-3">
                      {selectedOrder.status_history.map((history, idx) => (
                        <div key={`${idx}-${history.changed_at}`} className="flex gap-4 text-xs">
                          <span className="text-muted w-24 shrink-0 font-medium">{new Date(history.changed_at).toLocaleDateString()}</span>
                          <span className="font-extrabold text-foreground">{history.status}</span>
                          <span className="text-muted italic">({history.changed_by_email})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="pt-6 border-t border-border/40 flex justify-between items-center">
                    <span className="text-sm font-bold text-muted">Shipping Address: <strong className="text-foreground font-semibold ml-1">{selectedOrder.shipping_address}</strong></span>
                    <div className="text-right">
                      <span className="text-xs text-muted block">Grand Total</span>
                      <span className="text-lg font-black text-primary">KES {Number(selectedOrder.total_price).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Heart size={22} className="text-primary fill-primary" />
                My Saved items
              </h2>

              {loadingWishlist ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : wishlist.length === 0 ? (
                <div className="glass border-border/40 rounded-2xl p-8 text-center">
                  <p className="text-muted text-sm mb-4">Your wishlist is empty.</p>
                  <Link href="/store" className="btn-pill-primary px-6 py-2 text-sm inline-flex items-center">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.map(item => (
                    <div key={item.id} className="glass border-border/40 rounded-2xl p-4 flex gap-4 items-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-background border border-border/20" />
                      ) : (
                        <div className="w-20 h-20 bg-muted/20 rounded-xl flex items-center justify-center">🏷️</div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug}`} className="text-sm font-black hover:underline truncate block text-foreground">
                          {item.name}
                        </Link>
                        <span className="text-sm font-extrabold text-primary block mt-1">KES {Number(item.price).toLocaleString()}</span>
                        
                        {item.stock_quantity === 0 ? (
                          <span className="inline-block text-[10px] bg-danger/10 text-danger font-bold uppercase px-2 py-0.5 rounded-full mt-1.5">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] bg-success/10 text-success font-bold uppercase px-2 py-0.5 rounded-full mt-1.5">
                            In Stock
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {item.stock_quantity > 0 && (
                          <button
                            onClick={() => handleAddWishlistToCart(item)}
                            className="p-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-all border-none"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleWishlist(item.id)}
                          className="p-2.5 bg-danger/10 text-danger hover:bg-danger/25 rounded-full transition-all border-none"
                          title="Remove from Wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Alerts */}
          {activeTab === 'alerts' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Bell size={22} className="text-primary" />
                Back-in-Stock Alerts
              </h2>

              {loadingAlerts ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : alerts.length === 0 ? (
                <div className="glass border-border/40 rounded-2xl p-8 text-center">
                  <p className="text-muted text-sm">You have no active back-in-stock alerts.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="glass border-border/45 rounded-2xl p-4 flex justify-between items-center gap-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground">{alert.product_name}</h4>
                        {alert.is_notified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-success font-bold mt-1.5 bg-success/10 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} />
                            Back in Stock & Available!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full">
                            <Clock size={12} />
                            Awaiting restock / reactivation
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {alert.is_notified && (
                          <Link href={`/products/${alert.product_slug || alert.product_name.toLowerCase().replace(/ /g, '-')}`} className="px-3.5 py-1.5 bg-success text-success-foreground hover:bg-success/90 text-xs font-extrabold rounded-full transition-colors border-none">
                            View Product
                          </Link>
                        )}
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="p-2 text-muted hover:text-danger rounded-xl transition-all border-none bg-transparent"
                          title="Dismiss"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Review Modal */}
      {reviewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass border-border/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-black text-foreground pr-8 mb-2">Write a Review</h3>
            <p className="text-xs text-muted mb-6">Reviewing: <strong className="text-foreground font-bold">{reviewProduct.name}</strong></p>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-5">
              {/* Star Rating selector */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform bg-transparent border-none cursor-pointer"
                    >
                      <Star 
                        size={28} 
                        className={`transition-colors ${
                          star <= rating 
                            ? 'text-warning fill-warning' 
                            : 'text-muted-dark dark:text-muted/30'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on the product quality, shipping, or overall experience..."
                  className="w-full glass rounded-2xl p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                />
              </div>

              {reviewError && (
                <div className="text-xs font-bold text-danger bg-danger/5 border border-danger/10 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="text-xs font-bold text-success bg-success/5 border border-success/10 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setReviewProduct(null)}
                  className="flex-1 py-3 bg-foreground/10 text-foreground hover:bg-foreground/15 text-xs font-extrabold rounded-full transition-all border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-3 bg-success hover:bg-success/90 text-success-foreground text-xs font-extrabold rounded-full transition-all border-none flex items-center justify-center gap-2"
                >
                  {submittingReview ? <Loader2 size={14} className="animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {/* Success Fade-out Modal Toast */}
      {cartSuccessNotice && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${
          cartSuccessNotice.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}>
          <div className="bg-success text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="text-sm font-extrabold">{cartSuccessNotice.message}</span>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <AccountContent />
    </Suspense>
  )
}
