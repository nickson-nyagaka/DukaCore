'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const loggedUser = await login(identifier, password)
      const defaultRedirect = loggedUser.role === 'CUSTOMER' ? '/' : '/admin'
      const targetUrl = redirectParam ? decodeURIComponent(redirectParam) : defaultRedirect
      window.location.href = targetUrl
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md glass rounded-3xl p-8 animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          <span className="text-primary">Mavine</span> <span className="text-accent">Households</span>
        </div>
        <p className="text-xs text-muted mt-1 font-medium">Quality Home Essentials</p>
      </div>

      <h1 className="text-xl font-bold text-center text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Welcome back
      </h1>
      <p className="text-sm text-muted text-center mb-6">
        {redirectParam ? 'Sign in to add items to your cart & checkout' : 'Sign in to your account to continue shopping'}
      </p>

      {error && (
        <div className="bg-danger/10 text-danger text-sm font-medium p-3 rounded-xl mb-4 border border-danger/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Email Address or Username</label>
          <input
            type="text" placeholder="username or you@email.com" required
            value={identifier} onChange={e => setIdentifier(e.target.value)}
            className="input-glass"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} placeholder="••••••••" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-glass pr-11"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer z-10">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-pill-primary w-full py-3 text-sm mt-2 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center mt-5 text-sm text-muted">
        Don&apos;t have an account?{' '}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setLoading(true);
            const registerUrl = redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'
            router.push(registerUrl);
          }} 
          className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
        >
          Create one
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12 bg-surface">
      <Suspense fallback={<div className="glass p-8 rounded-3xl text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
