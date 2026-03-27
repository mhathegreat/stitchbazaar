/**
 * Home page — StitchBazaar
 * Sections: Hero (mosaic), Categories, Featured Products, Vendors, Why Us, Footer CTA
 */

import { Link } from 'react-router-dom'
import { Search, ArrowRight, Star, ShieldCheck, Truck, MessageCircle, Store } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsApi } from '../api/products.js'
import { categoriesApi } from '../api/categories.js'
import { vendorsApi } from '../api/vendors.js'

import PageWrapper       from '../components/layout/PageWrapper.jsx'
import MosaicBackground  from '../components/mosaic/MosaicBackground.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import BeadDots          from '../components/mosaic/BeadDots.jsx'
import ColorBlob         from '../components/mosaic/ColorBlob.jsx'
import DiamondMotif      from '../components/mosaic/DiamondMotif.jsx'
import { cardAccent, formatPrice } from '../styles/theme.js'

// ── Fallback data (used until API responds) ───────────────────────────────────
const FALLBACK_COLORS = ['#D85A30','#C88B00','#0F6E56','#6A4C93','#457B9D','#2DC653','#D85A30']
const FALLBACK_ICONS  = ['🧶','🪡','🧵','🔘','✂️','📌','🎨']

const MOCK_CATEGORIES = [
  { id: 1, name: 'Knitting Needles', slug: 'knitting-needles', icon: '🧶', color: '#D85A30' },
  { id: 2, name: 'Yarn & Thread',    slug: 'yarn-thread',      icon: '🪡', color: '#C88B00' },
  { id: 3, name: 'Fabric',           slug: 'fabric',           icon: '🧵', color: '#0F6E56' },
  { id: 4, name: 'Buttons & Beads',  slug: 'buttons-beads',    icon: '🔘', color: '#6A4C93' },
  { id: 5, name: 'Embroidery',       slug: 'embroidery',       icon: '✂️', color: '#457B9D' },
  { id: 6, name: 'Sewing Tools',     slug: 'sewing-tools',     icon: '📌', color: '#2DC653' },
  { id: 7, name: 'Craft Supplies',   slug: 'craft-supplies',   icon: '🎨', color: '#D85A30' },
]

const MOCK_FEATURED_PRODUCTS = [
  { id: '1', name: 'Bamboo Knitting Needles Set', basePrice: 189000, avgRating: 4.8, reviewCount: 34, vendor: { shopName: 'CraftHub Lahore' },  images: [] },
  { id: '2', name: 'Premium Merino Wool Yarn',    basePrice: 120000, avgRating: 4.6, reviewCount: 21, vendor: { shopName: 'YarnWala Karachi' }, images: [] },
  { id: '3', name: 'Embroidery Hoop 10"',         basePrice:  45000, avgRating: 4.9, reviewCount: 56, vendor: { shopName: 'NeedleArt Isb' },   images: [] },
  { id: '4', name: 'Silk Thread Bundle (24 pcs)', basePrice:  85000, avgRating: 4.7, reviewCount: 12, vendor: { shopName: 'ThreadMart PK' },   images: [] },
  { id: '5', name: 'Crochet Hook Set',            basePrice:  65000, avgRating: 4.5, reviewCount: 29, vendor: { shopName: 'CraftHub Lahore' }, images: [] },
  { id: '6', name: 'Cotton Fabric (per meter)',   basePrice:  38000, avgRating: 4.3, reviewCount: 44, vendor: { shopName: 'FabricCity LHR' },  images: [] },
]

const MOCK_FEATURED_VENDORS = [
  { id: '1', shopName: 'CraftHub Lahore',  city: 'Lahore',    _count: { products: 48 }, colorTheme: '#D85A30' },
  { id: '2', shopName: 'YarnWala Karachi', city: 'Karachi',   _count: { products: 31 }, colorTheme: '#0F6E56' },
  { id: '3', shopName: 'NeedleArt Isb',    city: 'Islamabad', _count: { products: 24 }, colorTheme: '#6A4C93' },
  { id: '4', shopName: 'ThreadMart PK',    city: 'Lahore',    _count: { products: 17 }, colorTheme: '#457B9D' },
]

