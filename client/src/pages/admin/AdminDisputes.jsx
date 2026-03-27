/**
 * Admin — Disputes management — /admin/disputes
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Eye } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  open:          { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  label: 'Open'          },
  investigating: { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  label: 'Investigating' },
  resolved:      { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Resolved'      },
  closed:        { color: '#7A6050', bg: 'rgba(122,96,80,0.1)',  label: 'Closed'        },
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    adminApi.disputes(params)
      .then(d => setDisputes(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = disputes

  async function updateStatus(id, status, resolution = '') {
    try {
      await adminApi.resolveDispute(id, { status, resolution })
      setDisputes(ds => ds.map(d => d.id === id ? { ...d, status } : d))
      toast.success(`Dispute marked as ${status}`)
    } catch { toast.error('Action failed') }
  }

  return (
    <AdminLayout active="/admin/disputes" title="Disputes">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          <span style={{ color: '#D85A30' }}>Dispute</span> Management
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Open',          value: disputes.filter(d => d.status === 'open').length,          color: '#D85A30' },
          { label: 'Investigating', value: disputes.filter(d => d.status === 'investigating').length, color: '#C88B00' },
          { label: 'Resolved',      value: disputes.filter(d => d.status === 'resolved').length,      color: '#0F6E56' },
          { label: 'Closed',        value: disputes.filter(d => d.status === 'closed').length,        color: '#7A6050' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: '#7A6050' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'open', 'investigating', 'resolved', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={filter === f
              ? { background: '#D85A30', color: '#FFFCF5' }
              : { background: 'rgba(216,90,48,0.1)', color: '#7A6050' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#D85A30' }} />
            <p className="text-sm" style={{ color: '#7A6050' }}>No disputes found</p>
          </div>
        ) : filtered.map(d => {
          const sc = STATUS_COLORS[d.status]
          return (
            <div key={d.id} className="rounded-xl overflow-hidden"
              style={{ border: `2px solid ${sc.color}30`, background: '#FFF8E7' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: sc.color + '12' }}>
                <span className="font-mono text-xs font-bold" style={{ color: '#1C0A00' }}>
                  #{d.order.id.slice(-8).toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#7A6050' }}>{d.createdAt?.slice(0,10)}</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
              </div>
              <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{d.customer.name}</p>
                  <p className="text-xs" style={{ color: '#7A6050' }}>{d.customer.email}</p>
                  <p className="text-sm mt-2 font-medium" style={{ color: '#D85A30' }}>
                    <AlertTriangle size={12} className="inline mr-1" />
                    {d.reason}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#7A6050' }}>
                    Order value: {formatPrice(d.order.totalAmount)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {d.status === 'open' && (
                    <button onClick={() => updateStatus(d.id, 'investigating')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>
                      Investigate
                    </button>
                  )}
                  {d.status === 'investigating' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(d.id, 'resolved')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                        Resolve
                      </button>
                      <button onClick={() => updateStatus(d.id, 'closed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(122,96,80,0.15)', color: '#7A6050' }}>
                        Close
                      </button>
                    </div>
                  )}
                  <Link to={`/customer/orders/${d.order.id}`}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: '#457B9D' }}>
                    <Eye size={12} /> View Order
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
