/**
 * Vendor Orders — detailed order management
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle,
  ChevronDown, ChevronUp, Phone, MapPin, CreditCard, AlertCircle, MessageCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import VendorLayout from './VendorLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { vendorsApi } from '../../api/vendors.js'
import { chatApi }    from '../../api/chat.js'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.12)',  icon: <Clock size={12} />,        next: 'confirmed'  },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.12)', icon: <CheckCircle size={12} />,  next: 'packed'     },
  packed:    { label: 'Packed',    color: '#6A4C93', bg: 'rgba(106,76,147,0.12)', icon: <Package size={12} />,      next: 'shipped'    },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.12)',  icon: <Truck size={12} />,        next: 'delivered'  },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.12)',  icon: <CheckCircle size={12} />,  next: null         },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.12)',  icon: <XCircle size={12} />,      next: null         },
}

const NEXT_LABEL = {
  confirmed: 'Mark Packed',
  packed:    'Mark Shipped',
  shipped:   'Mark Delivered',
}

export default function VendorOrders() {
  const navigate = useNavigate()
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [expanded, setExpanded] = useState({})
  const [updating, setUpdating] = useState(null)

  async function startChat(customerId) {
    if (!customerId) return toast.error('No customer account to chat with')
    try {
      const d = await chatApi.startAsVendor(customerId)
      navigate(`/vendor/messages/${d.data.id}`)
    } catch {
      toast.error('Could not start chat')
    }
  }

  useEffect(() => {
    vendorsApi.orders()
      .then(d => setItems(d.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.vendorStatus === filter)

  const counts = items.reduce((acc, i) => {
    acc[i.vendorStatus] = (acc[i.vendorStatus] || 0) + 1
    return acc
  }, {})

  async function advanceStatus(itemId, next) {
    setUpdating(itemId)
    try {
      await vendorsApi.updateOrderStatus(itemId, next)
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, vendorStatus: next } : i))
      toast.success(`Status updated to ${STATUS_CONFIG[next]?.label}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  function toggleExpand(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  const stats = [
    { label: 'Pending',   value: counts.pending   || 0, color: '#C88B00' },
    { label: 'Active',    value: (counts.confirmed || 0) + (counts.packed || 0) + (counts.shipped || 0), color: '#457B9D' },
    { label: 'Delivered', value: counts.delivered  || 0, color: '#0F6E56' },
    { label: 'Cancelled', value: counts.cancelled  || 0, color: '#D85A30' },
  ]

  return (
    <VendorLayout active="/vendor/orders" title="Orders">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <h1 className="font-serif font-bold text-2xl mb-5" style={{ color: '#1C0A00' }}>
              Order <span style={{ color: '#C88B00' }}>Management</span>
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {stats.map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                  <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: '#7A6050' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map(f => {
                const sc = STATUS_CONFIG[f]
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                    style={filter === f
                      ? { background: sc?.color || '#1C0A00', color: '#FFFCF5' }
                      : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
                    {f === 'all' ? `All (${items.length})` : `${sc?.label} (${counts[f] || 0})`}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="skeleton rounded-xl" style={{ height: 120 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
                <p style={{ color: '#7A6050' }}>No {filter !== 'all' ? filter : ''} orders yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(item => {
                  const sc  = STATUS_CONFIG[item.vendorStatus] || STATUS_CONFIG.pending
                  const exp = expanded[item.id]
                  const customer = item.order?.customer?.name || item.order?.guestName || 'Guest'
                  const phone    = item.order?.customer?.phone || item.order?.guestPhone || '—'
                  const address  = item.order?.deliveryAddress || '—'
                  const city     = item.order?.city || ''
                  const orderId  = item.order?.id || ''
                  const nextStatus = sc.next

                  return (
                    <div key={item.id} className="rounded-xl overflow-hidden"
                      style={{ border: '2px solid rgba(200,139,0,0.15)', background: '#FFF8E7' }}>
                      {/* Order header */}
                      <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                        style={{ background: '#1C0A00' }}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-xs font-bold" style={{ color: '#C88B00' }}>
                            #{orderId.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs" style={{ color: '#7A6050' }}>
                            {item.order?.createdAt ? new Date(item.order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' }) : ''}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: '#FFFCF5' }}>
                            {customer}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: sc.bg, color: sc.color }}>
                            {sc.icon} {sc.label}
                          </span>
                          <button onClick={() => toggleExpand(item.id)}
                            className="p-1 rounded-lg" style={{ color: '#7A6050' }}>
                            {exp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Product row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-xl"
                          style={{ background: 'rgba(200,139,0,0.1)' }}>
                          {item.product?.images?.[0]
                            ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                            : '🧶'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1C0A00' }}>
                            {item.product?.name || 'Product'}
                          </p>
                          {item.variant?.label && (
                            <p className="text-xs" style={{ color: '#7A6050' }}>{item.variant.label}</p>
                          )}
                          <p className="text-xs" style={{ color: '#7A6050' }}>Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm" style={{ color: '#C88B00' }}>
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          <p className="text-xs" style={{ color: '#7A6050' }}>
                            {item.order?.paymentMethod === 'cash_on_delivery' ? '💵 COD' : '🏦 Bank'}
                          </p>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {exp && (
                        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0"
                          style={{ borderTop: '1px solid rgba(200,139,0,0.1)' }}>
                          <div className="flex items-start gap-2 pt-3">
                            <Phone size={14} className="mt-0.5 shrink-0" style={{ color: '#C88B00' }} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#A07000' }}>Customer Phone</p>
                              <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>{phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pt-3 sm:col-span-2">
                            <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: '#C88B00' }} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#A07000' }}>Delivery Address</p>
                              <p className="text-sm" style={{ color: '#1C0A00' }}>{address}</p>
                              {city && <p className="text-xs" style={{ color: '#7A6050' }}>{city}</p>}
                            </div>
                          </div>
                          {item.order?.customer?.id && (
                            <div className="pt-1 sm:col-span-3">
                              <button
                                onClick={() => startChat(item.order.customer.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5"
                                style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00', border: '1px solid rgba(200,139,0,0.2)' }}>
                                <MessageCircle size={13} /> Message Customer
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action footer */}
                      {(nextStatus || item.vendorStatus === 'pending') && item.vendorStatus !== 'cancelled' && item.vendorStatus !== 'delivered' && (
                        <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
                          style={{ borderTop: '1px solid rgba(200,139,0,0.1)', background: 'rgba(200,139,0,0.04)' }}>
                          <p className="text-xs" style={{ color: '#7A6050' }}>
                            {item.vendorStatus === 'pending' ? '⏳ Waiting for confirmation' : `Next: ${STATUS_CONFIG[nextStatus]?.label}`}
                          </p>
                          <div className="flex gap-2">
                            {item.vendorStatus === 'pending' && (
                              <button
                                disabled={updating === item.id}
                                onClick={() => advanceStatus(item.id, 'cancelled')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30' }}>
                                Cancel
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                disabled={updating === item.id}
                                onClick={() => advanceStatus(item.id, nextStatus)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                                style={{ background: sc.color, color: '#FFFCF5' }}>
                                {updating === item.id ? 'Updating…' : (NEXT_LABEL[item.vendorStatus] || `Mark ${STATUS_CONFIG[nextStatus]?.label}`)}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </VendorLayout>
  )
}
