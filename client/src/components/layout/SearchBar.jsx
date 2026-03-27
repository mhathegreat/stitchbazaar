/**
 * SearchBar with autocomplete dropdown.
 * Used in the Navbar (desktop) and mobile menu.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { formatPrice } from '../../styles/theme.js'
import api from '../../api/client.js'

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchBar({ onClose }) {
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const dropRef   = useRef(null)

  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)

  const debounced = useDebounce(query, 280)

  useEffect(() => {
    if (debounced.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    api.get('/products/autocomplete', { params: { q: debounced } })
      .then(r => {
        setSuggestions(r.data?.data || [])
        setOpen(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debounced])

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function submit(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    navigate(`/products?q=${encodeURIComponent(query.trim())}`)
    onClose?.()
  }

  function pick(product) {
    setOpen(false)
    setQuery('')
    navigate(`/products/${product.id}`)
    onClose?.()
  }

  function clear() {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-sm">
      <form onSubmit={submit} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: '#A07000' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search products…"
          className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,252,245,0.1)', border: '1px solid rgba(200,139,0,0.3)', color: '#FFFCF5' }}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: '#7A6050' }}>
            <X size={13} />
          </button>
        )}
      </form>

      {open && (
        <div ref={dropRef}
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)' }}>
          {loading ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#7A6050' }}>Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#7A6050' }}>No results for "{query}"</p>
          ) : (
            <>
              {suggestions.map(p => (
                <button key={p.id} onClick={() => pick(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50 transition-colors"
                  style={{ borderBottom: '1px solid rgba(200,139,0,0.08)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                    style={{ background: 'rgba(200,139,0,0.1)' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                      : '🧶'
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1C0A00' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#7A6050' }}>{p.category?.name}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: '#C88B00' }}>
                    {formatPrice(p.basePrice)}
                  </span>
                </button>
              ))}
              <button onClick={submit}
                className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-amber-50"
                style={{ color: '#C88B00', borderTop: '1px solid rgba(200,139,0,0.15)' }}>
                See all results for "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
