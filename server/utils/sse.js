/**
 * Server-Sent Events (SSE) client manager.
 * Keeps a registry of connected clients keyed by userId.
 * Other modules call push() to send events to specific users or roles.
 * Every push is also persisted to the Notification table so history survives page refresh.
 */

import prisma from './prisma.js'

/** @type {Map<string, Set<import('express').Response>>} userId → Set of SSE responses */
const clients = new Map()

/** Save a notification to the DB (fire-and-forget, never throws). */
function saveNotification(userId, event) {
  prisma.notification.create({
    data: { userId, type: event.type, payload: event.payload ?? {} },
  }).catch(() => { /* non-critical */ })
}

/**
 * Register a new SSE connection for a user.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set())
  clients.get(userId).add(res)
}

/**
 * Remove an SSE connection (on client disconnect).
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function removeClient(userId, res) {
  const set = clients.get(userId)
  if (!set) return
  set.delete(res)
  if (set.size === 0) clients.delete(userId)
}

/**
 * Push an event to a specific user and persist it.
 * @param {string} userId
 * @param {{ type: string, payload: object }} event
 */
export function pushToUser(userId, event) {
  saveNotification(userId, event)
  const set = clients.get(userId)
  if (!set) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const res of set) {
    try { res.write(data) } catch { /* client gone */ }
  }
}

/**
 * Push an event to all users with a given role.
 * Persists to ALL users with that role in DB (even if offline),
 * then delivers via SSE to currently connected ones.
 * @param {string} role
 * @param {{ type: string, payload: object }} event
 */
export function pushToRole(role, event) {
  // Persist to every user with this role — regardless of whether they're connected
  prisma.user.findMany({ where: { role }, select: { id: true } })
    .then(users => {
      for (const { id } of users) saveNotification(id, event)
    })
    .catch(() => { /* non-critical */ })

  // Deliver in real-time to connected users
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const [, set] of clients) {
    for (const res of set) {
      try {
        if (res._sseRole === role) res.write(data)
      } catch { /* client gone */ }
    }
  }
}

/**
 * Push an event to all users with a given role, but skip users who have
 * muted this notification type via their notificationPrefs.
 * @param {string} role
 * @param {{ type: string, payload: object }} event
 * @param {string} prefKey  — the notificationPrefs key that mutes this type (e.g. 'mute_refund_requested')
 */
export function pushToRoleFiltered(role, event, prefKey) {
  prisma.user.findMany({ where: { role }, select: { id: true, notificationPrefs: true } })
    .then(users => {
      for (const u of users) {
        if (u.notificationPrefs?.[prefKey] === true) continue
        saveNotification(u.id, event)

        // Real-time delivery to connected client
        const set = clients.get(u.id)
        if (!set) continue
        const data = `data: ${JSON.stringify(event)}\n\n`
        for (const res of set) {
          try { res.write(data) } catch { /* client gone */ }
        }
      }
    })
    .catch(() => { /* non-critical */ })
}

/**
 * Push an event to all connected clients and persist to each.
 * @param {{ type: string, payload: object }} event
 */
export function pushToAll(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const [userId, set] of clients) {
    saveNotification(userId, event)
    for (const res of set) {
      try { res.write(data) } catch { /* client gone */ }
    }
  }
}
