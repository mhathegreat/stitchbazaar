/**
 * Server-Sent Events (SSE) client manager.
 * Keeps a registry of connected clients keyed by userId.
 * Other modules call push() to send events to specific users or roles.
 */

/** @type {Map<string, Set<import('express').Response>>} userId → Set of SSE responses */
const clients = new Map()

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
 * Push an event to a specific user.
 * @param {string} userId
 * @param {{ type: string, payload: object }} event
 */
export function pushToUser(userId, event) {
  const set = clients.get(userId)
  if (!set) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const res of set) {
    try { res.write(data) } catch { /* client gone */ }
  }
}

/**
 * Push an event to all connected users with a given role.
 * Requires that clients were registered with a role tag.
 * @param {string} role
 * @param {{ type: string, payload: object }} event
 */
export function pushToRole(role, event) {
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
 * Push an event to all connected clients.
 * @param {{ type: string, payload: object }} event
 */
export function pushToAll(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`
  for (const [, set] of clients) {
    for (const res of set) {
      try { res.write(data) } catch { /* client gone */ }
    }
  }
}
