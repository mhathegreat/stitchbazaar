/**
 * Admin Dashboard — /admin
 * Analytics, vendor approvals, product moderation, payouts, disputes.
 */

import { useState, useEffect } from 'react'
import { Users, Store, ShoppingBag, DollarSign, CheckCircle, XCircle, Eye, AlertTriangle, Package } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATS = [
  { label: 'Total Customers', value: '1,248', icon: <Users size={20} />,      color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
  { label: 'Active Vendors',  value: '86',    icon: <Store size={20} />,      color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
  { label: 'Total Orders',    value: '3,412', icon: <ShoppingBag size={20} />, color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
  { label: 'Revenue (30d)',   value: 'Rs. 4.2L', icon: <DollarSign size={20}/>, color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
]

const TOP_PRODUCTS = [
  { name: 'Bamboo Knitting Needles', vendor: 'CraftHub Lahore',  sales: 89,  revenue: 1688100 },
  { name: 'Merino Wool Yarn',        vendor: 'YarnWala Karachi', sales: 67,  revenue:  804000 },
  { name: 'Embroidery Hoop 10"',     vendor: 'NeedleArt Isb',   sales: 120, revenue:  540000 },
  { name: 'Silk Thread Bundle',      vendor: 'ThreadMart PK',   sales: 54,  revenue:  459000 },
  { name: 'Crochet Hook Set',        vendor: 'CraftHub Lahore', sales: 43,  revenue:  279500 },
]

const PENDING_VENDORS = [
  { id: 'v1', shopName: 'WoolCraft PK',  city: 'Lahore',    date: '2026-03-25', name: 'Tariq Mehmood' },
  { id: 'v2', shopName: 'StitchMasters', city: 'Karachi',   date: '2026-03-26', name: 'Sadia Khan'    },
  { id: 'v3', shopName: 'YarnHouse',     city: 'Islamabad', date: '2026-03-26', name: 'Bilal Ahmed'   },
]

const PENDING_PAYOUTS = [
  { id: 'p1', vendor: 'CraftHub Lahore',  amount: 1240000, bank: 'HBL',    date: '2026-03-20' },
  { id: 'p2', vendor: 'YarnWala Karachi', amount:  845000, bank: 'MCB',    date: '2026-03-22' },
  { id: 'p3', vendor: 'NeedleArt Isb',   amount:  560000, bank: 'Meezan', date: '2026-03-24' },
]

const OPEN_DISPUTES = [
  { id: 'd1', customer: 'Ayesha K.', orderId: 'ORD-ABC123', reason: 'Item not received', date: '2026-03-25' },
  { id: 'd2', customer: 'Fatima R.', orderId: 'ORD-DEF456', reason: 'Wrong item sent',   date: '2026-03-26' },
]


export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [vendors, setVendors] = useState(PENDING_VENDORS)
  const [payouts, setPayouts] = useState(PENDING_PAYOUTS)
  const [disputes, setDisputes] = useState(OPEN_DISPUTES)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    adminApi.dashboard().then(d => {
      const data = d.data
      setStats(data.stats)
      setVendors(data.pendingVendors || [])
      setPayouts(data.pendingPayouts || [])
      setDisputes(data.openDisputes  || [])
      setRecentOrders(data.recentOrders || [])
    }).catch(() => { /* keep mock data */ })
  }, [])

  async function approveVendor(id) {
    try {
      await adminApi.approveVendor(id)
      setVendors(v => v.filter(x => x.id !== id))
      toast.success('Vendor approved! Email sent.')
    } catch { toast.error('Action failed') }
  }
  async function rejectVendor(id) {
    try {
      await adminApi.rejectVendor(id)
      setVendors(v => v.filter(x => x.id !== id))
      toast.error('Vendor rejected. Email sent.')
    } catch { toast.error('Action failed') }
  }
  async function processPayout(id) {
    try {
      await adminApi.processPayout(id, { status: 'paid' })
      setPayouts(p => p.filter(x => x.id !== id))
      toast.success('Payout marked as paid!')
    } catch { toast.error('Action failed') }
  }

  const statCards = stats ? [
    { label: 'Total Customers', value: stats.totalCustomers, icon: <Users size={20} />,      color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
    { label: 'Active Vendors',  value: stats.totalVendors,   icon: <Store size={20} />,      color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
    { label: 'Total Orders',    value: stats.totalOrders,    icon: <ShoppingBag size={20} />, color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
    { label: 'Platform Revenue',value: formatPrice(stats.platformRevenue), icon: <DollarSign size={20}/>, color: '#6A4C93', bg: 'rgba(106,76,147,0.1)' },
  ] : STATS

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
                <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
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
              <div className="divide-y" style={{ background: '#FFF8E7', divideColor: 'rgba(200,139,0,0.1)' }}>
                {vendors.length === 0 ? (
                  <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>All caught up! 🎉</p>
                ) : vendors.map(v => (
                  <div key={v.id} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>{v.shopName[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{v.shopName}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>{v.name} · {v.city} · {v.date}</p>
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
                      <button className="p-1.5 rounded-lg transition-colors hover:bg-amber-100"
                        style={{ color: '#C88B00' }} title="View Details">
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
                {payouts.length === 0 ? (
                  <p className="p-4 text-sm text-center" style={{ color: '#7A6050' }}>No pending payouts.</p>
                ) : payouts.map(p => (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{p.vendor?.shopName || p.vendor}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>{p.vendor?.bankName || p.bank} · Requested {(p.requestedAt || p.date || '').slice(0,10)}</p>
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

            {/* Top 5 Products */}
            <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="px-4 py-3" style={{ background: '#D85A30' }}>
                <span className="font-serif font-bold text-sm" style={{ color: '#FFFCF5' }}>Top 5 Products</span>
              </div>
              <div className="divide-y" style={{ background: '#FFF8E7' }}>
                {TOP_PRODUCTS.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: cardAccent(i), color: '#1C0A00' }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate" style={{ color: '#1C0A00' }}>{p.name}</p>
                      <p className="text-[11px]" style={{ color: '#7A6050' }}>{p.vendor} · {p.sales} sold</p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: '#C88B00' }}>
                      {formatPrice(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Disputes */}
            <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="px-4 py-3" style={{ background: '#0F6E56' }}>
                <span className="font-serif font-bold text-sm" style={{ color: '#FFFCF5' }}>
                  Open Disputes ({OPEN_DISPUTES.length})
                </span>
              </div>
              <div className="divide-y" style={{ background: '#FFF8E7' }}>
                {OPEN_DISPUTES.map(d => (
                  <div key={d.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{d.customer}</p>
                        <p className="text-xs" style={{ color: '#7A6050' }}>Order #{d.orderId} · {d.date}</p>
                        <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{d.reason}</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
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
