'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: ('ADMIN' | 'STAFF' | 'CUSTOMER')[]
  allowedPermissions?: string[]
}

export default function RoleGuard({ children, allowedRoles, allowedPermissions }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      if (window.location.pathname.startsWith('/admin')) {
        router.push('/admin-login')
      } else {
        router.push('/login')
      }
      return
    }

    let isAuthorized = true

    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
      isAuthorized = false
    }

    if (allowedPermissions && user.permissions) {
      const hasPerm = allowedPermissions.some(p => user.permissions?.includes(p))
      if (!hasPerm) {
        isAuthorized = false
      }
    }

    if (!isAuthorized) {
      if (user.role === 'CUSTOMER') {
        router.push('/')
      } else {
        router.push('/admin')
      }
    }
  }, [user, loading, router, allowedRoles, allowedPermissions])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  if (allowedRoles && !allowedRoles.includes(user.role as any)) return null

  if (allowedPermissions && user.permissions) {
    const hasPerm = allowedPermissions.some(p => user.permissions?.includes(p))
    if (!hasPerm) return null
  }

  return <>{children}</>
}
