/**
 * ProductCard
 * Reusable card used in grids across the site.
 * Colored accent top border, vendor badge, star rating, Rs. price, Add to cart.
 */

import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { cardAccent, formatPrice } from '../../styles/theme.js'
import { useCart } from '../../context/CartContext.jsx'
import toast from 'react-hot-toast'

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={11}
          fill={n <= Math.round(rating) ? '#C88B00' : 'none'}
          stroke={n <= Math.round(rating) ? '#C88B00' : '#D4C4A8'}
        />
      ))}
    </span>
  )
}

/**
 * @param {object}  props
 * @param {object}  props.product   { id, name, basePrice, images, vendorName, vendorId, category, rating, reviewCount, stock }
 * @param {number}  [props.index=0] position in grid — determines accent color
 */
export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart()
  const accent = cardAccent(index)

  const {
    id, name, basePrice, salePrice, saleEndsAt, images = [], vendorName, vendorId,
    rating = 0, reviewCount = 0, stock = 0,
  } = product

  const img = images[0] || null

  // Determine active sale price
  const isSaleActive = salePrice && (!saleEndsAt || new Date(saleEndsAt) > new Date())
  const displayPrice = isSaleActive ? salePrice : basePrice
  const discountPct  = isSaleActive
    ? Math.round((1 - salePrice / basePrice) * 100)
    : 0

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (stock < 1) return
    addItem({
      productId:  id,
      variantId:  null,
      name,
      price:      displayPrice,
      image:      img,
      vendorId,
      vendorName,
      stock,
    })
    toast.success(`${name.slice(0, 28)}… added to cart`)
  }

  return (
    <Link to={`/products/${id}`} className="product-card group flex flex-col">
      {/* Accent top border */}
      <div className="h-1.5 w-full" style={{ background: accent }} />

      {/* Image */}
      <div className="relative overflow-hidden bg-stone-100" style={{ height: 180 }}>
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: `${accent}22` }}>
            🧶
          </div>
        )}
        {stock < 1 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(28,10,0,0.55)' }}>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#1C0A00', color: '#C88B00' }}>
              Out of Stock
            </span>
          </div>
        )}
        {isSaleActive && stock > 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#D85A30', color: '#FFFCF5' }}>
            -{discountPct}% SALE
          </div>
        )}
        {/* Wishlist btn */}
        <button
          onClick={e => { e.preventDefault(); toast('Wishlist coming soon!') }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: '#FFFCF5', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          aria-label="Save to wishlist"
        >
          <Heart size={14} style={{ color: '#D85A30' }} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Vendor badge */}
        <span className="badge self-start text-[10px]"
          style={{ background: `${accent}18`, color: accent }}>
          {vendorName}
        </span>

        <p className="font-semibold text-sm leading-snug line-clamp-2 flex-1" style={{ color: '#1C0A00' }}>
          {name}
        </p>

        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Stars rating={rating} />
            <span className="text-[11px]" style={{ color: '#7A6050' }}>({reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="font-bold text-base" style={{ color: isSaleActive ? '#D85A30' : '#C88B00' }}>
              {formatPrice(displayPrice)}
            </span>
            {isSaleActive && (
              <span className="text-xs line-through" style={{ color: '#A07000' }}>
                {formatPrice(basePrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={stock < 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: '#D85A30', color: '#FFFCF5' }}
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart size={12} /> Add
          </button>
        </div>
      </div>
    </Link>
  )
}
