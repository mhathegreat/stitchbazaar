/**
 * Vendor Orders — /vendor/orders
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, DollarSign, Store, CheckCircle, Truck, Clock, XCircle, LayoutDashboard } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { formatPrice } from '../../styles/theme.js'
import { vendorsApi } from '../../api/vendors.js'
import toast from 'react-hot-toast'

const VENDOR_NAV = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/vendor/products',  label: 'Products',  icon: <Package size={16} />    },
  { to: '/vendor/orders',    label: 'Orders',    icon: <ShoppingBag size={16} />},
  { to: '/vendor/earnings',  label: 'Earnings',  icon: <DollarSign size={16} /> },
  { to: '/vendor/settings',  label: 'Settings',  icon: <Store size={16} />      },
]

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  icon: <Clock size={13} />        },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.1)', icon: <CheckCircle size={13} />  },
  packed:    { label: 'Packed',    color: '#6A4C93', bg: 'rgba(106,76,147,0.1)', icon: <Package size={13} />      },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.1)',  icon: <Truck size={13} />        },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  icon: <CheckCircle size={13} />  },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <XCircle size={13} />      },
}

const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'packed', packed: 'shipped', shipped: 'delivered',
}

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    vendorsApi.orders(params)
      .then(d => setOrders(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  // Map API orderItem structure to the UI shape
  const filtered = orders.map(item => ({
    id:       item.order?.id || item.id,
    _itemId:  item.id,
    customer: item.order?.customer?.name || item.order?.guestName || 'Guest',
    phone:    item.order?.customer?.phone || item.order?.guestPhone || '',
    city:     item.order?.city || '',
    date:     item.order?.createdAt?.slice(0, 10) || item.createdAt?.slice(0, 10) || '',
    status:   item.vendorStatus || 'pending',
    items:    [{ name: item.product?.name || '', qty: item.quantity }],
    total:    item.unitPrice * item.quantity,
  }))

  async function advanceStatus(itemId, currentStatus) {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    try {
      await vendorsApi.updateOrderStatus(itemId, next)
      setOrders(os => os.map(o => o.id === itemId ? { ...o, vendorStatus: next } : o))
      toast.success(`Order moved to ${STATUS_CONFIG[next].label}`)
    } catch { toast.error('Could not update status') }
  }

  return (
    <PageWrapper title="Vendor Orders">
      <div className="flex min-h-screen" style={{ background: '#FFFCF5' }}>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 py-6 px-3 gap-1"
          style={{ background: '#1C0A00', minHeight: '100vh' }}>
          <div className="px-3 mb-5">
            <p className="font-serif font-bold text-base" style={{ color: '#C88B00' }}>Vendor Panel</p>
            <p className="text-[10px] tracking-widest mt-0.5" style={{ color: '#7A6050' }}>STITCHBAZAAR</p>
          </div>
          {VENDOR_NAV.map(n => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: n.to === '/vendor/orders' ? '#C88B00' : '#C8B89A',
                       background: n.to === '/vendor/orders' ? 'rgba(200,139,0,0.15)' : 'transparent' }}>
              <span style={{ color: '#C88B00' }}>{n.icon}</span> {n.label}
            </Link>
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 py-8">
          <h1 className="font-serif font-bold text-2xl mb-6" style={{ color: '#1C0A00' }}>
            <span style={{ color: '#C88B00' }}>Order</span> Management
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Pending',   count: filtered.filter(o => o.status === 'pending').length,   color: '#C88B00' },
              { label: 'Shipped',   count: filtered.filter(o => o.status === 'shipped').length,   color: '#2DC653' },
              { label: 'Delivered', count: filtered.filter(o => o.status === 'delivered').length, color: '#0F6E56' },
              { label: 'Cancelled', count: filtered.filter(o => o.status === 'cancelled').length, color: '#D85A30' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-bold text-2xl font-serif" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs" style={{ color: '#7A6050' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
            {['all', ...Object.keys(STATUS_CONFIG)].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all"
                style={filter === f
                  ? { background: '#C88B00', color: '#1C0A00' }
                  : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
                {f}
              </button>
            ))}
          </div>

          {/* Orders */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3].map(i => <div key={i} className="skeleton rounded-xl" style={{ height: 120 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C88B00' }} />
                <p className="font-serif text-lg font-bold" style={{ color: '#C88B00' }}>No orders found</p>
              </div>
            ) : filtered.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const next = NEXT_STATUS[order.status]
              return (
                <div key={order._itemId || order.id} className="rounded-xl overflow-hidden"
                  style={{ border: '2px solid rgba(200,139,0,0.15)', background: '#FFF8E7' }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: sc.color + '20', borderBottom: `2px solid ${sc.color}30` }}>
                    <span className="font-mono font-bold text-xs" style={{ color: '#1C0A00' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: '#7A6050' }}>{order.date}</span>
                  </div>
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{order.customer}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>
                        {order.phone && `📱 ${order.phone} · `}📍 {order.city}
                      </p>
                      <div className="mt-1">
                        {order.items.map((it, j) => (
                          <p key={j} className="text-xs" style={{ color: '#5A4030' }}>• {it.name} ×{it.qty}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold text-lg" style={{ color: '#C88B00' }}>{formatPrice(order.total)}</p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                      {next && (
                        <button onClick={() => advanceStatus(order._itemId, order.status)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: STATUS_CONFIG[next].color, color: '#FFFCF5' }}>
                          Mark as {STATUS_CONFIG[next].label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
