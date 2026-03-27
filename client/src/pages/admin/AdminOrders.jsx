/**
 * Admin — All Orders — /admin/orders
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingBag } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'

const STATUS_COLORS = {
  pending:   { color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
  confirmed: { color: '#457B9D', bg: 'rgba(69,123,157,0.1)' },
  packed:    { color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
  shipped:   { color: '#2DC653', bg: 'rgba(45,198,83,0.1)'  },
  delivered: { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
  cancelled: { color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
  disputed:  { color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
}

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [meta,    setMeta]    = useState({})

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    adminApi.orders(params)
      .then(d => { setOrders(d.data || []); setMeta(d.meta || {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = orders

  return (
    <AdminLayout active="/admin/orders" title="Orders">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          All <span style={{ color: '#C88B00' }}>Orders</span>
        </h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'shipped', 'delivered', 'disputed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={filter === f
                ? { background: '#C88B00', color: '#1C0A00' }
                : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',     value: meta.total ?? orders.length,                                color: '#C88B00' },
          { label: 'Pending',   value: orders.filter(o => o.status === 'pending').length,          color: '#C88B00' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length,        color: '#0F6E56' },
          { label: 'Disputed',  value: orders.filter(o => o.status === 'disputed').length,         color: '#D85A30' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: '#7A6050' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#C88B00', color: '#1C0A00' }}>
                <th className="text-left px-4 py-3 font-serif">Order ID</th>
                <th className="text-left px-4 py-3 font-serif hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-3 font-serif hidden lg:table-cell">City</th>
                <th className="text-left px-4 py-3 font-serif hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-serif">Total</th>
                <th className="text-center px-4 py-3 font-serif">Status</th>
                <th className="text-right px-4 py-3 font-serif">Action</th>
              </tr>
            </thead>
            <tbody style={{ background: '#FFF8E7' }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10" style={{ color: '#7A6050' }}>
                  <ShoppingBag size={28} className="mx-auto mb-2 opacity-30" /> No orders found
                </td></tr>
              ) : filtered.map((o, i) => {
                const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending
                return (
                  <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold" style={{ color: '#1C0A00' }}>
                        #{o.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#1C0A00' }}>
                      {o.customer?.name || o.guestName || 'Guest'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: '#7A6050' }}>{o.city}</td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#7A6050' }}>{o.createdAt?.slice(0,10)}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: '#C88B00' }}>
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/customer/orders/${o.id}`}
                        className="p-1.5 rounded-lg hover:bg-amber-100 inline-block" style={{ color: '#457B9D' }}>
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
