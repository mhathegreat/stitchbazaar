/**
 * Wipes all users (and all cascaded data) then creates a clean admin account.
 * Run: DATABASE_URL=... node scripts/reset-users.js
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all data in dependency order...')

  await prisma.auditLog.deleteMany()
  await prisma.question.deleteMany()
  await prisma.savedCart.deleteMany()
  await prisma.bankDetail.deleteMany()
  await prisma.review.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.refund.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.shippingRate.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.user.deleteMany()

  console.log('All users and related data deleted.')

  const hashed = await bcrypt.hash('Admin@1234', 12)
  const admin = await prisma.user.create({
    data: {
      name:     'Admin',
      email:    'admin@stitchbazaar.pk',
      password: hashed,
      role:     'admin',
    },
  })

  console.log('Admin account created:')
  console.log('  Email:   ', admin.email)
  console.log('  Password: Admin@1234')
  console.log('  Role:    ', admin.role)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
