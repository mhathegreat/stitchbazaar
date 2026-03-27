/**
 * Wishlist API service
 */
import api from './client.js'

export const wishlistApi = {
  get: () =>
    api.get('/wishlist').then(r => r.data),

  add: (productId) =>
    api.post('/wishlist', { productId }).then(r => r.data),

  remove: (productId) =>
    api.delete(`/wishlist/${productId}`).then(r => r.data),
}
