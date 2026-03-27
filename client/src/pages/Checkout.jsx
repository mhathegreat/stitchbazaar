/**
 * Checkout page — guest and authenticated.
 * COD + Bank Transfer. Submits order to API.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Phone, User, CreditCard, Banknote, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../api/client.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'
import { formatPrice, cardAccent } from '../styles/theme.js'

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Other']

function Field({ label, name, value, type = 'text', placeholder, error, required, onChange, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
        {label} {required && <span style={{ color: '#D85A30' }}>*</span>}
      </label>
      {children || (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: '#FFFCF5', border: `2px solid ${error ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
          onFocus={e => e.target.style.borderColor = '#C88B00'}
          onBlur={e => e.target.style.borderColor = error ? '#D85A30' : 'rgba(200,139,0,0.3)'}
        />
      )}
      {error && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{error}</p>}
    </div>
  )
}

export default function Checkout() {
  const { items, total, count, clearCart, byVendor } = useCart()
  const { user, isAuth } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    email:   user?.email   || '',
    address: user?.address || '',
    city:    user?.city    || '',
    notes:   '',
    paymentMethod: 'cash_on_delivery',
  })
  const [errors,       setErrors]       = useState({})
  const [loading,      setLoading]      = useState(false)
  const [shippingRate, setShippingRate] = useState(0)   // paisa

  useEffect(() => {
    const city = form.city
    if (!city) return
    api.get('/shipping/rate', { params: { city: city.toLowerCase() } })
      .then(r => {
        const { rate, freeAbove } = r.data?.data || {}
        const cartTotal = total
        const isFree = freeAbove > 0 && cartTotal >= freeAbove
        setShippingRate(isFree ? 0 : (rate || 0))
      })
      .catch(() => setShippingRate(0))
  }, [form.city, total])

  if (count === 0) return (
    <PageWrapper title="Checkout">
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4" style={{ background: '#FFFCF5' }}>
        <span className="text-5xl">🛒</span>
        <p className="font-serif font-bold text-xl" style={{ color: '#C88B00' }}>Your cart is empty</p>
        <Link to="/products" className="btn-primary rounded-xl px-6 py-2.5">Browse Products</Link>
      </div>
    </PageWrapper>
  )

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())              errs.name    = 'Name is required'
    if (!form.phone.trim())             errs.phone   = 'Phone number is required'
    else if (form.phone.trim().length < 7) errs.phone = 'Enter a valid phone number'
    if (!form.address.trim())           errs.address = 'Delivery address is required'
    else if (form.address.trim().length < 5) errs.address = 'Address must be at least 5 characters'
    if (!form.city)                     errs.city    = 'Please select a city'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        guestName:       !isAuth ? form.name  : undefined,
        guestEmail:      !isAuth ? form.email : undefined,
        phone:           form.phone,           // required for all users
        deliveryAddress: form.address,
        city:            form.city,
        notes:           form.notes,
        paymentMethod:   form.paymentMethod,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity:  i.quantity,
        })),
      }
      const { data } = await api.post('/orders', payload)
      clearCart()
      navigate(`/order-confirmation/${data.data?.id || 'demo'}`, {
        state: { order: data.data, customerName: form.name, customerPhone: form.phone },
      })
    } catch (err) {
      const data = err?.response?.data
      if (data?.errors) {
        // Zod field errors — show the first one and highlight the field
        const fieldErrors = data.errors
        const newErrs = {}
        if (fieldErrors.deliveryAddress) newErrs.address = fieldErrors.deliveryAddress[0]
        if (fieldErrors.city)            newErrs.city    = fieldErrors.city[0]
        if (fieldErrors.phone)           newErrs.phone   = fieldErrors.phone[0]
        if (fieldErrors.items)           newErrs.items   = fieldErrors.items[0]
        if (Object.keys(newErrs).length) setErrors(newErrs)
        const firstMsg = Object.values(fieldErrors).flat()[0]
        toast.error(firstMsg || 'Please check your order details')
      } else {
        toast.error(data?.message || 'Order failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper title="Checkout">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <ColorBlob color="#D85A30" className="top-0 right-0 w-64 h-64" opacity={0.05} />

        <h1 className="font-serif font-bold text-2xl mb-6" style={{ color: '#1C0A00' }}>
          <span style={{ color: '#D85A30' }}>Checkout</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Form */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Delivery info */}
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} style={{ color: '#D85A30' }} />
                  <h2 className="font-serif font-bold text-base" style={{ color: '#1C0A00' }}>Delivery Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" value={form.name} placeholder="Muhammad Ali" error={errors.name} required onChange={handleChange} />
                  <Field label="Phone (WhatsApp)" name="phone" value={form.phone} type="tel" placeholder="03XX-XXXXXXX" error={errors.phone} required onChange={handleChange} />
                  <div className="sm:col-span-2">
                    <Field label="Email" name="email" value={form.email} type="email" placeholder="you@email.com (for confirmation)" onChange={handleChange} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Delivery Address" name="address" value={form.address} placeholder="House/Flat, Street, Area" error={errors.address} required onChange={handleChange} />
                  </div>
                  <Field label="City" name="city" value={form.city} error={errors.city} required onChange={handleChange}>
                    <select name="city" value={form.city} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: '#FFFCF5', border: `2px solid ${errors.city ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: form.city ? '#1C0A00' : '#A07000' }}>
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Order Notes" name="notes" value={form.notes} placeholder="Special instructions (optional)" onChange={handleChange} />
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={16} style={{ color: '#C88B00' }} />
                  <h2 className="font-serif font-bold text-base" style={{ color: '#1C0A00' }}>Payment Method</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: <Banknote size={18} />, color: '#0F6E56' },
                    { value: 'bank_transfer',    label: 'Bank Transfer',    sub: 'Transfer before dispatch', icon: <CreditCard size={18} />, color: '#457B9D' },
                  ].map(m => (
                    <label key={m.value} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all"
                      style={{ borderColor: form.paymentMethod === m.value ? m.color : 'rgba(200,139,0,0.15)', background: form.paymentMethod === m.value ? `${m.color}08` : '#FFFCF5' }}>
                      <input type="radio" name="paymentMethod" value={m.value}
                        checked={form.paymentMethod === m.value} onChange={handleChange} className="sr-only" />
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{m.label}</p>
                        <p className="text-xs" style={{ color: '#7A6050' }}>{m.sub}</p>
                      </div>
                      <div className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: m.color }}>
                        {form.paymentMethod === m.value && <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="sticky top-24 rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
                <h2 className="font-serif font-bold text-base mb-4" style={{ color: '#1C0A00' }}>
                  Order Summary
                </h2>
                <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
                  {Object.values(byVendor).map((group, gi) => (
                    <div key={group.vendorId}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cardAccent(gi) }}>
                        {group.vendorName}
                      </p>
                      {group.items.map(item => (
                        <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-xs mb-1">
                          <span className="truncate flex-1 pr-2" style={{ color: '#5A4030' }}>{item.name} ×{item.quantity}</span>
                          <span className="shrink-0 font-semibold" style={{ color: '#1C0A00' }}>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: 'rgba(200,139,0,0.15)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#7A6050' }}>Delivery</span>
                    <span style={{ color: shippingRate === 0 ? '#0F6E56' : '#1C0A00' }}>
                      {shippingRate === 0 ? 'Free' : formatPrice(shippingRate)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span style={{ color: '#1C0A00' }}>Total</span>
                    <span style={{ color: '#C88B00' }}>{formatPrice(total + shippingRate)}</span>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full rounded-xl py-3 font-bold mt-4 gap-2 justify-center disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Placing Order…</>
                    : <><Lock size={14} /> Place Order</>
                  }
                </button>

                <p className="text-center text-xs mt-2" style={{ color: '#A07000' }}>
                  🔒 Your information is secure
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  )
}
