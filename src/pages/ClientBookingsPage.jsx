import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ClientBookingsPage({ user }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

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

  function formatDateTime(date, time) {
    const d = new Date(date)
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time?.slice(0, 5)}`
  }

  const pending = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'accepted')
  const past = bookings.filter(b => b.status === 'declined' || b.status === 'cancelled')

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

  function BookingCard({ booking, showCancel }) {
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

        {showCancel && (
          <button
            onClick={() => cancelBooking(booking.id)}
            className="w-full py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
          >
            Cancel appointment
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-stone-950">
      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4">
        <h1 className="text-xl font-bold text-stone-100 tracking-tight">My Appointments</h1>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6">
        {/* Tabs */}
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
              : pending.map(b => <BookingCard key={b.id} booking={b} showCancel={true} />)
          )}

          {activeTab === 'past' && (
            past.length === 0
              ? <p className="text-stone-500 text-sm text-center py-10">No past appointments.</p>
              : past.map(b => <BookingCard key={b.id} booking={b} showCancel={false} />)
          )}
        </div>
      </div>
    </div>
  )
}
