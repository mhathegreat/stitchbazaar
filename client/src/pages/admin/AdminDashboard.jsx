/**
 * Admin Dashboard — /admin
 * Analytics, vendor approvals, product moderation, payouts, disputes.
 * All data is live from the API — no mock/hardcoded values.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Store, ShoppingBag, DollarSign, CheckCircle, XCircle, Eye, AlertTriangle, Package } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [stats,       setStats]       = useState(null)
  const [vendors,     setVendors]     = useState([])
  const [payouts,     setPayouts]     = useState([])
  const [disputes,    setDisputes]    = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    adminApi.dashboard()
      .then(dash => {
        const d = dash.data
        setStats(d.stats)
        setVendors(d.pendingVendors || [])
        setPayouts(d.pendingPayouts || [])
        setDisputes(d.openDisputes  || [])
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))

    adminApi.analytics()
      .then(analytics => setTopProducts(analytics.data?.topProducts || []))
      .catch(() => {}) // analytics failing silently — not critical
  }, [])

  async function approveVendor(id) {
    try {
      await adminApi.approveVendor(id)
      setVendors(v => v.filter(x => x.id !== id))
      toast.success('Vendor approved!')
    } catch { toast.error('Action failed') }
  }

  async function rejectVendor(id) {
    try {
      await adminApi.rejectVendor(id)
      setVendors(v => v.filter(x => x.id !== id))
      toast.success('Vendor rejected.')
    } catch { toast.error('Action failed') }
  }

  async function processPayout(id) {
    try {
      await adminApi.processPayout(id, { status: 'paid' })
      setPayouts(p => p.filter(x => x.id !== id))
      toast.success('Payout marked as paid!')
    } catch { toast.error('Action failed') }
  }

  async function investigateDispute(id) {
    try {
      await adminApi.resolveDispute(id, { status: 'investigating', resolution: '' })
      setDisputes(d => d.filter(x => x.id !== id))
      toast.success('Dispute marked as investigating.')
    } catch { toast.error('Action failed') }
  }

  const statCards = stats ? [
    { label: 'Total Customers', value: stats.totalCustomers,               icon: <Users size={20} />,       color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
    { label: 'Active Vendors',  value: stats.totalVendors,                 icon: <Store size={20} />,       color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
    { label: 'Total Orders',    value: stats.totalOrders,                  icon: <ShoppingBag size={20} />, color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
    { label: 'Platform Revenue',value: formatPrice(stats.platformRevenue), icon: <DollarSign size={20}/>,   color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
  ] : [
    { label: 'Total Customers', value: '—', icon: <Users size={20} />,       color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
    { label: 'Active Vendors',  value: '—', icon: <Store size={20} />,       color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
    { label: 'Total Orders',    value: '—', icon: <ShoppingBag size={20} />, color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
    { label: 'Platform Revenue',value: '—', icon: <DollarSign size={20}/>,   color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
  ]

  return (
    <AdminLayout active="/admin" title="Dashboard">
      <div className="relative">
        <ColorBlob color="#C88B00" className="top-0 right-0 w-80 h-80" opacity={0.04} />

        {/* Header */}
        <div className="mb-7">
          <BeadDots count={5} size="sm" className="mb-2" />
          <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
            <span style={{ color: '#C88B00' }}>Admin</span> Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="rounded-xl p-4 mosaic-block" style={{ background: '#FFF8E7' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <p className={`font-bold text-xl font-serif ${loading ? 'opacity-30' : ''}`} style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#7A6050' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Pending Vendor Approvals */}
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#C88B00' }}>
              <span className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>
                Pending Approvals ({vendors.length})
              </span>
            </div>
            <div className="divide-y" style={{ background: '#FFF8E7' }}>
              {loading ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>Loading…</p>
              ) : vendors.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>All caught up! 🎉</p>
              ) : vendors.map(v => (
                <div key={v.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: '#C88B00', color: '#1C0A00' }}>{v.shopName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{v.shopName}</p>
                    <p className="text-xs" style={{ color: '#7A6050' }}>
                      {v.user?.name} · {v.city} · {(v.createdAt || '').slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => approveVendor(v.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-green-100"
                      style={{ color: '#0F6E56' }} title="Approve">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => rejectVendor(v.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-100"
                      style={{ color: '#D85A30' }} title="Reject">
                      <XCircle size={18} />
                    </button>
                    <button onClick={() => navigate(`/vendors/${v.id}`)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-amber-100"
                      style={{ color: '#C88B00' }} title="View Shop">
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#6A4C93' }}>
              <span className="font-serif font-bold text-sm" style={{ color: '#FFFCF5' }}>
                Payout Requests ({payouts.length})
              </span>
            </div>
            <div className="divide-y" style={{ background: '#FFF8E7' }}>
              {loading ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>Loading…</p>
              ) : payouts.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>No pending payouts.</p>
              ) : payouts.map(p => (
                <div key={p.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{p.vendor?.shopName}</p>
                    <p className="text-xs" style={{ color: '#7A6050' }}>
                      {p.vendor?.bankName} · Requested {(p.requestedAt || '').slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm" style={{ color: '#6A4C93' }}>{formatPrice(p.amount)}</span>
                    <button onClick={() => processPayout(p.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{ background: '#6A4C93', color: '#FFFCF5' }}>
                      Process
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top 5 Products (live from analytics API) */}
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="px-4 py-3" style={{ background: '#D85A30' }}>
              <span className="font-serif font-bold text-sm" style={{ color: '#FFFCF5' }}>Top Products by Orders</span>
            </div>
            <div className="divide-y" style={{ background: '#FFF8E7' }}>
              {loading ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>Loading…</p>
              ) : topProducts.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>No order data yet.</p>
              ) : topProducts.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: cardAccent(i), color: '#1C0A00' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate" style={{ color: '#1C0A00' }}>{p.name}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: '#C88B00' }}>
                    {p.orders} orders
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Open Disputes */}
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="px-4 py-3" style={{ background: '#0F6E56' }}>
              <span className="font-serif font-bold text-sm" style={{ color: '#FFFCF5' }}>
                Open Disputes ({disputes.length})
              </span>
            </div>
            <div className="divide-y" style={{ background: '#FFF8E7' }}>
              {loading ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>Loading…</p>
              ) : disputes.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>No open disputes. 🎉</p>
              ) : disputes.map(d => (
                <div key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{d.customer?.name || 'Customer'}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>
                        Order #{d.order?.id?.slice(-8) || d.orderId} · {(d.createdAt || '').slice(0, 10)}
                      </p>
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#D85A30' }}>
                        <AlertTriangle size={11} /> {d.reason}
                      </p>
                    </div>
                    <button onClick={() => investigateDispute(d.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                      style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                      Investigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
