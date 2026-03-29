/**
 * CitySelect — searchable city combobox for Pakistan cities.
 * Props:
 *   value       string   currently selected city
 *   onChange    fn(city) called with city string when selected
 *   placeholder string
 *   required    bool
 *   error       string   validation error message
 *   allowAll    bool     adds "All Cities" as first option (for filters)
 *   style       object   override container styles
 *   inputStyle  object   override input styles
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { PAKISTAN_CITIES } from '../../constants/cities.js'

export default function CitySelect({
  value = '',
  onChange,
  placeholder = 'Select city',
  required = false,
  error,
  allowAll = false,
  inputStyle = {},
}) {
  const [query,  setQuery]  = useState('')
  const [open,   setOpen]   = useState(false)
  const containerRef        = useRef(null)
  const inputRef            = useRef(null)

  const allOptions = allowAll ? ['All Cities', ...PAKISTAN_CITIES] : PAKISTAN_CITIES
  const filtered = query.trim()
    ? allOptions.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : allOptions

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function select(city) {
    onChange(city)
    setOpen(false)
    setQuery('')
  }

  function clear(e) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  const displayValue = open ? query : (value || '')

  const baseInputStyle = {
    background: '#FFFCF5',
    border: `1.5px solid ${error ? '#D85A30' : open ? '#C88B00' : 'rgba(200,139,0,0.3)'}`,
    color: '#1C0A00',
    ...inputStyle,
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery('') }}
          placeholder={value && !open ? value : placeholder}
          className="w-full px-4 py-2.5 pr-16 rounded-xl text-sm outline-none transition-colors"
          style={baseInputStyle}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button type="button" onClick={clear}
              className="p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: '#A07000' }}>
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: '#A07000' }} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-lg"
          style={{ background: '#FFFCF5', border: '1.5px solid rgba(200,139,0,0.3)', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#7A6050' }}>No cities found</p>
          ) : (
            filtered.map(city => (
              <button
                key={city}
                type="button"
                onMouseDown={() => select(city)}
                className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-amber-50"
                style={{ color: city === value ? '#C88B00' : '#1C0A00', fontWeight: city === value ? 600 : 400 }}>
                {city}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="text-xs mt-1" style={{ color: '#D85A30' }}>{error}</p>}
    </div>
  )
}
