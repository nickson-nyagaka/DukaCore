import { headers, cookies } from 'next/headers'

/**
 * Server-side fetch utility for Server Components.
 * Forwards the incoming Host and Cookie headers to the Django backend,
 * ensuring multi-vendor host resolution works correctly in SSR.
 */
export async function serverFetch(path: string, options?: RequestInit) {
  const headerStore = await headers()
  const host = headerStore.get('host') || 'localhost'
  const cookieStore = await cookies()
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const res = await fetch(`http://backend:8000${path}`, {
    ...options,
    headers: {
      Host: host,
      Cookie: cookieString,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}
