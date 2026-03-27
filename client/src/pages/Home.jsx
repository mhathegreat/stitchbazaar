/**
 * Home page — StitchBazaar
 * All sections now pull from live API. Mock data removed.
 */

import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, ShieldCheck, Truck, MessageCircle, Store, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'

import { productsApi }  from '../api/products.js'
import { categoriesApi } from '../api/categories.js'
import { vendorsApi }    from '../api/vendors.js'

import PageWrapper        from '../components/layout/PageWrapper.jsx'
import ProductCard        from '../components/product/ProductCard.jsx'
import MosaicBackground   from '../components/mosaic/MosaicBackground.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import BeadDots           from '../components/mosaic/BeadDots.jsx'
import ColorBlob          from '../components/mosaic/ColorBlob.jsx'
import DiamondMotif       from '../components/mosaic/DiamondMotif.jsx'
import { cardAccent, formatPrice } from '../styles/theme.js'

const FALLBACK_COLORS = ['#D85A30','#C88B00','#0F6E56','#6A4C93','#457B9D','#2DC653']
const FALLBACK_ICONS  = ['🧶','🪡','🧵','🔘','✂️','📌','🎨']

const WHY_ITEMS = [
  { icon: <Store size={28}/>,        title: 'Local Vendors',       desc: 'Support Pakistani artisan shops directly.',          color: '#C88B00' },
  { icon: <Truck size={28}/>,        title: 'Nationwide Delivery', desc: 'Delivered anywhere in Pakistan via TCS & Leopards.',  color: '#D85A30' },
  { icon: <ShieldCheck size={28}/>,  title: 'Verified Sellers',    desc: 'Every shop manually reviewed by our team.',          color: '#0F6E56' },
  { icon: <MessageCircle size={28}/>,title: 'WhatsApp Support',    desc: 'Chat directly with vendors on WhatsApp.',             color: '#6A4C93' },
]

/** Normalize API product shape → ProductCard shape */
function norm(p, i) {
  return {
    ...p,
    vendorName:  p.vendor?.shopName  || '',
    vendorId:    p.vendor?.id        || '',
    rating:      p.avgRating         || 0,
    reviewCount: p.reviewCount       || p._count?.reviews || 0,
    index:       i,
  }
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function SkeletonProductCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(200,139,0,0.08)' }}>
      <div className="h-1.5 skeleton" />
      <div className="skeleton" style={{ height: 180 }} />
      <div className="p-3 flex flex-col gap-2" style={{ background: '#FFF8E7' }}>
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="flex justify-between mt-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function SkeletonCategory() {
  return <div className="skeleton rounded-xl" style={{ height: 90 }} />
}

