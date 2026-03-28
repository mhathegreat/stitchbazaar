/**
 * Vendor API service
 */
import api from './client.js'

export const vendorsApi = {
  list: (params = {}) =>
    api.get('/vendors', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/vendors/${id}`).then(r => r.data),

  register: (body) =>
    api.post('/vendors/register', body).then(r => r.data),

  updateProfile: (body) =>
    api.put('/vendors/profile', body).then(r => r.data),

  dashboard: () =>
    api.get('/vendors/dashboard').then(r => r.data),

  earnings: () =>
    api.get('/vendors/earnings').then(r => r.data),

  orders: (params = {}) =>
    api.get('/vendors/orders', { params }).then(r => r.data),

  requestPayout: () =>
    api.post('/vendors/payout-request').then(r => r.data),

  updateOrderStatus: (itemId, status) =>
    api.put(`/vendors/orders/${itemId}/status`, { status }).then(r => r.data),

  disputes: () => api.get('/vendors/disputes').then(r => r.data),
  refunds:  () => api.get('/vendors/refunds').then(r => r.data),
}
