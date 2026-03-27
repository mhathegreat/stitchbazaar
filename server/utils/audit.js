/**
 * Audit log utility.
 * Fire-and-forget writes to the audit_logs table.
 * Usage: audit(req, 'vendor.approved', 'Vendor', vendorId, { shopName })
 */

import prisma from './prisma.js'
import { logger } from './logger.js'

/**
 * @param {import('express').Request} req
 * @param {string} action
 * @param {string} [entityType]
 * @param {string} [entityId]
 * @param {object} [meta]
 */
export function audit(req, action, entityType, entityId, meta) {
  const user = req?.user
  prisma.auditLog.create({
    data: {
      userId:     user?.id     || null,
      userEmail:  user?.email  || null,
      role:       user?.role   || null,
      action,
      entityType: entityType || null,
      entityId:   entityId   || null,
      meta:       meta       || undefined,
      ip:         req?.ip    || null,
    },
  }).catch(err => logger.warn(`Audit log failed: ${err.message}`))
}
