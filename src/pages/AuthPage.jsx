import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSent(true)
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}`,
      })
      if (error) setError(error.message)
      else setSent(true)
    }

    setLoading(false)
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
    setSent(false)
    setPassword('')
  }

  if (sent && mode === 'signup') {
    return (
      <div className="min-h-svh flex items-center justify-center px-6 bg-stone-800">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold text-stone-100 mb-2">Check your email</h2>
          <p className="text-stone-500 text-sm">We sent a confirmation link to <strong className="text-stone-300">{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    )
  }

  if (sent && mode === 'forgot') {
    return (
      <div className="min-h-svh flex items-center justify-center px-6 bg-stone-800">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold text-stone-100 mb-2">Reset link sent</h2>
          <p className="text-stone-500 text-sm">Check your email at <strong className="text-stone-300">{email}</strong> and click the link to reset your password.</p>
          <button
            onClick={() => switchMode('signin')}
            className="mt-6 text-sm text-amber-600 hover:text-amber-500 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-6 bg-stone-800">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-stone-100 tracking-tight">Root</h1>
          <p className="text-stone-500 text-sm mt-2">Your hair history, wherever you go.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
                placeholder="••••••••"
              />
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="mt-1.5 text-xs text-stone-500 hover:text-stone-400 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {mode === 'forgot' ? (
          <p className="text-center text-sm text-stone-600 mt-8">
            <button onClick={() => switchMode('signin')} className="text-amber-600 font-medium hover:text-amber-500 transition-colors">
              Back to sign in
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-stone-600 mt-8">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-amber-600 font-medium hover:text-amber-500 transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}

        {mode !== 'forgot' && (
          <div className="mt-6 pt-6 border-t border-stone-600 text-center">
            <p className="text-xs text-stone-600 mb-1">Are you a specialist?</p>
            <a
              href="/specialist/signup"
              className="text-sm text-amber-600 font-medium hover:text-amber-500 transition-colors"
            >
              Join as a specialist →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
