'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { register } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'
import { validateEmail, validateKenyanPhone } from '@/lib/validation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const [form, setForm] = useState({ email: '', username: '', password: '', first_name: '', last_name: '', phone_number: '', role: 'CUSTOMER' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(form.email)) {
      setError('Please provide a valid email address')
      return
    }
    if (form.phone_number && !validateKenyanPhone(form.phone_number)) {
      setError('Please provide a valid Kenyan phone number (starts with +254, 07, or 01, max 12 digits)')
      return
    }
    setLoading(true); setError('')
    try {
      await register(form)
      const targetUrl = redirectParam ? decodeURIComponent(redirectParam) : '/'
      window.location.href = targetUrl
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md glass rounded-3xl p-8 animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          <span className="text-primary">Duka</span><span className="text-accent">Core</span>
        </div>
      </div>

      <h1 className="text-xl font-bold text-center text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Create your account
      </h1>
      <p className="text-sm text-muted text-center mb-6">
        Join thousands of shoppers and vendors on DukaCore
      </p>

      {error && (
        <div className="bg-danger/10 text-danger text-sm font-medium p-3 rounded-xl mb-4 border border-danger/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">First Name</label>
            <input type="text" name="first_name" placeholder="John" required
              value={form.first_name} onChange={handleChange} className="input-glass" autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Last Name</label>
            <input type="text" name="last_name" placeholder="Doe" required
              value={form.last_name} onChange={handleChange} className="input-glass" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Username</label>
          <input type="text" name="username" placeholder="johndoe123" required
            value={form.username} onChange={handleChange} className="input-glass" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Email Address</label>
          <input type="email" name="email" placeholder="you@email.com" required
            value={form.email} onChange={handleChange} className="input-glass" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Phone Number (for M-Pesa)</label>
          <input type="tel" name="phone_number" placeholder="+254712345678"
            value={form.phone_number} onChange={handleChange} className="input-glass" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} name="password" placeholder="Min 8 characters" required minLength={8}
              value={form.password} onChange={handleChange} className="input-glass pr-11" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer z-10">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-pill-primary w-full py-3 text-sm mt-2">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center mt-5 text-sm text-muted">
        Already have an account?{' '}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setLoading(true);
            const loginUrl = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'
            router.push(loginUrl);
          }} 
          className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12 bg-surface">
      <Suspense fallback={<div className="glass p-8 rounded-3xl text-center">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
