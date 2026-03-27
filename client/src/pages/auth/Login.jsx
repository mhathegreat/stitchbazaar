/**
 * Login page
 * Colorful mosaic left panel + form right panel.
 * Redirects vendors → /vendor/dashboard, customers → /customer/orders, admins → /admin.
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext.jsx'
import MosaicBackground from '../../components/mosaic/MosaicBackground.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import DiamondMotif from '../../components/mosaic/DiamondMotif.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const from = location.state?.from || null

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)

      if (from) return navigate(from, { replace: true })
      if (user.role === 'vendor') navigate('/vendor/dashboard', { replace: true })
      else if (user.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/customer/orders', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.'
      // Field-level errors from server
      const serverErrors = err?.response?.data?.errors || []
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
    <PageWrapper title="Login" description="Sign in to your StitchBazaar account">
      <div className="min-h-[calc(100vh-64px)] flex">

        {/* ── Left — mosaic panel (hidden on mobile) ── */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col items-center justify-center"
          style={{ background: '#1C0A00' }}>
          <MosaicBackground height={700} />
          <div className="absolute inset-0" style={{ background: 'rgba(28,10,0,0.45)' }} />
          <DiamondMotif color="#C88B00" className="top-8 left-8 opacity-40" size={48} />
          <DiamondMotif color="#D85A30" className="bottom-8 right-8 opacity-40" size={48} />

          <div className="relative z-10 text-center px-10">
            <BeadDots count={7} size="md" className="mb-5 justify-center" />
            <h2 className="font-serif font-bold text-4xl mb-3" style={{ color: '#C88B00' }}>
              Welcome Back
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#C8B89A' }}>
              Sign in to browse thousands of craft products,<br />
              track your orders, and support local artisan shops.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-left">
              {['Thousands of craft products','Local Pakistani vendors','Cash on Delivery','WhatsApp order support'].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ['#C88B00','#D85A30','#0F6E56','#6A4C93'][i] }} />
                  <span className="text-sm" style={{ color: '#C8B89A' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right — form panel ── */}
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

            {/* Card */}
            <div className="rounded-2xl p-8" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)', boxShadow: '0 4px 24px rgba(200,139,0,0.1)' }}>
              <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: '#1C0A00' }}>Sign In</h1>
              <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: '#D85A30' }}>Create one free</Link>
              </p>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: '#FFFCF5',
                      border: `2px solid ${errors.email ? '#D85A30' : 'rgba(200,139,0,0.3)'}`,
                      color: '#1C0A00',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C88B00'}
                    onBlur={e => e.target.style.borderColor = errors.email ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium" style={{ color: '#1C0A00' }}>Password</label>
                    <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: '#C88B00' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: '#FFFCF5',
                        border: `2px solid ${errors.password ? '#D85A30' : 'rgba(200,139,0,0.3)'}`,
                        color: '#1C0A00',
                      }}
                      onFocus={e => e.target.style.borderColor = '#C88B00'}
                      onBlur={e => e.target.style.borderColor = errors.password ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: '#A07000' }}
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.password}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 rounded-xl font-bold mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn size={16} /> Sign In
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Vendor link */}
            <p className="text-center text-sm mt-5" style={{ color: '#7A6050' }}>
              Want to sell on StitchBazaar?{' '}
              <Link to="/vendor/register" className="font-semibold hover:underline" style={{ color: '#0F6E56' }}>
                Register your shop →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
