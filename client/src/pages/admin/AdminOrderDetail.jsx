/**
 * Admin Order Detail — /admin/orders/:id
 */

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle,
  RefreshCw, User, MapPin, CreditCard, AlertTriangle, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { ordersApi } from '../../api/orders.js'
import { adminApi } from '../../api/admin.js'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  icon: <Clock size={14} />,       step: 0 },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.1)', icon: <CheckCircle size={14} />, step: 1 },
  packed:    { label: 'Packed',    color: '#6A4C93', bg: 'rgba(106,76,147,0.1)', icon: <Package size={14} />,     step: 2 },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.1)',  icon: <Truck size={14} />,       step: 3 },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  icon: <CheckCircle size={14} />, step: 4 },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <XCircle size={14} />,     step: -1 },
  disputed:  { label: 'Disputed',  color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <AlertTriangle size={14} />, step: -1 },
}

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
const STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order,    setOrder]   = useState(null)
  const [loading,  setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    ordersApi.get(id)
      .then(d => { if (d.data) setOrder(d.data) })
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      await adminApi.updateOrderStatus(id, newStatus)
      setOrder(o => ({ ...o, status: newStatus }))
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <AdminLayout active="/admin/orders" title="Order Detail">
      <div className="max-w-3xl flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton rounded-xl" style={{ height: 120 }} />
        <div className="skeleton rounded-xl" style={{ height: 250 }} />
      </div>
    </AdminLayout>
  )

  if (!order) return (
    <AdminLayout active="/admin/orders" title="Order Detail">
      <p style={{ color: '#7A6050' }}>Order not found.</p>
    </AdminLayout>
  )

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = STEPS.indexOf(order.status)

  return (
    <AdminLayout active="/admin/orders" title="Order Detail">
      <div className="max-w-3xl">

        <Link to="/admin/orders" className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: '#C88B00' }}>
          <ArrowLeft size={15} /> Back to Orders
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
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

        {/* Status update */}
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3 flex-wrap"
          style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
          <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>Update Status:</p>
          <select
            value={order.status}
            disabled={updating}
            onChange={e => handleStatusChange(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}>
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {updating && <RefreshCw size={14} className="animate-spin" style={{ color: '#C88B00' }} />}
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
          <div className="px-4 py-3" style={{ background: '#C88B00' }}>
            <p className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>Order Items</p>
          </div>
          {(order.items || []).map((item, i) => {
            const theme = item.vendor?.colorTheme || '#C88B00'
            return (
              <div key={item.id} style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                <div className="px-4 py-2 flex items-center justify-between"
                  style={{ background: theme + '20' }}>
                  <span className="text-xs font-bold" style={{ color: theme }}>
                    {item.vendor?.shopName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{
                      background: STATUS_CONFIG[item.vendorStatus]?.bg || 'rgba(200,139,0,0.1)',
                      color:      STATUS_CONFIG[item.vendorStatus]?.color || '#C88B00',
                    }}>
                    {item.vendorStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4" style={{ background: '#FFF8E7' }}>
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{ background: theme + '15' }}>
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                      : '🧶'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{item.product?.name}</p>
                    {item.variant?.label && (
                      <p className="text-xs" style={{ color: '#7A6050' }}>Variant: {item.variant.label}</p>
                    )}
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

        {/* Summary + Customer + Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-serif font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: '#C88B00' }}>
              <CreditCard size={14} /> Order Summary
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#7A6050' }}>Total</span>
                <span className="font-bold" style={{ color: '#C88B00' }}>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#7A6050' }}>Payment</span>
                <span style={{ color: '#1C0A00' }}>
                  {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-serif font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: '#C88B00' }}>
              <User size={14} /> Customer
            </p>
            <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>
              {order.customer?.name || order.guestName || 'Guest'}
            </p>
            <p className="text-xs" style={{ color: '#7A6050' }}>
              {order.customer?.email || order.guestEmail || '—'}
            </p>
            {order.phone && (
              <p className="text-xs mt-1" style={{ color: '#7A6050' }}>{order.phone}</p>
            )}
          </div>

          <div className="rounded-xl p-4 sm:col-span-2" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-serif font-bold text-sm mb-2 flex items-center gap-1.5" style={{ color: '#C88B00' }}>
              <MapPin size={14} /> Delivery Address
            </p>
            <p className="text-sm" style={{ color: '#1C0A00' }}>{order.deliveryAddress}</p>
            <p className="text-sm" style={{ color: '#7A6050' }}>{order.city}</p>
            {order.notes && (
              <p className="text-xs mt-2 italic" style={{ color: '#7A6050' }}>Note: {order.notes}</p>
            )}
          </div>
        </div>

        {/* Disputes */}
        {order.disputes?.length > 0 && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(216,90,48,0.06)', border: '1.5px solid rgba(216,90,48,0.2)' }}>
            <p className="font-serif font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: '#D85A30' }}>
              <AlertTriangle size={14} /> Disputes ({order.disputes.length})
            </p>
            {order.disputes.map(d => (
              <div key={d.id} className="text-sm" style={{ color: '#1C0A00' }}>
                <p className="font-semibold capitalize">{d.status} — {d.reason}</p>
                {d.description && <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>{d.description}</p>}
              </div>
            ))}
            <Link to="/admin/disputes" className="mt-2 inline-flex text-xs font-semibold hover:underline"
              style={{ color: '#D85A30' }}>
              Manage Disputes →
            </Link>
          </div>
        )}

        {/* Refund */}
        {order.refund && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(106,76,147,0.06)', border: '1.5px solid rgba(106,76,147,0.2)' }}>
            <p className="font-serif font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: '#6A4C93' }}>
              <RotateCcw size={14} /> Refund Request
            </p>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: '#7A6050' }}>Amount</span>
              <span className="font-bold" style={{ color: '#6A4C93' }}>{formatPrice(order.refund.amount)}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#7A6050' }}>Reason: {order.refund.reason}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                style={{
                  background: order.refund.status === 'approved' ? 'rgba(15,110,86,0.1)' : order.refund.status === 'rejected' ? 'rgba(216,90,48,0.1)' : 'rgba(200,139,0,0.1)',
                  color:      order.refund.status === 'approved' ? '#0F6E56' : order.refund.status === 'rejected' ? '#D85A30' : '#C88B00',
                }}>
                {order.refund.status}
              </span>
              {order.refund.adminNote && (
                <span className="text-xs" style={{ color: '#7A6050' }}>— {order.refund.adminNote}</span>
              )}
            </div>
            <Link to="/admin/refunds" className="mt-2 inline-flex text-xs font-semibold hover:underline"
              style={{ color: '#6A4C93' }}>
              Manage Refunds →
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
