/**
 * Public Vendors listing — /vendors
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Package, MessageCircle } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import MosaicBackground from '../components/mosaic/MosaicBackground.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import BeadDots from '../components/mosaic/BeadDots.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'
import { vendorsApi } from '../api/vendors.js'

const CITIES = ['All Cities','Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar']

const MOCK_VENDORS = [
  { id: 'v1', shopName: 'CraftHub Lahore',      shopDescription: 'Premium knitting & stitching supplies. Trusted by 1000+ crafters.', city: 'Lahore',    colorTheme: '#C88B00', logo: null, _count: { products: 48 }, phone: '03001234567' },
  { id: 'v2', shopName: 'Yarn Paradise',         shopDescription: 'The finest imported yarns and wool from around the world.',          city: 'Karachi',   colorTheme: '#D85A30', logo: null, _count: { products: 32 }, phone: '03119876543' },
  { id: 'v3', shopName: 'Needle Arts Islamabad', shopDescription: 'Specialist store for embroidery, cross-stitch, and needlepoint.',   city: 'Islamabad', colorTheme: '#0F6E56', logo: null, _count: { products: 25 }, phone: '03451111222' },
]

export default function Vendors() {
  const [vendors, setVendors] = useState(MOCK_VENDORS)
  const [search, setSearch]   = useState('')
  const [city, setCity]       = useState('All Cities')

  useEffect(() => {
    const params = {}
    if (search) params.q = search
    if (city !== 'All Cities') params.city = city
    vendorsApi.list(params)
      .then(d => { if (d.data?.length) setVendors(d.data) })
      .catch(() => {})
  }, [search, city])

  const filtered = vendors

  return (
    <PageWrapper title="All Vendors — StitchBazaar">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4" style={{ background: '#1C0A00' }}>
        <MosaicBackground className="absolute inset-0" opacity={0.12} />
        <ColorBlob color="#C88B00" className="top-0 right-0 w-80 h-80" opacity={0.08} />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <BeadDots count={6} size="sm" className="justify-center mb-4" />
          <BrushstrokeHeading as="h1" align="center" beads={false}>
            <span style={{ color: '#FFFCF5' }}>Our </span>
            <span style={{ color: '#C88B00' }}>Vendors</span>
          </BrushstrokeHeading>
          <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: '#C8B89A' }}>
            Browse independent craft sellers from across Pakistan — each one handpicked for quality, authenticity, and service.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-52"
            style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
            <Search size={15} style={{ color: '#C88B00' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors…"
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: '#1C0A00' }} />
          </div>
          <select value={city} onChange={e => setCity(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <p className="text-sm mb-5" style={{ color: '#7A6050' }}>
          Showing {filtered.length} vendor{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(v => (
            <div key={v.id} className="rounded-xl overflow-hidden transition-all hover:-translate-y-1"
              style={{ border: '2px solid rgba(200,139,0,0.15)', boxShadow: '0 4px 16px rgba(200,139,0,0.08)' }}>

              {/* Banner */}
              <div className="h-24 flex items-center justify-center relative"
                style={{ background: v.colorTheme }}>
                <span className="text-white text-4xl font-serif font-bold opacity-20 select-none">
                  {v.shopName[0]}
                </span>
                <div className="absolute inset-0 flex items-end p-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#FFFCF5' }}>
                    {v.shopName[0]}
                  </div>
                </div>
              </div>

              <div className="p-4" style={{ background: '#FFF8E7' }}>
                <h3 className="font-serif font-bold text-base leading-tight" style={{ color: '#1C0A00' }}>
                  {v.shopName}
                </h3>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7A6050' }}>
                  {v.shopDescription}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#7A6050' }}>
                      <MapPin size={11} /> {v.city}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#7A6050' }}>
                      <Package size={11} /> {v._count.products} products
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Link to={`/vendors/${v.id}`}
                    className="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                    style={{ background: v.colorTheme, color: '#FFFCF5' }}>
                    Visit Shop
                  </Link>
                  <a href={`https://wa.me/${v.phone?.replace(/\D/g,'').replace(/^0/,'92')}?text=Hi%2C%20I%20found%20your%20shop%20on%20StitchBazaar!`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: '#25D36620', color: '#25D366' }}>
                    <MessageCircle size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-xl font-bold" style={{ color: '#C88B00' }}>No vendors found</p>
            <p className="text-sm mt-2" style={{ color: '#7A6050' }}>Try adjusting your search or city filter.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
