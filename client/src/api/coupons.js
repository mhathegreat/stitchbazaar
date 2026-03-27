import api from './client.js'

export const couponsApi = {
  validate: (code, cartTotal) => api.post('/coupons/validate', { code, cartTotal }).then(r => r.data),
}
