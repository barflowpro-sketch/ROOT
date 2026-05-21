import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function FeedbackModal({ userId, role, onClose }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('feedback').insert({ user_id: userId, role, message: message.trim() })
    setSending(false)
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-stone-700 border border-stone-600 rounded-t-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Send feedback</h3>
          <p className="text-xs text-stone-500 mt-0.5">What's missing? What could be better?</p>
        </div>

        {sent ? (
          <p className="text-sm text-green-400 text-center py-4">Thanks for your feedback!</p>
        ) : (
          <>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Tell us what you think…"
              className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-stone-600 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={sending || !message.trim()}
                className="flex-1 py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