const WHY_ITEMS = [
  { icon: <Store size={28}/>,       title: 'Local Vendors',     desc: 'Support Pakistani artisan shops directly.',       color: '#C88B00' },
  { icon: <Truck size={28}/>,       title: 'Nationwide Delivery', desc: 'Delivered anywhere in Pakistan via TCS & Leopard.', color: '#D85A30' },
  { icon: <ShieldCheck size={28}/>, title: 'Verified Sellers',  desc: 'Every shop manually reviewed by our team.',       color: '#0F6E56' },
  { icon: <MessageCircle size={28}/>,title: 'WhatsApp Support', desc: 'Chat directly with vendors on WhatsApp.',          color: '#6A4C93' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          size={12}
          fill={n <= Math.round(rating) ? '#C88B00' : 'none'}
          stroke={n <= Math.round(rating) ? '#C88B00' : '#CBD5E0'}
        />
      ))}
    </span>
  )
}

function ProductPlaceholder({ index }) {
  const colors = ['#D85A30','#C88B00','#0F6E56','#6A4C93','#457B9D','#2DC653']
  const bg = colors[index % colors.length]
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: bg, minHeight: 180 }}>
      <span className="text-4xl opacity-60">🧶</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Home() {
  const [search,           setSearch]           = useState('')
  const [categories,       setCategories]       = useState(MOCK_CATEGORIES)
  const [featuredProducts, setFeaturedProducts] = useState(MOCK_FEATURED_PRODUCTS)
  const [featuredVendors,  setFeaturedVendors]  = useState(MOCK_FEATURED_VENDORS)
  const navigate = useNavigate()

  useEffect(() => {
    categoriesApi.list()
      .then(d => { if (d.data?.length) setCategories(d.data) })
      .catch(() => {})

    productsApi.list({ limit: 6, sort: 'newest' })
      .then(d => { if (d.data?.length) setFeaturedProducts(d.data) })
      .catch(() => {})

    vendorsApi.list({ limit: 4 })
      .then(d => { if (d.data?.length) setFeaturedVendors(d.data.slice(0, 4)) })
      .catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <PageWrapper title="Home" description="Pakistan's marketplace for knitting, stitching & craft supplies">

      {/* ════════════════════════════════════════════════
          HERO — dark mosaic background
      ════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden flex items-center min-h-[90vh] md:min-h-[85vh]"
        style={{ background: '#1C0A00' }}
      >
        <MosaicBackground />

        {/* Overlay for text legibility */}
        <div className="absolute inset-0" style={{ background: 'rgba(28,10,0,0.55)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">

          {/* Tagline pill */}
          <span
            className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(200,139,0,0.15)', color: '#C88B00', borderColor: 'rgba(200,139,0,0.4)' }}
          >
            CRAFTS · KNITTING · HABERDASHERY
          </span>

          <BeadDots count={7} size="md" className="mb-5" />

          {/* Headline */}
          <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-4">
            <span style={{ color: '#C88B00' }}>Pakistan's</span>{' '}
            <span style={{ color: '#FFFCF5' }}>Craft</span><br />
            <span style={{ color: '#D85A30' }}>Marketplace</span>
          </h1>

          <p className="text-base sm:text-lg mb-10 max-w-xl" style={{ color: '#C8B89A' }}>
            Discover thousands of knitting, stitching & haberdashery products
            from local artisan shops across Pakistan.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-2 mb-8">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#A07000' }}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products, yarn, needles…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-shadow"
                style={{
                  background: '#FFFCF5',
                  color: '#1C0A00',
                  border: '2px solid #C88B00',
                  boxShadow: '0 0 0 0px #C88B00',
                }}
              />
            </div>
            <button type="submit" className="btn-primary px-6 rounded-xl text-sm">
              Search
            </button>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/products" className="btn-primary gap-2 rounded-xl px-7 py-3 text-sm font-bold">
              Browse All Products <ArrowRight size={16} />
            </Link>
            <Link to="/vendor/register" className="btn-secondary rounded-xl px-7 py-3 text-sm font-bold" style={{ borderColor: '#FFFCF5', color: '#FFFCF5' }}>
              Open Your Shop
            </Link>
          </div>
        </div>

        {/* Bottom wave cut */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 48 }}>
          <path d="M0,30 Q360,60 720,30 Q1080,0 1440,30 L1440,60 L0,60 Z" fill="#FFFCF5" />
        </svg>
      </section>

      {/* ════════════════════════════════════════════════
          CATEGORIES — warm cream with bold color tiles
      ════════════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#FFF8E7' }}>
        <ColorBlob color="#C88B00" className="top-0 right-0 w-72 h-72" opacity={0.08} />
        <ColorBlob color="#D85A30" className="bottom-0 left-0 w-56 h-56" opacity={0.07} />

        <div className="max-w-7xl mx-auto">
          <BrushstrokeHeading className="mb-10">
            <span style={{ color: '#C88B00' }}>Browse</span>{' '}
            <span style={{ color: '#1C0A00' }}>Categories</span>
          </BrushstrokeHeading>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="mosaic-block rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-1 hover:scale-105"
                style={{ background: cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
              >
                <span className="text-3xl">{cat.icon || FALLBACK_ICONS[i % FALLBACK_ICONS.length]}</span>
                <span className="font-semibold text-xs leading-tight" style={{ color: '#FFFCF5' }}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURED PRODUCTS
      ════════════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#FFFCF5' }}>
        <ColorBlob color="#6A4C93" className="top-10 right-10 w-64 h-64" opacity={0.06} />

        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <BrushstrokeHeading align="left">
              <span style={{ color: '#D85A30' }}>Featured</span>{' '}
              <span style={{ color: '#1C0A00' }}>Products</span>
            </BrushstrokeHeading>
            <Link
              to="/products"
              className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: '#C88B00' }}
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {featuredProducts.map((p, i) => (
              <Link key={p.id} to={`/products/${p.id}`} className="product-card group flex flex-col">
                {/* Accent top border */}
                <div className="h-1.5 w-full rounded-t-xl" style={{ background: cardAccent(i) }} />

                {/* Image */}
                <div className="relative overflow-hidden" style={{ height: 160 }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    : <ProductPlaceholder index={i} />
                  }
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  {/* Vendor badge */}
                  <span
                    className="badge text-[10px] self-start"
                    style={{ background: `${cardAccent(i)}18`, color: cardAccent(i) }}
                  >
                    {p.vendor?.shopName}
                  </span>

                  <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: '#1C0A00' }}>
                    {p.name}
                  </p>

                  <div className="flex items-center gap-1.5 mt-auto">
                    <StarRating rating={p.avgRating || 0} />
                    <span className="text-[11px]" style={{ color: '#7A6050' }}>({p._count?.reviews ?? p.reviewCount ?? 0})</span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-base" style={{ color: '#C88B00' }}>
                      {formatPrice(p.basePrice)}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ background: '#D85A30', color: '#FFFCF5' }}
                    >
                      Add +
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          VENDOR SHOPS ROW
      ════════════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden" style={{ background: '#1C0A00' }}>
        <DiamondMotif color="#C88B00" className="top-6 left-6 opacity-20" size={48} />
        <DiamondMotif color="#D85A30" className="top-6 right-6 opacity-20" size={48} />

        <div className="max-w-7xl mx-auto">
          <BrushstrokeHeading className="mb-10">
            <span style={{ color: '#C88B00' }}>Featured</span>{' '}
            <span style={{ color: '#FFFCF5' }}>Shops</span>
          </BrushstrokeHeading>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredVendors.map((v, i) => {
              const color = v.colorTheme || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
              return (
                <Link
                  key={v.id}
                  to={`/vendors/${v.id}`}
                  className="mosaic-block rounded-xl p-5 flex flex-col gap-2 hover:-translate-y-1 transition-transform"
                  style={{ background: color }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2"
                    style={{ background: '#FFFCF5', color, borderColor: '#1C0A00' }}
                  >
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
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/vendors" className="btn-secondary rounded-xl px-8 py-3 font-bold" style={{ borderColor: '#C88B00', color: '#C88B00' }}>
              View All Vendors
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          WHY STITCHBAZAAR
      ════════════════════════════════════════════════ */}
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
              <div
                key={i}
                className="mosaic-block rounded-xl p-5 flex flex-col items-center text-center gap-3"
                style={{ background: '#FFFCF5' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: item.color, color: '#FFFCF5' }}
                >
                  {item.icon}
                </div>
                <h3 className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5A4030' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          VENDOR CTA BANNER
      ════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #C88B00 0%, #D85A30 60%, #6A4C93 100%)' }}
      >
        <DiamondMotif color="#FFFCF5" className="top-4 left-4 opacity-20" size={36} />
        <DiamondMotif color="#FFFCF5" className="bottom-4 right-4 opacity-20" size={36} />

        <div className="max-w-2xl mx-auto text-center">
          <BeadDots count={6} size="sm" className="mb-4 justify-center" />
          <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4" style={{ color: '#FFFCF5' }}>
            Sell Your Crafts Online
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,252,245,0.85)' }}>
            Join hundreds of Pakistani artisan shops. Register your store in minutes,
            list your products, and start reaching customers across Pakistan.
          </p>
          <Link
            to="/vendor/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-1"
            style={{ background: '#1C0A00', color: '#C88B00' }}
          >
            Open Your Shop Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </PageWrapper>
  )
}
