'use client'

import { useEffect } from 'react'
import { Lock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function LoginPromptModal({ isOpen, onClose, message }: LoginPromptModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      // Prefetch login and register routes for zero-delay navigation
      router.prefetch('/login')
      router.prefetch('/register')
    }
  }, [isOpen, router])

  if (!isOpen) return null

  const handleNavigate = (targetPath: string) => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    const redirectUrl = currentPath ? `${targetPath}?redirect=${encodeURIComponent(currentPath)}` : targetPath
    onClose()
    router.push(redirectUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="glass w-full max-w-sm rounded-3xl p-6 relative border border-border shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer p-1 rounded-full hover:bg-surface"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <Lock size={26} />
        </div>

        <h3 className="font-extrabold text-xl mb-1 text-foreground font-heading">
          Sign In Required
        </h3>

        <p className="text-xs text-muted mb-6 leading-relaxed">
          {message || 'Please log in to your account to add products to your cart and proceed with checkout.'}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => handleNavigate('/login')}
            className="btn-pill-primary w-full py-3 text-sm font-bold justify-center"
          >
            Sign In Now
          </button>

          <button
            onClick={() => handleNavigate('/register')}
            className="btn-secondary w-full py-2.5 text-xs font-semibold justify-center rounded-xl"
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  )
}
