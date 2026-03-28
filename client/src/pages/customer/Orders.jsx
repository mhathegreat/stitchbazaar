/**
 * Customer Orders page — /customer/orders
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, AlertCircle } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import BrushstrokeHeading from '../../components/mosaic/BrushstrokeHeading.jsx'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { ordersApi } from '../../api/orders.js'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.1)' },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.1)'  },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
  disputed:  { label: 'Disputed',  color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
}

export default function CustomerOrders() {
  const [filter,  setFilter]  = useState('all')
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = {}
    if (filter !== 'all') params.status = filter
    ordersApi.list(params)
      .then(d => setOrders(d.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = orders

  return (
    <PageWrapper title="My Orders">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 relative">
        <ColorBlob color="#C88B00" className="top-0 right-0 w-64 h-64" opacity={0.05} />

        <BrushstrokeHeading align="left" className="mb-6">
          <span style={{ color: '#C88B00' }}>My</span>{' '}
          <span style={{ color: '#1C0A00' }}>Orders</span>
        </BrushstrokeHeading>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
          {['all','pending','shipped','delivered','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all"
              style={filter === f ? { background: '#C88B00', color: '#1C0A00' } : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C88B00', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Package size={40} style={{ color: '#C8B89A' }} />
            <p className="font-serif font-bold text-lg" style={{ color: '#C88B00' }}>No orders found</p>
            <Link to="/products" className="btn-primary rounded-xl px-6 py-2">Browse Products</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order, i) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              return (
                <div key={order.id} className="rounded-xl overflow-hidden"
                  style={{ border: '2px solid rgba(200,139,0,0.15)', background: '#FFF8E7' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: cardAccent(i), color: '#1C0A00' }}>
                    <span className="font-mono font-bold text-xs">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className="text-xs">{new Date(order.createdAt).toLocaleDateString('en-PK')}</span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        {(order.items || []).map((it, j) => (
                          <p key={j} className="text-sm font-medium" style={{ color: '#1C0A00' }}>
                            {it.product?.name || it.name} ×{it.quantity || it.qty}
                          </p>
                        ))}
                        <p className="text-xs mt-1" style={{ color: '#7A6050' }}>
                          {order.paymentMethod === 'cash_on_delivery' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: '#C88B00' }}>{formatPrice(order.totalAmount)}</p>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-1"
                          style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,139,0,0.12)' }}>
                      <Link to={`/customer/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs font-semibold hover:underline"
                        style={{ color: '#C88B00' }}>
                        View Details <ChevronRight size={13} />
                      </Link>
                      {order.status === 'delivered' && (
                        <Link to={`/customer/orders/${order.id}/dispute`}
                          className="flex items-center gap-1 text-xs font-semibold hover:underline ml-3"
                          style={{ color: '#D85A30' }}>
                          <AlertCircle size={13} /> Report Issue
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