function SkeletonVendor() {
  return <div className="skeleton rounded-xl" style={{ height: 110 }} />
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [search,    setSearch]    = useState('')
  const navigate = useNavigate()

  const [categories,       setCategories]       = useState(null)   // null = loading
  const [featured,         setFeatured]         = useState(null)
  const [onSale,           setOnSale]           = useState(null)
  const [vendors,          setVendors]          = useState(null)

  useEffect(() => {
    // Categories
    categoriesApi.list()
      .then(d => setCategories(d.data || []))
      .catch(() => setCategories([]))

    // Featured — newest 6
    productsApi.list({ limit: 6, sort: 'newest' })
      .then(d => setFeatured((d.data || []).map(norm)))
      .catch(() => setFeatured([]))

    // On sale — products with active salePrice, up to 4
    productsApi.list({ limit: 8, sort: 'newest' })
      .then(d => {
        const now = new Date()
        const sale = (d.data || [])
          .filter(p => p.salePrice && (!p.saleEndsAt || new Date(p.saleEndsAt) > now))
          .slice(0, 4)
          .map(norm)
        setOnSale(sale)
      })
      .catch(() => setOnSale([]))

    // Featured vendors — active, up to 4
    vendorsApi.list({ limit: 4 })
      .then(d => setVendors(d.data?.slice(0, 4) || []))
      .catch(() => setVendors([]))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <PageWrapper title="Home" description="Pakistan's marketplace for knitting, stitching & craft supplies">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden flex items-center min-h-[90vh] md:min-h-[85vh]"
        style={{ background: '#1C0A00' }}>
        <MosaicBackground />
        <div className="absolute inset-0" style={{ background: 'rgba(28,10,0,0.55)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(200,139,0,0.15)', color: '#C88B00', borderColor: 'rgba(200,139,0,0.4)' }}>
            CRAFTS · KNITTING · HABERDASHERY
          </span>

          <BeadDots count={7} size="md" className="mb-5" />

          <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-4">
            <span style={{ color: '#C88B00' }}>Pakistan's</span>{' '}
            <span style={{ color: '#FFFCF5' }}>Craft</span><br />
            <span style={{ color: '#D85A30' }}>Marketplace</span>
          </h1>

          <p className="text-base sm:text-lg mb-10 max-w-xl" style={{ color: '#C8B89A' }}>
            Discover thousands of knitting, stitching & haberdashery products
            from local artisan shops across Pakistan.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-2 mb-8">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#A07000' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, yarn, needles…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none"
                style={{ background: '#FFFCF5', color: '#1C0A00', border: '2px solid #C88B00' }} />
            </div>
            <button type="submit" className="btn-primary px-6 rounded-xl text-sm">Search</button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/products" className="btn-primary gap-2 rounded-xl px-7 py-3 text-sm font-bold">
              Browse All Products <ArrowRight size={16} />
            </Link>
            <Link to="/vendor/register" className="btn-secondary rounded-xl px-7 py-3 text-sm font-bold"
              style={{ borderColor: '#FFFCF5', color: '#FFFCF5' }}>
              Open Your Shop
            </Link>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 48 }}>
          <path d="M0,30 Q360,60 720,30 Q1080,0 1440,30 L1440,60 L0,60 Z" fill="#FFFCF5" />
        </svg>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#FFF8E7' }}>
        <ColorBlob color="#C88B00" className="top-0 right-0 w-72 h-72" opacity={0.08} />
        <ColorBlob color="#D85A30" className="bottom-0 left-0 w-56 h-56" opacity={0.07} />

        <div className="max-w-7xl mx-auto">
          <BrushstrokeHeading className="mb-10">
            <span style={{ color: '#C88B00' }}>Browse</span>{' '}
            <span style={{ color: '#1C0A00' }}>Categories</span>
          </BrushstrokeHeading>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories === null
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCategory key={i} />)
              : categories.length === 0
                ? <p className="col-span-full text-center text-sm py-6" style={{ color: '#A07000' }}>No categories yet.</p>
                : categories.map((cat, i) => (
                  <Link key={cat.id}
                    to={`/products?categoryId=${cat.id}`}
                    className="mosaic-block rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-1 hover:scale-105"
                    style={{ background: cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}>
                    <span className="text-3xl">{cat.icon || FALLBACK_ICONS[i % FALLBACK_ICONS.length]}</span>
                    <span className="font-semibold text-xs leading-tight" style={{ color: '#FFFCF5' }}>{cat.name}</span>
                  </Link>
                ))
            }
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FLASH SALES (only shown when there are active sale products)
      ═══════════════════════════════════════════ */}
      {(onSale === null || onSale?.length > 0) && (
        <section className="section-pad relative overflow-hidden" style={{ background: '#1C0A00' }}>
          <ColorBlob color="#D85A30" className="top-0 right-0 w-64 h-64" opacity={0.12} />
          <DiamondMotif color="#C88B00" className="bottom-6 left-6 opacity-20" size={40} />

          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: '#D85A30' }}>
                  <Tag size={18} style={{ color: '#FFFCF5' }} />
                </div>
                <BrushstrokeHeading align="left">
                  <span style={{ color: '#D85A30' }}>Flash</span>{' '}
                  <span style={{ color: '#FFFCF5' }}>Sales</span>
                </BrushstrokeHeading>
              </div>
              <Link to="/products" className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: '#C88B00' }}>
                View all <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {onSale === null
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)
                : onSale.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FEATURED PRODUCTS
      ═══════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#FFFCF5' }}>
        <ColorBlob color="#6A4C93" className="top-10 right-10 w-64 h-64" opacity={0.06} />

        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <BrushstrokeHeading align="left">
              <span style={{ color: '#D85A30' }}>Featured</span>{' '}
              <span style={{ color: '#1C0A00' }}>Products</span>
            </BrushstrokeHeading>
            <Link to="/products" className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: '#C88B00' }}>
              View all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featured === null
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonProductCard key={i} />)
              : featured.length === 0
                ? (
                  <div className="col-span-full flex flex-col items-center py-16 gap-3">
                    <span className="text-5xl">🧵</span>
                    <p className="font-serif font-bold text-lg" style={{ color: '#C88B00' }}>No products yet</p>
                    <p className="text-sm" style={{ color: '#7A6050' }}>Check back soon — vendors are adding products.</p>
                    <Link to="/vendor/register" className="btn-primary rounded-xl px-6 py-2.5 text-sm mt-2">
                      Open Your Shop →
                    </Link>
                  </div>
                )
                : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED VENDORS
      ═══════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#1C0A00' }}>
        <DiamondMotif color="#C88B00" className="top-6 left-6 opacity-20" size={48} />
        <DiamondMotif color="#D85A30" className="top-6 right-6 opacity-20" size={48} />

        <div className="max-w-7xl mx-auto">
          <BrushstrokeHeading className="mb-10">
            <span style={{ color: '#C88B00' }}>Featured</span>{' '}
            <span style={{ color: '#FFFCF5' }}>Shops</span>
          </BrushstrokeHeading>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vendors === null
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonVendor key={i} />)
              : vendors.length === 0
                ? <p className="col-span-full text-center text-sm py-8" style={{ color: '#A89070' }}>No vendors yet.</p>
                : vendors.map((v, i) => {
                  const color = v.colorTheme || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  return (
                    <Link key={v.id} to={`/vendors/${v.id}`}
                      className="mosaic-block rounded-xl p-5 flex flex-col gap-2 hover:-translate-y-1 transition-transform"
                      style={{ background: color }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2"
                        style={{ background: '#FFFCF5', color, borderColor: '#1C0A00' }}>
                        {(v.shopName || 'V')[0]}
                      </div>
                      <h3 className="font-serif font-bold text-sm leading-tight" style={{ color: '#FFFCF5' }}>
                        {v.shopName}
                      </h3>
                      <p className="text-xs" style={{ color: 'rgba(255,252,245,0.75)' }}>
                        {v.city} · {v._count?.products ?? 0} products
                      </p>
                    </Link>
                  )
                })
            }
          </div>

          <div className="text-center mt-8">
            <Link to="/vendors" className="btn-secondary rounded-xl px-8 py-3 font-bold"
              style={{ borderColor: '#C88B00', color: '#C88B00' }}>
              View All Vendors
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHY STITCHBAZAAR
      ═══════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#FFF8E7' }}>
        <ColorBlob color="#0F6E56" className="top-0 left-0 w-64 h-64" opacity={0.07} />

        <div className="max-w-5xl mx-auto">
          <BrushstrokeHeading className="mb-10">
            <span style={{ color: '#1C0A00' }}>Why</span>{' '}
            <span style={{ color: '#D85A30' }}>StitchBazaar</span>
            <span style={{ color: '#1C0A00' }}>?</span>
          </BrushstrokeHeading>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {WHY_ITEMS.map((item, i) => (
              <div key={i} className="mosaic-block rounded-xl p-5 flex flex-col items-center text-center gap-3"
                style={{ background: '#FFFCF5' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: item.color, color: '#FFFCF5' }}>
                  {item.icon}
                </div>
                <h3 className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5A4030' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          VENDOR CTA BANNER
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #C88B00 0%, #D85A30 60%, #6A4C93 100%)' }}>
        <DiamondMotif color="#FFFCF5" className="top-4 left-4 opacity-20" size={36} />
        <DiamondMotif color="#FFFCF5" className="bottom-4 right-4 opacity-20" size={36} />

        <div className="max-w-2xl mx-auto text-center">
          <BeadDots count={6} size="sm" className="mb-4 justify-center" />
          <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4" style={{ color: '#FFFCF5' }}>
            Sell Your Crafts Online
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,252,245,0.85)' }}>
            Join Pakistani artisan shops. Register your store in minutes,
            list your products, and start reaching customers across Pakistan.
          </p>
          <Link to="/vendor/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-1"
            style={{ background: '#1C0A00', color: '#C88B00' }}>
            Open Your Shop Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </PageWrapper>
  )
}
