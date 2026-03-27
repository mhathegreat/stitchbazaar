/**
 * Admin Shipping Rates — /admin/shipping
 * Configure per-city delivery fees.
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout.jsx'
import api from '../../api/client.js'
import { formatPrice } from '../../styles/theme.js'

const EMPTY = { city: '', rate: '', freeAbove: '' }

const PRESET_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala','default',
]

export default function AdminShipping() {
  const [rates,    setRates]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { fetchRates() }, [])

  async function fetchRates() {
    setLoading(true)
    try {
      const r = await api.get('/shipping')
      setRates(r.data?.data || [])
    } catch { setRates([]) }
    finally { setLoading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.city.trim() || form.rate === '') { toast.error('City and rate required'); return }
    setSaving(true)
    try {
      await api.post('/shipping', {
        city:      form.city.toLowerCase().trim(),
        rate:      Math.round(parseFloat(form.rate) * 100),
        freeAbove: form.freeAbove ? Math.round(parseFloat(form.freeAbove) * 100) : 0,
      })
      toast.success('Rate saved!')
      setForm(EMPTY)
      fetchRates()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  async function deleteRate(id) {
    if (!confirm('Delete this rate?')) return
    try {
      await api.delete(`/shipping/${id}`)
      setRates(rs => rs.filter(r => r.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout active="/admin/shipping" title="Shipping">
      <div className="max-w-3xl">
        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: '#1C0A00' }}>
          Shipping <span style={{ color: '#C88B00' }}>Rates</span>
        </h1>
        <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
          Set per-city delivery fees. Use <strong>default</strong> as a catch-all for unlisted cities.
        </p>

        {/* Add / update form */}
        <form onSubmit={handleSave}
          className="rounded-xl p-5 mb-6 grid grid-cols-3 gap-4"
          style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
          <h2 className="col-span-3 font-semibold text-sm" style={{ color: '#1C0A00' }}>
            Add / Update Rate
          </h2>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>City *</label>
            <input list="city-list" value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="karachi"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
            <datalist id="city-list">
              {PRESET_CITIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Rate (Rs.) *</label>
            <input type="number" value={form.rate}
              onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
              placeholder="200"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#7A6050' }}>Free Shipping Above (Rs.)</label>
            <input type="number" value={form.freeAbove}
              onChange={e => setForm(f => ({ ...f, freeAbove: e.target.value }))}
              placeholder="0 = never free"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', color: '#1C0A00' }} />
          </div>

          <div className="col-span-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: '#C88B00', color: '#1C0A00' }}>
              <Plus size={15} /> {saving ? 'Saving…' : 'Save Rate'}
            </button>
          </div>
        </form>

        {/* Rates table */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-16">
            <Truck size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C88B00' }} />
            <p style={{ color: '#7A6050' }}>No shipping rates configured yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FFF8E7', borderBottom: '2px solid rgba(200,139,0,0.15)' }}>
                  {['City', 'Rate', 'Free Above', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: '#A07000' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#FFFCF5' : '#FFF8E7', borderBottom: '1px solid rgba(200,139,0,0.08)' }}>
                    <td className="px-4 py-3 font-semibold capitalize" style={{ color: r.city === 'default' ? '#A07000' : '#1C0A00' }}>
                      {r.city === 'default' ? '⭐ Default (all cities)' : r.city}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#C88B00' }}>
                      {r.rate === 0 ? <span style={{ color: '#0F6E56' }}>Free</span> : formatPrice(r.rate)}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#5A4030' }}>
                      {r.freeAbove > 0 ? `≥ ${formatPrice(r.freeAbove)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteRate(r.id)}
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
