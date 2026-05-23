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

function formatDuration(mins) {
  if (!mins) return ''
  const m = parseInt(mins)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h} hr ${rem} min` : `${h} hr`
}

export default function BookingModal({ specialist, clientId, onClose, onSuccess }) {
  const [selectedService, setSelectedService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookedTimes, setBookedTimes] = useState([])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const availableDays = specialist.available_days || []
  const availableStart = specialist.available_start || null
  const availableEnd = specialist.available_end || null
  const blockedDates = specialist.blocked_dates || []
  const fromGroups = Object.values(specialist.service_groups || {}).flat().filter(Boolean)
  const allServices = fromGroups.length > 0 ? fromGroups : (specialist.services || [])

  const selectedDayName = date ? dayNames[new Date(date + 'T00:00:00').getDay()] : null
  const dayUnavailable = date && availableDays.length > 0 && !availableDays.includes(selectedDayName)
  const dateBlocked = date && blockedDates.includes(date)

  useEffect(() => {
    if (!date || !specialist.user_id) { setBookedTimes([]); return }
    supabase
      .from('bookings')
      .select('requested_time')
      .eq('specialist_id', specialist.user_id)
      .eq('requested_date', date)
      .in('status', ['pending', 'accepted'])
      .then(({ data }) => {
        const times = (data || []).map(b => {
          const t = b.requested_time || ''
          return t.includes(':') ? t.slice(0, 5) : t
        }).filter(Boolean)
        setBookedTimes(times)
        if (time && times.includes(time)) setTime('')
      })
  }, [date])

  const availableSlots = TIME_SLOTS.filter(slot => {
    if (bookedTimes.includes(slot.value)) return false
    if (availableStart && slot.value < availableStart) return false
    if (availableEnd && slot.value >= availableEnd) return false
    return true
  })

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
      service_name: selectedService || null,
      status: 'pending',
    })

    if (error) { setError(error.message); setLoading(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-stone-700 border border-stone-600 rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-semibold text-stone-100">Request appointment</p>
          <p className="text-xs text-stone-500 mt-0.5">with {specialist.name}</p>
        </div>

        {/* Service selector */}
        {allServices.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Service</label>
            <div className="space-y-2">
              {allServices.map(s => (
                <button key={s} type="button"
                  onClick={() => setSelectedService(prev => prev === s ? '' : s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                    selectedService === s ? 'border-amber-700 bg-amber-700/10' : 'border-stone-600 bg-stone-800 hover:border-stone-700'
                  }`}
                >
                  <span className={`text-sm ${selectedService === s ? 'text-amber-400' : 'text-stone-300'}`}>{s}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {specialist.service_durations?.[s] && (
                      <span className="text-xs text-stone-500">{formatDuration(specialist.service_durations[s])}</span>
                    )}
                    {specialist.service_prices?.[s] && (
                      <span className="text-sm font-medium text-amber-500">${specialist.service_prices[s]}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Date</label>
          <input type="date" value={date}
            onChange={e => { setDate(e.target.value); setTime('') }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
          />
          {dayUnavailable && <p className="text-red-400 text-xs mt-1.5">{specialist.name} is not available on {selectedDayName}s.</p>}
          {dateBlocked && !dayUnavailable && <p className="text-red-400 text-xs mt-1.5">{specialist.name} is unavailable on this date.</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Time</label>
          <select value={time} onChange={e => setTime(e.target.value)}
            disabled={!date || dayUnavailable || dateBlocked}
            className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 disabled:opacity-50"
          >
            <option value="">{!date ? 'Pick a date first' : (dayUnavailable || dateBlocked) ? 'Day unavailable' : 'Select a time'}</option>
            {availableSlots.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-800 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
            placeholder="Anything you want them to know before the appointment…"
          />
        </div>

        <p className="text-xs text-stone-500">Your hair profile will be shared automatically with this request.</p>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 bg-stone-600 text-stone-400 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50">
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
