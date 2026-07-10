import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from './auth'

// Generate a guest session UUID for unauthenticated cart tracking
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('dukacore_session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('dukacore_session_id', sid)
  }
  return sid
}

export interface CartItem {
  product_id: number
  quantity: number
  name: string
  price: number
  image_url?: string
  slug: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  sessionId: string
  addItem: (productId: number, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncFromServer: () => Promise<void>
  localAddItem: (item: CartItem) => void
  localRemoveItem: (productId: number) => void
  localUpdateQuantity: (productId: number, quantity: number) => void
  localClear: () => void
}

function recalc(items: CartItem[]) {
  return {
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      sessionId: '',

      syncFromServer: async () => {
        try {
          const data = await apiFetch('/api/cart/')
          set({ items: data.items, total: data.total, itemCount: data.item_count })
        } catch {
          // Not authenticated — keep local state
        }
      },

      addItem: async (productId, quantity = 1) => {
        const data = await apiFetch('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, quantity }),
        })
        set({ items: data.items, total: data.total, itemCount: data.item_count })
      },

      removeItem: async (productId) => {
        const data = await apiFetch(`/api/cart/items/${productId}`, { method: 'DELETE' })
        set({ items: data.items, total: data.total, itemCount: data.item_count })
      },

      updateQuantity: async (productId, quantity) => {
        const data = await apiFetch(`/api/cart/items/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({ product_id: productId, quantity }),
        })
        set({ items: data.items, total: data.total, itemCount: data.item_count })
      },

      clearCart: async () => {
        await apiFetch('/api/cart/', { method: 'DELETE' })
        set({ items: [], total: 0, itemCount: 0 })
      },

      // ── Local-only operations for guest carts ──

      localAddItem: (item) => {
        const items = get().items
        const existing = items.find(i => i.product_id === item.product_id)
        let newItems: CartItem[]
        if (existing) {
          newItems = items.map(i =>
            i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        } else {
          newItems = [...items, item]
        }
        set({ items: newItems, ...recalc(newItems), sessionId: getOrCreateSessionId() })
      },

      localRemoveItem: (productId) => {
        const newItems = get().items.filter(i => i.product_id !== productId)
        set({ items: newItems, ...recalc(newItems) })
      },

      localUpdateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().localRemoveItem(productId)
          return
        }
        const newItems = get().items.map(i =>
          i.product_id === productId ? { ...i, quantity } : i
        )
        set({ items: newItems, ...recalc(newItems) })
      },

      localClear: () => {
        set({ items: [], total: 0, itemCount: 0 })
      },
    }),
    { name: 'dukacore-cart' }
  )
)
