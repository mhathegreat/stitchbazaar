/**
 * Public Categories listing — /categories
 * All data live from API. Category images instead of emojis.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import MosaicBackground from '../components/mosaic/MosaicBackground.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import BeadDots from '../components/mosaic/BeadDots.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'
import { categoriesApi } from '../api/categories.js'
import toast from 'react-hot-toast'

const FALLBACK_COLORS = ['#C88B00','#D85A30','#0F6E56','#6A4C93','#457B9D','#2DC653','#E63946','#F4A261']

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.12)' }}>
      <div className="skeleton" style={{ height: 160 }} />
      <div className="p-4" style={{ background: '#FFF8E7' }}>
        <div className="skeleton h-4 w-28 rounded mb-2" />
        <div className="skeleton h-3 w-full rounded mb-1" />
        <div className="skeleton h-3 w-2/3 rounded mb-3" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState(null)  // null = loading

  useEffect(() => {
    categoriesApi.list()
      .then(d => setCategories(d.data || []))
      .catch(() => { toast.error('Failed to load categories'); setCategories([]) })
  }, [])

  const loading = categories === null

  return (
    <PageWrapper title="Shop by Category — StitchBazaar">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4" style={{ background: '#1C0A00' }}>
        <MosaicBackground className="absolute inset-0" opacity={0.12} />
        <ColorBlob color="#D85A30" className="top-0 left-0 w-64 h-64" opacity={0.08} />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <BeadDots count={6} size="sm" className="justify-center mb-4" />
          <BrushstrokeHeading as="h1" align="center" beads={false}>
            <span style={{ color: '#FFFCF5' }}>Shop by </span>
            <span style={{ color: '#C88B00' }}>Category</span>
          </BrushstrokeHeading>
          <p className="mt-3 text-sm" style={{ color: '#C8B89A' }}>
            Everything for knitting, crochet, embroidery, and more — sorted just for you.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : categories.length === 0
              ? <p className="col-span-full text-center py-12 text-sm" style={{ color: '#A07000' }}>No categories yet.</p>
              : categories.map((cat, i) => {
                  const color = cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  const count = cat._count?.products ?? 0
                  return (
                    <Link key={cat.id} to={`/products?categoryId=${cat.id}`}
                      className="group rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                      style={{ border: `2px solid ${color}25`, boxShadow: `0 4px 16px ${color}12` }}>

                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ height: 160, background: color + '22' }}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            🧵
                          </div>
                        )}
                        {/* Color overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-12"
                          style={{ background: `linear-gradient(to top, ${color}cc, transparent)` }} />
                      </div>

                      {/* Info */}
                      <div className="p-4" style={{ background: '#FFF8E7' }}>
                        <h3 className="font-serif font-bold text-base leading-tight" style={{ color: '#1C0A00' }}>
                          {cat.name}
                        </h3>
                        {cat.nameUrdu && (
                          <p className="text-xs mt-0.5" dir="rtl" style={{ color: '#7A6050' }}>
                            {cat.nameUrdu}
                          </p>
                        )}
                        {cat.description && (
                          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#7A6050' }}>
                            {cat.description}
                          </p>
                        )}
                        <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: color + '18', color }}>
                          {count} items
                        </span>
                      </div>
                    </Link>
                  )
                })
          }
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-xl p-8 text-center relative overflow-hidden"
          style={{ background: '#1C0A00' }}>
          <MosaicBackground className="absolute inset-0" opacity={0.1} />
          <div className="relative z-10">
            <p className="font-serif font-bold text-2xl" style={{ color: '#C88B00' }}>
              Can't find what you're looking for?
            </p>
            <p className="text-sm mt-2 mb-5" style={{ color: '#C8B89A' }}>
              Browse all products or contact us — we're always adding new categories.
            </p>
            <Link to="/products"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: '#C88B00', color: '#1C0A00' }}>
              Browse All Products →
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
