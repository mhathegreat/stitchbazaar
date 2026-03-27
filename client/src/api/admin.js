/**
 * Admin API service
 */
import api from './client.js'

export const adminApi = {
  dashboard: () =>
    api.get('/admin/dashboard').then(r => r.data),

  // Vendors
  vendors: (params = {}) =>
    api.get('/admin/vendors', { params }).then(r => r.data),
  approveVendor: (id) =>
    api.put(`/admin/vendors/${id}/approve`).then(r => r.data),
  rejectVendor: (id) =>
    api.put(`/admin/vendors/${id}/reject`).then(r => r.data),

  // Payouts
  payouts: (params = {}) =>
    api.get('/admin/payouts', { params }).then(r => r.data),
  processPayout: (id, body) =>
    api.put(`/admin/payouts/${id}/process`, body).then(r => r.data),

  // Disputes
  disputes: (params = {}) =>
    api.get('/admin/disputes', { params }).then(r => r.data),
  resolveDispute: (id, body) =>
    api.put(`/admin/disputes/${id}/resolve`, body).then(r => r.data),

  // Orders
  orders: (params = {}) =>
    api.get('/admin/orders', { params }).then(r => r.data),
  updateOrderStatus: (id, status) =>
    api.put(`/admin/orders/${id}/status`, { status }).then(r => r.data),

  // Products
  products: (params = {}) =>
    api.get('/admin/products', { params }).then(r => r.data),
  moderateProduct: (id, status) =>
    api.put(`/admin/products/${id}/moderate`, { status }).then(r => r.data),

  // Categories
  categories: () =>
    api.get('/admin/categories').then(r => r.data),
  createCategory: (body) =>
    api.post('/admin/categories', body).then(r => r.data),
  updateCategory: (id, body) =>
    api.put(`/admin/categories/${id}`, body).then(r => r.data),
  deleteCategory: (id) =>
    api.delete(`/admin/categories/${id}`).then(r => r.data),
}
