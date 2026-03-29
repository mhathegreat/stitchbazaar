/**
 * Shared Admin layout — sidebar + main content wrapper.
 * Used by all /admin/* sub-pages.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Store, Package, ShoppingBag,
  DollarSign, AlertTriangle, Tag, LogOut,
  Ticket, Truck, RotateCcw, Shield, Menu, X, Settings,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { adminApi } from '../../api/admin.js'

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { to: '/admin/vendors',    label: 'Vendors',    icon: <Store size={16} />,          countKey: 'pendingVendors'  },
  { to: '/admin/products',   label: 'Products',   icon: <Package size={16} />         },
  { to: '/admin/orders',     label: 'Orders',     icon: <ShoppingBag size={16} />,    countKey: 'pendingOrders'   },
  { to: '/admin/payouts',    label: 'Payouts',    icon: <DollarSign size={16} />,     countKey: 'pendingPayouts'  },
  { to: '/admin/disputes',   label: 'Disputes',   icon: <AlertTriangle size={16} />,  countKey: 'openDisputes'    },
  { to: '/admin/categories', label: 'Categories', icon: <Tag size={16} />             },
  { to: '/admin/coupons',    label: 'Coupons',    icon: <Ticket size={16} />          },
  { to: '/admin/shipping',   label: 'Shipping',   icon: <Truck size={16} />           },
  { to: '/admin/refunds',    label: 'Refunds',    icon: <RotateCcw size={16} />,      countKey: 'pendingRefunds'  },
  { to: '/admin/audit',      label: 'Audit Log',  icon: <Shield size={16} />          },
  { to: '/admin/settings',  label: 'Settings',   icon: <Settings size={16} />        },
]

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
      style={{ background: '#D85A30', color: '#FFFCF5' }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SidebarNav({ active, counts, logout, onNavClick }) {
  return (
    <div className="flex flex-col h-full py-6 px-3 gap-1">
      <div className="px-3 mb-5">
        <p className="font-serif font-bold text-base" style={{ color: '#C88B00' }}>Admin Panel</p>
        <p className="text-[10px] tracking-widest mt-0.5" style={{ color: '#7A6050' }}>STITCHBAZAAR</p>
      </div>

      {NAV.map(n => (
        <Link key={n.to} to={n.to}
          onClick={onNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
          style={{
            color:      active === n.to ? '#C88B00' : '#C8B89A',
            background: active === n.to ? 'rgba(200,139,0,0.15)' : 'transparent',
          }}>
          <span style={{ color: '#C88B00' }}>{n.icon}</span>
          {n.label}
          {n.countKey && <Badge count={counts[n.countKey]} />}
        </Link>
      ))}

      <button onClick={logout}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-900/20 mt-auto"
        style={{ color: '#D85A30' }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}

export default function AdminLayout({ children, active, title }) {
  const { logout } = useAuth()
  const [counts, setCounts] = useState({})
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    adminApi.counts()
      .then(d => { if (d.data) setCounts(d.data) })
      .catch(() => {})
  }, [active])

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [active])

  return (
    <PageWrapper title={`Admin — ${title}`}>
      <div className="flex min-h-screen" style={{ background: '#FFFCF5' }}>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto"
          style={{ background: '#1C0A00', minHeight: '100vh' }}>
          <SidebarNav active={active} counts={counts} logout={logout} />
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}
            style={{ background: 'rgba(0,0,0,0.5)' }} />
        )}

        {/* Mobile drawer */}
        <aside className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col overflow-y-auto transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ background: '#1C0A00' }}>
          <button onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: '#C8B89A' }}>
            <X size={18} />
          </button>
          <SidebarNav active={active} counts={counts} logout={logout} onNavClick={() => setMobileOpen(false)} />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-8">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center gap-2 mb-5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-amber-50"
            style={{ color: '#1C0A00', background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.2)' }}>
            <Menu size={16} style={{ color: '#C88B00' }} />
            <span>Menu</span>
          </button>

          {children}
        </main>
      </div>
    </PageWrapper>
  )
}
