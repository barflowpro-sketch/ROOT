import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'
import ClientHairProfileModal from '../components/ClientHairProfileModal'
import MessagingModal from '../components/MessagingModal'
import CalendarView from '../components/CalendarView'
import AccountSettingsPage from './AccountSettingsPage'
import FeedbackModal from '../components/FeedbackModal'

const CATEGORIES = ['Haircut', 'Braids', 'Locs']

const DURATION_OPTIONS = [
  { value: '', label: 'Duration' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hr' },
  { value: '90', label: '1.5 hr' },
  { value: '120', label: '2 hr' },
  { value: '150', label: '2.5 hr' },
  { value: '180', label: '3 hr' },
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

export default function SpecialistProfilePage({ user, onAdmin }) {
  const [profile, setProfile] = useState({
    name: '', bio: '', city: '', services: [], photo: '',
    available_days: [], available_start: '09:00', available_end: '18:00',
    service_prices: {},
    service_durations: {},
    service_groups: { Haircut: [], Braids: [], Locs: [], Other: [] },
    blocked_dates: [],
    service_location: '',
    location_address: '',
  })
  const [groupInputs, setGroupInputs] = useState({ Haircut: '', Braids: '', Locs: '', Other: '' })
  const [blockedDateInput, setBlockedDateInput] = useState('')
  const photoRef = useRef()
  const portfolioRef = useRef()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('requests')
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
  const [viewingClientId, setViewingClientId] = useState(null)
  const [viewingClientName, setViewingClientName] = useState('')
  const [messagingBooking, setMessagingBooking] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const now = new Date()
  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isActive = profile.subscription_status === 'active'
  const isInTrial = profile.subscription_status === 'trial' && trialEnd && trialEnd > now
  const isExpired = !isActive && !isInTrial
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))) : 0

  async function handleSubscribe() {
    setSubscribing(true)
    if (Capacitor.isNativePlatform()) {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { current } = await Purchases.getOfferings()
        const pkg = current?.monthly ?? current?.availablePackages?.[0]
        if (!pkg) {
          alert('No subscription plans available right now. Please try again.')
          setSubscribing(false)
          return
        }
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
        if (customerInfo.entitlements.active['specialist_access']) {
          setProfile(p => ({ ...p, subscription_status: 'active' }))
        }
      } catch (e) {
        if (e?.code !== 'PURCHASE_CANCELLED') {
          alert('Purchase failed. Please try again.')
        }
      }
    } else {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ specialist_id: user.id, email: user.email }),
        })
        const data = await res.json()
        if (data.url) window.location.href = data.url
        else alert(data.error || 'Could not start checkout. Please try again.')
      } catch {
        alert('Could not start checkout. Please try again.')
      }
    }
    setSubscribing(false)
  }

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
          service_prices: data.service_prices || {},
          service_durations: data.service_durations || {},
          blocked_dates: data.blocked_dates || [],
          service_groups: {
            Haircut: data.service_groups?.Haircut || [],
            Braids: data.service_groups?.Braids || [],
            Locs: data.service_groups?.Locs || [],
            Other: data.service_groups?.Other || [],
          },
          trial_ends_at: data.trial_ends_at || null,
          subscription_status: data.subscription_status || 'trial',
          subscribed_until: data.subscribed_until || null,
          service_location: data.service_location || '',
          location_address: data.location_address || '',
        })
      }

      const { data: portfolioData } = await supabase
        .from('portfolio_photos')
        .select('*')
        .eq('specialist_id', user.id)
        .order('created_at', { ascending: false })
      setPortfolioPhotos(portfolioData || [])

      let { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('specialist_id', user.id)
        .order('requested_date', { ascending: false })

      if (bookingData && bookingData.length > 0) {
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const toDecline = bookingData.filter(b =>
          b.status === 'pending' && new Date(b.created_at) < threeDaysAgo
        )
        if (toDecline.length > 0) {
          const ids = toDecline.map(b => b.id)
          await supabase.from('bookings').update({ status: 'declined' }).in('id', ids)
          bookingData = bookingData.map(b => ids.includes(b.id) ? { ...b, status: 'declined' } : b)
        }

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
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setProfile(p => ({ ...p, photo: canvas.toDataURL('image/jpeg', 0.85) }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  function handlePortfolioAdd(e) {
    const file = e.target.files[0]
    if (!file) return
    portfolioRef.current.value = ''
    setUploadingPortfolio(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const { data: row, error } = await supabase
        .from('portfolio_photos')
        .insert({ specialist_id: user.id, url: event.target.result })
        .select()
        .single()
      if (!error && row) setPortfolioPhotos(prev => [row, ...prev])
      setUploadingPortfolio(false)
    }
    reader.readAsDataURL(file)
  }

  async function deletePortfolioPhoto(id) {
    await supabase.from('portfolio_photos').delete().eq('id', id)
    setPortfolioPhotos(prev => prev.filter(p => p.id !== id))
  }

  function addServiceType(category) {
    const val = groupInputs[category].trim()
    if (!val) return
    setProfile(p => ({
      ...p,
      service_groups: {
        ...p.service_groups,
        [category]: [...(p.service_groups[category] || []), val],
      },
    }))
    setGroupInputs(g => ({ ...g, [category]: '' }))
  }

  function removeServiceType(category, type) {
    setProfile(p => ({
      ...p,
      service_groups: {
        ...p.service_groups,
        [category]: p.service_groups[category].filter(t => t !== type),
      },
    }))
  }

  function addBlockedDate() {
    if (!blockedDateInput || profile.blocked_dates.includes(blockedDateInput)) return
    setProfile(p => ({ ...p, blocked_dates: [...p.blocked_dates, blockedDateInput].sort() }))
    setBlockedDateInput('')
  }

  function removeBlockedDate(d) {
    setProfile(p => ({ ...p, blocked_dates: p.blocked_dates.filter(x => x !== d) }))
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
      .select('id, lat, lng, city')
      .eq('user_id', user.id)
      .single()

    let lat = existing?.lat || null
    let lng = existing?.lng || null

    if (profile.city && profile.city !== existing?.city) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(profile.city)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'RootApp/1.0' } }
        )
        const data = await res.json()
        if (data[0]) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon) }
      } catch {}
    }

    const flatServices = Object.values(profile.service_groups).flat()
    const payload = { ...profile, user_id: user.id, lat, lng, services: flatServices }

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

  function shareProfile() {
    const url = `${import.meta.env.VITE_APP_URL || window.location.origin}/specialist/${user.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function respondToBooking(bookingId, status) {
    await supabase.from('bookings').update({ status }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
  }

  async function cancelBooking(bookingId) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }

  async function markComplete(bookingId) {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b))
  }

  const today = new Date().toISOString().split('T')[0]
  const pending = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'accepted' && b.requested_date >= today)
  const past = bookings.filter(b =>
    b.status === 'declined' ||
    b.status === 'cancelled' ||
    b.status === 'completed' ||
    (b.status === 'accepted' && b.requested_date < today)
  )
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  function formatDateTime(date, time) {
    const d = new Date(date)
    return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time?.slice(0, 5)}`
  }

  const STATUS_BADGE = { pending: 'text-amber-500', accepted: 'text-green-500', declined: 'text-red-400', cancelled: 'text-stone-500', completed: 'text-stone-400' }
  const STATUS_LABEL = { pending: 'Pending', accepted: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled', completed: 'Completed' }

  return (
    <div className="min-h-svh bg-stone-800">
      {viewingClientId && (
        <ClientHairProfileModal
          clientId={viewingClientId}
          clientName={viewingClientName}
          onClose={() => { setViewingClientId(null); setViewingClientName('') }}
        />
      )}

      {showSettings && (
        <AccountSettingsPage user={user} role="specialist" onBack={() => setShowSettings(false)} />
      )}

      {showFeedback && (
        <FeedbackModal userId={user.id} role="specialist" onClose={() => setShowFeedback(false)} />
      )}

      {messagingBooking && (
        <MessagingModal
          booking={messagingBooking}
          currentUserId={user.id}
          otherName={messagingBooking.client_profile?.name || 'Client'}
          onClose={() => setMessagingBooking(null)}
        />
      )}

      {/* Subscription banner */}
      {isExpired && (
        <div className="bg-red-900/30 border-b border-red-800/40 px-6 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-400">Your trial has ended</p>
              <p className="text-xs text-red-500/80 mt-0.5">Your profile is hidden from clients. Subscribe to stay listed.</p>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="flex-shrink-0 px-4 py-2 bg-amber-700 text-amber-50 rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {subscribing ? 'Loading…' : 'Subscribe $17.99/mo'}
            </button>
          </div>
        </div>
      )}
      {isInTrial && (
        <div className="bg-amber-900/20 border-b border-amber-800/30 px-6 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <p className="text-xs text-amber-500">
              {trialDaysLeft === 0 ? 'Trial ends today' : `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`}
            </p>
            <button onClick={handleSubscribe} disabled={subscribing} className="text-xs text-amber-400 underline hover:text-amber-300 disabled:opacity-50">
              {subscribing ? 'Loading…' : 'Subscribe now'}
            </button>
          </div>
        </div>
      )}
      {isActive && (
        <div className="bg-green-900/20 border-b border-green-800/30 px-6 py-3">
          <p className="text-xs text-green-500 max-w-lg mx-auto">
            ✓ Subscribed · $17.99/mo{profile.subscribed_until ? ` · Renews ${new Date(profile.subscribed_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
          </p>
        </div>
      )}

      {!profile.city && !profile.bio && (
        <div className="bg-amber-900/20 border-b border-amber-800/30 px-6 py-3">
          <p className="text-xs font-medium text-amber-500 max-w-lg mx-auto">Add your city and a photo so clients can find and book you.</p>
        </div>
      )}

      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Root</h1>
          <p className="text-xs text-stone-600">Specialist dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {onAdmin && (
            <button onClick={onAdmin} className="text-sm text-amber-600 hover:text-amber-400 transition-colors">
              Admin
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
            Settings
          </button>
        </div>
      </header>

      {/* Completeness bar */}
      {(() => {
        const items = [
          { label: 'Name', done: !!profile.name.trim() },
          { label: 'Photo', done: !!profile.photo },
          { label: 'Bio', done: !!profile.bio.trim() },
          { label: 'City', done: !!profile.city.trim() },
          { label: 'Service', done: Object.values(profile.service_groups).flat().length > 0 },
          { label: 'Availability', done: profile.available_days.length > 0 },
        ]
        const done = items.filter(i => i.done).length
        const pct = Math.round((done / items.length) * 100)
        const complete = done === items.length
        return (
          <div className="bg-stone-700 border-b border-stone-600 px-6 py-3">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-stone-500">
                  {complete ? 'Profile complete — clients can find you!' : `${done} of ${items.length} sections complete`}
                </span>
                <span className="text-xs font-medium text-amber-600">{pct}%</span>
              </div>
              <div className="h-1.5 bg-stone-600 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${complete ? 'bg-green-500' : 'bg-amber-700'}`} style={{ width: `${pct}%` }} />
              </div>
              {!complete && (
                <p className="text-xs text-stone-600 mt-1.5">Missing: {items.filter(i => !i.done).map(i => i.label).join(', ')}</p>
              )}
            </div>
          </div>
        )
      })()}

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Profile form */}
        <div className="space-y-5">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">Your Profile</h2>

          <div className="relative w-full h-56 rounded-2xl overflow-hidden">
            <div
              onClick={() => photoRef.current.click()}
              className="w-full h-full bg-stone-600 border-2 border-dashed border-stone-700 flex items-center justify-center cursor-pointer hover:border-stone-500 transition-colors"
            >
              {profile.photo
                ? <img src={profile.photo} alt="" className="w-full h-full object-contain" />
                : <div className="flex flex-col items-center gap-2">
                    <span className="text-stone-500 text-4xl">+</span>
                    <span className="text-xs text-stone-500">Add profile photo</span>
                  </div>
              }
            </div>
            {profile.photo && (
              <button
                onClick={() => photoRef.current.click()}
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
              >
                ✎ Edit photo
              </button>
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          {/* Portfolio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wider">Portfolio</label>
              <button
                onClick={() => portfolioRef.current.click()}
                disabled={uploadingPortfolio}
                className="text-xs font-medium text-amber-600 hover:text-amber-500 px-3 py-1.5 rounded-lg border border-stone-600 hover:border-stone-700 transition-colors disabled:opacity-50"
              >
                {uploadingPortfolio ? 'Uploading…' : '+ Add photo'}
              </button>
            </div>
            <input ref={portfolioRef} type="file" accept="image/*" className="hidden" onChange={handlePortfolioAdd} />
            {portfolioPhotos.length === 0 ? (
              <button
                onClick={() => portfolioRef.current.click()}
                className="w-full border-2 border-dashed border-stone-600 rounded-2xl py-8 text-stone-600 text-sm hover:border-stone-700 transition-colors"
              >
                Add photos of your work
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {portfolioPhotos.map(photo => (
                  <div key={photo.id} className="relative aspect-square">
                    <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      onClick={() => deletePortfolioPhoto(photo.id)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => portfolioRef.current.click()}
                  disabled={uploadingPortfolio}
                  className="aspect-square border-2 border-dashed border-stone-600 rounded-xl text-stone-600 text-2xl hover:border-stone-700 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="Your name or business name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="e.g. Austin, TX"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">Where do you work?</label>
            <div className="flex gap-2 mb-3">
              {[
                { value: 'studio', label: 'Studio / Salon' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'both', label: 'Both' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, service_location: opt.value }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    profile.service_location === opt.value
                      ? 'bg-amber-700 border-amber-700 text-amber-50'
                      : 'bg-transparent border-stone-600 text-stone-500 hover:border-stone-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(profile.service_location === 'studio' || profile.service_location === 'both') && (
              <input
                type="text"
                value={profile.location_address}
                onChange={e => setProfile(p => ({ ...p, location_address: e.target.value }))}
                placeholder="Salon name or address"
                className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              />
            )}
            {profile.service_location === 'mobile' && (
              <p className="text-xs text-stone-600">You travel to the client's location.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
              placeholder="Tell clients about your experience and specialty…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-4 uppercase tracking-wider">Services & Pricing</label>
            <div className="space-y-6">
              {CATEGORIES.map(category => (
                <div key={category}>
                  <p className="text-sm font-semibold text-stone-300 mb-2">{category}</p>
                  <div className="space-y-2">
                    {(profile.service_groups[category] || []).map(type => (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-4 py-2.5 rounded-xl border border-amber-700/40 bg-amber-700/10 text-sm text-amber-400">{type}</div>
                          <button onClick={() => removeServiceType(category, type)} className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-red-400 transition-colors text-lg">×</button>
                        </div>
                        <div className="flex gap-2 pr-10">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 text-sm">$</span>
                            <input type="number" min="0" placeholder="Price" value={profile.service_prices[type] || ''}
                              onChange={e => setProfile(p => ({ ...p, service_prices: { ...p.service_prices, [type]: e.target.value } }))}
                              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-amber-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600" />
                          </div>
                          <select value={profile.service_durations[type] || ''}
                            onChange={e => setProfile(p => ({ ...p, service_durations: { ...p.service_durations, [type]: e.target.value } }))}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700">
                            {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={groupInputs[category]}
                        onChange={e => setGroupInputs(g => ({ ...g, [category]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addServiceType(category)}
                        placeholder={`Add a type of ${category.toLowerCase()}…`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
                      />
                      <button
                        onClick={() => addServiceType(category)}
                        disabled={!groupInputs[category].trim()}
                        className="px-4 py-2.5 bg-stone-600 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Other services — no category heading */}
              <div className="space-y-2">
                {(profile.service_groups['Other'] || []).map(type => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 rounded-xl border border-amber-700/40 bg-amber-700/10 text-sm text-amber-400">{type}</div>
                      <button onClick={() => removeServiceType('Other', type)} className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-red-400 transition-colors text-lg">×</button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">$</span>
                        <input type="number" min="0" placeholder="Price" value={profile.service_prices[type] || ''}
                          onChange={e => setProfile(p => ({ ...p, service_prices: { ...p.service_prices, [type]: e.target.value } }))}
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600" />
                      </div>
                      <select value={profile.service_durations[type] || ''}
                        onChange={e => setProfile(p => ({ ...p, service_durations: { ...p.service_durations, [type]: e.target.value } }))}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700">
                        {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupInputs['Other']}
                    onChange={e => setGroupInputs(g => ({ ...g, Other: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addServiceType('Other')}
                    placeholder="Add a service…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
                  />
                  <button
                    onClick={() => addServiceType('Other')}
                    disabled={!groupInputs['Other'].trim()}
                    className="px-4 py-2.5 bg-stone-600 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  {HOUR_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-stone-500 mb-1">To</label>
                <select
                  value={profile.available_end}
                  onChange={e => setProfile(p => ({ ...p, available_end: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  {HOUR_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            {profile.available_days.length === 0 && (
              <p className="text-xs text-stone-600">No days selected — clients can book any day.</p>
            )}

            {/* Blocked dates */}
            <div className="pt-1">
              <p className="text-xs text-stone-500 mb-2">Block specific dates (vacation, days off)</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={blockedDateInput}
                  onChange={e => setBlockedDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
                <button
                  onClick={addBlockedDate}
                  disabled={!blockedDateInput}
                  className="px-4 py-2 bg-stone-600 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40"
                >
                  Block
                </button>
              </div>
              {profile.blocked_dates.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {profile.blocked_dates.map(d => (
                    <div key={d} className="flex items-center justify-between px-3 py-2 bg-stone-600 rounded-xl">
                      <span className="text-xs text-stone-300">
                        {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button onClick={() => removeBlockedDate(d)} className="text-stone-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
          </button>

          <button
            onClick={shareProfile}
            className="w-full py-3 bg-stone-600 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            {copied ? 'Link copied!' : 'Share profile link'}
          </button>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-stone-600 mb-5">
            {[
              { key: 'requests', label: 'Requests', count: pending.length },
              { key: 'upcoming', label: 'Upcoming', count: 0 },
              { key: 'calendar', label: 'Calendar', count: 0 },
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
                <div className="bg-stone-700 border border-stone-600 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No pending requests.</p>
                  <p className="text-stone-600 text-xs mt-1">Complete your profile so clients can find you.</p>
                </div>
              ) : pending.map(booking => (
                <div key={booking.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                    {booking.service_name && <p className="text-xs text-amber-600 mt-0.5">{booking.service_name}</p>}
                  </div>
                  {booking.client_note && (
                    <p className="text-xs text-stone-400 bg-stone-600 rounded-lg px-3 py-2">{booking.client_note}</p>
                  )}
                  {booking.client_id && (
                    <button
                      onClick={() => { setViewingClientId(booking.client_id); setViewingClientName(booking.client_profile?.name || 'Client') }}
                      className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      View hair profile →
                    </button>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setMessagingBooking(booking)}
                      className="flex-1 py-2 bg-stone-600 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                      Message
                    </button>
                    <button onClick={() => respondToBooking(booking.id, 'accepted')}
                      className="flex-1 py-2 bg-green-800 text-green-200 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                      Accept
                    </button>
                    <button onClick={() => respondToBooking(booking.id, 'declined')}
                      className="flex-1 py-2 bg-stone-600 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
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
                <div className="bg-stone-700 border border-stone-600 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No confirmed appointments yet.</p>
                </div>
              ) : upcoming.map(booking => (
                <div key={booking.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                      {booking.service_name && <p className="text-xs text-amber-600 mt-0.5">{booking.service_name}</p>}
                    </div>
                    <span className="text-xs font-medium text-green-500">Confirmed</span>
                  </div>
                  {booking.client_id && (
                    <button
                      onClick={() => { setViewingClientId(booking.client_id); setViewingClientName(booking.client_profile?.name || 'Client') }}
                      className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      View hair profile →
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setMessagingBooking(booking)}
                      className="flex-1 py-2 bg-stone-600 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                      Message
                    </button>
                    <button onClick={() => markComplete(booking.id)}
                      className="flex-1 py-2 bg-green-900 text-green-300 rounded-lg text-xs font-medium hover:bg-green-800 transition-colors">
                      Mark complete
                    </button>
                    <button onClick={() => cancelBooking(booking.id)}
                      className="flex-1 py-2 bg-stone-600 text-stone-400 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calendar */}
          {activeTab === 'calendar' && (
            <CalendarView
              bookings={bookings}
              onMessage={booking => setMessagingBooking(booking)}
            />
          )}

          {/* Past */}
          {activeTab === 'past' && (
            <div className="space-y-3">
              {past.length === 0 ? (
                <div className="bg-stone-700 border border-stone-600 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No past appointments.</p>
                </div>
              ) : past.map(booking => (
                <div key={booking.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-100">{booking.client_profile?.name || 'Client'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatDateTime(booking.requested_date, booking.requested_time)}</p>
                      {booking.service_name && <p className="text-xs text-amber-600 mt-0.5">{booking.service_name}</p>}
                    </div>
                    <span className={`text-xs font-medium ${STATUS_BADGE[booking.status]}`}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </div>
                  {booking.client_id && (
                    <button
                      onClick={() => { setViewingClientId(booking.client_id); setViewingClientName(booking.client_profile?.name || 'Client') }}
                      className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      View hair profile →
                    </button>
                  )}
                  <button onClick={() => setMessagingBooking(booking)}
                    className="w-full py-2 bg-stone-600 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors">
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-stone-700 border border-stone-600 rounded-2xl p-6 text-center">
                  <p className="text-stone-500 text-sm">No reviews yet.</p>
                  <p className="text-stone-600 text-xs mt-1">Reviews appear here after clients rate their appointments.</p>
                </div>
              ) : (
                <>
                  <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4 flex items-center gap-4">
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
                    <div key={review.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-4 space-y-2">
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
