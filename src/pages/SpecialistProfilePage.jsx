import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SERVICES = [
  'Hair color',
  'Haircut',
  'Braids & locs',
  'Natural hair',
  'Beard grooming',
]

export default function SpecialistProfilePage({ user }) {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    city: '',
    services: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('specialist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile({
          name: data.name || '',
          bio: data.bio || '',
          city: data.city || '',
          services: data.services || [],
        })
      }

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, client:client_id(email), client_profile:client_id(name, history, loves, hates, sensitivities, notes, share_token)')
        .eq('specialist_id', user.id)
        .order('created_at', { ascending: false })

      if (bookingData) setBookings(bookingData)
    }
    load()
  }, [user.id])

  function toggleService(service) {
    setProfile(p => ({
      ...p,
      services: p.services.includes(service)
        ? p.services.filter(s => s !== service)
        : [...p.services, service]
    }))
  }

  async function save() {
    setSaving(true)
    const { data: existing } = await supabase
      .from('specialist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const payload = { ...profile, user_id: user.id }

    if (existing) {
      const { error } = await supabase.from('specialist_profiles').update(payload).eq('user_id', user.id)
      if (error) { alert(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('specialist_profiles').insert(payload)
      if (error) { alert(error.message); setSaving(false); return }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function respondToBooking(bookingId, status) {
    await supabase.from('bookings').update({ status }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const STATUS_COLORS = {
    pending: 'text-amber-500',
    accepted: 'text-green-500',
    declined: 'text-red-500',
  }

  return (
    <div className="min-h-svh bg-stone-950">
      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Root</h1>
          <p className="text-xs text-stone-600">Specialist dashboard</p>
        </div>
        <button onClick={signOut} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Profile form */}
        <div className="space-y-5">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">Your Profile</h2>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="Your name or business name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="e.g. Austin, TX"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
              placeholder="Tell clients about your experience and specialty…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(service => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    profile.services.includes(service)
                      ? 'bg-amber-700 border-amber-700 text-amber-50'
                      : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
          </button>
        </div>

        {/* Booking requests */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">Booking Requests</h2>

          {bookings.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
              <p className="text-stone-500 text-sm">No booking requests yet.</p>
              <p className="text-stone-600 text-xs mt-1">Complete your profile so clients can find you.</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-100">
                      {booking.client_profile?.name || booking.client?.email}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {new Date(booking.requested_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {booking.requested_time?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium capitalize ${STATUS_COLORS[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>

                {booking.client_note && (
                  <p className="text-xs text-stone-400 bg-stone-800 rounded-lg px-3 py-2">{booking.client_note}</p>
                )}

                {booking.client_profile?.share_token && (
                  <a
                    href={`/share/${booking.client_profile.share_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    View hair profile →
                  </a>
                )}

                {booking.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => respondToBooking(booking.id, 'accepted')}
                      className="flex-1 py-2 bg-green-800 text-green-200 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToBooking(booking.id, 'declined')}
                      className="flex-1 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
