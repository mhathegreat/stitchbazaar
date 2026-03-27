/**
 * SEO component — injects dynamic <title> and Open Graph meta tags.
 * Usage: <SEO title="Product Name" description="…" image="…" url="…" />
 *
 * Uses document.title + a small meta-tag injector (no extra deps needed).
 * For production, swap with react-helmet-async.
 */

import { useEffect } from 'react'

const SITE_NAME = 'StitchBazaar'
const SITE_URL  = 'https://stitchbazaar.pk'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`
const DEFAULT_DESC  = 'Pakistan\'s marketplace for knitting needles, yarn, crochet hooks, embroidery supplies, and all things craft. Shop from trusted vendors across Pakistan.'

function setMeta(property, content) {
  if (typeof document === 'undefined') return
  let el = document.querySelector(`meta[property="${property}"]`)
             || document.querySelector(`meta[name="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      el.setAttribute('property', property)
    } else {
      el.setAttribute('name', property)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image       = DEFAULT_IMAGE,
  url,
  type        = 'website',
  price,        // in paisa — adds product:price meta if provided
  noIndex     = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} | Crafting Marketplace Pakistan`
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL

  useEffect(() => {
    document.title = fullTitle

    setMeta('description',          description)
    setMeta('og:title',             fullTitle)
    setMeta('og:description',       description)
    setMeta('og:image',             image)
    setMeta('og:url',               canonical)
    setMeta('og:type',              type)
    setMeta('og:site_name',         SITE_NAME)
    setMeta('og:locale',            'en_PK')

    setMeta('twitter:card',         'summary_large_image')
    setMeta('twitter:title',        fullTitle)
    setMeta('twitter:description',  description)
    setMeta('twitter:image',        image)

    if (price !== undefined) {
      setMeta('product:price:amount',   String(price / 100))
      setMeta('product:price:currency', 'PKR')
    }

    if (noIndex) {
      setMeta('robots', 'noindex,nofollow')
    } else {
      setMeta('robots', 'index,follow')
    }

    // Canonical link tag
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)
  }, [fullTitle, description, image, canonical, type, price, noIndex])

  return null
}
