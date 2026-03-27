/**
 * Footer
 * Deep dark background (#1C0A00) with amber and coral accents.
 * Logo + tagline, nav links, WhatsApp contact, social.
 */

import { Link } from 'react-router-dom'
import BeadDots from '../mosaic/BeadDots.jsx'
import DiamondMotif from '../mosaic/DiamondMotif.jsx'
import { MessageCircle, Mail, MapPin } from 'lucide-react'

const SHOP_LINKS = [
  { to: '/products',    label: 'All Products'   },
  { to: '/categories',  label: 'Categories'     },
  { to: '/vendors',     label: 'Vendors'        },
  { to: '/products?new=1', label: 'New Arrivals'},
]

const ACCOUNT_LINKS = [
  { to: '/login',           label: 'Login'          },
  { to: '/register',        label: 'Create Account' },
  { to: '/customer/orders', label: 'My Orders'      },
  { to: '/customer/wishlist', label: 'Wishlist'     },
]

const VENDOR_LINKS = [
  { to: '/vendor/register',  label: 'Register Shop'   },
  { to: '/vendor/dashboard', label: 'Vendor Dashboard'},
]

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: '#1C0A00', color: '#FFFCF5' }}
    >
      {/* Decorative corner diamonds */}
      <DiamondMotif color="#C88B00" className="top-6 left-6 opacity-30" size={40} />
      <DiamondMotif color="#D85A30" className="top-6 right-6 opacity-30" size={40} />

      {/* Top amber divider line */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C88B00, #D85A30, #0F6E56, #6A4C93, #C88B00)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

        {/* ── Brand block ──────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-12">
          <span className="font-serif font-bold text-3xl" style={{ color: '#C88B00' }}>
            Stitch<span style={{ color: '#FFFCF5' }}>Bazaar</span>
          </span>
          <span
            className="text-[10px] font-semibold tracking-[0.22em] mt-1 mb-4"
            style={{ color: '#C88B00' }}
          >
            CRAFTS · KNITTING · HABERDASHERY
          </span>
          <BeadDots count={8} size="sm" />
          <p className="mt-4 text-sm max-w-sm" style={{ color: '#A89070' }}>
            Pakistan's marketplace for knitting, stitching &amp; craft supplies.
            Supporting local artisan shops since 2025.
          </p>
        </div>

        {/* ── Link columns ─────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-serif font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C88B00' }}>
              Shop
            </h4>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm hover:text-amber-400 transition-colors" style={{ color: '#C8B89A' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C88B00' }}>
              Account
            </h4>
            <ul className="space-y-2.5">
              {ACCOUNT_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm hover:text-amber-400 transition-colors" style={{ color: '#C8B89A' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C88B00' }}>
              Vendors
            </h4>
            <ul className="space-y-2.5">
              {VENDOR_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm hover:text-amber-400 transition-colors" style={{ color: '#C8B89A' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C88B00' }}>
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors"
                  style={{ color: '#C8B89A' }}
                >
                  <MessageCircle size={15} style={{ color: '#2DC653' }} />
                  WhatsApp Us
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@stitchbazaar.pk"
                  className="flex items-center gap-2 text-sm hover:text-amber-400 transition-colors"
                  style={{ color: '#C8B89A' }}
                >
                  <Mail size={15} style={{ color: '#C88B00' }} />
                  hello@stitchbazaar.pk
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm" style={{ color: '#C8B89A' }}>
                <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: '#D85A30' }} />
                Pakistan
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────── */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(200,139,0,0.2)', color: '#7A6050' }}
        >
          <span>© {new Date().getFullYear()} StitchBazaar. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy</Link>
            <Link to="/terms"   className="hover:text-amber-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
