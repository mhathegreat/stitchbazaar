/**
 * Reset Password page
 * Reads ?token= from URL, submits new password to API.
 */

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../../api/client.js'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token    = params.get('token') || ''

  const [form,    setForm]    = useState({ password: '', confirm: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [done,    setDone]    = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (form.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' })
      return
    }
    if (form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' })
      return
    }
    if (!token) {
      toast.error('Invalid or missing reset token. Please request a new reset link.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Reset failed. Please request a new link.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper title="Reset Password" description="Set a new password for your StitchBazaar account">
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{ background: '#FFFCF5' }}>
        <ColorBlob color="#6A4C93" className="top-0 right-0 w-80 h-80" opacity={0.06} />
        <ColorBlob color="#C88B00" className="bottom-0 left-0 w-64 h-64" opacity={0.06} />

        <div className="w-full max-w-md relative z-10">
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
            {!done ? (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'rgba(200,139,0,0.12)' }}>
                    <KeyRound size={24} style={{ color: '#C88B00' }} />
                  </div>
                  <BeadDots count={5} size="sm" className="mb-3" />
                  <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: '#1C0A00' }}>Set New Password</h1>
                  <p className="text-sm" style={{ color: '#7A6050' }}>Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>New Password</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'} name="password"
                        value={form.password} onChange={handleChange}
                        placeholder="Min. 8 characters" autoComplete="new-password"
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>Confirm Password</label>
                    <input
                      type={show ? 'text' : 'password'} name="confirm"
                      value={form.confirm} onChange={handleChange}
                      placeholder="Repeat password" autoComplete="new-password"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: '#FFFCF5', border: `2px solid ${errors.confirm ? '#D85A30' : 'rgba(200,139,0,0.3)'}`, color: '#1C0A00' }}
                      onFocus={e => e.target.style.borderColor = '#C88B00'}
                      onBlur={e => e.target.style.borderColor = errors.confirm ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                    />
                    {errors.confirm && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{errors.confirm}</p>}
                  </div>

                  <button type="submit" disabled={loading || !token}
                    className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-60">
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Updating…
                        </span>
                      : 'Update Password'
                    }
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(15,110,86,0.12)' }}>
                  <span className="text-3xl">✅</span>
                </div>
                <BeadDots count={5} size="sm" className="mb-3" />
                <h2 className="font-serif font-bold text-xl mb-2" style={{ color: '#1C0A00' }}>Password Updated!</h2>
                <p className="text-sm mb-4" style={{ color: '#7A6050' }}>Redirecting you to login…</p>
                <Link to="/login" className="btn-primary rounded-xl px-6 py-2">Go to Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
