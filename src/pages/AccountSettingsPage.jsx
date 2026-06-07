import { useState } from 'react'
import { supabase } from '../lib/supabase'
import FeedbackModal from '../components/FeedbackModal'

export default function AccountSettingsPage({ user, onBack, role }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) {
      setPwMessage({ error: true, text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ error: true, text: 'Passwords do not match.' })
      return
    }
    setPwSaving(true)
    setPwMessage(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwMessage({ error: true, text: error.message })
    } else {
      setPwMessage({ error: false, text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setPwSaving(false)
  }

  async function deleteAccount() {
    setDeleting(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.ok) {
      await supabase.auth.signOut()
    } else {
      const body = await res.json()
      alert(body.error || 'Failed to delete account.')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fdf7f0] overflow-y-auto">
      {showFeedback && (
        <FeedbackModal userId={user.id} role={role || 'specialist'} onClose={() => setShowFeedback(false)} />
      )}
      <header className="sticky top-0 bg-[#fdf7f0]/95 backdrop-blur border-b border-[#e4d0b8] px-6 py-4 flex items-center gap-3 z-10">
        <button
          onClick={onBack}
          className="text-[#7c5c3e] hover:text-[#1a0e06] transition-colors text-sm flex items-center gap-1.5"
        >
          ← Back
        </button>
        <span className="text-sm font-semibold text-[#1a0e06]">Account Settings</span>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Email */}
        <div>
          <h2 className="text-xs font-medium text-[#7c5c3e] uppercase tracking-wider mb-3">Account</h2>
          <div className="bg-[#f5ede0] border border-[#e4d0b8] rounded-xl px-4 py-3">
            <p className="text-xs text-[#9c7a5e]">Signed in as</p>
            <p className="text-sm text-[#1a0e06] mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Change password */}
        <div>
          <h2 className="text-xs font-medium text-[#7c5c3e] uppercase tracking-wider mb-3">Change Password</h2>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 rounded-xl border border-[#e4d0b8] bg-white text-[#1a0e06] text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder:text-[#b8a090]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl border border-[#e4d0b8] bg-white text-[#1a0e06] text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 placeholder:text-[#b8a090]"
            />
            {pwMessage && (
              <p className={`text-xs ${pwMessage.error ? 'text-red-400' : 'text-green-400'}`}>{pwMessage.text}</p>
            )}
            <button
              onClick={changePassword}
              disabled={pwSaving}
              className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div>
          <h2 className="text-xs font-medium text-[#7c5c3e] uppercase tracking-wider mb-3">Feedback</h2>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full py-3 bg-[#f5ede0] border border-[#e4d0b8] text-[#4a3728] rounded-xl text-sm font-medium hover:bg-[#e8d5b7] transition-colors"
          >
            Send feedback
          </button>
        </div>

        {/* Sign out */}
        <div>
          <h2 className="text-xs font-medium text-[#7c5c3e] uppercase tracking-wider mb-3">Session</h2>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full py-3 bg-[#e8d5b7] text-[#4a3728] rounded-xl text-sm font-medium hover:bg-[#f5ede0] transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Delete account */}
        <div>
          <h2 className="text-xs font-medium text-red-500 uppercase tracking-wider mb-3">Danger Zone</h2>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full py-3 bg-[#f5ede0] border border-red-900 text-red-400 rounded-xl text-sm font-medium hover:bg-red-950 transition-colors"
            >
              Delete account
            </button>
          ) : (
            <div className="bg-[#f5ede0] border border-red-900 rounded-xl p-5 space-y-4">
              <p className="text-sm text-[#4a3728]">This will permanently delete your account and all your data. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-3 bg-[#e8d5b7] text-[#7c5c3e] rounded-xl text-sm font-medium hover:bg-[#f5ede0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-900 text-red-100 rounded-xl text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
