/**
 * StitchBazaar Database Seed
 * Creates admin, categories, shipping rates, and welcome coupon.
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding StitchBazaar database...')

  // ── 1. Admin user ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@stitchbazaar.pk' },
    update: {},
    create: {
      name:     'StitchBazaar Admin',
      email:    'admin@stitchbazaar.pk',
      password: adminPassword,
      role:     'admin',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // ── 2. Categories ─────────────────────────────────────────────
  const catData = [
    { slug: 'yarn-thread',   name: 'Yarn & Thread',   color: '#C88B00', description: 'Wool, cotton, acrylic and silk yarns',               image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { slug: 'needles-hooks', name: 'Needles & Hooks', color: '#D85A30', description: 'Knitting needles, crochet hooks, darning needles',    image: 'https://images.unsplash.com/photo-1604170937700-84cfad6413e2?w=600&q=80' },
    { slug: 'embroidery',    name: 'Embroidery',       color: '#6A4C93', description: 'Embroidery floss, hoops, fabric and kits',            image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80' },
    { slug: 'fabric',        name: 'Fabric & Canvas',  color: '#457B9D', description: 'Aida cloth, linen, cotton canvas',                   image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80' },
    { slug: 'kits-patterns', name: 'Kits & Patterns',  color: '#0F6E56', description: 'Complete craft kits and printed patterns',            image: 'https://images.unsplash.com/photo-1615486511262-c7e080240e9e?w=600&q=80' },
    { slug: 'tools-storage', name: 'Tools & Storage',  color: '#2DC653', description: 'Scissors, stitch markers, project bags',             image: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=600&q=80' },
  ]

  await Promise.all(
    catData.map(c => prisma.category.upsert({
      where:  { slug: c.slug },
      update: { image: c.image, color: c.color },
      create: c,
    }))
  )
  console.log('✅ Categories seeded')

  // ── 3. Shipping rates ─────────────────────────────────────────
  const shippingRates = [
    { city: 'karachi',    rate: 15000, freeAbove: 300000 },
    { city: 'lahore',     rate: 15000, freeAbove: 300000 },
    { city: 'islamabad',  rate: 20000, freeAbove: 300000 },
    { city: 'rawalpindi', rate: 20000, freeAbove: 300000 },
    { city: 'faisalabad', rate: 20000, freeAbove: 300000 },
    { city: 'multan',     rate: 25000, freeAbove: 300000 },
    { city: 'peshawar',   rate: 25000, freeAbove: 300000 },
    { city: 'quetta',     rate: 30000, freeAbove: 500000 },
    { city: 'default',    rate: 30000, freeAbove: 500000 },
  ]

  for (const s of shippingRates) {
    await prisma.shippingRate.upsert({
      where:  { city: s.city },
      update: s,
      create: s,
    })
  }
  console.log('✅ Shipping rates seeded')

  // ── 4. Welcome coupon ─────────────────────────────────────────
  await prisma.coupon.upsert({
    where:  { code: 'WELCOME10' },
    update: {},
    create: {
      code:     'WELCOME10',
      type:     'percentage',
      value:    10,
      minOrder: 100000,
      maxUses:  1000,
      active:   true,
    },
  })
  console.log('✅ Coupon WELCOME10 seeded')

  console.log('\n🎉 Seed complete!')
  console.log('Admin login: admin@stitchbazaar.pk / Admin@1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
