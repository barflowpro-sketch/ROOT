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
      <div className="min-h-svh flex items-center justify-center px-6" style={{background: '#fdf7f0'}}>
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-2xl" style={{background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.25)'}}>
            ✉
          </div>
          <h2 className="text-xl font-bold" style={{color: '#1a0e06'}}>
            {mode === 'signup' ? 'Check your email' : 'Reset link sent'}
          </h2>
          <p className="text-sm leading-relaxed" style={{color: '#7c5c3e'}}>
            {mode === 'signup'
              ? <>We sent a confirmation link to <span style={{color: '#1a0e06'}}>{email}</span>. Click it to activate your account.</>
              : <>Check <span style={{color: '#1a0e06'}}>{email}</span> for a link to reset your password.</>
            }
          </p>
          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} className="text-sm text-amber-700 hover:text-amber-600 transition-colors">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col" style={{background: '#fdf7f0'}}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Root" className="w-20 h-20 rounded-3xl mx-auto mb-5 shadow-lg" />
          <h1 className="text-3xl font-bold tracking-tight" style={{color: '#1a0e06'}}>
            {mode === 'forgot' ? 'Reset your password' : 'Join as a specialist'}
          </h1>
          <p className="text-sm mt-2" style={{color: '#9c7a5e'}}>
            {mode === 'forgot'
              ? "Enter your email and we'll send a reset link"
              : 'Get discovered by clients who already know their hair.'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div className="flex rounded-xl p-1 mb-6 w-full max-w-xs" style={{background: '#f0e4d2'}}>
            <button
              onClick={() => switchMode('signin')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={mode === 'signin' ? {background: '#fff', color: '#1a0e06', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'} : {color: '#9c7a5e'}}
            >
              Sign in
            </button>
            <button
              onClick={() => switchMode('signup')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={mode === 'signup' ? {background: '#fff', color: '#1a0e06', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'} : {color: '#9c7a5e'}}
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
            className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            style={{background: '#fff', border: '1px solid #e4d0b8', color: '#1a0e06'}}
            placeholder="Email address"
          />

          {mode !== 'forgot' && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              style={{background: '#fff', border: '1px solid #e4d0b8', color: '#1a0e06'}}
              placeholder="Password"
            />
          )}

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 active:bg-amber-800 transition-colors disabled:opacity-50 shadow-lg shadow-amber-900/20"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create specialist account' : 'Send reset link'}
          </button>

          {mode === 'signin' && (
            <button type="button" onClick={() => switchMode('forgot')} className="w-full text-center text-xs transition-colors pt-1 hover:text-amber-700" style={{color: '#b8a090'}}>
              Forgot password?
            </button>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('signin')} className="w-full text-center text-xs transition-colors pt-1 hover:text-amber-700" style={{color: '#b8a090'}}>
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
                <span className="text-xs" style={{color: '#b8a090'}}>{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 text-center pt-6" style={{borderTop: '1px solid #e4d0b8'}}>
        <p className="text-xs mb-1" style={{color: '#b8a090'}}>Looking to book a specialist?</p>
        <a href="/" className="text-sm text-amber-700 font-semibold hover:text-amber-600 transition-colors">
          Join Root as a client →
        </a>
      </div>
    </div>
  )
}
