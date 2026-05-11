import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SharePage from './pages/SharePage'
import OnboardingPage from './pages/OnboardingPage'
import SpecialistSignupPage from './pages/SpecialistSignupPage'
import SpecialistOnboardingPage from './pages/SpecialistOnboardingPage'
import SpecialistProfilePage from './pages/SpecialistProfilePage'
import DiscoveryPage from './pages/DiscoveryPage'
import BookingModal from './components/BookingModal'
import ClientBookingsPage from './pages/ClientBookingsPage'
import SpecialistDetailPage from './pages/SpecialistDetailPage'

const CLIENT_ONBOARDING_KEY = 'root_onboarded'
const SPECIALIST_ONBOARDING_KEY = 'root_specialist_onboarded'
const SEEN_NOTIFICATIONS_KEY = 'root_seen_notifications'

function App() {
  const { user, loading } = useAuth()
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [bookingTarget, setBookingTarget] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [viewingSpecialist, setViewingSpecialist] = useState(null)
  const [appointmentBadge, setAppointmentBadge] = useState(0)

  useEffect(() => {
    if (!user) { setRoleLoading(false); return }

    const metaRole = user.user_metadata?.role
    if (metaRole === 'specialist') {
      setRole('specialist')
      setOnboarded(!!localStorage.getItem(SPECIALIST_ONBOARDING_KEY))
      setRoleLoading(false)
      return
    }

    setRole('client')
    setOnboarded(!!localStorage.getItem(CLIENT_ONBOARDING_KEY))
    setRoleLoading(false)

    supabase
      .from('bookings')
      .select('id')
      .eq('client_id', user.id)
      .in('status', ['accepted', 'declined'])
      .then(({ data }) => {
        if (!data) return
        const seen = JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || '[]')
        const unseen = data.filter(b => !seen.includes(b.id))
        setAppointmentBadge(unseen.length)
      })
  }, [user])

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return

    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') PushNotifications.register()
    })

    const regListener = PushNotifications.addListener('registration', async token => {
      await supabase.from('push_tokens').upsert(
        { user_id: user.id, token: token.value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    })

    return () => { regListener.then(l => l.remove()) }
  }, [user])

  function completeOnboarding() {
    const key = role === 'specialist' ? SPECIALIST_ONBOARDING_KEY : CLIENT_ONBOARDING_KEY
    localStorage.setItem(key, '1')
    setOnboarded(true)
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-950">
        <p className="text-stone-600 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/specialist/signup" element={<SpecialistSignupPage />} />
        <Route
          path="*"
          element={
            !user ? <AuthPage /> :
            !onboarded && role === 'specialist' ? <SpecialistOnboardingPage onDone={completeOnboarding} /> :
            !onboarded && role === 'client' ? <OnboardingPage onDone={completeOnboarding} /> :
            role === 'specialist' ? <SpecialistProfilePage user={user} /> :
            <>
              {viewingSpecialist && (
                <SpecialistDetailPage
                  specialist={viewingSpecialist}
                  onBack={() => setViewingSpecialist(null)}
                  onBook={s => { setViewingSpecialist(null); setBookingTarget(s) }}
                />
              )}

              {bookingTarget && (
                <BookingModal
                  specialist={bookingTarget}
                  clientId={user.id}
                  onClose={() => setBookingTarget(null)}
                  onSuccess={() => { setBookingTarget(null); setBookingSuccess(true); setTimeout(() => setBookingSuccess(false), 3000) }}
                />
              )}

              {bookingSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-800 text-green-100 text-sm px-5 py-3 rounded-full shadow-lg">
                  Request sent — your hair profile was attached automatically.
                </div>
              )}

              <div className="pb-20">
                {activeTab === 'profile' && <ProfilePage user={user} />}
                {activeTab === 'discover' && <DiscoveryPage user={user} onView={setViewingSpecialist} />}
                {activeTab === 'bookings' && <ClientBookingsPage user={user} />}
              </div>

              <nav className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t border-stone-800 flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-4 text-xs font-medium transition-colors ${activeTab === 'profile' ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`flex-1 py-4 text-xs font-medium transition-colors ${activeTab === 'discover' ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  Find
                </button>
                <button
                  onClick={() => {
                    setActiveTab('bookings')
                    if (appointmentBadge > 0) {
                      supabase
                        .from('bookings')
                        .select('id')
                        .eq('client_id', user.id)
                        .in('status', ['accepted', 'declined'])
                        .then(({ data }) => {
                          if (data) localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(data.map(b => b.id)))
                        })
                      setAppointmentBadge(0)
                    }
                  }}
                  className={`flex-1 py-4 text-xs font-medium transition-colors relative ${activeTab === 'bookings' ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
                >
                  Appointments
                  {appointmentBadge > 0 && (
                    <span className="absolute top-2.5 right-1/4 translate-x-3 bg-amber-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {appointmentBadge}
                    </span>
                  )}
                </button>
              </nav>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
