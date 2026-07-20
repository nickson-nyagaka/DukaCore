'use client'

import { useEffect, useState } from 'react'
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
  Loader2
} from 'lucide-react'
import Link from 'next/link'

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

interface Order {
  id: number
  created_at: string
  status: OrderStatus
  shipping_address: string
  total_price: number
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
  is_notified: boolean
  notified_at?: string
}

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth()
  const { addItem, localAddItem } = useCartStore()

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'alerts'>('orders')
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

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingWishlist, setLoadingWishlist] = useState(false)
  const [loadingAlerts, setLoadingAlerts] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOrders()
      fetchWishlist()
      fetchAlerts()
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
    try {
      if (user) {
        await addItem(item.id, 1)
      } else {
        localAddItem({
          product_id: item.id,
          quantity: 1,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          slug: item.slug
        })
      }
      alert('🛒 Item added to your cart!')
    } catch (e) {
      console.error('Failed to add wishlist item to cart', e)
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
          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border ${
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

          <button
            onClick={() => { setActiveTab('wishlist'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border ${
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

          <button
            onClick={() => { setActiveTab('alerts'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all w-full text-left border ${
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
                              <span className="text-sm font-black text-primary">KES {Number(order.total_price).toLocaleString()}</span>
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
                            <span className="text-xs text-muted block mt-0.5">Quantity: {item.quantity} • Price: KES {Number(item.product_price).toLocaleString()}</span>
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
                      {selectedOrder.status_history.map(history => (
                        <div key={history.id} className="flex gap-4 text-xs">
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
                            Back in Stock!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted font-bold mt-1.5 bg-muted/10 px-2.5 py-1 rounded-full">
                            <Clock size={12} />
                            Awaiting stock replenishment
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {alert.is_notified && (
                          <Link href={`/products/${alert.product_name.toLowerCase().replace(/ /g, '-')}`} className="px-3.5 py-1.5 bg-success text-success-foreground hover:bg-success/90 text-xs font-extrabold rounded-full transition-colors border-none">
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

    </div>
  )
}
