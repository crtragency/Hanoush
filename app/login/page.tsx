'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!email.trim()) {
          setError('Please enter your email')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, email: email.trim(), password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Could not create account')
          setLoading(false)
          return
        }
      }

      const result = await signIn('credentials', {
        redirect: false,
        name: trimmedName,
        password,
      })

      if (result?.error) {
        setError(mode === 'signup' ? 'Account created, but sign in failed. Try logging in.' : 'Invalid name or password')
        setLoading(false)
        return
      }

      router.replace('/')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C2185B] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#FFB6C1]/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#F8BBD9]/40 blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl p-10 shadow-xl border border-pink-100 w-full max-w-sm text-center animate-scale-in">
        {/* Neutral sparkle badge (replaces the personal photo) */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center shadow-lg ring-4 ring-pink-100 bg-gradient-to-br from-[#FFB6C1] to-[#C2185B]">
          <span className="text-4xl text-white">✦</span>
        </div>

        <h1 className="font-playfair text-3xl font-bold text-[#3D0026] mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-sm text-[#C2185B]/70 font-medium mb-8 tracking-wide">
          {mode === 'login' ? 'Sign in to your task manager' : 'Set up your personal task manager'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-medium text-[#3D0026] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="username"
              maxLength={50}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#FFB6C1] focus:border-[#C2185B] focus:outline-none text-[#3D0026] placeholder:text-gray-300 transition-colors"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#3D0026] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#FFB6C1] focus:border-[#C2185B] focus:outline-none text-[#3D0026] placeholder:text-gray-300 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#3D0026] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#FFB6C1] focus:border-[#C2185B] focus:outline-none text-[#3D0026] placeholder:text-gray-300 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-rose-600 px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C2185B] hover:bg-[#880E4F] text-white font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading && (
              <div className="w-5 h-5 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
            )}
            {loading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#C2185B] font-semibold hover:text-[#880E4F] transition-colors"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        <p className="text-xs text-gray-400 mt-8">
          Your tasks, beautifully organized ✨
        </p>
      </div>
    </div>
  )
}
