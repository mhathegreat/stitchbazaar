/**
 * Sitemap generator
 * Fetches all public products, vendors, and categories from DB.
 * Caches for 1 hour to avoid hammering the database on every crawl.
 */

import prisma from './prisma.js'

const BASE = process.env.CLIENT_URL || 'https://stitchbazaar.pk'

let cache = null
let cacheAt = 0
const CACHE_TTL = 60 * 60 * 1000  // 1 hour

/**
 * Generate and return sitemap XML.
 * @returns {Promise<string>}
 */
export async function generateSitemap() {
  if (cache && Date.now() - cacheAt < CACHE_TTL) return cache

  const [products, vendors, categories] = await Promise.all([
    prisma.product.findMany({
      where:  { status: 'active' },
      select: { id: true, updatedAt: true },
    }),
    prisma.vendor.findMany({
      where:  { status: 'active' },
      select: { id: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
  ])

  const staticUrls = [
    { loc: `${BASE}/`,            priority: '1.0',  changefreq: 'daily'   },
    { loc: `${BASE}/products`,    priority: '0.9',  changefreq: 'daily'   },
    { loc: `${BASE}/vendors`,     priority: '0.8',  changefreq: 'weekly'  },
    { loc: `${BASE}/categories`,  priority: '0.7',  changefreq: 'weekly'  },
    { loc: `${BASE}/register`,    priority: '0.5',  changefreq: 'monthly' },
    { loc: `${BASE}/login`,       priority: '0.4',  changefreq: 'monthly' },
  ]

  const productUrls = products.map(p => ({
    loc:        `${BASE}/products/${p.id}`,
    lastmod:    p.updatedAt.toISOString().split('T')[0],
    priority:   '0.8',
    changefreq: 'weekly',
  }))

  const vendorUrls = vendors.map(v => ({
    loc:        `${BASE}/vendors/${v.id}`,
    lastmod:    v.updatedAt.toISOString().split('T')[0],
    priority:   '0.7',
    changefreq: 'weekly',
  }))

  const categoryUrls = categories.map(c => ({
    loc:        `${BASE}/products?category=${c.slug}`,
    priority:   '0.7',
    changefreq: 'weekly',
  }))

  const allUrls = [...staticUrls, ...productUrls, ...vendorUrls, ...categoryUrls]

  const urlEntries = allUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod    ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority   ? `<priority>${u.priority}</priority>` : ''}
  </url>`).join('')

  cache  = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
  cacheAt = Date.now()

  return cache
}
