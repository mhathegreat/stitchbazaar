/**
 * Order API service
 */
import api from './client.js'

export const ordersApi = {
  create: (body) =>
    api.post('/orders', body).then(r => r.data),

  list: (params = {}) =>
    api.get('/orders', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/orders/${id}`).then(r => r.data),

  updateStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status }).then(r => r.data),

  dispute: (id, reason) =>
    api.post(`/orders/${id}/dispute`, { reason }).then(r => r.data),
}
