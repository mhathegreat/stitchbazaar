/**
 * useRecentlyViewed — persists last 8 viewed product stubs in localStorage.
 * Each entry: { id, name, basePrice, images, category }
 */

import { useState, useEffect, useCallback } from 'react'

const KEY   = 'sb_recently_viewed'
const LIMIT = 8

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState(load)

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setItems(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addProduct = useCallback((product) => {
    if (!product?.id) return
    setItems(prev => {
      const stub = {
        id:        product.id,
        name:      product.name,
        basePrice: product.basePrice,
        images:    product.images,
        category:  product.category,
        avgRating: product.avgRating ?? null,
      }
      const filtered = prev.filter(p => p.id !== stub.id)
      const next = [stub, ...filtered].slice(0, LIMIT)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(KEY)
    setItems([])
  }, [])

  return { items, addProduct, clear }
}
