/**
 * Vendor Registration page
 * Multi-step form: Shop Info → Bank Details → Submit for review.
 * Only accessible to logged-in users with role 'vendor'.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

import api, { setAccessToken } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import MosaicBackground from '../../components/mosaic/MosaicBackground.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import { colors } from '../../styles/theme.js'

const STEPS = ['Shop Info', 'Bank Details', 'Review & Submit']

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala']
const COLOR_THEMES = [
  { value: '#C88B00', label: 'Amber'      },
  { value: '#D85A30', label: 'Coral'      },
  { value: '#0F6E56', label: 'Emerald'    },
  { value: '#6A4C93', label: 'Purple'     },
  { value: '#457B9D', label: 'Steel Blue' },
]

export default function VendorRegister() {
  const navigate        = useNavigate()
  const { user, refresh } = useAuth()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const [shop, setShop] = useState({
    shopName: '', shopDescription: '', city: '', whatsapp: '', colorTheme: '#C88B00',
  })
  const [bank, setBank] = useState({
    accountName: '', accountNumber: '', bankName: '', branchCode: '',
  })

  function shopChange(e)  { setShop(s  => ({ ...s,  [e.target.name]: e.target.value })); setErrors(er => ({ ...er, [e.target.name]: '' })) }
  function bankChange(e)  { setBank(b  => ({ ...b,  [e.target.name]: e.target.value })); setErrors(er => ({ ...er, [e.target.name]: '' })) }

  function validateShop() {
    const errs = {}
    if (!shop.shopName.trim())        errs.shopName = 'Shop name is required'
    if (shop.shopName.trim().length < 2) errs.shopName = 'Shop name must be at least 2 characters'
    if (!shop.city)                   errs.city     = 'Please select your city'
    if (shop.shopName.length > 80)    errs.shopName = 'Max 80 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateBank() {
    const errs = {}
    if (!bank.accountName.trim())   errs.accountName   = 'Account holder name is required'
    if (!bank.accountNumber.trim()) errs.accountNumber = 'Account number is required'
    if (!bank.bankName.trim())      errs.bankName      = 'Bank name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (step === 0 && !validateShop()) return
    if (step === 1 && !validateBank()) return
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!user) { toast.error('Please sign in before registering a shop'); navigate('/login'); return }
    setLoading(true)
    try {
      await api.post('/vendors/register', {
        shopName:        shop.shopName,
        shopDescription: shop.shopDescription,
        city:            shop.city,
        whatsapp:        shop.whatsapp,
        colorTheme:      shop.colorTheme,
        bankAccountName:   bank.accountName,
        bankAccountNumber: bank.accountNumber,
        bankName:          bank.bankName,
        branchCode:        bank.branchCode || undefined,
      })
      // Refresh JWT so role updates from 'customer' → 'vendor' immediately
      await refresh().catch(() => {})
      setStep(3) // success state
    } catch (err) {
      const data = err?.response?.data
      if (data?.errors) {
        // Show first Zod validation error
        const firstError = Object.values(data.errors).flat()[0]
        toast.error(firstError || 'Please check your inputs and try again.')
      } else {
        toast.error(data?.message || 'Submission failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <PageWrapper title="Shop Submitted">
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: '#FFFCF5' }}>
          <ColorBlob color="#0F6E56" className="top-0 right-0 w-80 h-80" opacity={0.07} />
          <div className="max-w-md w-full text-center relative z-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(15,110,86,0.1)' }}>
              <CheckCircle size={40} style={{ color: '#0F6E56' }} />
            </div>
            <BeadDots count={7} className="justify-center mb-4" />
            <h1 className="font-serif font-bold text-3xl mb-3" style={{ color: '#1C0A00' }}>
              Shop Submitted!
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#5A4030' }}>
              <strong style={{ color: '#0F6E56' }}>{shop.shopName}</strong> has been submitted for review.
              Our team will review your shop within 24–48 hours and notify you by email.
            </p>
            <div className="rounded-xl p-4 mb-6" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A07000' }}>What's next?</p>
              <ul className="text-sm text-left flex flex-col gap-2" style={{ color: '#5A4030' }}>
                <li className="flex gap-2">
                  <span style={{ color: '#C88B00' }}>1.</span> Our admin reviews your shop details
                </li>
                <li className="flex gap-2">
                  <span style={{ color: '#C88B00' }}>2.</span> You receive an approval email
                </li>
                <li className="flex gap-2">
                  <span style={{ color: '#C88B00' }}>3.</span> Start listing products and selling!
                </li>
              </ul>
            </div>
            <Link to="/vendor/dashboard" className="btn-primary rounded-xl px-8 py-3 font-bold">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Register Your Shop" description="Open your shop on StitchBazaar">
      <div className="min-h-[calc(100vh-64px)] flex">
        {/* Left mosaic panel */}
        <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden flex-col items-center justify-center" style={{ background: '#1C0A00' }}>
          <MosaicBackground height={700} />
          <div className="absolute inset-0" style={{ background: 'rgba(28,10,0,0.5)' }} />
          <div className="relative z-10 text-center px-10">
            <BeadDots count={7} className="justify-center mb-5" />
            <h2 className="font-serif font-bold text-4xl mb-3" style={{ color: '#C88B00' }}>Open Your Shop</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#C8B89A' }}>
              Join hundreds of Pakistani artisan shops.<br />
              Reach customers across the country.
            </p>
            <div className="flex flex-col gap-3 text-left">
              {['Free to register','10% commission only on sales','Cash payout to your bank','WhatsApp order alerts','Admin support 7 days'].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: Object.values(colors).slice(0, 5)[i] }} />
                  <span className="text-sm" style={{ color: '#C8B89A' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-start justify-center px-4 py-10 overflow-y-auto" style={{ background: '#FFFCF5' }}>
          <div className="w-full max-w-lg">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-center mb-8">
              <span className="font-serif font-bold text-2xl" style={{ color: '#C88B00' }}>Stitch<span style={{ color: '#1C0A00' }}>Bazaar</span></span>
              <span className="text-[9px] tracking-[0.2em] font-semibold mt-0.5" style={{ color: '#C88B00' }}>CRAFTS · KNITTING · HABERDASHERY</span>
            </Link>

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                      style={i <= step
                        ? { background: '#C88B00', borderColor: '#C88B00', color: '#1C0A00' }
                        : { background: 'transparent', borderColor: 'rgba(200,139,0,0.3)', color: '#A07000' }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="text-[10px] mt-1 font-medium" style={{ color: i <= step ? '#C88B00' : '#A07000' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 -mt-4"
                      style={{ background: i < step ? '#C88B00' : 'rgba(200,139,0,0.2)' }} />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-7" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)', boxShadow: '0 4px 24px rgba(200,139,0,0.1)' }}>

              {/* ── Step 0: Shop Info ── */}
              {step === 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-serif font-bold text-xl mb-1" style={{ color: '#1C0A00' }}>Shop Information</h2>

                  <Field label="Shop Name" name="shopName" value={shop.shopName} onChange={shopChange}
                    placeholder="e.g. CraftHub Lahore" error={errors.shopName} required />

                  <Field label="WhatsApp Number" name="whatsapp" value={shop.whatsapp} onChange={shopChange}
                    placeholder="03xxxxxxxxx" hint="Customers will contact you on this number" />

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
                      Shop Description <span style={{ color: '#A07000' }}>(optional)</span>
                    </label>
                    <textarea name="shopDescription" value={shop.shopDescription} onChange={shopChange}
                      placeholder="Tell customers about your shop, what you sell, your story…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                      onFocus={e => e.target.style.borderColor = '#C88B00'}
                      onBlur={e => e.target.style.borderColor = 'rgba(200,139,0,0.3)'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
                      City <span style={{ color: '#D85A30' }}>*</span>
                    </label>
                    <select name="city" value={shop.city} onChange={shopChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: '#FFFCF5', border: `2px solid ${errors.city ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: shop.city ? '#1C0A00' : '#A07000' }}>
                      <option value="">Select your city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.city && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1C0A00' }}>Shop Color Theme</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_THEMES.map(t => (
                        <button key={t.value} type="button" onClick={() => setShop(s => ({ ...s, colorTheme: t.value }))}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
                          style={{ borderColor: shop.colorTheme === t.value ? '#1C0A00' : 'transparent' }}>
                          <div className="w-8 h-8 rounded-full" style={{ background: t.value }} />
                          <span className="text-[10px] font-medium" style={{ color: '#7A6050' }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Bank Details ── */}
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-serif font-bold text-xl" style={{ color: '#1C0A00' }}>Bank Details</h2>
                    <p className="text-xs mt-1" style={{ color: '#7A6050' }}>
                      Used for payout transfers when admin processes your earnings.
                    </p>
                  </div>
                  <Field label="Account Holder Name" name="accountName" value={bank.accountName} onChange={bankChange}
                    placeholder="Muhammad Ali" error={errors.accountName} required />
                  <Field label="Account Number / IBAN" name="accountNumber" value={bank.accountNumber} onChange={bankChange}
                    placeholder="PK36 SCBL 0000 0011 2345 6702" error={errors.accountNumber} required />
                  <Field label="Bank Name" name="bankName" value={bank.bankName} onChange={bankChange}
                    placeholder="e.g. HBL, MCB, UBL, Meezan" error={errors.bankName} required />
                  <Field label="Branch Code" name="branchCode" value={bank.branchCode} onChange={bankChange}
                    placeholder="e.g. 0012 (optional)" />
                  <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(15,110,86,0.08)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.2)' }}>
                    🔒 Your bank details are stored securely and only used for payouts by our admin team.
                  </div>
                </div>
              )}

              {/* ── Step 2: Review ── */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-serif font-bold text-xl mb-1" style={{ color: '#1C0A00' }}>Review & Submit</h2>
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.2)' }}>
                    <ReviewRow label="Shop Name"    value={shop.shopName} />
                    <ReviewRow label="City"         value={shop.city} />
                    <ReviewRow label="WhatsApp"     value={shop.whatsapp || '—'} />
                    <ReviewRow label="Description"  value={shop.shopDescription || '—'} />
                    <ReviewRow label="Color Theme"  value={<span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded-full inline-block" style={{ background: shop.colorTheme }} />{COLOR_THEMES.find(t => t.value === shop.colorTheme)?.label}</span>} />
                  </div>
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.2)' }}>
                    <ReviewRow label="Account Name"   value={bank.accountName} />
                    <ReviewRow label="Account Number" value={bank.accountNumber} />
                    <ReviewRow label="Bank"           value={bank.bankName} />
                  </div>
                  <p className="text-xs" style={{ color: '#7A6050' }}>
                    By submitting, you agree to StitchBazaar's vendor terms and a 10% commission on each sale.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="btn-secondary rounded-xl px-5 py-2.5 gap-2">
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={nextStep} className="btn-primary rounded-xl px-6 py-2.5 gap-2 flex-1 justify-center">
                    Next <ArrowRight size={15} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    className="btn-primary rounded-xl px-6 py-2.5 gap-2 flex-1 justify-center disabled:opacity-60">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Submitting…</>
                      : <><Store size={15} /> Submit for Review</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

// Defined outside VendorRegister so React doesn't treat it as a new component
// type on every render (which would unmount/remount the input and lose focus).
function Field({ label, name, value, onChange, placeholder, type = 'text', error, hint, required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
        {label} {required && <span style={{ color: '#D85A30' }}>*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{ background: '#FFFCF5', border: `2px solid ${error ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
        onFocus={e => e.target.style.borderColor = '#C88B00'}
        onBlur={e => e.target.style.borderColor = error ? '#D85A30' : 'rgba(200,139,0,0.3)'}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{error}</p>}
      {hint && !error && <p className="text-xs mt-1" style={{ color: '#A07000' }}>{hint}</p>}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-32 shrink-0 font-medium" style={{ color: '#A07000' }}>{label}</span>
      <span style={{ color: '#1C0A00' }}>{value}</span>
    </div>
  )
}
