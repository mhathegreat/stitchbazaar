/**
 * Vendor Refunds — /vendor/refunds
 * Shows refund requests filed on orders containing the vendor's products.
 * Vendors have read-only visibility; only admin can approve/reject.
 */

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import VendorLayout from './VendorLayout.jsx'
import { vendorsApi } from '../../api/vendors.js'
import { formatPrice } from '../../styles/theme.js'

const STATUS = {
  pending:  { label: 'Pending',  color: '#C88B00', bg: 'rgba(200,139,0,0.1)'  },
  approved: { label: 'Approved', color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'  },
  rejected: { label: 'Rejected', color: '#D85A30', bg: 'rgba(216,90,48,0.1)'  },
}

export default function VendorRefunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    vendorsApi.refunds()
      .then(d => setRefunds(d.data || []))
      .catch(() => setRefunds([]))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter
    ? refunds.filter(r => r.status === filter)
    : refunds

  return (
    <VendorLayout active="/vendor/refunds" title="Refunds">
      <div className="px-4 sm:px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
            Refund <span style={{ color: '#C88B00' }}>Requests</span>
          </h1>
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: filter === s ? '#C88B00' : 'rgba(200,139,0,0.1)',
                  color:      filter === s ? '#1C0A00' : '#A07000',
                }}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3 mb-5 flex items-center gap-2 text-xs"
          style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)', color: '#A07000' }}>
          <RotateCcw size={13} />
          Refund approvals are handled by the platform admin. You'll be notified of the outcome.
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'rgba(200,139,0,0.08)' }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#C88B00' }} />
            <p className="text-sm" style={{ color: '#7A6050' }}>
              {filter ? `No ${filter} refund requests` : 'No refund requests on your orders'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map(r => {
              const st = STATUS[r.status] || STATUS.pending
              const customerName = r.customer?.name || r.order?.guestName || 'Guest'
              const orderDate = r.order?.createdAt
                ? new Date(r.order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })
                : '—'

              return (
                <div key={r.id} className="rounded-xl p-5"
                  style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Status + date */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        <span className="text-xs" style={{ color: '#A07000' }}>
                          Requested {new Date(r.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        </span>
                      </div>

                      {/* Customer + order */}
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{customerName}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>
                        Order: <span className="font-mono">{r.orderId?.slice(-8).toUpperCase()}</span>
                        {' · '}Placed: {orderDate}
                        {' · '}Amount:{' '}
                        <span className="font-bold" style={{ color: '#C88B00' }}>
                          {formatPrice(r.amount)}
                        </span>
                      </p>

                      {/* Reason */}
                      <p className="text-sm mt-2 px-3 py-2 rounded-lg leading-relaxed"
                        style={{ background: 'rgba(200,139,0,0.06)', color: '#3A2010' }}>
                        {r.reason}
                      </p>

                      {/* Admin note (if any) */}
                      {r.adminNote && (
                        <p className="text-xs mt-2 italic" style={{ color: '#7A6050' }}>
                          Admin note: {r.adminNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}
