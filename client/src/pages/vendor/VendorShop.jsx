/**
 * Vendor Storefront page — /vendors/:id
 * Mosaic banner, about section, product grid, seller reviews.
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Package, Star, MessageCircle, Loader2, Send } from 'lucide-react'

import PageWrapper    from '../../components/layout/PageWrapper.jsx'
import ProductGrid    from '../../components/product/ProductGrid.jsx'
import BeadDots       from '../../components/mosaic/BeadDots.jsx'
import ColorBlob      from '../../components/mosaic/ColorBlob.jsx'
import DiamondMotif   from '../../components/mosaic/DiamondMotif.jsx'
import BrushstrokeHeading from '../../components/mosaic/BrushstrokeHeading.jsx'
import { vendorsApi } from '../../api/vendors.js'
import { chatApi }    from '../../api/chat.js'
import { useAuth }    from '../../context/AuthContext.jsx'
import api            from '../../api/client.js'
import toast from 'react-hot-toast'

function Stars({ rating, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          fill={n <= Math.round(rating) ? '#C88B00' : 'none'}
          stroke={n <= Math.round(rating) ? '#C88B00' : '#D4C4A8'} />
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className="inline-flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}>
          <Star size={24}
            fill={(hovered || value) >= n ? '#C88B00' : 'none'}
            stroke={(hovered || value) >= n ? '#C88B00' : '#D4C4A8'} />
        </button>
      ))}
    </span>
  )
}

export default function VendorShop() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const [vendor,         setVendor]         = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(false)
  const [startingChat,   setStartingChat]   = useState(false)

  // Reviews
  const [reviews,        setReviews]        = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating,   setReviewRating]   = useState(0)
  const [reviewComment,  setReviewComment]  = useState('')
  const [eligibleOrders, setEligibleOrders] = useState([]) // delivered orders from this vendor
  const [reviewOrderId,  setReviewOrderId]  = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  async function startChat() {
    if (!vendor) return
    setStartingChat(true)
    try {
      const d = await chatApi.start(vendor.id)
      navigate(`/messages/${d.data.id}`)
    } catch {
      toast.error('Could not start chat')
    } finally {
      setStartingChat(false)
    }
  }

  async function loadReviews() {
    setReviewsLoading(true)
    try {
      const r = await api.get(`/vendors/${id}/reviews`)
      setReviews(r.data?.data || [])
    } catch { /* ignore */ }
    finally { setReviewsLoading(false) }
  }

  async function loadEligibleOrders() {
    if (!user || user.role !== 'customer') return
    try {
      const r = await api.get('/orders', { params: { status: 'delivered', limit: 50 } })
      const eligible = (r.data?.data || []).filter(o =>
        o.items?.some(item => item.vendor?.id === id)
      )
      setEligibleOrders(eligible)
      if (eligible.length) setReviewOrderId(eligible[0].id)
    } catch { /* ignore */ }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!reviewRating) { toast.error('Please pick a star rating'); return }
    if (!reviewOrderId) { toast.error('No eligible order found'); return }
    setSubmittingReview(true)
    try {
      const r = await api.post(`/vendors/${id}/reviews`, {
        orderId: reviewOrderId,
        rating:  reviewRating,
        comment: reviewComment.trim() || undefined,
      })
      const newReview = r.data?.data
      setReviews(prev => [newReview, ...prev.filter(rv => rv.id !== newReview.id)])
      setShowReviewForm(false)
      setReviewRating(0)
      setReviewComment('')
      toast.success('Review submitted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(false)
    vendorsApi.get(id)
      .then(d => setVendor(d.data))
      .catch(() => { toast.error('Could not load vendor shop'); setError(true) })
      .finally(() => setLoading(false))
    loadReviews()
    loadEligibleOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) return (
    <PageWrapper title="Vendor Not Found">
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold mb-3" style={{ color: '#C88B00' }}>Vendor not found</p>
        <p className="text-sm" style={{ color: '#7A6050' }}>This shop may no longer be available.</p>
      </div>
    </PageWrapper>
  )

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

  const accent       = vendor.colorTheme
  const reviewCount  = vendor._count?.vendorReviews ?? 0
  const avgRating    = vendor.avgRating

  return (
    <PageWrapper title={vendor.shopName} description={`${vendor.shopDescription?.slice(0, 140) ?? ''} — Shop on StitchBazaar`}>

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
                <Package size={13} /> {vendor._count?.products ?? 0} products
              </span>
              {avgRating > 0 && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,252,245,0.8)' }}>
                  <Star size={13} fill="rgba(255,252,245,0.8)" stroke="none" /> {avgRating} ({reviewCount} reviews)
                </span>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="ml-auto hidden sm:flex items-center gap-2 flex-wrap">
            {vendor.whatsapp && (
              <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g,'').replace(/^0/,'92')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: '#1C0A00', color: '#C88B00' }}>
                <MessageCircle size={15} style={{ color: '#2DC653' }} /> WhatsApp
              </a>
            )}
            {user?.role === 'customer' && (
              <button onClick={startChat} disabled={startingChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: '#1C0A00', color: '#C88B00', border: '1px solid rgba(200,139,0,0.3)' }}>
                {startingChat ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                Message Shop
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Products', value: vendor._count?.products ?? 0,    color: accent },
            { label: 'Sales',    value: vendor._count?.orderItems ?? 0,  color: '#D85A30' },
            { label: 'Joined',   value: new Date(vendor.createdAt || Date.now()).getFullYear(), color: '#0F6E56' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center mosaic-block" style={{ background: '#FFF8E7' }}>
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
          vendorId:    vendor.id,
          vendorName:  vendor.shopName,
          rating:      p.rating      || 0,
          reviewCount: p.reviewCount || 0,
        }))} />

        {/* ── Seller Reviews ── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <BrushstrokeHeading align="left">
              <span style={{ color: '#1C0A00' }}>Seller </span>
              <span style={{ color: accent }}>Reviews</span>
              {reviewCount > 0 && (
                <span className="ml-2 text-sm font-normal" style={{ color: '#7A6050' }}>
                  ({reviewCount})
                </span>
              )}
            </BrushstrokeHeading>

            {avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={avgRating} size={16} />
                <span className="font-bold text-lg" style={{ color: '#C88B00' }}>{avgRating}</span>
                <span className="text-sm" style={{ color: '#7A6050' }}>/ 5</span>
              </div>
            )}
          </div>

          {/* Write a review */}
          {user?.role === 'customer' && eligibleOrders.length > 0 && (
            <div className="mb-6 rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: accent, color: '#FFFCF5' }}>
                  <Star size={14} /> Write a Review
                </button>
              ) : (
                <form onSubmit={submitReview} className="flex flex-col gap-4">
                  <h3 className="font-serif font-bold text-base" style={{ color: '#1C0A00' }}>Your Review</h3>

                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#1C0A00' }}>Rating</p>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>

                  {eligibleOrders.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#1C0A00' }}>Order</label>
                      <select value={reviewOrderId} onChange={e => setReviewOrderId(e.target.value)}
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}>
                        {eligibleOrders.map(o => (
                          <option key={o.id} value={o.id}>Order #{o.id.slice(-8).toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this seller (optional)…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                  />

                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingReview || !reviewRating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>
                      <Send size={13} /> {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2.5 rounded-xl text-sm" style={{ color: '#7A6050' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10">
              <Star size={36} className="mx-auto mb-2 opacity-20" style={{ color: '#C88B00' }} />
              <p className="text-sm" style={{ color: '#7A6050' }}>No reviews yet for this seller.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map(r => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.12)' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{r.customer?.name}</span>
                      <span className="text-xs ml-2" style={{ color: '#A07000' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <Stars rating={r.rating} size={13} />
                  </div>
                  {r.comment && <p className="text-sm mt-1" style={{ color: '#3A2010' }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
