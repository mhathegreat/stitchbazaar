/**
 * Product Detail page
 * Image gallery, variant selector, add to cart, reviews, related products.
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Share2, Store, Shield, Truck, MessageCircle, ChevronLeft, ChevronRight, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'

import PageWrapper        from '../components/layout/PageWrapper.jsx'
import VariantSelector    from '../components/product/VariantSelector.jsx'
import ProductGrid        from '../components/product/ProductGrid.jsx'
import BrushstrokeHeading from '../components/mosaic/BrushstrokeHeading.jsx'
import ColorBlob          from '../components/mosaic/ColorBlob.jsx'
import { useCart }              from '../context/CartContext.jsx'
import { useAuth }              from '../context/AuthContext.jsx'
import { productsApi }          from '../api/products.js'
import { reviewsApi }           from '../api/reviews.js'
import { wishlistApi }          from '../api/wishlist.js'
import { chatApi }              from '../api/chat.js'
import api                      from '../api/client.js'
import { useRecentlyViewed }    from '../hooks/useRecentlyViewed.js'
import { cardAccent, formatPrice } from '../styles/theme.js'

// ── Sub-components ─────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          fill={n <= Math.round(rating) ? '#C88B00' : 'none'}
          stroke={n <= Math.round(rating) ? '#C88B00' : '#D4C4A8'}
        />
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}>
          <Star size={22}
            fill={(hovered || value) >= n ? '#C88B00' : 'none'}
            stroke={(hovered || value) >= n ? '#C88B00' : '#D4C4A8'}
          />
        </button>
      ))}
    </span>
  )
}

function RatingBar({ label, value, max = 5 }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 shrink-0" style={{ color: '#7A6050' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(200,139,0,0.12)' }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: '#C88B00' }} />
      </div>
      <span className="w-6 text-right font-medium" style={{ color: '#7A6050' }}>{value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }                    = useParams()
  const { addItem }               = useCart()
  const { user }                  = useAuth()
  const navigate                  = useNavigate()
  const { items: recentItems,
          addProduct: trackView } = useRecentlyViewed()
  const [msgLoading, setMsgLoading] = useState(false)

  const [product,         setProduct]         = useState(null)
  const [related,         setRelated]          = useState([])
  const [reviews,         setReviews]          = useState([])
  const [loading,         setLoading]          = useState(true)
  const [selectedVariant, setSelectedVariant]  = useState(null)
  const [qty,             setQty]              = useState(1)
  const [imgIdx,          setImgIdx]           = useState(0)
  const [activeTab,       setActiveTab]        = useState('description')
  const [wishlisted,      setWishlisted]       = useState(false)
  const [wishWorking,     setWishWorking]       = useState(false)
  const [zoomed,          setZoomed]           = useState(false)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setZoomed(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Review form
  const [reviewRating,  setReviewRating]  = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  // Q&A
  const [questions,    setQuestions]   = useState([])
  const [qLoaded,      setQLoaded]     = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [submittingQ,  setSubmittingQ] = useState(false)
  const [answeringId,  setAnsweringId] = useState(null)
  const [answerText,   setAnswerText]  = useState('')
  const [submittingA,  setSubmittingA] = useState(false)

  useEffect(() => {
    setLoading(true)
    setProduct(null)
    setRelated([])
    setReviews([])
    setSelectedVariant(null)
    setImgIdx(0)

    productsApi.get(id)
      .then(d => {
        if (!d.data) return
        const p = d.data
        setProduct(p)
        setReviews(p.reviews || [])
        trackView(p)
        // Fetch related products in same category
        if (p.category?.id) {
          productsApi.list({ categoryId: p.category.id, limit: 6 })
            .then(rd => {
              const others = (rd.data || []).filter(r => r.id !== p.id).slice(0, 5)
              setRelated(others)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Check wishlist status for logged-in users
    if (user) {
      wishlistApi.get()
        .then(d => {
          const items = d.data || []
          setWishlisted(items.some(w => (w.product?.id || w.productId) === id))
        })
        .catch(() => {})
    }
  }, [id, user])

  async function handleMessageSeller() {
    if (!user) { navigate('/login'); return }
    if (user.role === 'vendor') { toast.error('Vendors cannot message other vendors'); return }
    setMsgLoading(true)
    try {
      const d = await chatApi.start(product.vendor.id)
      navigate(`/messages/${d.data.id}`)
    } catch {
      toast.error('Could not start conversation')
    } finally {
      setMsgLoading(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Product">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="skeleton rounded-2xl" style={{ height: 420 }} />
            <div className="flex flex-col gap-4">
              <div className="skeleton h-6 w-32 rounded-full" />
              <div className="skeleton h-8 w-full rounded" />
              <div className="skeleton h-8 w-2/3 rounded" />
              <div className="skeleton h-12 w-40 rounded" />
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!product) return (
    <PageWrapper title="Not Found">
      <div className="flex flex-col items-center py-24 gap-4">
        <span className="text-6xl">🧵</span>
        <p className="font-serif text-xl font-bold" style={{ color: '#C88B00' }}>Product not found</p>
        <Link to="/products" className="btn-primary rounded-xl px-6 py-2.5">Browse Products</Link>
      </div>
    </PageWrapper>
  )

  const accent       = product.vendor?.colorTheme || cardAccent(0)
  const variant      = product.variants?.find(v => v.id === selectedVariant)
  const finalPrice   = variant ? product.basePrice + variant.priceModifier : product.basePrice
  const inStock      = variant ? variant.stock > 0 : product.stock > 0
  const stockCount   = variant ? variant.stock : product.stock
  const needsVariant = (product.variants?.length > 0) && !selectedVariant

  const avgRating    = product.avgRating
    ?? (reviews.length ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0)

  function handleAddToCart() {
    if (needsVariant) { toast.error('Please select a variant first'); return }
    if (!inStock) { toast.error('This item is out of stock'); return }
    addItem({
      productId:  product.id,
      variantId:  selectedVariant,
      name:       product.name + (variant ? ` (${variant.label.split(':').pop()?.trim()})` : ''),
      price:      finalPrice,
      image:      product.images?.[0] || null,
      vendorId:   product.vendor?.id,
      vendorName: product.vendor?.shopName,
      stock:      stockCount,
      quantity:   qty,
    })
    toast.success('Added to cart!')
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Link copied!')
  }

  function handleWhatsApp() {
    const text = `Check out ${product.name} on StitchBazaar!\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  async function loadQuestions() {
    if (qLoaded) return
    try {
      const r = await api.get(`/products/${id}/questions`)
      setQuestions(r.data?.data || [])
    } catch { setQuestions([]) }
    finally { setQLoaded(true) }
  }

  async function handleAskQuestion(e) {
    e.preventDefault()
    if (!questionText.trim()) return
    setSubmittingQ(true)
    try {
      const r = await api.post(`/products/${id}/questions`, { question: questionText.trim() })
      setQuestions(qs => [r.data.data, ...qs])
      setQuestionText('')
      toast.success('Question submitted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit question')
    } finally { setSubmittingQ(false) }
  }

  async function handleAnswerQuestion(qId) {
    if (!answerText.trim()) return
    setSubmittingA(true)
    try {
      const r = await api.patch(`/questions/${qId}/answer`, { answer: answerText.trim() })
      setQuestions(qs => qs.map(q => q.id === qId ? r.data.data : q))
      setAnsweringId(null)
      setAnswerText('')
      toast.success('Answer posted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not post answer')
    } finally { setSubmittingA(false) }
  }

  async function toggleWishlist() {
    if (!user) { toast.error('Sign in to save to wishlist'); return }
    setWishWorking(true)
    try {
      if (wishlisted) {
        await wishlistApi.remove(product.id)
        setWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await wishlistApi.add(product.id)
        setWishlisted(true)
        toast.success('Added to wishlist!')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update wishlist')
    } finally { setWishWorking(false) }
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!user) { toast.error('Please sign in to leave a review'); return }
    if (!reviewRating) { toast.error('Please pick a star rating'); return }
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return }
    setSubmitting(true)
    try {
      const d = await reviewsApi.submit({ productId: product.id, rating: reviewRating, comment: reviewComment.trim() })
      const newReview = d.data || { id: Date.now(), rating: reviewRating, comment: reviewComment, createdAt: new Date().toISOString(), user: { name: user?.name || 'You' } }
      setReviews(rs => [newReview, ...rs])
      setReviewRating(0)
      setReviewComment('')
      toast.success('Review submitted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit review')
    } finally { setSubmitting(false) }
  }

  return (
    <PageWrapper
      title={product.name}
      description={`${(product.description || '').slice(0, 140)} — Buy on StitchBazaar`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <ColorBlob color="#C88B00" className="top-0 right-0 w-96 h-96" opacity={0.05} />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: '#7A6050' }}>
          <Link to="/" className="hover:underline" style={{ color: '#C88B00' }}>Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:underline">Products</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="line-clamp-1">{product.name}</span>
        </nav>

        {/* ── Main product layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">

          {/* ── Image gallery ── */}
          <div className="flex flex-col gap-3">
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ height: 380, background: `${accent}15`, border: `3px solid #1C0A00`, cursor: product.images?.[imgIdx] ? 'zoom-in' : 'default' }}
              onClick={() => product.images?.[imgIdx] && setZoomed(true)}
            >
              {product.images?.[imgIdx] ? (
                <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-7xl">🧶</span>
                  <span className="text-sm font-medium" style={{ color: accent }}>{product.category?.name}</span>
                </div>
              )}
              <div className="absolute top-0 left-0 right-0 h-2" style={{ background: accent }} />

              {product.images?.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(28,10,0,0.6)', color: '#FFFCF5' }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % product.images.length)}
                    className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(28,10,0,0.6)', color: '#FFFCF5' }}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                    style={{ borderColor: imgIdx === i ? '#C88B00' : 'transparent' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="flex flex-col gap-4">
            {/* Category + tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Link to={`/products?category=${product.category.slug}`}
                  className="badge text-xs" style={{ background: `${accent}18`, color: accent }}>
                  {product.category.name}
                </Link>
              )}
              {(product.tags || []).map(t => (
                <span key={t} className="badge text-xs" style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                  {t}
                </span>
              ))}
            </div>

            <h1 className="font-serif font-bold text-2xl md:text-3xl leading-tight" style={{ color: '#1C0A00' }}>
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-2">
              <Stars rating={avgRating} />
              <span className="font-semibold text-sm" style={{ color: '#C88B00' }}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <span className="text-sm" style={{ color: '#7A6050' }}>({reviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-3xl" style={{ color: '#C88B00' }}>
                {formatPrice(finalPrice)}
              </span>
              {variant?.priceModifier > 0 && (
                <span className="text-sm line-through" style={{ color: '#A07000' }}>
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {/* Stock */}
            <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
              {inStock
                ? <span style={{ color: '#0F6E56' }}>✓ In stock ({stockCount} available)</span>
                : <span style={{ color: '#D85A30' }}>✗ Out of stock</span>
              }
              {inStock && stockCount <= 5 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(216,90,48,0.12)', color: '#D85A30' }}>
                  ⚠ Only {stockCount} left!
                </span>
              )}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selected={selectedVariant}
                onSelect={setSelectedVariant}
                basePrice={product.basePrice}
              />
            )}

            {/* Qty + Add to cart */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center border-2 rounded-xl overflow-hidden" style={{ borderColor: 'rgba(200,139,0,0.3)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-11 text-lg font-bold transition-colors hover:bg-amber-50" style={{ color: '#C88B00' }}>−</button>
                <span className="w-10 text-center font-semibold text-sm" style={{ color: '#1C0A00' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(stockCount, q + 1))}
                  className="w-10 h-11 text-lg font-bold transition-colors hover:bg-amber-50" style={{ color: '#C88B00' }}>+</button>
              </div>

              <button onClick={handleAddToCart} disabled={!inStock}
                className="flex-1 btn-primary rounded-xl py-3 font-bold disabled:opacity-50 gap-2">
                <ShoppingCart size={16} /> Add to Cart
              </button>

              <button onClick={toggleWishlist} disabled={wishWorking}
                className="w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-colors hover:bg-red-50"
                style={{ borderColor: wishlisted ? '#D85A30' : 'rgba(216,90,48,0.3)', background: wishlisted ? 'rgba(216,90,48,0.08)' : 'transparent' }}>
                <Heart size={18} fill={wishlisted ? '#D85A30' : 'none'} style={{ color: '#D85A30' }} />
              </button>

              <button onClick={handleShare} title="Copy link"
                className="w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-colors hover:bg-amber-50"
                style={{ borderColor: 'rgba(200,139,0,0.3)' }}>
                <Share2 size={18} style={{ color: '#C88B00' }} />
              </button>

              <button onClick={handleWhatsApp} title="Share on WhatsApp"
                className="w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-colors"
                style={{ borderColor: 'rgba(45,198,83,0.4)', background: 'rgba(45,198,83,0.07)' }}>
                {/* WhatsApp SVG icon */}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#2DC653">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.418A9.954 9.954 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.073-1.119l-.292-.173-3.026.863.872-3.016-.19-.31A7.954 7.954 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
                </svg>
              </button>
            </div>

            {needsVariant && (
              <p className="text-xs font-medium" style={{ color: '#D85A30' }}>⚠ Please select a variant above before adding to cart</p>
            )}

            {/* Vendor card */}
            {product.vendor && (
              <div className="flex flex-col gap-2 mt-1">
                <Link to={`/vendors/${product.vendor.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: accent, color: '#FFFCF5' }}>
                    {product.vendor.shopName?.[0] || 'V'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{product.vendor.shopName}</p>
                    <p className="text-xs" style={{ color: '#7A6050' }}>View shop →</p>
                  </div>
                  <Store size={16} style={{ color: '#C88B00' }} />
                </Link>
                <button onClick={handleMessageSeller} disabled={msgLoading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: '#1C0A00', color: '#FFFCF5', border: '2px solid rgba(200,139,0,0.3)' }}>
                  <MessageCircle size={15} />
                  {msgLoading ? 'Opening chat…' : 'Message Seller'}
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { icon: <Truck size={14} />,         text: 'Nationwide Delivery', color: '#0F6E56' },
                { icon: <Shield size={14} />,         text: 'Verified Vendor',     color: '#457B9D' },
                { icon: <MessageCircle size={14} />,  text: 'WhatsApp Support',    color: '#2DC653' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
                  style={{ background: `${b.color}10`, border: `1px solid ${b.color}25` }}>
                  <span style={{ color: b.color }}>{b.icon}</span>
                  <span className="text-[10px] font-medium leading-tight" style={{ color: '#5A4030' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs: Description / Reviews ── */}
        <div className="mb-12">
          <div className="flex gap-1 mb-6 border-b-2" style={{ borderColor: 'rgba(200,139,0,0.15)' }}>
            {['description', 'reviews', 'questions'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'questions') loadQuestions() }}
                className="px-5 py-2.5 text-sm font-semibold capitalize transition-all -mb-0.5"
                style={activeTab === tab
                  ? { color: '#C88B00', borderBottom: '3px solid #C88B00' }
                  : { color: '#7A6050' }
                }>
                {tab === 'reviews' ? `reviews (${reviews.length})` : tab === 'questions' ? `Q&A (${questions.length})` : tab}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-2xl">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#3A2010' }}>
                {product.description}
              </p>
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map(t => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="max-w-3xl flex flex-col gap-6">
              {/* Ask a question */}
              {user ? (
                <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
                  <h3 className="font-serif font-bold text-base mb-3" style={{ color: '#1C0A00' }}>
                    Ask a <span style={{ color: '#C88B00' }}>Question</span>
                  </h3>
                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <input
                      value={questionText}
                      onChange={e => setQuestionText(e.target.value)}
                      placeholder="What would you like to know about this product?"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }}
                    />
                    <button type="submit" disabled={submittingQ || !questionText.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>
                      <Send size={14} /> {submittingQ ? 'Posting…' : 'Ask'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                  <p className="text-sm" style={{ color: '#7A6050' }}>
                    <Link to="/login" className="font-semibold hover:underline" style={{ color: '#C88B00' }}>Sign in</Link>
                    {' '}to ask a question
                  </p>
                </div>
              )}

              {/* Questions list */}
              {!qLoaded ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-10">
                  <MessageCircle size={36} className="mx-auto mb-2 opacity-20" style={{ color: '#C88B00' }} />
                  <p className="text-sm" style={{ color: '#7A6050' }}>No questions yet — be the first to ask!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {questions.map(q => {
                    const isVendor = user?.id === product.vendor?.userId
                    return (
                      <div key={q.id} className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.12)' }}>
                        {/* Question */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                            style={{ background: 'rgba(200,139,0,0.15)', color: '#C88B00' }}>Q</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: '#1C0A00' }}>{q.question}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#A07000' }}>
                              {q.customer?.name} · {new Date(q.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                            </p>
                          </div>
                        </div>

                        {/* Answer */}
                        {q.answer ? (
                          <div className="flex items-start gap-2 ml-8 mt-2 p-3 rounded-lg"
                            style={{ background: 'rgba(15,110,86,0.07)', border: '1px solid rgba(15,110,86,0.15)' }}>
                            <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                              style={{ background: '#0F6E56', color: '#FFFCF5' }}>A</span>
                            <div>
                              <p className="text-sm" style={{ color: '#1C0A00' }}>{q.answer}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#5A8070' }}>
                                {q.answeredBy?.name} (Vendor) · {new Date(q.answeredAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                              </p>
                            </div>
                          </div>
                        ) : isVendor ? (
                          answeringId === q.id ? (
                            <div className="ml-8 mt-2 flex gap-2">
                              <input
                                value={answerText}
                                onChange={e => setAnswerText(e.target.value)}
                                placeholder="Write your answer…"
                                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: '#FFFCF5', border: '1.5px solid rgba(15,110,86,0.3)', color: '#1C0A00' }}
                              />
                              <button onClick={() => handleAnswerQuestion(q.id)} disabled={submittingA || !answerText.trim()}
                                className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                                style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                                {submittingA ? '…' : 'Post'}
                              </button>
                              <button onClick={() => { setAnsweringId(null); setAnswerText('') }}
                                className="px-3 py-2 rounded-lg text-xs" style={{ color: '#7A6050' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setAnsweringId(q.id)}
                              className="ml-8 mt-1 text-xs font-semibold hover:underline"
                              style={{ color: '#0F6E56' }}>
                              + Answer this question
                            </button>
                          )
                        ) : (
                          <p className="ml-8 mt-1 text-xs italic" style={{ color: '#A07000' }}>Awaiting vendor response</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Rating summary */}
                <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                  <div className="text-center">
                    <span className="font-serif font-bold text-5xl" style={{ color: '#C88B00' }}>
                      {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                    </span>
                    <div className="flex justify-center mt-1"><Stars rating={avgRating} size={16} /></div>
                    <p className="text-xs mt-1" style={{ color: '#7A6050' }}>{reviews.length} total reviews</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[5,4,3,2,1].map(n => (
                      <RatingBar key={n} label={`${n}★`}
                        value={reviews.filter(r => r.rating === n).length}
                        max={Math.max(reviews.length, 1)} />
                    ))}
                  </div>
                </div>

                {/* Review list */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: '#7A6050' }}>No reviews yet — be the first!</p>
                  ) : reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-xl" style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.12)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: '#C88B00', color: '#1C0A00' }}>
                            {(r.user?.name || 'A')[0]}
                          </div>
                          <span className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{r.user?.name || 'Anonymous'}</span>
                        </div>
                        <Stars rating={r.rating} size={12} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#3A2010' }}>{r.comment}</p>
                      <p className="text-xs mt-2" style={{ color: '#A07000' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write a review */}
              {user ? (
                <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
                  <h3 className="font-serif font-bold text-base mb-4" style={{ color: '#1C0A00' }}>
                    Write a <span style={{ color: '#C88B00' }}>Review</span>
                  </h3>
                  <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#7A6050' }}>Your rating</p>
                      <StarPicker value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#7A6050' }}>Your review</p>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={3}
                        placeholder="Share your experience with this product…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }}
                      />
                    </div>
                    <button type="submit" disabled={submitting}
                      className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>
                      <Send size={14} />
                      {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                  <p className="text-sm" style={{ color: '#7A6050' }}>
                    <Link to="/login" className="font-semibold hover:underline" style={{ color: '#C88B00' }}>Sign in</Link>
                    {' '}to leave a review
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div>
            <BrushstrokeHeading align="left" className="mb-6">
              <span style={{ color: '#D85A30' }}>Related</span>{' '}
              <span style={{ color: '#1C0A00' }}>Products</span>
            </BrushstrokeHeading>
            <ProductGrid products={related} />
          </div>
        )}

        {/* ── Recently viewed ── */}
        {recentItems.filter(p => p.id !== id).length > 0 && (
          <div className="mt-10">
            <BrushstrokeHeading align="left" className="mb-6">
              <span style={{ color: '#7A6050' }}>Recently</span>{' '}
              <span style={{ color: '#1C0A00' }}>Viewed</span>
            </BrushstrokeHeading>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentItems.filter(p => p.id !== id).map(p => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="shrink-0 w-40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ border: '1.5px solid rgba(200,139,0,0.15)' }}>
                  <div className="w-full h-28 flex items-center justify-center text-3xl"
                    style={{ background: 'rgba(200,139,0,0.08)' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : '🧶'}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1C0A00' }}>{p.name}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: '#C88B00' }}>{formatPrice(p.basePrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Image zoom modal ── */}
      {zoomed && product.images?.[imgIdx] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setZoomed(false)}
        >
          <img
            src={product.images[imgIdx]}
            alt={product.name}
            className="max-w-full max-h-full rounded-2xl select-none"
            style={{ boxShadow: '0 0 60px rgba(200,139,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          />
          {/* Nav inside zoom */}
          {product.images.length > 1 && (
            <>
              <button
                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,252,245,0.15)', color: '#FFFCF5' }}
                onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + product.images.length) % product.images.length) }}>
                <ChevronLeft size={22} />
              </button>
              <button
                className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,252,245,0.15)', color: '#FFFCF5' }}
                onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % product.images.length) }}>
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,252,245,0.2)', color: '#FFFCF5' }}
            onClick={() => setZoomed(false)}>
            <X size={18} />
          </button>
          <p className="absolute bottom-5 text-xs" style={{ color: 'rgba(255,252,245,0.5)' }}>
            Click outside or press Esc to close
          </p>
        </div>
      )}
    </PageWrapper>
  )
}
