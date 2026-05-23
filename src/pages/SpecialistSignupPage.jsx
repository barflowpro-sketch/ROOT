import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SpecialistSignupPage() {
  const [mode, setMode] = useState('signup')
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
      else window.location.href = '/'
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'specialist' } }
      })
      if (error) setError(error.message)
      else if (data.session) {
        // confirmation off — user is already signed in, App.jsx will redirect
      } else {
        setSent(true)
      }
    }

    setLoading(false)
  }

  if (sent) {
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

  return (
    <div className="min-h-svh flex items-center justify-center px-6 bg-stone-800">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <a href="/" className="text-stone-600 text-sm hover:text-stone-400 transition-colors">← Back</a>
          <h1 className="text-3xl font-bold text-stone-100 tracking-tight mt-4">Join as a specialist</h1>
          <p className="text-stone-500 text-sm mt-2">Get discovered by clients who already know their hair history.</p>
        </div>

        <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4 mb-6 space-y-2">
          {[
            'Clients arrive with their full hair history',
            'No more cold consultations',
            'Get discovered by new clients in your city',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">✓</span>
              <p className="text-xs text-stone-400">{item}</p>
            </div>
          ))}
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
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create specialist account'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-600 mt-8">
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setEmail(''); setPassword('') }}
            className="text-amber-600 font-medium hover:text-amber-500 transition-colors"
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
