/**
 * Vendor Storefront page — /vendors/:id
 * Mosaic banner in vendor's color, about section, product grid.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Package, Star, MessageCircle } from 'lucide-react'

import PageWrapper    from '../../components/layout/PageWrapper.jsx'
import ProductGrid    from '../../components/product/ProductGrid.jsx'
import BeadDots       from '../../components/mosaic/BeadDots.jsx'
import ColorBlob      from '../../components/mosaic/ColorBlob.jsx'
import DiamondMotif   from '../../components/mosaic/DiamondMotif.jsx'
import BrushstrokeHeading from '../../components/mosaic/BrushstrokeHeading.jsx'
import { vendorTheme, formatPrice } from '../../styles/theme.js'
import { vendorsApi } from '../../api/vendors.js'

export default function VendorShop() {
  const { id } = useParams()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    vendorsApi.get(id)
      .then(d => setVendor(d.data))
      .catch(() => {
        // Fallback mock if API unavailable
        const theme = vendorTheme(0)
        setVendor({ id, shopName: 'StitchBazaar Shop', shopDescription: '', city: 'Pakistan',
          colorTheme: theme.bg, phone: '', _count: { products: 0 }, products: [] })
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading || !vendor) return (
    <PageWrapper title="Vendor Shop">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="skeleton rounded-2xl mb-8" style={{ height: 220 }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton rounded-xl" style={{ height: 240 }} />)}
        </div>
      </div>
    </PageWrapper>
  )

  const accent = vendor.colorTheme

  return (
    <PageWrapper title={vendor.shopName} description={`${vendor.shopDescription.slice(0, 140)} — Shop on StitchBazaar`}>

      {/* ── Banner ── */}
      <section className="relative overflow-hidden" style={{ background: accent, minHeight: 220 }}>
        <ColorBlob color="#FFFCF5" className="top-0 right-0 w-72 h-72" opacity={0.08} />
        <ColorBlob color="#1C0A00" className="bottom-0 left-0 w-56 h-56" opacity={0.1} />
        <DiamondMotif color="rgba(255,252,245,0.3)" className="top-4 right-12" size={56} />
        <DiamondMotif color="rgba(255,252,245,0.2)" className="bottom-4 left-8" size={40} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-end gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center font-bold text-3xl border-4 shrink-0"
            style={{ background: '#FFFCF5', color: accent, borderColor: 'rgba(28,10,0,0.3)' }}>
            {vendor.shopName[0]}
          </div>
          <div>
            <BeadDots count={5} size="sm" className="mb-2" />
            <h1 className="font-serif font-bold text-2xl md:text-3xl" style={{ color: '#FFFCF5' }}>{vendor.shopName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,252,245,0.8)' }}>
                <MapPin size={13} /> {vendor.city}
              </span>
              <span className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,252,245,0.8)' }}>
                <Package size={13} /> {vendor.productCount} products
              </span>
              {vendor.avgRating > 0 && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,252,245,0.8)' }}>
                  <Star size={13} fill="rgba(255,252,245,0.8)" stroke="none" /> {vendor.avgRating} ({vendor.reviewCount || 0} reviews)
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp CTA */}
          {vendor.phone && (
            <a href={`https://wa.me/${vendor.phone.replace(/\D/g,'').replace(/^0/,'92')}`} target="_blank" rel="noopener noreferrer"
              className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: '#1C0A00', color: '#C88B00' }}>
              <MessageCircle size={15} style={{ color: '#2DC653' }} /> WhatsApp
            </a>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Products',  value: vendor._count?.products ?? vendor.productCount ?? 0, color: accent },
            { label: 'Sales',     value: vendor._count?.orderItems ?? vendor.totalSales ?? 0, color: '#D85A30' },
            { label: 'Joined',    value: new Date(vendor.createdAt || Date.now()).getFullYear(), color: '#0F6E56' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center mosaic-block"
              style={{ background: '#FFF8E7' }}>
              <p className="font-serif font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-1" style={{ color: '#7A6050' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        {vendor.shopDescription && (
          <div className="rounded-xl p-5 mb-8" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <h2 className="font-serif font-bold text-sm mb-2" style={{ color: '#A07000' }}>About This Shop</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#3A2010' }}>{vendor.shopDescription}</p>
          </div>
        )}

        {/* Products */}
        <BrushstrokeHeading align="left" className="mb-6">
          <span style={{ color: accent }}>Products</span>{' '}
          <span style={{ color: '#1C0A00' }}>from {vendor.shopName}</span>
        </BrushstrokeHeading>
        <ProductGrid products={(vendor.products || []).map(p => ({
          ...p,
          vendorId:   vendor.id,
          vendorName: vendor.shopName,
          rating:     p.rating     || 0,
          reviewCount:p.reviewCount|| 0,
        }))} />
      </div>
    </PageWrapper>
  )
}
