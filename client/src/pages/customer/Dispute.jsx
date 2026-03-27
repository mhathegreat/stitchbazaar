/**
 * Customer Dispute Form — /customer/orders/:id/dispute
 */

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Send } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { ordersApi } from '../../api/orders.js'
import toast from 'react-hot-toast'

const REASONS = [
  'Item not received',
  'Item received damaged',
  'Item does not match description',
  'Wrong item received',
  'Poor quality / not as described',
  'Seller not responding',
  'Other',
]

export default function Dispute() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reason, setReason]       = useState('')
  const [details, setDetails]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const orderId = id

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) { toast.error('Please select a reason'); return }
    if (details.trim().length < 20) { toast.error('Please provide more details (at least 20 characters)'); return }

    setSubmitting(true)
    try {
      await ordersApi.dispute(orderId, `${reason}: ${details.trim()}`)
      toast.success('Dispute submitted. Our team will review it within 24 hours.')
      navigate('/customer/orders')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper title="Report an Issue">
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">

          <Link to={`/customer/orders/${orderId}`} className="flex items-center gap-2 text-sm mb-5 hover:underline"
            style={{ color: '#C88B00' }}>
            <ArrowLeft size={15} /> Back to Order
          </Link>

          {/* Warning banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{ background: 'rgba(216,90,48,0.08)', border: '1px solid rgba(216,90,48,0.3)' }}>
            <AlertTriangle size={18} style={{ color: '#D85A30', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#D85A30' }}>Submit a Dispute</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>
                For order <strong style={{ color: '#1C0A00' }}>#{orderId?.slice(-8).toUpperCase()}</strong>.
                Our support team will review your case within 24 hours and contact you via email.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl p-5 flex flex-col gap-5"
            style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#7A6050' }}>
                Reason <span style={{ color: '#D85A30' }}>*</span>
              </label>
              <div className="flex flex-col gap-2">
                {REASONS.map(r => (
                  <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="reason" value={r} checked={reason === r}
                      onChange={() => setReason(r)} className="accent-amber-500 shrink-0" />
                    <span className="text-sm transition-colors"
                      style={{ color: reason === r ? '#C88B00' : '#5A4030', fontWeight: reason === r ? 600 : 400 }}>
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A6050' }}>
                Describe the issue <span style={{ color: '#D85A30' }}>*</span>
              </label>
              <textarea value={details} rows={5}
                onChange={e => setDetails(e.target.value)}
                placeholder="Please describe what happened in detail. Include dates, photos if possible, and what resolution you're looking for."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }} />
              <p className="text-[10px] mt-1" style={{ color: details.length < 20 ? '#D85A30' : '#7A6050' }}>
                {details.length}/500 characters (min 20)
              </p>
            </div>

            {/* Notice */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.15)' }}>
              <p className="text-[11px]" style={{ color: '#A07000' }}>
                📸 <strong>Tip:</strong> If you have photos or screenshots, email them to{' '}
                <span className="font-mono">support@stitchbazaar.pk</span> quoting your order ID.
              </p>
            </div>

            <div className="flex gap-3">
              <Link to={`/customer/orders/${orderId}`}
                className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00' }}>
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: '#D85A30', color: '#FFFCF5' }}>
                <Send size={14} />
                {submitting ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
