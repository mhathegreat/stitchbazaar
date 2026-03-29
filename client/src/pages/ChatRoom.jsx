/**
 * ChatRoom — /messages/:id
 * Shared for customer and vendor — real-time via SSE + polling fallback.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, ImagePlus, X } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import { chatApi } from '../api/chat.js'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

export default function ChatRoom() {
  const { id }                    = useParams()
  const { user }                  = useAuth()
  const [convo,    setConvo]      = useState(null)
  const [msgs,     setMsgs]       = useState([])
  const [hasMore,  setHasMore]    = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page,     setPage]       = useState(1)
  const [text,        setText]        = useState('')
  const [imageFile,   setImageFile]   = useState(null)   // File object
  const [imagePreview,setImagePreview]= useState(null)   // local blob URL
  const [uploading,   setUploading]   = useState(false)
  const [sending,     setSending]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const messagesRef                   = useRef(null)
  const inputRef                      = useRef(null)
  const fileInputRef                  = useRef(null)

  const load = useCallback(async () => {
    try {
      const d = await chatApi.get(id)
      setConvo(d.data.conversation)
      setMsgs(d.data.messages)
      setHasMore(d.data.meta?.hasMore ?? false)
      setPage(1)
      chatApi.markRead(id).catch(() => {})
    } catch {
      toast.error('Could not load chat')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Scroll to bottom only on initial load / new messages sent
  useEffect(() => {
    if (!loading) {
      const el = messagesRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [loading])

  // Load older messages (prepend, keep scroll position)
  async function loadOlder() {
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const d = await chatApi.get(id, nextPage)
      const older = d.data.messages
      setMsgs(prev => [...older, ...prev])
      setHasMore(d.data.meta?.hasMore ?? false)
      setPage(nextPage)
      // Preserve scroll position after prepend
      const el = messagesRef.current
      if (el) {
        const prevHeight = el.scrollHeight
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight
        })
      }
    } catch {
      toast.error('Could not load older messages')
    } finally {
      setLoadingMore(false)
    }
  }

  // Poll for new messages every 5 seconds (SSE delivers, this is a fallback)
  useEffect(() => {
    const timer = setInterval(() => {
      chatApi.get(id).then(d => {
        setMsgs(d.data.messages)
        chatApi.markRead(id).catch(() => {})
      }).catch(() => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [id])

  // Listen to SSE new_message events via localStorage broadcast
  useEffect(() => {
    function onStorage(e) {
      if (e.key === `chat_${id}`) load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [id, load])

  function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''   // reset so same file can be picked again
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null) }
  }

  async function handleSend(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body && !imageFile) return

    setSending(true)
    setText('')
    let imageUrl = null

    try {
      // Upload image first if present
      if (imageFile) {
        setUploading(true)
        const form = new FormData()
        form.append('image', imageFile)
        const up = await api.post('/upload?folder=stitchbazaar/chat', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = up.data.data.url
        clearImage()
        setUploading(false)
      }

      const d = await chatApi.send(id, body, imageUrl)
      setMsgs(prev => [...prev, d.data])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send')
      setText(body)
      setUploading(false)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  if (loading) return (
    <PageWrapper title="Chat">
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: '#C88B00' }} />
      </div>
    </PageWrapper>
  )

  const isVendor  = user?.role === 'vendor'
  const isAdmin   = user?.role === 'admin'
  const otherName = (isVendor || isAdmin) ? convo?.customer?.name : convo?.vendor?.shopName
  const backPath  = isVendor ? '/vendor/messages' : isAdmin ? '/admin/messages' : '/messages'

  // Group messages by date
  const grouped = msgs.reduce((acc, msg) => {
    const day = new Date(msg.createdAt).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <PageWrapper title={`Chat with ${otherName || '…'}`}>
      <div className="flex flex-col" style={{ background: '#FFFCF5', height: 'calc(100vh - 64px)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-sm"
          style={{ background: '#1C0A00', borderBottom: '1px solid rgba(200,139,0,0.3)' }}>
          <Link to={backPath} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
            <ArrowLeft size={18} style={{ color: '#C88B00' }} />
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: '#C88B00', color: '#1C0A00' }}>
            {(otherName || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#FFFCF5' }}>{otherName || '…'}</p>
            <p className="text-[10px]" style={{ color: '#C8B89A' }}>
              {isVendor ? 'Customer' : convo?.vendor?.shopName}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">

          {/* Load older messages */}
          {hasMore && (
            <div className="flex justify-center pb-2">
              <button onClick={loadOlder} disabled={loadingMore}
                className="text-xs font-semibold px-4 py-1.5 rounded-full transition-opacity disabled:opacity-50"
                style={{ background: 'rgba(200,139,0,0.12)', color: '#A07000' }}>
                {loadingMore ? 'Loading…' : '↑ Load older messages'}
              </button>
            </div>
          )}

          {msgs.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: '#C8B89A' }}>
              No messages yet. Say hello!
            </p>
          )}

          {Object.entries(grouped).map(([day, dayMsgs]) => (
            <div key={day}>
              {/* Date divider */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(200,139,0,0.15)' }} />
                <span className="text-[10px] px-2 font-medium" style={{ color: '#A07000' }}>
                  {formatDate(dayMsgs[0].createdAt)}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(200,139,0,0.15)' }} />
              </div>

              {dayMsgs.map((msg, i) => {
                const isMine  = msg.senderId === user?.id
                const showName = !isMine && (i === 0 || dayMsgs[i-1]?.senderId !== msg.senderId)
                return (
                  <div key={msg.id} className={`flex flex-col mb-1 ${isMine ? 'items-end' : 'items-start'}`}>
                    {showName && (
                      <span className="text-[10px] mb-0.5 ml-1" style={{ color: '#7A6050' }}>
                        {msg.sender?.name}
                      </span>
                    )}
                    <div className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${
                      isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'
                    }`}
                      style={isMine
                        ? { background: '#C88B00', color: '#1C0A00' }
                        : { background: '#FFF8E7', color: '#1C0A00', border: '1px solid rgba(200,139,0,0.2)' }
                      }>
                      {msg.imageUrl && (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.imageUrl} alt="shared"
                            className="block w-full max-w-[280px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: 260 }} />
                        </a>
                      )}
                      {msg.body && (
                        <p className="px-4 py-2.5">{msg.body}</p>
                      )}
                    </div>
                    <span className="text-[9px] mt-0.5 mx-1" style={{ color: '#B09070' }}>
                      {formatTime(msg.createdAt)}
                      {isMine && msg.readAt && ' · read'}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}

        </div>

        {/* Input */}
        <form onSubmit={handleSend}
          className="sticky bottom-0 px-4 py-3 flex flex-col gap-2"
          style={{ background: '#FFFCF5', borderTop: '1px solid rgba(200,139,0,0.15)' }}>

          {/* Image preview strip */}
          {imagePreview && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
              style={{ border: '2px solid rgba(200,139,0,0.3)' }}>
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={clearImage}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#1C0A00', color: '#FFFCF5' }}>
                <X size={10} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={handleImagePick} />

            {/* Image picker button */}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
              style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.25)', color: '#C88B00' }}>
              <ImagePlus size={18} />
            </button>

            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
              placeholder={imageFile ? 'Add a caption… (optional)' : 'Type a message…'}
              maxLength={2000}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFF8E7', border: '1.5px solid rgba(200,139,0,0.25)', color: '#1C0A00' }}
            />
            <button
              type="submit"
              disabled={(!text.trim() && !imageFile) || sending || uploading}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: '#C88B00', color: '#1C0A00' }}>
              {(sending || uploading) ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  )
}
