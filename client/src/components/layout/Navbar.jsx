/**
 * Navbar
 * Dark (#1C0A00) top navigation. Stays dark on scroll with subtle amber bottom border.
 * Logo left, links center/right, cart icon with amber badge.
 */

import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, Menu, X, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'
import SearchBar from './SearchBar.jsx'

const NAV_LINKS = [
  { to: '/products',  label: 'Shop'     },
  { to: '/vendors',   label: 'Vendors'  },
  { to: '/categories',label: 'Categories'},
]

/**
 * @param {object} props
 * @param {number} [props.cartCount=0]
 */
export default function Navbar({ cartCount = 0 }) {
  const { user } = useAuth()
  const [scrolled,     setScrolled]     = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: '#1C0A00',
        borderBottom: scrolled ? '2px solid #C88B00' : '2px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ─────────────────────────────────────── */}
        <Link to="/" className="flex flex-col leading-none select-none shrink-0">
          <span className="font-serif font-bold text-xl" style={{ color: '#C88B00' }}>
            Stitch<span style={{ color: '#FFFCF5' }}>Bazaar</span>
          </span>
          <span
            className="text-[9px] font-semibold tracking-[0.18em] mt-0.5"
            style={{ color: '#C88B00' }}
          >
            CRAFTS · KNITTING · HABERDASHERY
          </span>
        </Link>

        {/* ── Desktop links ─────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'text-amber-400' : 'text-stone-200 hover:text-amber-400'
                }`
              }
              style={({ isActive }) => ({ color: isActive ? '#C88B00' : undefined })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Right actions ─────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Search — desktop only */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#FFFCF5' }}
            aria-label={`Cart — ${cartCount} items`}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                style={{ background: '#C88B00', color: '#1C0A00' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Notification bell (authenticated users only) */}
          {user && <NotificationBell />}

          {/* Account */}
          <Link
            to={user ? (user.role === 'vendor' ? '/vendor/dashboard' : user.role === 'admin' ? '/admin' : '/customer/orders') : '/login'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
            style={{ color: '#FFFCF5' }}
          >
            <User size={16} />
            {user ? user.name?.split(' ')[0] : 'Account'}
          </Link>

          {/* Vendor CTA */}
          <Link
            to="/vendor/register"
            className="hidden lg:inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: '#D85A30', color: '#FFFCF5' }}
          >
            Sell Here
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: '#FFFCF5' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-1"
          style={{ background: '#1C0A00', borderTop: '1px solid rgba(200,139,0,0.2)' }}
        >
          {/* Mobile search */}
          <div className="pb-2">
            <SearchBar onClose={() => setMobileOpen(false)} />
          </div>

          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: '#FFFCF5' }}
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="py-2.5 px-3 rounded-lg text-sm font-medium"
            style={{ color: '#FFFCF5' }}
          >
            Account
          </Link>
          <Link
            to="/vendor/register"
            onClick={() => setMobileOpen(false)}
            className="mt-2 py-2.5 px-3 rounded-lg text-sm font-semibold text-center"
            style={{ background: '#D85A30', color: '#FFFCF5' }}
          >
            Sell on StitchBazaar
          </Link>
        </div>
      )}
    </header>
  )
}
