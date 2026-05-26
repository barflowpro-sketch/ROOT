import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SpecialistSignupPage() {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError(null)
    setSent(false)
    setPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/'
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'specialist' } }
      })
      if (error) setError(error.message)
      else if (data.session) {
        // confirmation off — already signed in
      } else {
        setSent(true)
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}`,
      })
      if (error) setError(error.message)
      else setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-svh flex items-center justify-center px-6 bg-stone-900">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center mx-auto text-2xl">
            ✉
          </div>
          <h2 className="text-xl font-bold text-stone-100">
            {mode === 'signup' ? 'Check your email' : 'Reset link sent'}
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            {mode === 'signup'
              ? <>We sent a confirmation link to <span className="text-stone-300">{email}</span>. Click it to activate your account.</>
              : <>Check <span className="text-stone-300">{email}</span> for a link to reset your password.</>
            }
          </p>
          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} className="text-sm text-amber-600 hover:text-amber-500 transition-colors">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col bg-stone-900">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Root" className="w-20 h-20 rounded-3xl mx-auto mb-5 shadow-xl" />
          <h1 className="text-3xl font-bold text-stone-100 tracking-tight">
            {mode === 'forgot' ? 'Reset your password' : 'Join as a specialist'}
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            {mode === 'forgot'
              ? "Enter your email and we'll send a reset link"
              : 'Get discovered by clients who already know their hair.'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div className="flex bg-stone-800 rounded-xl p-1 mb-6 w-full max-w-xs">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signin' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-400'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-stone-700 text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-400'}`}
            >
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent placeholder:text-stone-600"
            placeholder="Email address"
          />

          {mode !== 'forgot' && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent placeholder:text-stone-600"
              placeholder="Password"
            />
          )}

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 active:bg-amber-800 transition-colors disabled:opacity-50 shadow-lg shadow-amber-900/30"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create specialist account' : 'Send reset link'}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full text-center text-xs text-stone-600 hover:text-stone-400 transition-colors pt-1"
            >
              Forgot password?
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-center text-xs text-stone-600 hover:text-stone-400 transition-colors pt-1"
            >
              Back to sign in
            </button>
          )}
        </form>

        {mode !== 'forgot' && (
          <div className="mt-10 w-full max-w-xs space-y-3">
            {[
              { icon: '✦', text: 'Clients arrive with their full hair history' },
              { icon: '✦', text: 'No more cold consultations' },
              { icon: '✦', text: 'Get discovered by new clients in your city' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-amber-700 text-xs">{icon}</span>
                <span className="text-xs text-stone-600">{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 text-center border-t border-stone-800 pt-6">
        <p className="text-xs text-stone-600 mb-1">Looking to book a specialist?</p>
        <a href="/" className="text-sm text-amber-600 font-semibold hover:text-amber-500 transition-colors">
          Join Root as a client →
        </a>
      </div>
    </div>
  )
}
