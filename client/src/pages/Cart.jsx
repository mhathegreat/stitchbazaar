/**
 * Cart page — multi-vendor cart grouped by shop, with coupon input.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Store, Tag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice, cardAccent } from '../styles/theme.js'
import { couponsApi } from '../api/coupons.js'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'

export default function Cart() {
  const { items, byVendor, updateQty, removeItem, total, count, clearCart } = useCart()

  const [couponInput,    setCouponInput]    = useState('')
  const [appliedCoupon,  setAppliedCoupon]  = useState(null)  // { code, discount, finalTotal }
  const [couponLoading,  setCouponLoading]  = useState(false)

  const displayTotal   = appliedCoupon ? appliedCoupon.finalTotal : total
  const discountAmount = appliedCoupon?.discount || 0

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const data = await couponsApi.validate(couponInput.trim(), total)
      setAppliedCoupon(data)
      toast.success(`Coupon applied! You save ${formatPrice(data.discount)}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
  }

  if (count === 0) return (
    <PageWrapper title="Cart">
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-5 px-4" style={{ background: '#FFFCF5' }}>
        <span className="text-7xl">🧺</span>
        <BrushstrokeHeading>
          <span style={{ color: '#C88B00' }}>Your Cart</span>{' '}
          <span style={{ color: '#1C0A00' }}>is Empty</span>
        </BrushstrokeHeading>
        <p className="text-sm" style={{ color: '#7A6050' }}>Browse our products and add some crafty items!</p>
        <Link to="/products" className="btn-primary rounded-xl px-8 py-3 gap-2">
          <ShoppingCart size={16} /> Browse Products
        </Link>
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper title="Your Cart">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <ColorBlob color="#C88B00" className="top-0 right-0 w-72 h-72" opacity={0.05} />

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <BrushstrokeHeading align="left" beads={false}>
            <span style={{ color: '#C88B00' }}>Cart</span>{' '}
            <span style={{ color: '#1C0A00' }}>({count} items)</span>
          </BrushstrokeHeading>
          <button onClick={clearCart} className="text-sm hover:underline" style={{ color: '#D85A30' }}>
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {Object.values(byVendor).map((group, gi) => (
              <div key={group.vendorId} className="rounded-xl overflow-hidden"
                style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
                {/* Vendor header */}
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{ background: cardAccent(gi), color: '#1C0A00' }}>
                  <Store size={14} />
                  <Link to={`/vendors/${group.vendorId}`} className="font-semibold text-sm hover:underline">
                    {group.vendorName}
                  </Link>
                </div>

                {/* Items */}
                <div className="flex flex-col divide-y" style={{ background: '#FFF8E7', divideColor: 'rgba(200,139,0,0.1)' }}>
                  {group.items.map(item => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 p-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
                        style={{ background: 'rgba(200,139,0,0.1)' }}>
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : '🧶'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.productId}`}
                          className="font-semibold text-sm line-clamp-2 hover:underline" style={{ color: '#1C0A00' }}>
                          {item.name}
                        </Link>
                        <p className="font-bold text-sm mt-1" style={{ color: '#C88B00' }}>
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Qty stepper */}
                        <div className="flex items-center border rounded-lg overflow-hidden"
                          style={{ borderColor: 'rgba(200,139,0,0.3)' }}>
                          <button onClick={() => item.quantity > 1 ? updateQty(item.productId, item.variantId, item.quantity - 1) : removeItem(item.productId, item.variantId)}
                            className="w-7 h-7 flex items-center justify-center text-sm transition-colors hover:bg-amber-50"
                            style={{ color: '#C88B00' }}>
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold" style={{ color: '#1C0A00' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 flex items-center justify-center text-sm transition-colors hover:bg-amber-50 disabled:opacity-40"
                            style={{ color: '#C88B00' }}>
                            <Plus size={12} />
                          </button>
                        </div>

                        <p className="text-xs font-bold" style={{ color: '#1C0A00' }}>
                          {formatPrice(item.price * item.quantity)}
                        </p>

                        <button onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 rounded transition-colors hover:bg-red-50"
                          style={{ color: '#D85A30' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
              <h2 className="font-serif font-bold text-lg mb-4" style={{ color: '#1C0A00' }}>Order Summary</h2>

              {/* Coupon input */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-4"
                  style={{ background: 'rgba(15,110,86,0.08)', border: '1px solid rgba(15,110,86,0.25)' }}>
                  <div className="flex items-center gap-2">
                    <Tag size={13} style={{ color: '#0F6E56' }} />
                    <span className="text-xs font-bold" style={{ color: '#0F6E56' }}>{appliedCoupon.code}</span>
                    <span className="text-xs" style={{ color: '#0F6E56' }}>— save {formatPrice(discountAmount)}</span>
                  </div>
                  <button onClick={removeCoupon}><X size={13} style={{ color: '#7A6050' }} /></button>
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    style={{ background: '#C88B00', color: '#1C0A00' }}>
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#7A6050' }}>Subtotal ({count} items)</span>
                  <span style={{ color: '#1C0A00' }}>{formatPrice(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#0F6E56' }}>Discount</span>
                    <span className="font-semibold" style={{ color: '#0F6E56' }}>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#7A6050' }}>Delivery</span>
                  <span style={{ color: '#0F6E56' }}>Free</span>
                </div>
                <div className="border-t pt-2 mt-1" style={{ borderColor: 'rgba(200,139,0,0.2)' }}>
                  <div className="flex justify-between">
                    <span className="font-bold text-sm" style={{ color: '#1C0A00' }}>Total</span>
                    <span className="font-bold text-lg" style={{ color: '#C88B00' }}>{formatPrice(displayTotal)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs mb-4 px-2 py-2 rounded-lg text-center"
                style={{ background: 'rgba(15,110,86,0.08)', color: '#0F6E56' }}>
                💵 Payment: Cash on Delivery
              </p>

              <Link
                to={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}&discount=${appliedCoupon.discount}` : ''}`}
                className="btn-primary w-full rounded-xl py-3 font-bold gap-2 justify-center">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <Link to="/products" className="block text-center text-sm mt-3 hover:underline" style={{ color: '#C88B00' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
