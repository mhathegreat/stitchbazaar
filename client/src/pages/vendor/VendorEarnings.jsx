/**
 * Vendor Earnings — /vendor/earnings
 */

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react'
import VendorLayout from './VendorLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { vendorsApi } from '../../api/vendors.js'
import toast from 'react-hot-toast'

const PAYOUT_COLORS = {
  pending:    { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  label: 'Pending',    icon: <Clock size={12} />       },
  processing: { color: '#457B9D', bg: 'rgba(69,123,157,0.1)', label: 'Processing', icon: <Clock size={12} />       },
  paid:       { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Paid',       icon: <CheckCircle size={12} /> },
  rejected:   { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  label: 'Rejected',   icon: <TrendingDown size={12} />},
}

export default function VendorEarnings() {
  const [requesting, setRequesting] = useState(false)
  const [monthly,    setMonthly]    = useState([])
  const [payouts,    setPayouts]    = useState([])
  const [commissionRate, setCommissionRate] = useState(10)

  useEffect(() => {
    vendorsApi.earnings()
      .then(d => {
        if (!d.data) return
        const { items, payouts: ps, commissionRate: cr } = d.data
        if (cr) setCommissionRate(cr)
        if (ps?.length) setPayouts(ps)
        // Aggregate items by month
        const map = {}
        for (const item of (items || [])) {
          const key = item.order?.createdAt?.slice(0, 7) || item.createdAt?.slice(0, 7)
          if (!key) continue
          if (!map[key]) map[key] = { month: key, gross: 0, orders: 0 }
          map[key].gross  += item.unitPrice * item.quantity
          map[key].orders += 1
        }
        const agg = Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
        if (agg.length) setMonthly(agg.map(m => ({
          ...m,
          month: new Date(m.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }),
        })))
      })
      .catch(() => {})
  }, [])

  const totalGross   = monthly.reduce((s, m) => s + m.gross, 0)
  const totalNet     = Math.round(totalGross * (1 - commissionRate / 100))
  const totalPaidOut = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const available    = totalNet - totalPaidOut

  const maxGross = Math.max(...monthly.map(m => m.gross), 1)

  async function handlePayoutRequest() {
    if (available <= 0) { toast.error('No available balance'); return }
    setRequesting(true)
    try {
      const d = await vendorsApi.requestPayout()
      setPayouts(ps => [d.data, ...ps])
      toast.success('Payout request submitted!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed')
    } finally { setRequesting(false) }
  }

  return (
    <VendorLayout active="/vendor/earnings" title="Earnings">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-serif font-bold text-2xl mb-6" style={{ color: '#1C0A00' }}>
            Earnings & <span style={{ color: '#C88B00' }}>Payouts</span>
          </h1>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Gross Revenue',    value: totalGross,   color: '#C88B00', icon: <TrendingUp size={18} />,  note: 'all time' },
              { label: `Net (after ${commissionRate}% fee)`, value: totalNet, color: '#0F6E56', icon: <DollarSign size={18} />, note: 'all time' },
              { label: 'Total Paid Out',   value: totalPaidOut, color: '#457B9D', icon: <CheckCircle size={18} />, note: 'all time' },
              { label: 'Available Balance',value: available,    color: available > 0 ? '#2DC653' : '#7A6050', icon: <DollarSign size={18} />, note: 'ready to withdraw' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <p className="font-bold text-lg font-serif" style={{ color: s.color }}>{formatPrice(s.value)}</p>
                <p className="text-xs font-semibold" style={{ color: '#1C0A00' }}>{s.label}</p>
                <p className="text-[10px]" style={{ color: '#7A6050' }}>{s.note}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Bar chart */}
            <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <h2 className="font-serif font-bold text-base mb-4" style={{ color: '#1C0A00' }}>
                Monthly <span style={{ color: '#C88B00' }}>Revenue</span>
              </h2>
              <div className="flex items-end gap-2 h-36">
                {monthly.map((m, i) => {
                  const pct = (m.gross / maxGross) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold" style={{ color: '#C88B00' }}>
                        {formatPrice(m.gross)}
                      </span>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{
                          height:     `${pct}%`,
                          minHeight:  4,
                          background: i === monthly.length - 1
                            ? 'linear-gradient(to top, #C88B00, #F0B830)'
                            : 'rgba(200,139,0,0.3)',
                        }} />
                      <span className="text-[9px]" style={{ color: '#7A6050' }}>
                        {m.month.slice(0, 3)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: '#7A6050' }}>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(200,139,0,0.3)' }} />
                  Previous months
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded" style={{ background: '#C88B00' }} />
                  Current month
                </span>
              </div>
            </div>

            {/* Payout request */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <h2 className="font-serif font-bold text-base mb-3" style={{ color: '#1C0A00' }}>
                  Request <span style={{ color: '#C88B00' }}>Payout</span>
                </h2>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span style={{ color: '#7A6050' }}>Net earnings</span>
                    <span className="font-semibold" style={{ color: '#1C0A00' }}>{formatPrice(totalNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#7A6050' }}>Already paid</span>
                    <span className="font-semibold" style={{ color: '#457B9D' }}>{formatPrice(totalPaidOut)}</span>
                  </div>
                  <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(200,139,0,0.15)' }}>
                    <span className="font-bold" style={{ color: '#1C0A00' }}>Available</span>
                    <span className="font-bold text-base" style={{ color: available > 0 ? '#0F6E56' : '#7A6050' }}>
                      {formatPrice(available)}
                    </span>
                  </div>
                </div>
                <button onClick={handlePayoutRequest} disabled={available <= 0 || requesting}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                  {requesting ? 'Submitting…' : 'Request Payout'}
                </button>
                <p className="text-[10px] mt-2 text-center" style={{ color: '#7A6050' }}>
                  Processed within 2-3 business days via bank transfer
                </p>
              </div>

              {/* Commission info */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#A07000' }}>Platform Commission</p>
                <p className="text-2xl font-serif font-bold" style={{ color: '#C88B00' }}>{commissionRate}%</p>
                <p className="text-[11px] mt-1" style={{ color: '#7A6050' }}>
                  StitchBazaar deducts 10% from each sale to cover platform fees, payment processing, and customer support.
                </p>
              </div>
            </div>
          </div>

          {/* Payout history */}
          <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="px-4 py-3" style={{ background: '#C88B00' }}>
              <h2 className="font-serif font-bold text-sm" style={{ color: '#1C0A00' }}>Payout History</h2>
            </div>
            <div style={{ background: '#FFF8E7' }}>
              {payouts.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: '#7A6050' }}>No payout history yet</p>
              ) : payouts.map((p, i) => {
                const sc = PAYOUT_COLORS[p.status]
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{formatPrice(p.amount)}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>
                        Requested: {p.requestedAt}
                        {p.processedAt && ` · Processed: ${p.processedAt}`}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
      </div>
    </VendorLayout>
  )
}
