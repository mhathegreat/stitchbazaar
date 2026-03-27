/**
 * Category API service
 */
import api from './client.js'

export const categoriesApi = {
  list: () =>
    api.get('/categories').then(r => r.data),

  get: (slug) =>
    api.get(`/categories/${slug}`).then(r => r.data),
}
