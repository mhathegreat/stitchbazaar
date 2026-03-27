/**
 * Register page — Customer accounts only.
 * Vendor registration is handled separately via /vendor/register.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, ShoppingBag, Heart, Package } from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'
import MosaicBackground from '../../components/mosaic/MosaicBackground.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import DiamondMotif from '../../components/mosaic/DiamondMotif.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'

export default function Register() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [form,    setForm]    = useState({
    name: '', email: '', password: '', phone: '',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) {
      setErrors(er => ({ ...er, password: 'Password must be at least 8 characters' }))
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { ...form, role: 'customer' })
      await login(form.email, form.password)
      toast.success(`Welcome to StitchBazaar, ${form.name.split(' ')[0]}!`)
      navigate('/', { replace: true })
    } catch (err) {
      const msg          = err?.response?.data?.message || 'Registration failed.'
      const serverErrors = err?.response?.data?.errors  || []
      if (serverErrors.length) {
        const map = {}
        serverErrors.forEach(e => { map[e.field] = e.message })
        setErrors(map)
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper title="Create Account" description="Join StitchBazaar — Pakistan's craft marketplace">
      <div className="min-h-[calc(100vh-64px)] flex">

        {/* ── Left mosaic panel ── */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col items-center justify-center"
          style={{ background: '#1C0A00' }}>
          <MosaicBackground height={700} />
          <div className="absolute inset-0" style={{ background: 'rgba(28,10,0,0.45)' }} />
          <DiamondMotif color="#D85A30" className="top-8 right-8 opacity-40" size={48} />
          <DiamondMotif color="#0F6E56" className="bottom-8 left-8 opacity-40" size={48} />

          <div className="relative z-10 text-center px-10">
            <BeadDots count={7} size="md" className="mb-5 justify-center" />
            <h2 className="font-serif font-bold text-4xl mb-3" style={{ color: '#C88B00' }}>
              Join StitchBazaar
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#C8B89A' }}>
              Pakistan's marketplace for knitting,<br />stitching & haberdashery supplies.
            </p>

            <div className="flex flex-col gap-3 text-left">
              {[
                { icon: <ShoppingBag size={14} />, title: 'Browse thousands of products', color: '#C88B00' },
                { icon: <Heart size={14} />,       title: 'Save favourites to your wishlist', color: '#D85A30' },
                { icon: <Package size={14} />,     title: 'Track all your orders in one place', color: '#0F6E56' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3 border flex items-center gap-3"
                  style={{ background: 'rgba(255,252,245,0.06)', borderColor: 'rgba(200,139,0,0.2)' }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-xs" style={{ color: '#C8B89A' }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ background: '#FFFCF5' }}>
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex flex-col items-center">
                <span className="font-serif font-bold text-2xl" style={{ color: '#C88B00' }}>
                  Stitch<span style={{ color: '#1C0A00' }}>Bazaar</span>
                </span>
                <span className="text-[9px] tracking-[0.2em] font-semibold mt-0.5" style={{ color: '#C88B00' }}>
                  CRAFTS · KNITTING · HABERDASHERY
                </span>
              </Link>
            </div>

            <div className="rounded-2xl p-8" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)', boxShadow: '0 4px 24px rgba(200,139,0,0.1)' }}>
              <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: '#1C0A00' }}>Create Account</h1>
              <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: '#D85A30' }}>Sign in</Link>
              </p>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>Full Name</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Muhammad Ali" autoComplete="name" required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#FFFCF5', border: `2px solid ${errors.name ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
                    onFocus={e => e.target.style.borderColor = '#C88B00'}
                    onBlur={e => e.target.style.borderColor = errors.name ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                  />
                  {errors.name && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>Email Address</label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" autoComplete="email" required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#FFFCF5', border: `2px solid ${errors.email ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
                    onFocus={e => e.target.style.borderColor = '#C88B00'}
                    onBlur={e => e.target.style.borderColor = errors.email ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
                    Phone Number <span style={{ color: '#A07000' }}>(WhatsApp)</span>
                  </label>
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="03XX-XXXXXXX" autoComplete="tel"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.3)', color: '#1C0A00' }}
                    onFocus={e => e.target.style.borderColor = '#C88B00'}
                    onBlur={e => e.target.style.borderColor = 'rgba(200,139,0,0.3)'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>Password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                      placeholder="Min. 8 characters" autoComplete="new-password" required
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                      style={{ background: '#FFFCF5', border: `2px solid ${errors.password ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
                      onFocus={e => e.target.style.borderColor = '#C88B00'}
                      onBlur={e => e.target.style.borderColor = errors.password ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#A07000' }}>
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.password}</p>}
                  {form.password && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: form.password.length >= n * 2 + 2
                            ? n <= 1 ? '#D85A30' : n <= 2 ? '#C88B00' : n <= 3 ? '#2DC653' : '#0F6E56'
                            : 'rgba(200,139,0,0.15)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 rounded-xl font-bold mt-1 disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus size={16} /> Create Account
                    </span>
                  )}
                </button>

                <p className="text-center text-xs" style={{ color: '#A07000' }}>
                  By creating an account you agree to our{' '}
                  <Link to="/terms" className="underline" style={{ color: '#C88B00' }}>Terms</Link> &amp;{' '}
                  <Link to="/privacy" className="underline" style={{ color: '#C88B00' }}>Privacy Policy</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
