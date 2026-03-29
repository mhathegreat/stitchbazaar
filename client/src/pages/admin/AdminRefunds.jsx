/**
 * Admin Refunds — /admin/refunds
 * Review and process customer refund requests.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, CheckCircle, XCircle, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout.jsx'
import api from '../../api/client.js'
import { chatApi } from '../../api/chat.js'
import { formatPrice } from '../../styles/theme.js'

const STATUS_COLOR = {
  pending:  { color: '#C88B00', bg: 'rgba(200,139,0,0.1)'   },
  approved: { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)'   },
  rejected: { color: '#D85A30', bg: 'rgba(216,90,48,0.1)'   },
}

export default function AdminRefunds() {
  const navigate = useNavigate()
  const [refunds,     setRefunds]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('')
  const [processing,  setProcessing]  = useState(null)
  const [adminNotes,  setAdminNotes]  = useState({})
  const [startingChat, setStartingChat] = useState(null)

  async function startChat(customerId) {
    setStartingChat(customerId)
    try {
      const d = await chatApi.startAsAdmin(customerId)
      navigate(`/admin/messages/${d.data.id}`)
    } catch {
      toast.error('Could not start chat')
    } finally {
      setStartingChat(null)
    }
  }

  useEffect(() => { fetchRefunds() }, [filter])

  async function fetchRefunds() {
    setLoading(true)
    try {
      const params = filter ? { status: filter } : {}
      const r = await api.get('/refunds', { params })
      setRefunds(r.data?.data || [])
    } catch { setRefunds([]) }
    finally { setLoading(false) }
  }

  async function processRefund(id, status) {
    setProcessing(id + status)
    try {
      await api.put(`/refunds/${id}/process`, { status, adminNote: adminNotes[id] || '' })
      setRefunds(rs => rs.map(r => r.id === id ? { ...r, status, adminNote: adminNotes[id] } : r))
      toast.success(`Refund ${status}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally { setProcessing(null) }
  }

  return (
    <AdminLayout active="/admin/refunds" title="Refunds">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
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

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-16">
            <RotateCcw size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C88B00' }} />
            <p style={{ color: '#7A6050' }}>No refund requests{filter ? ` with status "${filter}"` : ''}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {refunds.map(r => {
              const sc = STATUS_COLOR[r.status] || STATUS_COLOR.pending
              return (
                <div key={r.id} className="rounded-xl p-5"
                  style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                          style={{ background: sc.bg, color: sc.color }}>
                          {r.status}
                        </span>
                        <span className="text-xs" style={{ color: '#A07000' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>
                        {r.customer?.name}
                      </p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>
                        {r.customer?.email}
                        {r.customer?.phone && <span> · 📱 {r.customer.phone}</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>
                        Order: <span className="font-mono">{r.orderId?.slice(-8).toUpperCase()}</span>
                        {' · '}Amount: <span className="font-bold" style={{ color: '#C88B00' }}>{formatPrice(r.amount)}</span>
                      </p>
                      <p className="text-sm mt-2 p-2 rounded-lg" style={{ background: 'rgba(200,139,0,0.06)', color: '#3A2010' }}>
                        {r.reason}
                      </p>
                      {r.adminNote && (
                        <p className="text-xs mt-1 italic" style={{ color: '#7A6050' }}>Note: {r.adminNote}</p>
                      )}
                      <button
                        onClick={() => startChat(r.customer?.id)}
                        disabled={startingChat === r.customer?.id}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                        style={{ background: 'rgba(69,123,157,0.1)', color: '#457B9D' }}>
                        <MessageCircle size={12} /> {startingChat === r.customer?.id ? 'Opening…' : 'Chat with Customer'}
                      </button>
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                        <input
                          value={adminNotes[r.id] || ''}
                          onChange={e => setAdminNotes(n => ({ ...n, [r.id]: e.target.value }))}
                          placeholder="Admin note (optional)"
                          className="px-3 py-1.5 rounded-lg text-xs outline-none"
                          style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => processRefund(r.id, 'approved')}
                            disabled={processing === r.id + 'approved'}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
                            style={{ background: '#0F6E56', color: '#FFFCF5' }}>
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => processRefund(r.id, 'rejected')}
                            disabled={processing === r.id + 'rejected'}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
                            style={{ background: '#D85A30', color: '#FFFCF5' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
