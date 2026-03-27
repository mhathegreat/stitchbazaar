/**
 * StitchBazaar Database Seed
 * Creates admin, vendors, categories, and sample products.
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
      city:     'Karachi',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // ── 2. Vendor users ───────────────────────────────────────────
  const vendorPassword = await bcrypt.hash('Vendor@1234', 12)

  const vendorUser1 = await prisma.user.upsert({
    where:  { email: 'lahorekraft@stitchbazaar.pk' },
    update: {},
    create: {
      name:     'Ayesha Malik',
      email:    'lahorekraft@stitchbazaar.pk',
      password: vendorPassword,
      role:     'vendor',
      city:     'Lahore',
    },
  })

  const vendorUser2 = await prisma.user.upsert({
    where:  { email: 'karachiyarn@stitchbazaar.pk' },
    update: {},
    create: {
      name:     'Fatima Zahra',
      email:    'karachiyarn@stitchbazaar.pk',
      password: vendorPassword,
      role:     'vendor',
      city:     'Karachi',
    },
  })

  const vendorUser3 = await prisma.user.upsert({
    where:  { email: 'islamabadcraft@stitchbazaar.pk' },
    update: {},
    create: {
      name:     'Sana Tariq',
      email:    'islamabadcraft@stitchbazaar.pk',
      password: vendorPassword,
      role:     'vendor',
      city:     'Islamabad',
    },
  })

  // ── 3. Vendor profiles ────────────────────────────────────────
  const vendor1 = await prisma.vendor.upsert({
    where:  { userId: vendorUser1.id },
    update: {},
    create: {
      userId:          vendorUser1.id,
      shopName:        'Lahore Kraft Studio',
      shopDescription: 'Premium hand-embroidered fabrics and kits from the heart of Lahore. Specialising in traditional Pakistani craft supplies.',
      colorTheme:      '#C88B00',
      city:            'Lahore',
      status:          'active',
      commissionRate:  10,
    },
  })

  const vendor2 = await prisma.vendor.upsert({
    where:  { userId: vendorUser2.id },
    update: {},
    create: {
      userId:          vendorUser2.id,
      shopName:        'Karachi Yarn Co.',
      shopDescription: 'The finest imported and local yarns for knitting and crochet. Serving crafters across Pakistan since 2018.',
      colorTheme:      '#D85A30',
      city:            'Karachi',
      status:          'active',
      commissionRate:  10,
    },
  })

  const vendor3 = await prisma.vendor.upsert({
    where:  { userId: vendorUser3.id },
    update: {},
    create: {
      userId:          vendorUser3.id,
      shopName:        'Capital Craft House',
      shopDescription: 'Needles, hoops, frames, and all the tools you need to bring your craft projects to life.',
      colorTheme:      '#5A8A6A',
      city:            'Islamabad',
      status:          'active',
      commissionRate:  10,
    },
  })

  console.log('✅ Vendors created')

  // ── 4. Categories ─────────────────────────────────────────────
  const catData = [
    { slug: 'yarn-thread',   name: 'Yarn & Thread',   color: '#C88B00', description: 'Wool, cotton, acrylic and silk yarns',               image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { slug: 'needles-hooks', name: 'Needles & Hooks', color: '#D85A30', description: 'Knitting needles, crochet hooks, darning needles',    image: 'https://images.unsplash.com/photo-1604170937700-84cfad6413e2?w=600&q=80' },
    { slug: 'embroidery',    name: 'Embroidery',       color: '#6A4C93', description: 'Embroidery floss, hoops, fabric and kits',            image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80' },
    { slug: 'fabric',        name: 'Fabric & Canvas',  color: '#457B9D', description: 'Aida cloth, linen, cotton canvas',                   image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80' },
    { slug: 'kits-patterns', name: 'Kits & Patterns',  color: '#0F6E56', description: 'Complete craft kits and printed patterns',            image: 'https://images.unsplash.com/photo-1615486511262-c7e080240e9e?w=600&q=80' },
    { slug: 'tools-storage', name: 'Tools & Storage',  color: '#2DC653', description: 'Scissors, stitch markers, project bags',             image: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=600&q=80' },
  ]
  const categories = await Promise.all(
    catData.map(c => prisma.category.upsert({
      where:  { slug: c.slug },
      update: { image: c.image, color: c.color },
      create: c,
    }))
  )

  const [catYarn, catNeedles, catEmbroidery, catFabric, catKits, catTools] = categories
  console.log('✅ Categories created')

  // ── 5. Products ───────────────────────────────────────────────
  const products = [
    // Lahore Kraft Studio products
    {
      vendorId:    vendor1.id,
      categoryId:  catEmbroidery.id,
      name:        'Traditional Phulkari Embroidery Kit',
      nameUrdu:    'روایتی پھلکاری کڑھائی کٹ',
      description: 'Complete Phulkari embroidery kit including pre-marked fabric, coloured silk threads, needle, and step-by-step instruction card in Urdu and English. Perfect for beginners and experienced crafters alike.',
      basePrice:   249900, // Rs. 2499
      stock:       45,
      status:      'active',
      tags:        ['phulkari', 'embroidery', 'kit', 'traditional', 'silk'],
      images:      ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80'],
    },
    {
      vendorId:    vendor1.id,
      categoryId:  catEmbroidery.id,
      name:        'Kashmiri Crewel Embroidery Set',
      nameUrdu:    'کشمیری کروئل کڑھائی سیٹ',
      description: 'Premium Kashmiri crewel embroidery set with hand-dyed wool threads in 24 vibrant colours, embroidery hoop (12 inch), and linen fabric. Inspired by traditional Kashmiri motifs.',
      basePrice:   349900, // Rs. 3499
      salePrice:   279900, // Rs. 2799 on sale
      saleEndsAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      stock:       20,
      status:      'active',
      tags:        ['kashmiri', 'crewel', 'embroidery', 'wool', 'hoop'],
      images:      ['https://images.unsplash.com/photo-1584811644165-33078f50eb15?w=600&q=80'],
    },
    {
      vendorId:    vendor1.id,
      categoryId:  catFabric.id,
      name:        'Aida Cloth 14-Count White (50x50cm)',
      nameUrdu:    'آئیڈا کپڑا 14 کاؤنٹ سفید',
      description: 'High quality 14-count Aida cloth for cross stitch. Pre-washed and pre-shrunk. 50x50cm. Perfect for medium to large cross stitch projects.',
      basePrice:   59900, // Rs. 599
      stock:       150,
      status:      'active',
      tags:        ['aida', 'fabric', 'cross-stitch', 'white', '14-count'],
      images:      ['https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=600&q=80'],
    },
    {
      vendorId:    vendor1.id,
      categoryId:  catEmbroidery.id,
      name:        'DMC Stranded Cotton Floss — 50 Colour Pack',
      nameUrdu:    'ڈی ایم سی سوتی دھاگہ 50 رنگ',
      description: 'Genuine DMC stranded cotton embroidery floss in 50 assorted colours. Each skein is 8 metres. Includes a colour card for reference.',
      basePrice:   189900, // Rs. 1899
      stock:       60,
      status:      'active',
      tags:        ['dmc', 'floss', 'embroidery', 'thread', 'cotton'],
      images:      ['https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=600&q=80'],
    },

    // Karachi Yarn Co. products
    {
      vendorId:    vendor2.id,
      categoryId:  catYarn.id,
      name:        'Merino Wool Yarn — Natural White 200g',
      nameUrdu:    'میرینو اون یارن — قدرتی سفید',
      description: 'Super soft 100% merino wool yarn, perfect for babies and sensitive skin. 200g skein, approximately 400m. DK weight. Ideal for knitting sweaters, scarves and baby clothes.',
      basePrice:   159900, // Rs. 1599
      stock:       85,
      status:      'active',
      tags:        ['merino', 'wool', 'yarn', 'dk', 'natural', 'baby'],
      images:      ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
    },
    {
      vendorId:    vendor2.id,
      categoryId:  catYarn.id,
      name:        'Cotton Crochet Yarn Bundle — 10 Colours',
      nameUrdu:    'کاٹن کروشیا یارن بنڈل',
      description: 'Pakistani hand-spun cotton yarn bundle in 10 traditional colours including indigo, terracotta, saffron, and emerald. Each ball is 100g / 200m. Fingering weight. Great for amigurumi and dishcloths.',
      basePrice:   129900, // Rs. 1299
      salePrice:   99900,  // Rs. 999 on sale
      saleEndsAt:  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      stock:       40,
      status:      'active',
      tags:        ['cotton', 'crochet', 'yarn', 'bundle', 'handspun'],
      images:      ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&q=80'],
    },
    {
      vendorId:    vendor2.id,
      categoryId:  catYarn.id,
      name:        'Chunky Acrylic Yarn — Midnight Blue 300g',
      nameUrdu:    'چنکی اکریلک یارن — گہرا نیلا',
      description: 'Thick and cosy chunky acrylic yarn in deep midnight blue. Machine washable. 300g / 150m. Bulky weight 6. Great for quick knit blankets, hats and cowls.',
      basePrice:   89900, // Rs. 899
      stock:       70,
      status:      'active',
      tags:        ['chunky', 'acrylic', 'yarn', 'bulky', 'blue'],
      images:      ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80'],
    },
    {
      vendorId:    vendor2.id,
      categoryId:  catYarn.id,
      name:        'Silk & Wool Blend Lace Yarn — Rose Gold',
      nameUrdu:    'ریشم اور اون ملا ہوا لیس یارن',
      description: 'Luxurious 70/30 silk and merino wool blend lace weight yarn in a beautiful rose gold colourway. 50g / 400m. Perfect for shawls, wraps and fine knits.',
      basePrice:   219900, // Rs. 2199
      stock:       25,
      status:      'active',
      tags:        ['silk', 'wool', 'lace', 'luxury', 'shawl'],
      images:      ['https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80'],
    },

    // Capital Craft House products
    {
      vendorId:    vendor3.id,
      categoryId:  catNeedles.id,
      name:        'Bamboo Knitting Needle Set — 15 Pairs',
      nameUrdu:    'بانس کی بنائی سوئی سیٹ',
      description: 'Complete set of 15 pairs of smooth bamboo knitting needles in sizes 2mm to 10mm. Stored in a zipped canvas roll. Lightweight and warm to the touch. Great starter set.',
      basePrice:   149900, // Rs. 1499
      stock:       55,
      status:      'active',
      tags:        ['bamboo', 'knitting', 'needles', 'set', 'beginner'],
      images:      ['https://images.unsplash.com/photo-1573441090541-a7b8aabc4d13?w=600&q=80'],
    },
    {
      vendorId:    vendor3.id,
      categoryId:  catNeedles.id,
      name:        'Ergonomic Crochet Hook Set — 9 Sizes',
      nameUrdu:    'آرام دہ کروشیا ہک سیٹ',
      description: 'Set of 9 ergonomic crochet hooks with soft rubber grip handles in sizes 2mm to 6mm. Reduces hand fatigue during long crochet sessions. Includes a carry case.',
      basePrice:   119900, // Rs. 1199
      salePrice:   89900,  // Rs. 899
      saleEndsAt:  new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      stock:       40,
      status:      'active',
      tags:        ['crochet', 'hooks', 'ergonomic', 'set', 'hooks'],
      images:      ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&q=80'],
    },
    {
      vendorId:    vendor3.id,
      categoryId:  catTools.id,
      name:        'Wooden Embroidery Hoop Set — 4 Sizes',
      nameUrdu:    'لکڑی کی کڑھائی ہوپ سیٹ',
      description: 'Set of 4 smooth beechwood embroidery hoops: 4", 6", 8", and 10". Adjustable screw tension. Can be used for display framing after stitching.',
      basePrice:   79900, // Rs. 799
      stock:       90,
      status:      'active',
      tags:        ['hoop', 'embroidery', 'wooden', 'beechwood', 'set'],
      images:      ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'],
    },
    {
      vendorId:    vendor3.id,
      categoryId:  catKits.id,
      name:        'Beginner Cross Stitch Kit — Mughal Floral',
      nameUrdu:    'ابتدائی کراس سٹچ کٹ — مغل پھول',
      description: 'Beautiful beginner cross stitch kit featuring a traditional Mughal floral motif. Includes 14-count Aida cloth with printed pattern, DMC floss, needle, and full instructions in Urdu and English.',
      basePrice:   179900, // Rs. 1799
      stock:       35,
      status:      'active',
      tags:        ['cross-stitch', 'kit', 'beginner', 'mughal', 'floral'],
      images:      ['https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=600&q=80'],
    },
    {
      vendorId:    vendor3.id,
      categoryId:  catTools.id,
      name:        'Stainless Steel Embroidery Scissors — Floral Handle',
      nameUrdu:    'اسٹیل کڑھائی قینچی — پھول ہینڈل',
      description: 'Sharp precision embroidery scissors with beautiful floral engraved handles. 10cm. Stainless steel blades. Comes in a protective leather pouch.',
      basePrice:   44900, // Rs. 449
      stock:       120,
      status:      'active',
      tags:        ['scissors', 'embroidery', 'stainless-steel', 'floral'],
      images:      ['https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=600&q=80'],
    },
  ]

  let created = 0
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name, vendorId: p.vendorId },
    })
    if (!existing) {
      await prisma.product.create({ data: p })
      created++
    }
  }
  console.log(`✅ ${created} products created (${products.length - created} already existed)`)

  // ── 6. Shipping rates ─────────────────────────────────────────
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

  // ── 7. Sample coupon ──────────────────────────────────────────
  await prisma.coupon.upsert({
    where:  { code: 'WELCOME10' },
    update: {},
    create: {
      code:      'WELCOME10',
      type:      'percentage',
      value:     10,
      minOrder:  100000, // Rs. 1000 minimum
      maxUses:   1000,
      active:    true,
    },
  })
  console.log('✅ Sample coupon WELCOME10 created (10% off, min order Rs. 1000)')

  console.log('\n🎉 Seed complete!')
  console.log('─────────────────────────────────────────')
  console.log('Admin login:  admin@stitchbazaar.pk  /  Admin@1234')
  console.log('Vendor login: lahorekraft@stitchbazaar.pk  /  Vendor@1234')
  console.log('─────────────────────────────────────────')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
