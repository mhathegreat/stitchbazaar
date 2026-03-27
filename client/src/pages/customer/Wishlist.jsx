/**
 * Customer Wishlist — /customer/wishlist
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { wishlistApi } from '../../api/wishlist.js'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import toast from 'react-hot-toast'

export default function CustomerWishlist() {
  const { addItem } = useCart()
  const { isAuth } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuth) { setLoading(false); return }
    wishlistApi.get()
      .then(d => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuth])

  async function remove(productId, wishlistId) {
    try {
      await wishlistApi.remove(productId)
      setItems(is => is.filter(i => i.id !== wishlistId))
      toast.success('Removed from wishlist')
    } catch { toast.error('Could not remove item') }
  }

  async function moveToCart(item) {
    const p = item.product
    addItem({
      productId:   p.id,
      name:        p.name,
      price:       p.basePrice,
      vendorId:    p.vendor?.id || 'vendor_1',
      vendorName:  p.vendor?.shopName || '',
      image:       p.images?.[0] || null,
    }, 1)
    await remove(p.id, item.id)
  }

  return (
    <PageWrapper title="My Wishlist">
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
              My <span style={{ color: '#C88B00' }}>Wishlist</span>
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal" style={{ color: '#7A6050' }}>
                  ({items.length} {items.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h1>
            <Link to="/products" className="text-sm font-semibold hover:underline" style={{ color: '#C88B00' }}>
              Continue shopping →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="skeleton rounded-xl" style={{ height: 260 }} />)}
            </div>
          ) : !isAuth ? (
            <div className="text-center py-20">
              <Heart size={48} className="mx-auto mb-4" style={{ color: '#C88B00', opacity: 0.3 }} />
              <p className="font-serif text-xl font-bold mb-2" style={{ color: '#C88B00' }}>Sign in to view your wishlist</p>
              <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold mt-2"
                style={{ background: '#C88B00', color: '#1C0A00' }}>Sign In</Link>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={48} className="mx-auto mb-4" style={{ color: '#C88B00', opacity: 0.3 }} />
              <p className="font-serif text-xl font-bold mb-2" style={{ color: '#C88B00' }}>Your wishlist is empty</p>
              <p className="text-sm mb-5" style={{ color: '#7A6050' }}>Save items you love and come back to them later.</p>
              <Link to="/products"
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#C88B00', color: '#1C0A00' }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, i) => {
                const p = item.product
                const accent = cardAccent(i)
                return (
                  <div key={item.id} className="rounded-xl overflow-hidden"
                    style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                    {/* Image area */}
                    <div className="relative h-40 flex items-center justify-center"
                      style={{ background: accent + '15' }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <Package size={48} style={{ color: accent, opacity: 0.4 }} />
                      }
                      {p.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgba(28,10,0,0.55)' }}>
                          <span className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ background: '#D85A30', color: '#FFFCF5' }}>Out of Stock</span>
                        </div>
                      )}
                      <button onClick={() => remove(p.id, item.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#D85A30', color: '#FFFCF5' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: accent }}>
                        {p.vendor?.shopName || ''}
                      </p>
                      <Link to={`/products/${p.id}`}
                        className="font-semibold text-sm leading-tight hover:underline line-clamp-2"
                        style={{ color: '#1C0A00' }}>
                        {p.name}
                      </Link>
                      <p className="font-bold text-base mt-1" style={{ color: '#C88B00' }}>
                        {formatPrice(p.basePrice)}
                      </p>

                      <button onClick={() => moveToCart(item)} disabled={p.stock === 0}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-40"
                        style={{ background: p.stock > 0 ? '#C88B00' : 'rgba(200,139,0,0.2)', color: '#1C0A00' }}>
                        <ShoppingCart size={13} />
                        {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
