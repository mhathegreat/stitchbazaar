/**
 * Order Confirmation page
 * Shows order summary, WhatsApp deep link, and next steps.
 */

import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle, MessageCircle, Package, ArrowRight } from 'lucide-react'
import { buildOrderWhatsAppLink } from '../utils/whatsapp.js'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import BeadDots from '../components/mosaic/BeadDots.jsx'
import ColorBlob from '../components/mosaic/ColorBlob.jsx'

export default function OrderConfirmation() {
  const { id }   = useParams()
  const location = useLocation()
  const { order, customerName, customerPhone } = location.state || {}

  const shortId = id?.slice(-8).toUpperCase() || id

  // Build demo WhatsApp link if no real order
  const waLink = buildOrderWhatsAppLink({
    phone:   customerPhone || '03001234567',
    orderId: id || 'demo123',
    items:   order?.items  || [{ name: 'Your crafty items', quantity: 1, unitPrice: 0 }],
    total:   order?.totalAmount || 0,
  })

  return (
    <PageWrapper title="Order Confirmed!" description="Your StitchBazaar order has been placed successfully">
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{ background: '#FFFCF5' }}>
        <ColorBlob color="#0F6E56" className="top-0 right-0 w-80 h-80" opacity={0.07} />
        <ColorBlob color="#C88B00" className="bottom-0 left-0 w-64 h-64" opacity={0.06} />

        <div className="w-full max-w-lg text-center relative z-10">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(15,110,86,0.1)' }}>
            <CheckCircle size={42} style={{ color: '#0F6E56' }} />
          </div>

          <BeadDots count={7} className="justify-center mb-4" />

          <h1 className="font-serif font-bold text-3xl mb-2" style={{ color: '#1C0A00' }}>
            Order <span style={{ color: '#0F6E56' }}>Confirmed!</span>
          </h1>
          <p className="text-sm mb-2" style={{ color: '#5A4030' }}>
            Thank you{customerName ? `, ${customerName.split(' ')[0]}` : ''}! Your order has been placed successfully.
          </p>

          {/* Order ID */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6"
            style={{ background: '#FFF0C0', border: '2px solid rgba(200,139,0,0.3)' }}>
            <Package size={14} style={{ color: '#A07000' }} />
            <span className="font-mono font-bold text-sm" style={{ color: '#1C0A00' }}>
              Order #{shortId}
            </span>
          </div>

          {/* Info card */}
          <div className="rounded-2xl p-6 mb-6 text-left"
            style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
            <h2 className="font-serif font-bold text-sm mb-3" style={{ color: '#A07000' }}>What happens next?</h2>
            <div className="flex flex-col gap-3">
              {[
                { step: '1', text: 'The vendor confirms your order and prepares it for dispatch.',         color: '#C88B00' },
                { step: '2', text: 'Your order is shipped via TCS, Leopard or similar courier.',           color: '#D85A30' },
                { step: '3', text: 'Pay Cash on Delivery when your package arrives at your doorstep.',    color: '#0F6E56' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: s.color, color: '#FFFCF5' }}>{s.step}</span>
                  <p className="text-sm" style={{ color: '#3A2010' }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm mb-3 transition-all hover:-translate-y-0.5"
            style={{ background: '#25D366', color: '#FFFCF5' }}>
            <MessageCircle size={18} />
            Send Order Details via WhatsApp
          </a>

          <div className="flex gap-3">
            <Link to="/customer/orders" className="flex-1 btn-secondary rounded-xl py-2.5 text-sm gap-1.5 justify-center">
              <Package size={14} /> My Orders
            </Link>
            <Link to="/products" className="flex-1 btn-primary rounded-xl py-2.5 text-sm gap-1.5 justify-center">
              Keep Shopping <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
