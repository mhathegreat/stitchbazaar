/**
 * Navbar
 * Dark (#1C0A00) top navigation with account dropdown (profile + logout).
 */

import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, ShoppingBag, Heart, LayoutDashboard, Store, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'
import SearchBar from './SearchBar.jsx'

const NAV_LINKS = [
  { to: '/products',   label: 'Shop'       },
  { to: '/vendors',    label: 'Vendors'    },
  { to: '/categories', label: 'Categories' },
]

export default function Navbar({ cartCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleLogout() {
    setAccountOpen(false)
    await logout()
    navigate('/')
  }

  // Links shown in the account dropdown based on role
  const accountLinks = user?.role === 'admin'
    ? [
        { to: '/admin',            label: 'Admin Panel', icon: <Shield size={14} /> },
      ]
    : user?.role === 'vendor'
    ? [
        { to: '/vendor/dashboard', label: 'Dashboard',   icon: <LayoutDashboard size={14} /> },
        { to: '/vendor/products',  label: 'My Products', icon: <Store size={14} />           },
        { to: '/vendor/messages',  label: 'Messages',    icon: <MessageCircle size={14} />   },
      ]
    : [
        { to: '/customer/profile', label: 'My Profile',  icon: <User size={14} />            },
        { to: '/customer/orders',  label: 'My Orders',   icon: <ShoppingBag size={14} />     },
        { to: '/customer/wishlist',label: 'Wishlist',    icon: <Heart size={14} />           },
        { to: '/messages',         label: 'Messages',    icon: <MessageCircle size={14} />   },
      ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: '#1C0A00',
        borderBottom: scrolled ? '2px solid #C88B00' : '2px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex flex-col leading-none select-none shrink-0">
          <span className="font-serif font-bold text-xl" style={{ color: '#C88B00' }}>
            Stitch<span style={{ color: '#FFFCF5' }}>Bazaar</span>
          </span>
          <span className="text-[9px] font-semibold tracking-[0.18em] mt-0.5" style={{ color: '#C88B00' }}>
            CRAFTS · KNITTING · HABERDASHERY
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${isActive ? 'text-amber-400' : 'text-stone-200 hover:text-amber-400'}`
              }
              style={({ isActive }) => ({ color: isActive ? '#C88B00' : undefined })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search — desktop only */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* Cart */}
          <Link to="/cart"
            className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#FFFCF5' }}
            aria-label={`Cart — ${cartCount} items`}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                style={{ background: '#C88B00', color: '#1C0A00' }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Notification bell */}
          {user && <NotificationBell />}

          {/* Account dropdown (desktop) */}
          {user ? (
            <div className="hidden sm:block relative" ref={dropdownRef}>
              <button
                onClick={() => setAccountOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
                style={{ color: '#FFFCF5' }}
              >
                <User size={16} />
                {user.name?.split(' ')[0]}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                  style={{ background: '#1C0A00', border: '1.5px solid rgba(200,139,0,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {/* User info header */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(200,139,0,0.15)' }}>
                    <p className="text-xs font-semibold truncate" style={{ color: '#C88B00' }}>{user.name}</p>
                    <p className="text-[11px] truncate" style={{ color: '#7A6050' }}>{user.email}</p>
                  </div>

                  {/* Links */}
                  {accountLinks.map(l => (
                    <Link key={l.to} to={l.to}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/10"
                      style={{ color: '#FFFCF5' }}>
                      <span style={{ color: '#C88B00' }}>{l.icon}</span>
                      {l.label}
                    </Link>
                  ))}

                  {/* Logout */}
                  <div className="border-t" style={{ borderColor: 'rgba(200,139,0,0.15)' }}>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/10 text-left"
                      style={{ color: '#D85A30' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: '#FFFCF5' }}>
              <User size={16} /> Account
            </Link>
          )}

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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-1"
          style={{ background: '#1C0A00', borderTop: '1px solid rgba(200,139,0,0.2)' }}>
          {/* Mobile search */}
          <div className="pb-2">
            <SearchBar onClose={() => setMobileOpen(false)} />
          </div>

          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to}
              onClick={() => setMobileOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: '#FFFCF5' }}>
              {label}
            </NavLink>
          ))}

          {/* Mobile account links */}
          {user ? (
            <>
              <div className="my-1 border-t" style={{ borderColor: 'rgba(200,139,0,0.15)' }} />
              {accountLinks.map(l => (
                <Link key={l.to} to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-white/10"
                  style={{ color: '#FFFCF5' }}>
                  <span style={{ color: '#C88B00' }}>{l.icon}</span> {l.label}
                </Link>
              ))}
              <button onClick={() => { setMobileOpen(false); handleLogout() }}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-white/10 text-left"
                style={{ color: '#D85A30' }}>
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium"
              style={{ color: '#FFFCF5' }}>
              Account
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
