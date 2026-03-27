/**
 * Product API service
 */
import api from './client.js'

export const productsApi = {
  list: (params = {}) =>
    api.get('/products', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/products/${id}`).then(r => r.data),

  mine: (params = {}) =>
    api.get('/products/vendor/mine', { params }).then(r => r.data),

  create: (body) =>
    api.post('/products', body).then(r => r.data),

  update: (id, body) =>
    api.put(`/products/${id}`, body).then(r => r.data),

  delete: (id) =>
    api.delete(`/products/${id}`).then(r => r.data),
}
