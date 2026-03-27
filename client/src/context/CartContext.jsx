/**
 * CartContext
 * Multi-vendor cart. Persisted to localStorage.
 * Items grouped by vendorId when rendering.
 * All prices stored as integers in paisa.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
const STORAGE_KEY = 'sb_cart'
const SYNC_DELAY  = 3000   // debounce 3 s before syncing to server

export function CartProvider({ children }) {
  const { user } = useAuth()

  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
    } catch {
      return []
    }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Debounced server sync for abandonment recovery (logged-in users only)
  const syncTimer = useRef(null)
  useEffect(() => {
    if (!user) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      const payload = items.map(i => ({
        productId: i.productId,
        name:      i.name,
        price:     i.price,
        qty:       i.quantity,
        image:     i.image || null,
      }))
      api.post('/cart/sync', { items: payload }).catch(() => {})
    }, SYNC_DELAY)
    return () => clearTimeout(syncTimer.current)
  }, [items, user])

  /**
   * Add an item. If same productId + variantId exists, increment quantity.
   * @param {{ productId, variantId, name, price, image, vendorId, vendorName, stock, quantity? }} item
   */
  const addItem = useCallback((item) => {
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      )
      if (idx === -1) {
        return [...prev, { ...item, quantity: item.quantity ?? 1 }]
      }
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        quantity: Math.min(next[idx].quantity + (item.quantity ?? 1), next[idx].stock),
      }
      return next
    })
  }, [])

  const removeItem = useCallback((productId, variantId) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
  }, [])

  const updateQty = useCallback((productId, variantId, quantity) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i =>
      i.productId === productId && i.variantId === variantId
        ? { ...i, quantity: Math.min(quantity, i.stock) }
        : i
    ))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    if (user) api.post('/cart/sync', { items: [] }).catch(() => {})
  }, [user])

  /** Total in paisa */
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  /** Item count */
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  /** Items grouped by vendor */
  const byVendor = items.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = { vendorId: item.vendorId, vendorName: item.vendorName, items: [] }
    }
    acc[item.vendorId].items.push(item)
    return acc
  }, {})

  const value = { items, addItem, removeItem, updateQty, clearCart, total, count, byVendor }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/** @returns {CartContext} */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
