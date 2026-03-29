/**
 * Public Vendors listing — /vendors
 * All data live from API. No mock vendors.
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
import toast from 'react-hot-toast'
import CitySelect from '../components/ui/CitySelect.jsx'

function SkeletonVendorCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
      <div className="h-24 skeleton" />
      <div className="p-4" style={{ background: '#FFF8E7' }}>
        <div className="skeleton h-4 w-32 rounded mb-2" />
        <div className="skeleton h-3 w-full rounded mb-1" />
        <div className="skeleton h-3 w-2/3 rounded mb-4" />
        <div className="skeleton h-8 w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function Vendors() {
  const [vendors, setVendors] = useState(null)   // null = loading
  const [search, setSearch]   = useState('')
  const [city, setCity]       = useState('All Cities')

  useEffect(() => {
    setVendors(null)
    const params = {}
    if (search) params.q = search
    if (city !== 'All Cities') params.city = city
    vendorsApi.list(params)
      .then(d => setVendors(d.data || []))
      .catch(() => { toast.error('Failed to load vendors'); setVendors([]) })
  }, [search, city])

  const loading = vendors === null

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
          <div className="w-48">
            <CitySelect
              value={city === 'All Cities' ? '' : city}
              onChange={v => setCity(v || 'All Cities')}
              placeholder="All Cities"
              allowAll
              inputStyle={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}
            />
          </div>
        </div>

        {!loading && (
          <p className="text-sm mb-5" style={{ color: '#7A6050' }}>
            Showing {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonVendorCard key={i} />)
            : vendors.map(v => (
              <div key={v.id} className="rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                style={{ border: '2px solid rgba(200,139,0,0.15)', boxShadow: '0 4px 16px rgba(200,139,0,0.08)' }}>

                {/* Banner */}
                <div className="h-24 flex items-center justify-center relative"
                  style={{ background: v.colorTheme || '#C88B00' }}>
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
                    {v.shopDescription || 'Pakistani craft vendor on StitchBazaar.'}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {v.city && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#7A6050' }}>
                          <MapPin size={11} /> {v.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#7A6050' }}>
                        <Package size={11} /> {v._count?.products ?? 0} products
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link to={`/vendors/${v.id}`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: v.colorTheme || '#C88B00', color: '#FFFCF5' }}>
                      Visit Shop
                    </Link>
                    {v.phone && (
                      <a href={`https://wa.me/${v.phone.replace(/\D/g,'').replace(/^0/,'92')}?text=Hi%2C%20I%20found%20your%20shop%20on%20StitchBazaar!`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: '#25D36620', color: '#25D366' }}>
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>

        {!loading && vendors.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-xl font-bold" style={{ color: '#C88B00' }}>No vendors found</p>
            <p className="text-sm mt-2" style={{ color: '#7A6050' }}>Try adjusting your search or city filter.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
