/**
 * Vendor Settings — /vendor/settings
 */

import { useState, useEffect, useRef } from 'react'
import { Save, Camera, Palette, Bell } from 'lucide-react'
import VendorLayout from './VendorLayout.jsx'
import { vendorsApi } from '../../api/vendors.js'
import { authApi } from '../../api/auth.js'
import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import CitySelect from '../../components/ui/CitySelect.jsx'


const COLOR_OPTIONS = [
  '#C88B00', '#D85A30', '#0F6E56', '#6A4C93',
  '#457B9D', '#2DC653', '#E63946', '#F4A261',
]

const BANKS = ['HBL', 'MCB Bank', 'UBL', 'Bank Alfalah', 'Meezan Bank',
               'Standard Chartered', 'Faysal Bank', 'Allied Bank', 'NBP', 'Askari Bank']

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

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
const inputStyle = {
  background:  '#FFFCF5',
  border:      '2px solid rgba(200,139,0,0.2)',
  color:       '#1C0A00',
}

export default function VendorSettings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('shop')
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef(null)

  const [shop, setShop] = useState({
    shopName:        '',
    shopDescription: '',
    city:            '',
    colorTheme:      '#C88B00',
  })

  const [bank, setBank] = useState({
    accountName:   '',
    accountNumber: '',
    bankName:      'HBL',
    branchCode:    '',
  })

  const [profile, setProfile] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const [notifPrefs, setNotifPrefs] = useState({ mute_new_order: false })
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    vendorsApi.dashboard()
      .then(d => {
        if (!d.data?.vendor) return
        const v = d.data.vendor
        setLogoUrl(v.logo || '')
        setShop({
          shopName:        v.shopName        || '',
          shopDescription: v.shopDescription || '',
          city:            v.city            || '',
          colorTheme:      v.colorTheme      || '#C88B00',
        })
        setBank({
          accountName:   v.bankAccountName   || '',
          accountNumber: v.bankAccountNumber || '',
          bankName:      v.bankName          || 'HBL',
          branchCode:    v.branchCode        || '',
        })
      })
      .catch(() => {})

    api.get('/notifications/prefs')
      .then(r => { if (r.data.success) setNotifPrefs(p => ({ ...p, ...r.data.data })) })
      .catch(() => {})
  }, [])

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/upload?folder=logos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = data.data?.url || data.url
      setLogoUrl(url)
      await vendorsApi.updateProfile({ logo: url })
      toast.success('Logo uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true)
    try {
      const r = await api.patch('/notifications/prefs', notifPrefs)
      if (!r.data.success) throw new Error()
      toast.success('Notification preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally { setSavingPrefs(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const promises = []
      if (tab === 'shop' || tab === 'bank') {
        promises.push(vendorsApi.updateProfile({
          shopName:          shop.shopName,
          shopDescription:   shop.shopDescription,
          city:              shop.city,
          colorTheme:        shop.colorTheme,
          bankAccountName:   bank.accountName,
          bankAccountNumber: bank.accountNumber,
          bankName:          bank.bankName,
        }))
      }
      if (tab === 'profile') {
        promises.push(authApi.updateProfile({ name: profile.name, phone: profile.phone }))
      }
      await Promise.all(promises)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <VendorLayout active="/vendor/settings" title="Settings">
      <div className="max-w-2xl px-4 sm:px-6 py-8">
            <h1 className="font-serif font-bold text-2xl mb-6" style={{ color: '#1C0A00' }}>
              Shop <span style={{ color: '#C88B00' }}>Settings</span>
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'rgba(200,139,0,0.2)' }}>
              {[
                { id: 'shop',          label: 'Shop Info'      },
                { id: 'bank',          label: 'Bank Details'   },
                { id: 'profile',       label: 'My Account'     },
                { id: 'notifications', label: 'Notifications'  },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px"
                  style={tab === t.id
                    ? { color: '#C88B00', borderColor: '#C88B00' }
                    : { color: '#7A6050', borderColor: 'transparent' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Shop Info Tab */}
            {tab === 'shop' && (
              <div className="flex flex-col gap-5">
                {/* Logo upload */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0"
                    style={{ background: shop.colorTheme + '20', border: `2px solid ${shop.colorTheme}40` }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      : <span>🧶</span>}
                  </div>
                  <div>
                    <button type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                      style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00' }}>
                      {uploading
                        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Camera size={13} />}
                      {uploading ? 'Uploading…' : 'Upload Logo'}
                    </button>
                    <p className="text-[10px] mt-1" style={{ color: '#7A6050' }}>JPG or PNG, max 2MB</p>
                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>

                <Field label="Shop Name" required>
                  <input value={shop.shopName}
                    onChange={e => setShop(s => ({ ...s, shopName: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="Shop Description">
                  <textarea value={shop.shopDescription} rows={3}
                    onChange={e => setShop(s => ({ ...s, shopDescription: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="City">
                  <CitySelect value={shop.city} onChange={v => setShop(s => ({ ...s, city: v }))} placeholder="Select city" />
                </Field>

                <Field label="Shop Colour Theme">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Palette size={15} style={{ color: '#C88B00' }} />
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} onClick={() => setShop(s => ({ ...s, colorTheme: c }))}
                        className="w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          background:   c,
                          borderColor:  shop.colorTheme === c ? '#1C0A00' : 'transparent',
                          transform:    shop.colorTheme === c ? 'scale(1.2)' : 'scale(1)',
                        }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full" style={{ background: shop.colorTheme }} />
                    <input value={shop.colorTheme}
                      onChange={e => setShop(s => ({ ...s, colorTheme: e.target.value }))}
                      maxLength={7} className="w-24 px-2 py-1 rounded text-xs font-mono"
                      style={{ ...inputStyle, border: '1px solid rgba(200,139,0,0.2)' }} />
                  </div>
                </Field>

                {/* Preview banner */}
                <div className="rounded-xl p-4 text-white" style={{ background: shop.colorTheme }}>
                  <p className="font-serif font-bold text-lg">{shop.shopName || 'Your Shop Name'}</p>
                  <p className="text-xs opacity-80 mt-1">{shop.shopDescription?.slice(0, 60)}…</p>
                </div>
              </div>
            )}

            {/* Bank Details Tab */}
            {tab === 'bank' && (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl p-4" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                  <p className="text-xs" style={{ color: '#A07000' }}>
                    💡 Bank details are used for payout transfers. Make sure they're accurate. These are kept private and only visible to admins.
                  </p>
                </div>

                <Field label="Account Holder Name" required>
                  <input value={bank.accountName}
                    onChange={e => setBank(b => ({ ...b, accountName: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="Bank Name" required>
                  <select value={bank.bankName}
                    onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    {BANKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </Field>

                <Field label="Account Number" required>
                  <input value={bank.accountNumber}
                    onChange={e => setBank(b => ({ ...b, accountNumber: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="0123456789012" />
                </Field>

                <Field label="Branch Code">
                  <input value={bank.branchCode}
                    onChange={e => setBank(b => ({ ...b, branchCode: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="0242" />
                </Field>
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="flex flex-col gap-5">
                <Field label="Full Name" required>
                  <input value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="Email Address" required>
                  <input type="email" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>

                <Field label="Phone Number" required>
                  <input type="tel" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="03xxxxxxxxx" />
                </Field>

                <div className="rounded-xl p-4" style={{ background: 'rgba(216,90,48,0.06)', border: '1px solid rgba(216,90,48,0.2)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#D85A30' }}>Change Password</p>
                  <p className="text-xs mb-2" style={{ color: '#7A6050' }}>Use the forgot password flow to change your password securely.</p>
                  <Link to="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: '#D85A30' }}>
                    Reset password →
                  </Link>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {tab === 'notifications' && (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl p-4" style={{ background: 'rgba(200,139,0,0.06)', border: '1px solid rgba(200,139,0,0.2)' }}>
                  <p className="text-xs" style={{ color: '#A07000' }}>
                    Control which notifications you receive. Turned-off notifications won't appear in your bell or be saved.
                  </p>
                </div>

                {[
                  {
                    key:    'mute_new_order',
                    label:  'New Orders',
                    desc:   'Get notified when a customer places a new order containing your products.',
                    invert: true,
                  },
                  {
                    key:    'mute_new_message',
                    label:  'Customer Messages',
                    desc:   'Get notified when a customer sends you a message.',
                    invert: true,
                  },
                  {
                    key:    'mute_payout_status',
                    label:  'Payout Updates',
                    desc:   'Get notified when admin processes your payout request.',
                    invert: true,
                  },
                  {
                    key:    'mute_refund_requested',
                    label:  'Refund Requests',
                    desc:   'Get notified when a customer requests a refund on one of your orders.',
                    invert: true,
                  },
                ].map(({ key, label, desc, invert }) => {
                  const enabled = invert ? !notifPrefs[key] : !!notifPrefs[key]
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                      style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.15)' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#7A6050' }}>{desc}</p>
                      </div>
                      <button type="button"
                        onClick={() => setNotifPrefs(p => ({ ...p, [key]: invert ? enabled : !p[key] }))}
                        className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                        style={{ background: enabled ? '#C88B00' : 'rgba(200,139,0,0.2)' }}>
                        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  )
                })}

                <button onClick={handleSavePrefs} disabled={savingPrefs}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: '#C88B00', color: '#1C0A00' }}>
                  <Bell size={15} />
                  {savingPrefs ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* Save button (shop / bank / profile tabs only) */}
            {tab !== 'notifications' && (
              <button onClick={handleSave} disabled={saving}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: '#C88B00', color: '#1C0A00' }}>
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
      </div>
    </VendorLayout>
  )
}
