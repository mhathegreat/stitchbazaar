/**
 * Customer Profile — /customer/profile
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, ShoppingBag, Heart, Settings, Save, LogOut } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { authApi } from '../../api/auth.js'
import toast from 'react-hot-toast'

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Hyderabad','Sialkot']

const NAV = [
  { to: '/customer/profile',  label: 'My Profile',  icon: <User size={16} />        },
  { to: '/customer/orders',   label: 'My Orders',   icon: <ShoppingBag size={16} /> },
  { to: '/customer/wishlist', label: 'Wishlist',    icon: <Heart size={16} />       },
]

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
const inputStyle = { background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A6050' }}>
        {label} {required && <span style={{ color: '#D85A30' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function CustomerProfile() {
  const { user, logout, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   user?.phone   || '',
    address: user?.address || '',
    city:    user?.city    || '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      await authApi.updateProfile({ name: form.name, phone: form.phone, address: form.address, city: form.city })
      await refresh()
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <PageWrapper title="My Profile">
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full md:w-52 shrink-0">
            {/* Avatar */}
            <div className="rounded-xl p-5 text-center mb-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-serif font-bold mb-2"
                style={{ background: 'rgba(200,139,0,0.15)', color: '#C88B00' }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{user?.name}</p>
              <p className="text-xs" style={{ color: '#7A6050' }}>{user?.email}</p>
              <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00' }}>
                {user?.role || 'customer'}
              </span>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV.map(n => (
                <Link key={n.to} to={n.to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={n.to === '/customer/profile'
                    ? { background: 'rgba(200,139,0,0.1)', color: '#C88B00' }
                    : { color: '#7A6050' }}>
                  {n.icon} {n.label}
                </Link>
              ))}
              <button onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left mt-2"
                style={{ color: '#D85A30' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Form */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif font-bold text-2xl mb-5" style={{ color: '#1C0A00' }}>
              My <span style={{ color: '#C88B00' }}>Profile</span>
            </h1>

            <form onSubmit={handleSave} className="rounded-xl p-5 flex flex-col gap-4"
              style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="Email Address">
                  <input type="email" value={form.email} disabled
                    className={inputCls} style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                </Field>

                <Field label="Phone Number">
                  <input type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="03xxxxxxxxx" />
                </Field>

                <Field label="City">
                  <select value={form.city} onChange={e => set('city', e.target.value)}
                    className={inputCls} style={inputStyle}>
                    <option value="">-- Select city --</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Default Delivery Address">
                <textarea value={form.address} rows={3}
                  onChange={e => set('address', e.target.value)}
                  className={inputCls} style={inputStyle}
                  placeholder="House #, Street, Area, City" />
              </Field>

              <div className="flex items-center justify-between pt-2">
                <Link to="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: '#D85A30' }}>
                  Change password →
                </Link>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: '#C88B00', color: '#1C0A00' }}>
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>

            {/* Vendor CTA */}
            {user?.role === 'customer' && (
              <div className="mt-4 rounded-xl p-5" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                <p className="font-serif font-bold text-sm" style={{ color: '#C88B00' }}>Start Selling on StitchBazaar</p>
                <p className="text-xs mt-1 mb-3" style={{ color: '#7A6050' }}>
                  Turn your craft skills into income. Set up your shop and reach thousands of buyers across Pakistan.
                </p>
                <Link to="/vendor/register"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#C88B00', color: '#1C0A00' }}>
                  Become a Vendor →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
