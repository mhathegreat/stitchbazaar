import api from './client.js'

export const chatApi = {
  start: (vendorId, customerId) =>
    api.post('/conversations', { vendorId, ...(customerId ? { customerId } : {}) }).then(r => r.data),

  startAsVendor: (customerId) =>
    api.post('/conversations/as-vendor', { customerId }).then(r => r.data),

  startAsAdmin: (customerId) =>
    api.post('/conversations/as-admin', { customerId }).then(r => r.data),

  list: () =>
    api.get('/conversations').then(r => r.data),

  get: (id, page = 1, limit = 500) =>
    api.get(`/conversations/${id}`, { params: { page, limit } }).then(r => r.data),

  send: (id, body, imageUrl) =>
    api.post(`/conversations/${id}/messages`, { body, ...(imageUrl ? { imageUrl } : {}) }).then(r => r.data),

  markRead: (id) =>
    api.put(`/conversations/${id}/read`).then(r => r.data),
}
