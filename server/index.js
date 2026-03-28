/**
 * StitchBazaar Express Server
 * Entry point — bootstraps middleware, routes, and starts listening.
 */

import 'dotenv/config'
import * as Sentry from '@sentry/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

// Sentry must be initialized before other imports
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  })
}

import { logger } from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Routes
import authRoutes       from './routes/auth.js'
import productRoutes    from './routes/products.js'
import variantRoutes    from './routes/variants.js'
import categoryRoutes   from './routes/categories.js'
import vendorRoutes     from './routes/vendors.js'
import orderRoutes      from './routes/orders.js'
import reviewRoutes     from './routes/reviews.js'
import wishlistRoutes   from './routes/wishlist.js'
import adminRoutes      from './routes/admin.js'
import uploadRoutes     from './routes/upload.js'
import sitemapRoutes      from './routes/sitemap.js'
import notificationRoutes from './routes/notifications.js'
import couponRoutes       from './routes/coupons.js'
import importRoutes       from './routes/import.js'
import shippingRoutes     from './routes/shipping.js'
import refundRoutes       from './routes/refunds.js'
import questionRoutes     from './routes/questions.js'
import cartRoutes         from './routes/cart.js'
import chatRoutes         from './routes/chat.js'
import { startCartRecoveryCron } from './utils/cartRecovery.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & parsing ───────────────────────────────────────────
app.use(helmet())
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return cb(null, true)
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true)
    cb(new Error(`CORS: ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── HTTP logging (Morgan → Winston stream) ───────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}))

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'StitchBazaar API is running', timestamp: new Date() })
})

// ── API v1 routes ────────────────────────────────────────────────
const v1 = '/api/v1'
app.use(`${v1}/auth`,       authRoutes)
app.use(`${v1}/products`,   productRoutes)
app.use(`${v1}/variants`,   variantRoutes)
app.use(`${v1}/categories`, categoryRoutes)
app.use(`${v1}/vendors`,    vendorRoutes)
app.use(`${v1}/orders`,     orderRoutes)
app.use(`${v1}/reviews`,    reviewRoutes)
app.use(`${v1}/wishlist`,   wishlistRoutes)
app.use(`${v1}/admin`,      adminRoutes)
app.use(`${v1}/upload`,     uploadRoutes)
app.use('/sitemap.xml',          sitemapRoutes)
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain')
  res.send(`User-agent: *\nAllow: /\nSitemap: ${process.env.CLIENT_URL || 'https://stitchbazaar.pk'}/sitemap.xml`)
})
app.use(`${v1}/notifications`,   notificationRoutes)
app.use(`${v1}/coupons`,         couponRoutes)
app.use(`${v1}/import`,          importRoutes)
app.use(`${v1}/shipping`,        shippingRoutes)
app.use(`${v1}/refunds`,         refundRoutes)
app.use(`${v1}`,                 questionRoutes)   // /products/:id/questions + /questions/:id
app.use(`${v1}/cart`,            cartRoutes)
app.use(`${v1}/conversations`,   chatRoutes)

// ── 404 + error handlers ─────────────────────────────────────────
app.use(notFound)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app)
}
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`StitchBazaar server running on port ${PORT}`)
  startCartRecoveryCron()
})

export default app
