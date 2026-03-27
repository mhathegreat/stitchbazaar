/**
 * Forgot Password page
 * Sends a reset link via email. Shows success state after submission.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'

import api from '../../api/client.js'
import BeadDots from '../../components/mosaic/BeadDots.jsx'
import ColorBlob from '../../components/mosaic/ColorBlob.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper title="Reset Password" description="Reset your StitchBazaar password">
      <div
        className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{ background: '#FFFCF5' }}
      >
        {/* Background blobs */}
        <ColorBlob color="#C88B00" className="top-0 right-0 w-80 h-80" opacity={0.07} />
        <ColorBlob color="#D85A30" className="bottom-0 left-0 w-64 h-64" opacity={0.06} />

        <div className="w-full max-w-md relative z-10">

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

            {!sent ? (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(200,139,0,0.12)' }}>
                    <Mail size={24} style={{ color: '#C88B00' }} />
                  </div>
                  <BeadDots count={5} size="sm" className="mb-3" />
                  <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: '#1C0A00' }}>
                    Forgot Password?
                  </h1>
                  <p className="text-sm" style={{ color: '#7A6050' }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C0A00' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: '#FFFCF5',
                        border: `2px solid ${error ? '#D85A30' : 'rgba(200,139,0,0.3)'}`,
                        color: '#1C0A00',
                      }}
                      onFocus={e => e.target.style.borderColor = '#C88B00'}
                      onBlur={e => e.target.style.borderColor = error ? '#D85A30' : 'rgba(200,139,0,0.3)'}
                    />
                    {error && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send size={15} /> Send Reset Link
                      </span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="flex flex-col items-center text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(15,110,86,0.12)' }}
                >
                  <Mail size={28} style={{ color: '#0F6E56' }} />
                </div>
                <BeadDots count={5} size="sm" className="mb-3" />
                <h2 className="font-serif font-bold text-xl mb-2" style={{ color: '#1C0A00' }}>
                  Check Your Email
                </h2>
                <p className="text-sm mb-2" style={{ color: '#7A6050' }}>
                  If <strong style={{ color: '#1C0A00' }}>{email}</strong> is registered, you'll receive a reset link shortly.
                </p>
                <p className="text-xs mb-6" style={{ color: '#A07000' }}>
                  Don't forget to check your spam folder.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-sm underline"
                  style={{ color: '#C88B00' }}
                >
                  Try a different email
                </button>
              </div>
            )}

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(200,139,0,0.15)' }}>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm font-medium hover:underline"
                style={{ color: '#7A6050' }}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
