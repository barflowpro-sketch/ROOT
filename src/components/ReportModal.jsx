import { useState } from 'react'
import { supabase } from '../lib/supabase'

const REASONS = [
  'Inappropriate content',
  'Spam or scam',
  'Fake profile',
  'Harassment',
  'Other',
]

export default function ReportModal({ reporterId, reportedUserId, context, onClose }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!reason) return
    setLoading(true)
    await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      context,
      reason,
    })
    setDone(true)
    setLoading(false)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-stone-700 border border-stone-600 rounded-t-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-green-400">Report submitted. Thank you.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-stone-100">Report</p>
              <p className="text-xs text-stone-500 mt-0.5">Select a reason for your report.</p>
            </div>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                    reason === r
                      ? 'border-red-700 bg-red-700/10 text-red-400'
                      : 'border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="flex-1 py-3 bg-stone-600 text-stone-400 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={!reason || loading}
                className="flex-1 py-3 bg-red-800 text-red-100 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
