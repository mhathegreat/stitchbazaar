/**
 * Admin Settings — /admin/settings
 * Notification preferences for the admin account.
 */

import { useState, useEffect } from 'react'
import { Bell, Save } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import api from '../../api/client.js'
import toast from 'react-hot-toast'

const NOTIF_OPTIONS = [
  {
    key:   'mute_refund_requested',
    label: 'Refund Requests',
    desc:  'Get notified when a customer submits a refund request.',
  },
  {
    key:   'mute_dispute_opened',
    label: 'Disputes',
    desc:  'Get notified when a customer opens a dispute on an order.',
  },
  {
    key:   'mute_payout_requested',
    label: 'Payout Requests',
    desc:  'Get notified when a vendor requests a payout.',
  },
]

function Toggle({ enabled, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
      style={{ background: enabled ? '#C88B00' : 'rgba(200,139,0,0.2)' }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

export default function AdminSettings() {
  const [prefs,   setPrefs]   = useState({})
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications/prefs')
      .then(r => { if (r.data.success) setPrefs(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const r = await api.patch('/notifications/prefs', prefs)
      if (!r.data.success) throw new Error()
      toast.success('Preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally { setSaving(false) }
  }

  return (
    <AdminLayout active="/admin/settings" title="Settings">
      <h1 className="font-serif font-bold text-2xl mb-6" style={{ color: '#1C0A00' }}>
        Admin <span style={{ color: '#C88B00' }}>Settings</span>
      </h1>

      <div className="max-w-xl">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={16} style={{ color: '#C88B00' }} />
          <h2 className="font-semibold text-sm" style={{ color: '#1C0A00' }}>Notification Preferences</h2>
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
          <p className="text-xs" style={{ color: '#A07000' }}>
            Control which platform events show up in your notification bell. Muted types are not saved to your history either.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#C88B00', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {NOTIF_OPTIONS.map(({ key, label, desc }) => {
              const enabled = !prefs[key]
              return (
                <div key={key}
                  className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                  style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.15)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>{desc}</p>
                  </div>
                  <Toggle
                    enabled={enabled}
                    onChange={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                  />
                </div>
              )
            })}
          </div>
        )}

        <button onClick={handleSave} disabled={saving || loading}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: '#C88B00', color: '#1C0A00' }}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </AdminLayout>
  )
}
