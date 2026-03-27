/**
 * AuthContext
 * Provides user authentication state and helpers across the app.
 * Stores JWT in memory; refresh token in httpOnly cookie (set by server).
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, name, email, role }
  const [token,   setToken]   = useState(null)   // access JWT (in-memory)
  const [loading, setLoading] = useState(true)

  /** Attempt silent token refresh on mount */
  useEffect(() => {
    api.post('/auth/refresh')
      .then(({ data }) => {
        setToken(data.data.accessToken)
        setUser(data.data.user)
      })
      .catch(() => { /* not logged in — that's fine */ })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.data.accessToken)
    setUser(data.data.user)
    return data.data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, loading, login, logout, isAuth: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** @returns {{ user, token, loading, login, logout, isAuth }} */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
