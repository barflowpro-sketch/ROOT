import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const value = `${String(h).padStart(2, '0')}:${m}`
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const ampm = h < 12 ? 'AM' : 'PM'
  return { value, label: `${hour12}:${m} ${ampm}` }
})

export default function BookingModal({ specialist, clientId, onClose, onSuccess }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookedTimes, setBookedTimes] = useState([])

  useEffect(() => {
    if (!date) { setBookedTimes([]); return }
    supabase
      .from('bookings')
      .select('requested_time')
      .eq('specialist_id', specialist.user_id)
      .eq('requested_date', date)
      .in('status', ['pending', 'accepted'])
      .then(({ data }) => {
        setBookedTimes((data || []).map(b => b.requested_time?.slice(0, 5)))
        if (time && data?.some(b => b.requested_time?.slice(0, 5) === time)) setTime('')
      })
  }, [date])

  async function submit() {
    if (!date || !time) { setError('Please pick a date and time.'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('bookings').insert({
      client_id: clientId,
      specialist_id: specialist.user_id,
      requested_date: date,
      requested_time: time,
      client_note: note,
      status: 'pending',
    })

    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-semibold text-stone-100">Request appointment</p>
          <p className="text-xs text-stone-500 mt-0.5">with {specialist.name}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Time</label>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            disabled={!date}
            className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 disabled:opacity-50"
          >
            <option value="">{date ? 'Select a time' : 'Pick a date first'}</option>
            {TIME_SLOTS.map(slot => {
              const taken = bookedTimes.includes(slot.value)
              return (
                <option key={slot.value} value={slot.value} disabled={taken}>
                  {taken ? `${slot.label} — Unavailable` : slot.label}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
            placeholder="Anything you want them to know before the appointment…"
          />
        </div>

        <p className="text-xs text-stone-500">Your hair profile will be shared automatically with this request.</p>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-stone-800 text-stone-400 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
