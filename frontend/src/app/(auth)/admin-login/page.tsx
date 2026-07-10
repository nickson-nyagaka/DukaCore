'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const loggedUser = await login(identifier, password)
      if (loggedUser.role === 'CUSTOMER') {
        router.push('/')
      } else {
        router.push('/admin')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-md glass rounded-3xl p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="text-primary">Duka</span><span className="text-accent">Core</span>
          </div>
          <p className="text-xs text-muted mt-1 font-medium">Your Marketplace Platform</p>
        </div>

        <h1 className="text-xl font-bold text-center text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Admin Portal
        </h1>
        <p className="text-sm text-muted text-center mb-6">
          Sign in to manage your store and catalog
        </p>

        {error && (
          <div className="bg-danger/10 text-danger text-sm font-medium p-3 rounded-xl mb-4 border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Email Address or Username</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text" placeholder="username or you@email.com" required
                value={identifier} onChange={e => setIdentifier(e.target.value)}
                className="input-glass pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-glass pl-10 pr-11"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-pill-primary w-full py-3 text-sm mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>



        <div className="mt-5 p-4 rounded-2xl bg-primary-light border border-primary/20 text-xs text-muted">
          <strong className="text-foreground font-bold block mb-1">Demo accounts:</strong>
          Superadmin: admin@mve.co.ke / admin123<br />
          Store Owner: store@mve.co.ke / store123
        </div>
      </div>
    </div>
  )
}
