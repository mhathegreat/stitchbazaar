/**
 * ProductGrid
 * Responsive grid of ProductCards with skeleton loading state.
 */

import ProductCard from './ProductCard.jsx'

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(200,139,0,0.1)' }}>
      <div className="h-1.5 skeleton" />
      <div className="skeleton" style={{ height: 180 }} />
      <div className="p-3 flex flex-col gap-2" style={{ background: '#FFF8E7' }}>
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex justify-between mt-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * @param {object}    props
 * @param {Array}     props.products
 * @param {boolean}   [props.loading=false]
 * @param {number}    [props.skeletonCount=12]
 * @param {string}    [props.emptyMessage]
 */
export default function ProductGrid({ products = [], loading = false, skeletonCount = 12, emptyMessage }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <span className="text-6xl">🧵</span>
        <p className="font-serif text-xl font-bold" style={{ color: '#C88B00' }}>No products found</p>
        <p className="text-sm" style={{ color: '#7A6050' }}>{emptyMessage || 'Try adjusting your search or filters.'}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  )
}
