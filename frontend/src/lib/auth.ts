// Auth context and hooks — all calls use relative paths through Next.js API proxy

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  phone_number?: string
  permissions?: string[]
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  }

  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrftoken')
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken
    }
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text()
    let err
    try {
      err = JSON.parse(text)
    } catch (e) {
      console.error(`API Error on ${path}: Received non-JSON response:`, text.substring(0, 500))
      throw new Error(`Server returned an invalid response (not JSON) for ${path}`)
    }
    
    let message = err.message || 'Request failed'
    if (Array.isArray(err.detail)) {
      message = err.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
    } else if (err.detail) {
      message = err.detail
    }
    throw new Error(message)
  }

  const responseText = await res.text()
  try {
    return JSON.parse(responseText)
  } catch (e) {
    console.error(`API Error on ${path}: Received non-JSON response with status 200:`, responseText.substring(0, 500))
    throw new Error(`Server returned an invalid response (not JSON) for ${path}`)
  }
}

export async function login(identifier: string, password: string): Promise<User> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  return data.user
}

export async function register(payload: {
  email: string; username: string; password: string; first_name: string; last_name: string;
  phone_number?: string; role?: string
}): Promise<User> {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.user
}

export async function getMe(): Promise<User> {
  return apiFetch('/api/auth/me')
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/'
}

// React hook
import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const u = await getMe()
      setUser(u)
      return u
    } catch {
      setUser(null)
      return null
    }
  }

  return { user, loading, logout: handleLogout, refreshUser }
}

