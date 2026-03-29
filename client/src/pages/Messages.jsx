/**
 * Messages Inbox — /messages
 * Shared for customer and vendor.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search } from 'lucide-react'
import PageWrapper    from '../components/layout/PageWrapper.jsx'
import { chatApi }   from '../api/chat.js'
import { useAuth }   from '../context/AuthContext.jsx'
import toast         from 'react-hot-toast'

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(date).toLocaleDateString('en-PK')
}

export default function Messages() {
  const { user }              = useAuth()
  const [convos,  setConvos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    chatApi.list()
      .then(d => setConvos(d.data || []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [])

  const isVendor = user?.role === 'vendor'
  const isAdmin  = user?.role === 'admin'

  function convoName(c) {
    if (isVendor || isAdmin) return c.customer?.name
    return c.vendor?.shopName
  }

  const filtered = convos.filter(c => {
    const name = convoName(c)
    return !search || name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <PageWrapper title="Messages">
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
              <span style={{ color: '#C88B00' }}>My</span> Messages
            </h1>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7A6050' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isVendor ? 'Search customers…' : 'Search shops…'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.2)', color: '#1C0A00' }}
            />
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <MessageCircle size={40} style={{ color: '#C8B89A' }} />
              <p className="font-serif font-bold text-lg" style={{ color: '#C88B00' }}>No conversations yet</p>
              {!isVendor && (
                <Link to="/vendors" className="text-sm font-semibold hover:underline" style={{ color: '#C88B00' }}>
                  Browse shops to start chatting →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(c => {
                const name    = convoName(c)
                const avatar  = (name || '?')[0].toUpperCase()
                const preview = c.messages?.[0]
                const unread  = preview && !preview.readAt && preview.senderId !== user?.id
                const href    = isVendor ? `/vendor/messages/${c.id}` : isAdmin ? `/admin/messages/${c.id}` : `/messages/${c.id}`

                return (
                  <Link key={c.id} to={href}
                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: '#FFF8E7', border: `1.5px solid ${unread ? 'rgba(200,139,0,0.4)' : 'rgba(200,139,0,0.15)'}` }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                      style={{ background: '#C88B00', color: '#1C0A00' }}>
                      {avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{name}</p>
                        {preview && (
                          <span className="text-[10px] shrink-0" style={{ color: '#A07000' }}>
                            {timeAgo(preview.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${unread ? 'font-semibold' : ''}`}
                        style={{ color: unread ? '#1C0A00' : '#7A6050' }}>
                        {preview ? preview.body : 'Start the conversation'}
                      </p>
                    </div>
                    {unread && (
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#C88B00' }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
