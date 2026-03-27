/**
 * Shared Prisma client singleton.
 * Import this everywhere instead of creating a new PrismaClient() each time.
 */

import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { logger } from './logger.js'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn'  },
  ],
})

prisma.$on('error', (e) => logger.error(`Prisma error: ${e.message}`))
prisma.$on('warn',  (e) => logger.warn(`Prisma warn: ${e.message}`))

export default prisma
