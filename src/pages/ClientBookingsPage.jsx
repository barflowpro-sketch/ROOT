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

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl leading-none transition-colors ${i <= (hover || value) ? 'text-amber-500' : 'text-stone-700'}`}
        >★</button>
      ))}
    </div>
  )
}

export default function ClientBookingsPage({ user }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [editingId, setEditingId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editBookedTimes, setEditBookedTimes] = useState([])
  const [reviews, setReviews] = useState({})
  const [ratingId, setRatingId] = useState(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingComment, setRatingComment] = useState('')

  useEffect(() => {
    async function load() {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('requested_date', { ascending: true })

      if (bookingData && bookingData.length > 0) {
        const specialistIds = [...new Set(bookingData.map(b => b.specialist_id))]
        const { data: specialistData } = await supabase
          .from('specialist_profiles')
          .select('user_id, name, city')
          .in('user_id', specialistIds)

        const specialistMap = {}
        specialistData?.forEach(s => { specialistMap[s.user_id] = s })

        setBookings(bookingData.map(b => ({
          ...b,
          specialist_profile: specialistMap[b.specialist_id] || null
        })))

        const bookingIds = bookingData.map(b => b.id)
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('booking_id, rating, comment')
          .in('booking_id', bookingIds)

        const reviewMap = {}
        reviewData?.forEach(r => { reviewMap[r.booking_id] = r })
        setReviews(reviewMap)
      } else {
        setBookings([])
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  async function cancelBooking(bookingId) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }

  async function startEdit(booking) {
    setEditingId(booking.id)
    setEditDate(booking.requested_date)
    setEditTime(booking.requested_time?.slice(0, 5))
    await fetchEditBookedTimes(booking.specialist_id, booking.requested_date, booking.id)
  }

  async function fetchEditBookedTimes(specialistId, date, excludeBookingId) {
    if (!date) { setEditBookedTimes([]); return }
    const { data } = await supabase
      .from('bookings')
      .select('requested_time')
      .eq('specialist_id', specialistId)
      .eq('requested_date', date)
      .in('status', ['pending', 'accepted'])
      .neq('id', excludeBookingId)
    setEditBookedTimes((data || []).map(b => b.requested_time?.slice(0, 5)))
  }

  async function saveEdit(bookingId) {
    if (!editDate || !editTime) return
    await supabase.from('bookings').update({ requested_date: editDate, requested_time: editTime }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, requested_date: editDate, requested_time: editTime } : b))
    setEditingId(null)
  }

  async function submitRating(booking) {
    if (!ratingStars) return
    await supabase.from('reviews').insert({
      booking_id: booking.id,
      client_id: user.id,
      specialist_id: booking.specialist_id,
      rating: ratingStars,
      comment: ratingComment,
    })
    setReviews(prev => ({ ...prev, [booking.id]: { rating: ratingStars, comment: ratingComment } }))
    setRatingId(null)
    setRatingStars(0)
    setRatingComment('')
  }

  function formatDateTime(date, time) {
    const d = new Date(date)
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time?.slice(0, 5)}`
  }

  const today = new Date().toISOString().split('T')[0]
  const pending = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'accepted' && b.requested_date >= today)
  const past = bookings.filter(b =>
    b.status === 'declined' ||
    b.status === 'cancelled' ||
    (b.status === 'accepted' && b.requested_date < today)
  )

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-950">
        <p className="text-stone-600 text-sm">Loading…</p>
      </div>
    )
  }

  const STATUS_BADGE = {
    pending: 'text-amber-500',
    accepted: 'text-green-500',
    declined: 'text-red-400',
    cancelled: 'text-stone-500',
  }

  const STATUS_LABEL = {
    pending: 'Pending',
    accepted: 'Confirmed',
    declined: 'Declined',
    cancelled: 'Cancelled',
  }

  function BookingCard({ booking, showCancel, showEdit, showRate }) {
    const isEditing = editingId === booking.id
    const isRating = ratingId === booking.id
    const existingReview = reviews[booking.id]

    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-100">
              {booking.specialist_profile?.name || 'Specialist'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {booking.specialist_profile?.city && `${booking.specialist_profile.city} · `}
              {formatDateTime(booking.requested_date, booking.requested_time)}
            </p>
          </div>
          <span className={`text-xs font-medium ${STATUS_BADGE[booking.status]}`}>
            {STATUS_LABEL[booking.status]}
          </span>
        </div>

        {booking.client_note && (
          <p className="text-xs text-stone-400 bg-stone-800 rounded-lg px-3 py-2">{booking.client_note}</p>
        )}

        {existingReview && (
          <div className="space-y-1 pt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`text-base ${i <= existingReview.rating ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
              ))}
            </div>
            {existingReview.comment && (
              <p className="text-xs text-stone-400 italic">"{existingReview.comment}"</p>
            )}
          </div>
        )}

        {isRating && !existingReview && (
          <div className="space-y-3 pt-1">
            <StarPicker value={ratingStars} onChange={setRatingStars} />
            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              rows={2}
              placeholder="Share your experience… (optional)"
              className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRatingId(null)}
                className="flex-1 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => submitRating(booking)}
                disabled={!ratingStars}
                className="flex-1 py-2 bg-amber-700 text-amber-50 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Submit review
              </button>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="space-y-2">
            <input
              type="date"
              value={editDate}
              onChange={e => {
                setEditDate(e.target.value)
                setEditTime('')
                fetchEditBookedTimes(booking.specialist_id, e.target.value, booking.id)
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
            />
            <select
              value={editTime}
              onChange={e => setEditTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-950 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
            >
              <option value="">Select a time</option>
              {TIME_SLOTS.map(slot => {
                const taken = editBookedTimes.includes(slot.value)
                return (
                  <option key={slot.value} value={slot.value} disabled={taken}>
                    {taken ? `${slot.label} — Unavailable` : slot.label}
                  </option>
                )
              })}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveEdit(booking.id)}
                className="flex-1 py-2 bg-amber-700 text-amber-50 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        )}

        {!isEditing && !isRating && (
          <div className="flex gap-2">
            {showRate && !existingReview && (
              <button
                onClick={() => { setRatingId(booking.id); setRatingStars(0); setRatingComment('') }}
                className="flex-1 py-2 bg-stone-800 text-amber-500 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
              >
                Leave a review
              </button>
            )}
            {showEdit && (
              <button
                onClick={() => startEdit(booking)}
                className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
              >
                Edit
              </button>
            )}
            {showCancel && (
              <button
                onClick={() => cancelBooking(booking.id)}
                className="flex-1 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-stone-950">
      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-100 tracking-tight">My Appointments</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6">
        <div className="flex border-b border-stone-800 mb-5">
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'pending', label: 'Pending', count: pending.length },
            { key: 'past', label: 'Past', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${activeTab === tab.key ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 bg-amber-700 text-amber-50 text-xs rounded-full px-1.5 py-0.5">{tab.count}</span>
              )}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activeTab === 'upcoming' && (
            upcoming.length === 0
              ? <p className="text-stone-500 text-sm text-center py-10">No confirmed appointments yet.</p>
              : upcoming.map(b => <BookingCard key={b.id} booking={b} showCancel={true} />)
          )}

          {activeTab === 'pending' && (
            pending.length === 0
              ? <p className="text-stone-500 text-sm text-center py-10">No pending requests.</p>
              : pending.map(b => <BookingCard key={b.id} booking={b} showCancel={true} showEdit={true} />)
          )}

          {activeTab === 'past' && (
            past.length === 0
              ? <p className="text-stone-500 text-sm text-center py-10">No past appointments.</p>
              : past.map(b => <BookingCard key={b.id} booking={b} showCancel={false} showRate={b.status === 'accepted'} />)
          )}
        </div>
      </div>
    </div>
  )
}
