'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/auth'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', password: '', first_name: '', last_name: '', phone_number: '', role: 'CUSTOMER' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await register(form)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" name="first_name" placeholder="John" required
                  value={form.first_name} onChange={handleChange} className="input-glass pl-9" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">Last Name</label>
              <input type="text" name="last_name" placeholder="Doe" required
                value={form.last_name} onChange={handleChange} className="input-glass" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" name="username" placeholder="johndoe123" required
                value={form.username} onChange={handleChange} className="input-glass pl-9" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="email" name="email" placeholder="you@email.com" required
                value={form.email} onChange={handleChange} className="input-glass pl-9" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Phone Number (for M-Pesa)</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="tel" name="phone_number" placeholder="+254712345678"
                value={form.phone_number} onChange={handleChange} className="input-glass pl-9" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type={showPw ? 'text' : 'password'} name="password" placeholder="Min 8 characters" required minLength={8}
                value={form.password} onChange={handleChange} className="input-glass pl-9 pr-11" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer">
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
              router.push('/login');
            }} 
            className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
