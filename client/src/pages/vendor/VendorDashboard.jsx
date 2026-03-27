/**
 * Vendor Dashboard — /vendor/dashboard
 * Stats, recent orders, quick actions, earnings overview.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, DollarSign, TrendingUp, Plus, Eye, Clock, CheckCircle, Truck, AlertCircle, Loader2 } from 'lucide-react'

import PageWrapper    from '../../components/layout/PageWrapper.jsx'
import BeadDots       from '../../components/mosaic/BeadDots.jsx'
import ColorBlob      from '../../components/mosaic/ColorBlob.jsx'
import BrushstrokeHeading from '../../components/mosaic/BrushstrokeHeading.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { vendorsApi } from '../../api/vendors.js'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  icon: <Clock size={12} />        },
  confirmed: { label: 'Confirmed', color: '#457B9D', bg: 'rgba(69,123,157,0.1)', icon: <CheckCircle size={12} /> },
  packed:    { label: 'Packed',    color: '#6A4C93', bg: 'rgba(106,76,147,0.1)', icon: <Package size={12} />      },
  shipped:   { label: 'Shipped',   color: '#2DC653', bg: 'rgba(45,198,83,0.1)',  icon: <Truck size={12} />        },
  delivered: { label: 'Delivered', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  icon: <AlertCircle size={12} /> },
}

const QUICK_LINKS = [
  { to: '/vendor/products/new', label: 'Add Product',     icon: <Plus size={18} />,      color: '#C88B00' },
  { to: '/vendor/products',     label: 'My Products',     icon: <Package size={18} />,   color: '#D85A30' },
  { to: '/vendor/orders',       label: 'Manage Orders',   icon: <ShoppingBag size={18}/>, color: '#0F6E56' },
  { to: '/vendor/earnings',     label: 'Earnings',        icon: <DollarSign size={18}/>,  color: '#6A4C93' },
  { to: '/vendor/shop/preview', label: 'Preview Shop',    icon: <Eye size={18} />,        color: '#457B9D' },
]

export default function VendorDashboard() {
  const [activeTab,      setActiveTab]      = useState('all')
  const [vendor,         setVendor]         = useState(null)
  const [stats,          setStats]          = useState(null)
  const [recentOrders,   setRecentOrders]   = useState([])
  const [payoutLoading,  setPayoutLoading]  = useState(false)

  useEffect(() => {
    vendorsApi.dashboard()
      .then(d => {
        setVendor(d.data.vendor)
        setStats(d.data.stats)
        setRecentOrders(d.data.recentOrders || [])
      })
      .catch(() => toast.error('Failed to load dashboard'))
  }, [])

  const filtered = activeTab === 'all'
    ? recentOrders
    : recentOrders.filter(o => o.vendorStatus === activeTab || o.status === activeTab)

  const statCards = stats ? [
    { label: 'Total Products', value: stats.totalProducts,           icon: <Package size={20} />,     color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
    { label: 'Total Orders',   value: stats.totalOrders,             icon: <ShoppingBag size={20} />, color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
    { label: 'Total Earnings', value: formatPrice(stats.netRevenue), icon: <DollarSign size={20} />,  color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
    { label: 'Pending Payout', value: formatPrice(stats.pendingPayout), icon: <TrendingUp size={20} />, color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
  ] : []

  return (
    <PageWrapper title="Vendor Dashboard">
      <div className="min-h-screen relative" style={{ background: '#FFFCF5' }}>
        <ColorBlob color="#C88B00" className="top-0 right-0 w-96 h-96" opacity={0.04} />

        {/* ── Header ── */}
        <div className="relative overflow-hidden py-8 px-4" style={{ background: '#1C0A00' }}>
          <ColorBlob color="#C88B00" className="top-0 right-0 w-64 h-64" opacity={0.08} />
          <div className="max-w-6xl mx-auto relative z-10">
            <BeadDots count={5} size="sm" className="mb-3" />
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-serif font-bold text-2xl" style={{ color: '#C88B00' }}>
                  Good morning, <span style={{ color: '#FFFCF5' }}>{vendor?.shopName || '…'}</span> 👋
                </h1>
                <p className="text-sm mt-1" style={{ color: '#C8B89A' }}>
                  Your shop is <span style={{ color: vendor?.status === 'active' ? '#2DC653' : '#C88B00' }}>● {vendor?.status || 'Pending'}</span>
                </p>
              </div>
              <Link to="/vendor/products/new" className="btn-primary rounded-xl px-5 py-2.5 gap-2 text-sm">
                <Plus size={15} /> Add Product
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className="rounded-xl p-5 mosaic-block" style={{ background: '#FFF8E7' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#7A6050' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <BrushstrokeHeading as="h2" align="left" beads={false}>
                  <span style={{ color: '#D85A30' }}>Recent</span>{' '}
                  <span style={{ color: '#1C0A00' }}>Orders</span>
                </BrushstrokeHeading>
                <Link to="/vendor/orders" className="text-sm font-semibold hover:underline" style={{ color: '#C88B00' }}>
                  View all →
                </Link>
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {['all','pending','confirmed','shipped','delivered'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize"
                    style={activeTab === t
                      ? { background: '#C88B00', color: '#1C0A00' }
                      : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {filtered.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: '#C8B89A' }}>No orders yet.</p>
                )}
                {filtered.map((o, idx) => {
                  const sc = STATUS_CONFIG[o.vendorStatus || o.status] || STATUS_CONFIG.pending
                  const customerName = o.order?.guestName || o.order?.customer?.name || 'Customer'
                  return (
                    <div key={o.id} className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.12)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: cardAccent(idx) + '22', color: cardAccent(idx) }}>
                        {customerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#1C0A00' }}>{o.product?.name || '—'}</p>
                        <p className="text-xs" style={{ color: '#7A6050' }}>{customerName} · Qty: {o.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-sm" style={{ color: '#C88B00' }}>{formatPrice(o.unitPrice * o.quantity)}</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: sc.bg, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <BrushstrokeHeading as="h2" align="left" beads={false} className="mb-4">
                <span style={{ color: '#1C0A00' }}>Quick</span>{' '}
                <span style={{ color: '#C88B00' }}>Actions</span>
              </BrushstrokeHeading>
              <div className="flex flex-col gap-2">
                {QUICK_LINKS.map(l => (
                  <Link key={l.to} to={l.to}
                    className="flex items-center gap-3 p-4 rounded-xl mosaic-block transition-all hover:-translate-y-0.5"
                    style={{ background: '#FFF8E7' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${l.color}18`, color: l.color }}>
                      {l.icon}
                    </div>
                    <span className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{l.label}</span>
                  </Link>
                ))}
              </div>

              {/* Payout request */}
              {stats && (
                <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(15,110,86,0.08)', border: '2px solid rgba(15,110,86,0.2)' }}>
                  <p className="font-serif font-bold text-sm mb-1" style={{ color: '#0F6E56' }}>Available for Payout</p>
                  <p className="font-bold text-xl mb-3" style={{ color: '#0F6E56' }}>{formatPrice(stats.pendingPayout || 0)}</p>
                  <button
                    disabled={!stats.pendingPayout || payoutLoading}
                    onClick={async () => {
                      setPayoutLoading(true)
                      try {
                        await vendorsApi.requestPayout()
                        toast.success('Payout request submitted!')
                      } catch (e) {
                        toast.error(e?.response?.data?.message || 'Payout request failed')
                      } finally { setPayoutLoading(false) }
                    }}
                    className="w-full py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                    {payoutLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {payoutLoading ? 'Requesting…' : 'Request Payout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
