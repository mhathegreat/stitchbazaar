/**
 * Customer Order Detail — /customer/orders/:id
 */

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle, MessageCircle, Printer, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/client.js'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { formatPrice } from '../../styles/theme.js'
import { buildOrderWhatsAppLink } from '../../utils/whatsapp.js'
import { ordersApi } from '../../api/orders.js'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  icon: <Clock size={14} />,       step: 0 },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.1)', icon: <CheckCircle size={14} />, step: 1 },
  packed:    { label: 'Packed',    color: '#6A4C93', bg: 'rgba(106,76,147,0.1)', icon: <Package size={14} />,     step: 2 },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.1)',  icon: <Truck size={14} />,       step: 3 },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  icon: <CheckCircle size={14} />, step: 4 },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <XCircle size={14} />,     step: -1 },
  disputed:  { label: 'Disputed',  color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <XCircle size={14} />,     step: -1 },
}

const STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

const MOCK_ORDER = {
  id: '', status: 'pending', createdAt: new Date().toISOString(),
  totalAmount: 0, paymentMethod: 'cash_on_delivery',
  deliveryAddress: '', city: '', notes: '', items: [],
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order,           setOrder]          = useState(MOCK_ORDER)
  const [loading,         setLoading]        = useState(true)
  const [refundReason,    setRefundReason]   = useState('')
  const [refundSubmitted, setRefundSubmitted]= useState(false)
  const [refundLoading,   setRefundLoading]  = useState(false)
  const [showRefundForm,  setShowRefundForm] = useState(false)

  async function submitRefund() {
    if (!refundReason.trim() || refundReason.trim().length < 10) {
      toast.error('Please provide at least 10 characters of reason')
      return
    }
    setRefundLoading(true)
    try {
      await api.post('/refunds', {
        orderId: order.id,
        reason:  refundReason.trim(),
        amount:  order.totalAmount,
      })
      setRefundSubmitted(true)
      setShowRefundForm(false)
      toast.success('Refund request submitted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit refund request')
    } finally {
      setRefundLoading(false)
    }
  }

  useEffect(() => {
    ordersApi.get(id)
      .then(d => { if (d.data) setOrder(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <PageWrapper title="Order">
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton rounded-xl" style={{ height: 120 }} />
        <div className="skeleton rounded-xl" style={{ height: 200 }} />
      </div>
    </PageWrapper>
  )

  const sc    = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = STEPS.indexOf(order.status)

  const firstVendorPhone = order.items?.[0]?.vendor?.phone
  const waLink = firstVendorPhone ? buildOrderWhatsAppLink({
    phone:      firstVendorPhone.replace(/\D/g,'').replace(/^0/,'92'),
    orderId:    order.id,
    items:      order.items.map(i => ({ name: i.product?.name || '', quantity: i.quantity, unitPrice: i.unitPrice })),
    total:      order.totalAmount,
    vendorName: order.items[0]?.vendor?.shopName,
  }) : null

  return (
    <PageWrapper title={`Order #${order.id.slice(-8).toUpperCase()}`}>
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* Back */}
          <Link to="/customer/orders" className="flex items-center gap-2 text-sm mb-5 hover:underline"
            style={{ color: '#C88B00' }}>
            <ArrowLeft size={15} /> Back to Orders
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
                Order <span style={{ color: '#C88B00' }}>#{order.id.slice(-8).toUpperCase()}</span>
              </h1>
              <p className="text-sm" style={{ color: '#7A6050' }}>
                Placed {new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: sc.bg, color: sc.color }}>
              {sc.icon} {sc.label}
            </span>
          </div>

          {/* Progress tracker */}
          {order.status !== 'cancelled' && order.status !== 'disputed' && (
            <div className="rounded-xl p-5 mb-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep
                  const sc2  = STATUS_CONFIG[step]
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          style={{
                            background: done ? sc2.color : 'rgba(200,139,0,0.1)',
                            color:      done ? '#FFFCF5' : '#7A6050',
                          }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className="text-[9px] font-semibold text-center"
                          style={{ color: done ? sc2.color : '#7A6050' }}>
                          {sc2.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 -mt-4"
                          style={{ background: i < currentStep ? '#C88B00' : 'rgba(200,139,0,0.2)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl overflow-hidden mb-5"
            style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            {order.items.map((item, i) => {
              const theme = item.vendor.colorTheme
              return (
                <div key={item.id}>
                  <div className="px-4 py-2 flex items-center justify-between"
                    style={{ background: theme + '20' }}>
                    <span className="text-xs font-bold" style={{ color: theme }}>
                      {item.vendor.shopName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: STATUS_CONFIG[item.vendorStatus]?.bg, color: STATUS_CONFIG[item.vendorStatus]?.color }}>
                      {item.vendorStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-4" style={{ background: '#FFF8E7' }}>
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
                      style={{ background: theme + '15' }}>
                      {item.product.images[0]
                        ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                        : '🧶'
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{item.product.name}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0" style={{ color: '#C88B00' }}>
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary + Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <p className="font-serif font-bold text-sm mb-3" style={{ color: '#C88B00' }}>Order Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#7A6050' }}>Subtotal</span>
                  <span style={{ color: '#1C0A00' }}>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#7A6050' }}>Delivery</span>
                  <span className="font-semibold" style={{ color: '#0F6E56' }}>Free</span>
                </div>
                <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid rgba(200,139,0,0.1)' }}>
                  <span style={{ color: '#1C0A00' }}>Total</span>
                  <span style={{ color: '#C88B00' }}>{formatPrice(order.totalAmount)}</span>
                </div>
                <p className="text-xs pt-1" style={{ color: '#7A6050' }}>
                  Payment: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <p className="font-serif font-bold text-sm mb-3" style={{ color: '#C88B00' }}>Delivery Address</p>
              <p className="text-sm" style={{ color: '#1C0A00' }}>{order.deliveryAddress}</p>
              <p className="text-sm" style={{ color: '#7A6050' }}>{order.city}</p>
              {order.notes && (
                <p className="text-xs mt-2 italic" style={{ color: '#7A6050' }}>Note: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 no-print">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#25D366', color: '#FFFCF5' }}>
                <MessageCircle size={15} /> WhatsApp Vendor
              </a>
            )}

            {order.status === 'delivered' && (
              <Link to={`/customer/orders/${order.id}/dispute`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', border: '1px solid rgba(216,90,48,0.3)' }}>
                Report an Issue
              </Link>
            )}

            {order.status === 'delivered' && !refundSubmitted && (
              <button
                onClick={() => setShowRefundForm(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(106,76,147,0.1)', color: '#6A4C93', border: '1px solid rgba(106,76,147,0.25)' }}>
                <RotateCcw size={14} /> Request Refund
              </button>
            )}
            {refundSubmitted && (
              <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(15,110,86,0.08)', color: '#0F6E56' }}>
                ✓ Refund requested
              </span>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00', border: '1px solid rgba(200,139,0,0.2)' }}>
              <Printer size={14} /> Print Invoice
            </button>

            <Link to="/customer/orders"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00' }}>
              <ArrowLeft size={14} /> All Orders
            </Link>
          </div>

          {/* Refund form */}
          {showRefundForm && (
            <div className="mt-4 rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(106,76,147,0.2)' }}>
              <p className="font-semibold text-sm mb-3" style={{ color: '#6A4C93' }}>Reason for refund</p>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                rows={3}
                placeholder="Please describe the issue with your order (min 10 characters)…"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(106,76,147,0.3)', color: '#1C0A00' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitRefund}
                  disabled={refundLoading}
                  className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                  style={{ background: '#6A4C93', color: '#FFFCF5' }}>
                  {refundLoading ? 'Submitting…' : 'Submit Request'}
                </button>
                <button
                  onClick={() => setShowRefundForm(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: '#7A6050' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Print-only invoice header */}
          <div className="hidden print:block mt-0 mb-4 text-center">
            <p className="font-serif font-bold text-2xl" style={{ color: '#C88B00' }}>StitchBazaar</p>
            <p className="text-xs text-gray-500">CRAFTS · KNITTING · HABERDASHERY</p>
            <p className="text-xs text-gray-400 mt-1">Invoice — Order #{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'long' })}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
