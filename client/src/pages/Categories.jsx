/**
 * Public Categories listing — /categories
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import MosaicBackground from '../components/mosaic/MosaicBackground.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import BeadDots from '../components/mosaic/BeadDots.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'
import { categoriesApi } from '../api/categories.js'

const FALLBACK_COLORS = ['#C88B00','#D85A30','#0F6E56','#6A4C93','#457B9D','#2DC653','#E63946','#F4A261']
const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Knitting Needles', nameUrdu: 'سلائیاں',       slug: 'knitting-needles', icon: '🧶', color: '#C88B00', _count: { products: 48 }, description: 'Bamboo, metal, circular, and interchangeable needle sets' },
  { id: 'c2', name: 'Crochet Hooks',   nameUrdu: 'کروشیا ہکس',    slug: 'crochet-hooks',    icon: '🪝', color: '#D85A30', _count: { products: 32 }, description: 'Ergonomic and standard hooks in all sizes' },
  { id: 'c3', name: 'Yarn & Wool',     nameUrdu: 'اون',             slug: 'yarn-wool',        icon: '🐑', color: '#0F6E56', _count: { products: 56 }, description: 'Merino, cotton, silk, and acrylic yarns' },
  { id: 'c4', name: 'Thread & Floss',  nameUrdu: 'دھاگا',           slug: 'thread-floss',     icon: '🪡', color: '#6A4C93', _count: { products: 28 }, description: 'Embroidery floss, silk thread, and sewing thread' },
  { id: 'c5', name: 'Embroidery Hoops',nameUrdu: 'کڑھائی کے حلقے', slug: 'embroidery-hoops', icon: '⭕', color: '#457B9D', _count: { products: 18 }, description: 'Wooden and plastic hoops in all sizes' },
]

export default function Categories() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES)

  useEffect(() => {
    categoriesApi.list()
      .then(d => { if (d.data?.length) setCategories(d.data) })
      .catch(() => {})
  }, [])

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat, i) => {
            const color = cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
            const count = cat._count?.products ?? cat.count ?? 0
            return (
            <Link key={cat.id} to={`/products?categoryId=${cat.id}`}
              className="group flex flex-col items-center text-center rounded-xl p-5 transition-all hover:-translate-y-1"
              style={{
                background: '#FFF8E7',
                border:     `2px solid ${color}25`,
                boxShadow:  `0 4px 16px ${color}12`,
              }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110"
                style={{ background: color + '18' }}>
                {cat.icon || '🧵'}
              </div>
              <p className="font-serif font-bold text-sm leading-tight" style={{ color: '#1C0A00' }}>
                {cat.name}
              </p>
              {cat.nameUrdu && (
                <p className="text-[11px] mt-0.5" dir="rtl" style={{ color: '#7A6050' }}>
                  {cat.nameUrdu}
                </p>
              )}
              {cat.description && (
                <p className="text-[10px] mt-2 line-clamp-2" style={{ color: '#7A6050' }}>
                  {cat.description}
                </p>
              )}
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: color + '18', color }}>
                {count} items
              </span>
            </Link>
          )})}
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
