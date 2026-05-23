import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PasswordResetPage({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(onDone, 2000)
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-6 bg-stone-800">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Set new password</h1>
          <p className="text-stone-500 text-sm mt-2">Choose a new password for your account.</p>
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-green-400 text-sm font-medium">Password updated! Signing you in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
