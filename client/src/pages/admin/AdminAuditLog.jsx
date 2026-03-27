/**
 * Admin Audit Log — /admin/audit
 * View all platform actions by admin/vendor users.
 */

import { useState, useEffect } from 'react'
import { Shield, RefreshCw } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import api from '../../api/client.js'

const ACTION_COLOR = {
  'vendor.approved':  '#0F6E56',
  'vendor.rejected':  '#D85A30',
  'payout.paid':      '#0F6E56',
  'payout.rejected':  '#D85A30',
  'dispute.resolved': '#0F6E56',
  'dispute.closed':   '#457B9D',
  'refund.approved':  '#0F6E56',
  'refund.rejected':  '#D85A30',
}

export default function AdminAuditLog() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')

  const LIMIT = 50

  useEffect(() => { fetchLogs() }, [page, search])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (search) params.action = search
      const r = await api.get('/admin/audit-logs', { params })
      setLogs(r.data?.data || [])
      setTotal(r.data?.meta?.total || 0)
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <AdminLayout active="/admin/audit" title="Audit Log">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
            Audit <span style={{ color: '#C88B00' }}>Log</span>
          </h1>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Filter by action…"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
            />
            <button onClick={fetchLogs}
              className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
              style={{ color: '#C88B00' }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <p className="text-xs mb-4" style={{ color: '#A07000' }}>
          {total} total entries
        </p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C88B00' }} />
            <p style={{ color: '#7A6050' }}>No audit log entries yet.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#FFF8E7', borderBottom: '2px solid rgba(200,139,0,0.15)' }}>
                    {['Time', 'User', 'Role', 'Action', 'Entity', 'IP'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: '#A07000' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const color = ACTION_COLOR[log.action] || '#5A4030'
                    return (
                      <tr key={log.id} style={{ background: i % 2 === 0 ? '#FFFCF5' : '#FFF8E7', borderBottom: '1px solid rgba(200,139,0,0.06)' }}>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: '#7A6050' }}>
                          {new Date(log.createdAt).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2.5 text-xs max-w-[140px] truncate" style={{ color: '#1C0A00' }}>
                          {log.userEmail || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold capitalize"
                            style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                            {log.role || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs font-semibold" style={{ color }}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#5A4030' }}>
                          {log.entityType ? `${log.entityType} ${log.entityId?.slice(-6)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#A07000' }}>
                          {log.ip || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
                  style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                  ← Prev
                </button>
                <span className="text-sm" style={{ color: '#7A6050' }}>
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
                  style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
