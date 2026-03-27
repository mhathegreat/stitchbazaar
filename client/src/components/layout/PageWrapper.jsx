/**
 * PageWrapper
 * Wraps every page with consistent padding below the fixed Navbar.
 * Also injects page-level <title> and meta description via props.
 */

import { useEffect } from 'react'

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children
 * @param {string}          [props.title]       <title> override
 * @param {string}          [props.description] meta description override
 */
export default function PageWrapper({ children, title, description }) {
  useEffect(() => {
    if (title) document.title = `${title} — StitchBazaar`
    if (description) {
      const el = document.querySelector('meta[name="description"]')
      if (el) el.setAttribute('content', description)
    }
  }, [title, description])

  return (
    // pt-16 accounts for the fixed 64px navbar
    <main className="min-h-screen pt-16" style={{ background: '#FFFCF5' }}>
      {children}
    </main>
  )
}
