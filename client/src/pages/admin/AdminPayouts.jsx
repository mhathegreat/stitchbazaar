/**
 * Admin — Payouts management — /admin/payouts
 */

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, DollarSign } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending:    { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  label: 'Pending'    },
  processing: { color: '#457B9D', bg: 'rgba(69,123,157,0.1)', label: 'Processing' },
  paid:       { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Paid'       },
  rejected:   { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  label: 'Rejected'   },
}

const MOCK_PAYOUTS = [
  { id: 'pay_1', vendor: { shopName: 'CraftHub Lahore', bankAccountName: 'Ali Hassan', bankAccountNumber: '0123456789', bankName: 'HBL'         }, amount: 2700000, status: 'pending',    requestedAt: '2026-03-25' },
  { id: 'pay_2', vendor: { shopName: 'Yarn Paradise',   bankAccountName: 'Sara Ahmed', bankAccountNumber: '9876543210', bankName: 'Meezan Bank' }, amount: 1800000, status: 'pending',    requestedAt: '2026-03-24' },
  { id: 'pay_3', vendor: { shopName: 'Stitch Studio',   bankAccountName: 'Fatima M.',  bankAccountNumber: '1111222233', bankName: 'MCB Bank'    }, amount: 3200000, status: 'paid',       requestedAt: '2026-03-01' },
  { id: 'pay_4', vendor: { shopName: 'CraftHub Lahore', bankAccountName: 'Ali Hassan', bankAccountNumber: '0123456789', bankName: 'HBL'         }, amount: 1500000, status: 'rejected',   requestedAt: '2026-02-15' },
]

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState(MOCK_PAYOUTS)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    adminApi.payouts(params)
      .then(d => setPayouts(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = payouts
  const pendingTotal = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  async function process(id, status) {
    try {
      await adminApi.processPayout(id, { status })
      setPayouts(ps => ps.map(p => p.id === id ? { ...p, status } : p))
      toast[status === 'paid' ? 'success' : 'error'](`Payout marked as ${status}`)
    } catch { toast.error('Action failed') }
  }

  return (
    <AdminLayout active="/admin/payouts" title="Payouts">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          Payout <span style={{ color: '#C88B00' }}>Management</span>
        </h1>
        <div className="rounded-xl px-4 py-2 text-center" style={{ background: 'rgba(200,139,0,0.1)', border: '1px solid rgba(200,139,0,0.2)' }}>
          <p className="text-[10px]" style={{ color: '#7A6050' }}>Pending Total</p>
          <p className="font-bold text-lg font-serif" style={{ color: '#C88B00' }}>{formatPrice(pendingTotal)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'pending', 'paid', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={filter === f
              ? { background: '#C88B00', color: '#1C0A00' }
              : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
            {f}
            {f === 'pending' && payouts.filter(p => p.status === 'pending').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: '#D85A30', color: '#FFFCF5' }}>
                {payouts.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#C88B00' }} />
            <p className="text-sm" style={{ color: '#7A6050' }}>No payouts found</p>
          </div>
        ) : filtered.map(p => {
          const sc = STATUS_COLORS[p.status]
          return (
            <div key={p.id} className="rounded-xl overflow-hidden"
              style={{ border: '2px solid rgba(200,139,0,0.15)', background: '#FFF8E7' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: sc.color + '15', borderBottom: `1px solid ${sc.color}20` }}>
                <span className="font-mono text-xs font-bold" style={{ color: '#1C0A00' }}>
                  {p.id.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: sc.bg, color: sc.color }}>
                  {sc.label}
                </span>
              </div>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{p.vendor.shopName}</p>
                  <p className="text-xs" style={{ color: '#7A6050' }}>
                    {p.vendor.bankAccountName} · {p.vendor.bankName} · {p.vendor.bankAccountNumber}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#7A6050' }}>Requested: {p.requestedAt?.slice(0,10)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-bold text-xl" style={{ color: '#C88B00' }}>{formatPrice(p.amount)}</p>
                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => process(p.id, 'paid')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                        <CheckCircle size={12} /> Mark Paid
                      </button>
                      <button onClick={() => process(p.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', border: '1px solid rgba(216,90,48,0.3)' }}>
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
