/**
 * Axios API client
 * Base URL points to /api/v1 — proxied to Express in dev.
 * Attaches JWT from AuthContext automatically via interceptor.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  withCredentials: true,   // send httpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token stored in-memory (set by AuthContext after login/refresh)
let _accessToken = null
export const setAccessToken = (t) => { _accessToken = t }

api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    // 401 → try one silent refresh, then reject
    // Skip retry if the failing request IS the refresh endpoint (avoids infinite loop)
    const isRefreshCall = err.config?.url?.includes('/auth/refresh')
    if (err.response?.status === 401 && !err.config._retry && !isRefreshCall) {
      err.config._retry = true
      try {
        const { data } = await api.post('/auth/refresh')
        _accessToken = data.data.accessToken
        err.config.headers.Authorization = `Bearer ${_accessToken}`
        return api(err.config)
      } catch {
        _accessToken = null
      }
    }
    return Promise.reject(err)
  }
)

export default api
