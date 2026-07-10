'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StoreRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
    </div>
  )
}
