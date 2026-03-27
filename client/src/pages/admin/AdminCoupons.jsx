/**
 * Admin Coupons — /admin/coupons
 * Create, toggle, and delete coupon codes.
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout.jsx'
import api from '../../api/client.js'
import { formatPrice } from '../../styles/theme.js'

const EMPTY = { code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', expiresAt: '', active: true }

export default function AdminCoupons() {
  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchCoupons() }, [])

  async function fetchCoupons() {
    setLoading(true)
    try {
      const r = await api.get('/coupons')
      setCoupons(r.data?.data || [])
    } catch { setCoupons([]) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.code.trim() || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    try {
      await api.post('/coupons', {
        code:      form.code.toUpperCase().trim(),
        type:      form.type,
        value:     form.type === 'fixed'
          ? Math.round(parseFloat(form.value) * 100)   // Rs → paisa
          : parseInt(form.value),
        minOrder:  form.minOrder  ? Math.round(parseFloat(form.minOrder) * 100)  : 0,
        maxUses:   form.maxUses   ? parseInt(form.maxUses)   : 0,
        expiresAt: form.expiresAt || null,
        active:    true,
      })
      toast.success('Coupon created!')
      setForm(EMPTY)
      setShowForm(false)
      fetchCoupons()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create coupon')
    } finally { setSaving(false) }
  }

  async function toggleActive(c) {
    try {
      await api.put(`/coupons/${c.id}`, { active: !c.active })
      setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, active: !x.active } : x))
    } catch { toast.error('Failed to update') }
  }

  async function deleteCoupon(id) {
    if (!confirm('Delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      setCoupons(cs => cs.filter(c => c.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout active="/admin/coupons" title="Coupons">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
            Coupon <span style={{ color: '#C88B00' }}>Codes</span>
          </h1>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: '#C88B00', color: '#1C0A00' }}>
            <Plus size={15} /> New Coupon
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate}
            className="rounded-xl p-5 mb-6 grid grid-cols-2 gap-4"
            style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
            <h2 className="col-span-2 font-semibold text-sm" style={{ color: '#1C0A00' }}>New Coupon</h2>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>
                Value * {form.type === 'percentage' ? '(%)' : '(Rs.)'}
              </label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'percentage' ? '20' : '500'}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Min Order (Rs.)</label>
              <input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                placeholder="0 = no minimum"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Max Uses</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="0 = unlimited"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Expires At</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            </div>

            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: '#C88B00', color: '#1C0A00' }}>
                {saving ? 'Creating…' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl text-sm" style={{ color: '#7A6050' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C88B00' }} />
            <p style={{ color: '#7A6050' }}>No coupons yet. Create your first one.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FFF8E7', borderBottom: '2px solid rgba(200,139,0,0.15)' }}>
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: '#A07000' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? '#FFFCF5' : '#FFF8E7', borderBottom: '1px solid rgba(200,139,0,0.08)' }}>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: '#C88B00' }}>{c.code}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: '#5A4030' }}>{c.type}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1C0A00' }}>
                      {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5A4030' }}>
                      {c.minOrder > 0 ? formatPrice(c.minOrder) : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5A4030' }}>
                      {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#7A6050' }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-PK') : '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c)}>
                        {c.active
                          ? <ToggleRight size={20} style={{ color: '#0F6E56' }} />
                          : <ToggleLeft  size={20} style={{ color: '#A07000' }} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteCoupon(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: '#D85A30' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
