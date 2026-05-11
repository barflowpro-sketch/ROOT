import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const SERVICES = [
  'Hair color',
  'Haircut',
  'Braids & locs',
  'Natural hair',
  'Beard grooming',
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const HOUR_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const h = 6 + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const value = `${String(h).padStart(2, '0')}:${m}`
  const hour12 = h > 12 ? h - 12 : h
  const ampm = h < 12 ? 'AM' : 'PM'
  return { value, label: `${hour12}:${m} ${ampm}` }
})

export default function SpecialistProfilePage({ user }) {
  const [profile, setProfile] = useState({
    name: '', bio: '', city: '', services: [], photo: '',
    available_days: [], available_start: '09:00', available_end: '18:00',
  })
  const photoRef = useRef()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('requests')

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
          photo: data.photo || '',
          available_days: data.available_days || [],
          available_start: data.available_start || '09:00',
          available_end: data.available_end || '18:00',
        })
      }

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('specialist_id', user.id)
        .order('requested_date', { ascending: false })

      if (bookingData && bookingData.length > 0) {
        const clientIds = [...new Set(bookingData.map(b => b.client_id))]
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, name, share_token')
          .in('user_id', clientIds)

        const profileMap = {}
        profileData?.forEach(p => { profileMap[p.user_id] = p })

        setBookings(bookingData.map(b => ({
          ...b,
          client_profile: profileMap[b.client_id] || null
        })))
      } else {
        setBookings([])
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('specialist_id', user.id)
        .order('created_at', { ascending: false })

      if (reviewData && reviewData.length > 0) {
        const clientIds = [...new Set(reviewData.map(r => r.client_id))]
        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', clientIds)

        const clientMap = {}
        clientProfiles?.forEach(p => { clientMap[p.user_id] = p })

        setReviews(reviewData.map(r => ({
          ...r,
          client_name: clientMap[r.client_id]?.name || 'Client'
        })))
      } else {
        setReviews([])
      }
    }
    load()
  }, [user.id])

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setProfile(p => ({ ...p, photo: event.target.result }))
    reader.readAsDataURL(file)
  }

  function toggleService(service) {
    setProfile(p => ({
      ...p,
      services: p.services.includes(service)
        ? p.services.filter(s => s !== service)
        : [...p.services, service]
    }))
  }

  function toggleDay(day) {
    setProfile(p => ({
      ...p,
      available_days: p.available_days.includes(day)
        ? p.available_days.filter(d => d !== day)
        : [...p.available_days, day]
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

  async function cancelBooking(bookingId) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }

  const today = new Date().toISOString().split('T')[0]
  const pending = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'accepted' && b.requested_date >= today)
  const past = bookings.filter(b =>
    b.status === 'declined' ||
    b.status === 'cancelled' ||
    (b.status === 'accepted' && b.requested_date < today)
  )
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  function formatDateTime(date, time) {
    const d = new Date(date)
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time?.slice(0, 5)}`
  }

  const STATUS_BADGE = { pending: 'text-amber-500', accepted: 'text-green-500', declined: 'text-red-400', cancelled: 'text-stone-500' }
  const STATUS_LABEL = { pending: 'Pending', accepted: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled' }

  return (
    <div className="min-h-svh bg-stone-950">
      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Root</h1>
          <p className="text-xs text-stone-600">Specialist dashboard</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Profile form */}
        <div className="space-y-5">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">Your Profile</h2>

          <div
            onClick={() => photoRef.current.click()}
            className="w-full h-52 rounded-2xl bg-stone-800 border-2 border-dashed border-stone-700 overflow-hidden flex items-center justify-center cursor-pointer hover:border-stone-500 transition-colors"
          >
            {profile.photo
              ? <img src={profile.photo} alt="" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-2">
                  <span className="text-stone-500 text-4xl">+</span>
                  <span className="text-xs text-stone-500">Add profile photo</span>
                </div>
            }
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

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

          {/* Availability */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider">Availability</label>
            <div className="flex gap-1.5">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    profile.available_days.includes(day)
                      ? 'bg-amber-700 border-amber-700 text-amber-50'
                      : 'bg-transparent border-stone-700 text-stone-500 hover:border-stone-500'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-stone-500 mb-1">From</label>
                <select
                  value={profile.available_start}
                  onChange={e => setProfile(p => ({ ...p, available_start: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  {HOUR_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-stone-500 mb-1">To</label>
                <select
                  value={profile.available_end}
                  onChange={e => setProfile(p => ({ ...p, available_end: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  {HOUR_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            {profile.available_days.length === 0 && (
              <p className="text-xs text-stone-600">No days selected — clients can book any day.</p>
            )}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
          </button>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-stone-800 mb-5">
            {[
              { key: 'requests', label: 'Requests', count: pending.length },
              { key: 'upcoming', label: 'Upcoming', count: 0 },
              { key: 'past', label: 'Past', count: 0 },
              { key: 'reviews', label: 'Reviews', count: 0 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${activeTab === tab.key ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-amber-700 text-amber-50 text-xs rounded-full px-1.5 py-0.5">{tab.count}</span>
                )}
                {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
              </button>
            ))}
          </div>

          {/* Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No pending requests.</p>
                  <p className="text-stone-600 text-xs mt-1">Complete your profile so clients can find you.</p>
                </div>
              ) : pending.map(booking => (
                <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                  </div>
                  {booking.client_note && (
                    <p className="text-xs text-stone-400 bg-stone-800 rounded-lg px-3 py-2">{booking.client_note}</p>
                  )}
                  {booking.client_profile?.share_token && (
                    <a href={`/share/${booking.client_profile.share_token}`} target="_blank" rel="noreferrer"
                      className="block text-xs text-amber-600 hover:text-amber-500 transition-colors">
                      View hair profile →
                    </a>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => respondToBooking(booking.id, 'accepted')}
                      className="flex-1 py-2 bg-green-800 text-green-200 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                      Accept
                    </button>
                    <button onClick={() => respondToBooking(booking.id, 'declined')}
                      className="flex-1 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming */}
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No confirmed appointments yet.</p>
                </div>
              ) : upcoming.map(booking => (
                <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                    </div>
                    <span className="text-xs font-medium text-green-500">Confirmed</span>
                  </div>
                  {booking.client_profile?.share_token && (
                    <a href={`/share/${booking.client_profile.share_token}`} target="_blank" rel="noreferrer"
                      className="block text-xs text-amber-600 hover:text-amber-500 transition-colors">
                      View hair profile →
                    </a>
                  )}
                  <button onClick={() => cancelBooking(booking.id)}
                    className="w-full py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                    Cancel appointment
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Past */}
          {activeTab === 'past' && (
            <div className="space-y-3">
              {past.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No past appointments.</p>
                </div>
              ) : past.map(booking => (
                <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                    </div>
                    <span className={`text-xs font-medium ${STATUS_BADGE[booking.status]}`}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </div>
                  {booking.client_profile?.share_token && (
                    <a href={`/share/${booking.client_profile.share_token}`} target="_blank" rel="noreferrer"
                      className="block text-xs text-amber-600 hover:text-amber-500 transition-colors">
                      View hair profile →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No reviews yet.</p>
                  <p className="text-stone-600 text-xs mt-1">Reviews appear here after clients rate their appointments.</p>
                </div>
              ) : (
                <>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-stone-100">{avgRating}</p>
                      <p className="text-xs text-stone-500 mt-0.5">avg rating</p>
                    </div>
                    <div>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-xl ${i <= Math.round(avgRating) ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                    </div>
                  </div>

                  {reviews.map(review => (
                    <div key={review.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-stone-100">{review.client_name}</p>
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-sm ${i <= review.rating ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-stone-400 leading-relaxed">"{review.comment}"</p>
                      )}
                      <p className="text-xs text-stone-600">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
