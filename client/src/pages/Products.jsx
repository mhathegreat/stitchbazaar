/**
 * Products listing page
 * Search, filter by category/price/vendor, sort, infinite scroll.
 * Reads ?q= ?categoryId= from URL so links and search bar work together.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react'

import PageWrapper       from '../components/layout/PageWrapper.jsx'
import ProductGrid       from '../components/product/ProductGrid.jsx'
import ColorBlob         from '../components/mosaic/ColorBlob.jsx'
import BeadDots          from '../components/mosaic/BeadDots.jsx'
import { productsApi }   from '../api/products.js'
import { categoriesApi } from '../api/categories.js'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First'    },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'popular',   label: 'Top Rated'        },
]

const PAGE_SIZE = 24

// ── Component ─────────────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search,      setSearch]      = useState(searchParams.get('q') || '')
  const [categoryId,  setCategoryId]  = useState(searchParams.get('categoryId') || '')
  const [minPrice,    setMinPrice]    = useState('')
  const [maxPrice,    setMaxPrice]    = useState('')
  const [sort,        setSort]        = useState('newest')
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [products,    setProducts]    = useState([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [hasMore,     setHasMore]     = useState(false)
  const [categories,  setCategories]  = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const sentinelRef = useRef(null)

  // Load categories once
  useEffect(() => {
    categoriesApi.list()
      .then(d => setCategories(d.data || []))
      .catch(() => {})
  }, [])

  // Build query params for API
  function buildParams(pg = 1) {
    const p = { sort, limit: PAGE_SIZE, page: pg }
    if (search)     p.q          = search
    if (categoryId) p.categoryId = categoryId
    if (minPrice)   p.minPrice   = Number(minPrice) * 100
    if (maxPrice)   p.maxPrice   = Number(maxPrice) * 100
    return p
  }

  // Initial / filter-change load (resets list)
  const load = useCallback(() => {
    setLoading(true)
    setPage(1)
    productsApi.list(buildParams(1))
      .then(d => {
        const list = d.data || []
        const tot  = d.meta?.total || list.length
        setProducts(list)
        setTotal(tot)
        setHasMore(list.length < tot)
      })
      .catch(() => { setProducts([]); setTotal(0); setHasMore(false) })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, minPrice, maxPrice, sort])

  useEffect(() => { load() }, [load])

  // Load next page
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    productsApi.list(buildParams(nextPage))
      .then(d => {
        const list = d.data || []
        setProducts(prev => {
          const combined = [...prev, ...list]
          setHasMore(combined.length < (d.meta?.total || 0))
          return combined
        })
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, page, search, categoryId, minPrice, maxPrice, sort])

  // IntersectionObserver sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  function handleSearch(e) {
    e.preventDefault()
    const params = {}
    if (search.trim()) params.q = search.trim()
    if (categoryId)    params.categoryId = categoryId
    setSearchParams(params)
  }

  function clearFilters() {
    setSearch(''); setCategoryId(''); setMinPrice(''); setMaxPrice(''); setSort('newest')
    setSearchParams({})
  }

  const activeFilterCount = [search, categoryId, minPrice, maxPrice].filter(Boolean).length

  return (
    <PageWrapper title="Shop All Products" description="Browse all knitting, stitching and craft products on StitchBazaar">
      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden py-12 px-4" style={{ background: '#1C0A00' }}>
        <ColorBlob color="#C88B00" className="top-0 right-0 w-72 h-72" opacity={0.1} />
        <ColorBlob color="#D85A30" className="bottom-0 left-0 w-56 h-56" opacity={0.08} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <BeadDots count={6} size="sm" className="mb-3 justify-center" />
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">
            <span style={{ color: '#C88B00' }}>Shop</span>{' '}
            <span style={{ color: '#FFFCF5' }}>All Products</span>
          </h1>
          <p className="text-sm mb-6" style={{ color: '#C8B89A' }}>
            {total} products from local artisan shops across Pakistan
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A07000' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, yarn, needles…"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#FFFCF5', border: '2px solid #C88B00', color: '#1C0A00' }}
              />
            </div>
            <button type="submit" className="btn-primary rounded-xl px-5 text-sm">Search</button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">

          {/* ── Sidebar filters — desktop ── */}
          <aside className="hidden lg:flex flex-col gap-5 w-56 shrink-0">
            <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs hover:underline" style={{ color: '#D85A30' }}>
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A07000' }}>Category</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setCategoryId('')}
                    className="text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                    style={{ background: !categoryId ? '#C88B00' : 'transparent', color: !categoryId ? '#1C0A00' : '#5A4030', fontWeight: !categoryId ? 700 : 400 }}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className="text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                      style={{ background: categoryId === cat.id ? '#C88B00' : 'transparent', color: categoryId === cat.id ? '#1C0A00' : '#5A4030', fontWeight: categoryId === cat.id ? 700 : 400 }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A07000' }}>Price (Rs.)</p>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                    style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                  />
                  <input
                    type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                    style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              {/* Mobile filters toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.3)', color: '#5A4030' }}
              >
                <SlidersHorizontal size={15} />
                Filters {activeFilterCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#C88B00', color: '#1C0A00' }}>{activeFilterCount}</span>}
              </button>

              <p className="text-sm" style={{ color: '#7A6050' }}>
                Showing <strong style={{ color: '#1C0A00' }}>{products.length}</strong> of <strong style={{ color: '#1C0A00' }}>{total}</strong>
              </p>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort} onChange={e => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium outline-none cursor-pointer"
                  style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.3)', color: '#5A4030' }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A07000' }} />
              </div>
            </div>

            {/* Mobile filter panel */}
            {showFilters && (
              <div className="lg:hidden mb-4 rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm" style={{ color: '#1C0A00' }}>Filters</h3>
                  <button onClick={() => setShowFilters(false)}><X size={16} style={{ color: '#7A6050' }} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat.id}
                      onClick={() => { setCategoryId(cat.id); setShowFilters(false) }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={categoryId === cat.id
                        ? { background: '#C88B00', color: '#1C0A00', borderColor: '#C88B00' }
                        : { background: 'transparent', color: '#5A4030', borderColor: 'rgba(200,139,0,0.3)' }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-3 text-xs underline" style={{ color: '#D85A30' }}>Clear all</button>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(200,139,0,0.12)', color: '#A07000' }}>
                    "{search}"
                    <button onClick={() => setSearch('')}><X size={11} /></button>
                  </span>
                )}
                {categoryId && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30' }}>
                    {categories.find(c => c.id === categoryId)?.name}
                    <button onClick={() => setCategoryId('')}><X size={11} /></button>
                  </span>
                )}
              </div>
            )}

            <ProductGrid products={products} loading={loading} />

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 size={28} className="animate-spin" style={{ color: '#C88B00' }} />
              </div>
            )}

            {/* End of results */}
            {!hasMore && products.length > 0 && !loading && (
              <p className="text-center text-sm py-8" style={{ color: '#A07000' }}>
                ✦ All {total} products loaded
              </p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
