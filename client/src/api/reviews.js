/**
 * Review API service
 */
import api from './client.js'

export const reviewsApi = {
  list: (productId, params = {}) =>
    api.get(`/reviews/product/${productId}`, { params }).then(r => r.data),

  submit: (body) =>
    api.post('/reviews', body).then(r => r.data),
}
