/**
 * Shared Admin layout — sidebar + main content wrapper.
 * Used by all /admin/* sub-pages.
 */

import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Store, Package, ShoppingBag,
  DollarSign, AlertTriangle, Tag, LogOut,
  Ticket, Truck, RotateCcw, Shield,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { to: '/admin/vendors',    label: 'Vendors',    icon: <Store size={16} />           },
  { to: '/admin/products',   label: 'Products',   icon: <Package size={16} />         },
  { to: '/admin/orders',     label: 'Orders',     icon: <ShoppingBag size={16} />     },
  { to: '/admin/payouts',    label: 'Payouts',    icon: <DollarSign size={16} />      },
  { to: '/admin/disputes',   label: 'Disputes',   icon: <AlertTriangle size={16} />   },
  { to: '/admin/categories', label: 'Categories', icon: <Tag size={16} />             },
  { to: '/admin/coupons',    label: 'Coupons',    icon: <Ticket size={16} />          },
  { to: '/admin/shipping',   label: 'Shipping',   icon: <Truck size={16} />           },
  { to: '/admin/refunds',    label: 'Refunds',    icon: <RotateCcw size={16} />       },
  { to: '/admin/audit',      label: 'Audit Log',  icon: <Shield size={16} />          },
]

export default function AdminLayout({ children, active, title }) {
  const { logout } = useAuth()

  return (
    <PageWrapper title={`Admin — ${title}`}>
      <div className="flex min-h-screen" style={{ background: '#FFFCF5' }}>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 py-6 px-3 gap-1 overflow-y-auto"
          style={{ background: '#1C0A00', minHeight: '100vh' }}>
          <div className="px-3 mb-5">
            <p className="font-serif font-bold text-base" style={{ color: '#C88B00' }}>Admin Panel</p>
            <p className="text-[10px] tracking-widest mt-0.5" style={{ color: '#7A6050' }}>STITCHBAZAAR</p>
          </div>

          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
              style={{
                color:      active === n.to ? '#C88B00' : '#C8B89A',
                background: active === n.to ? 'rgba(200,139,0,0.15)' : 'transparent',
              }}>
              <span style={{ color: '#C88B00' }}>{n.icon}</span>
              {n.label}
            </Link>
          ))}

          <button onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-900/20 mt-auto"
            style={{ color: '#D85A30' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </PageWrapper>
  )
}
