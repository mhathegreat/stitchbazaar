/**
 * Auth API service
 */
import api from './client.js'

export const authApi = {
  updateProfile: (body) =>
    api.put('/auth/profile', body).then(r => r.data),
}
