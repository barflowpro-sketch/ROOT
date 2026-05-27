import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import AccountSettingsPage from './pages/AccountSettingsPage'
import SpecialistPublicPage from './pages/SpecialistPublicPage'
import PasswordResetPage from './pages/PasswordResetPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import FeedbackModal from './components/FeedbackModal'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'

const VAPID_PUBLIC_KEY = 'BPI7tMdtshKS-yb6JyvQ3hBl--HcmXdD2FW-IH-g0SNvipgIV009gv_BeRW_3X7e_HejwyHcAOoOV-dnVnNgsLw'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

async function registerWebPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription: sub.toJSON(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } catch {}
}

const CLIENT_ONBOARDING_KEY = 'root_onboarded'
const SPECIALIST_ONBOARDING_KEY = 'root_specialist_onboarded'
const SEEN_NOTIFICATIONS_KEY = 'root_seen_notifications'

function App() {
  const { user, loading, authEvent } = useAuth()
  const [role, setRole] = useState(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [bookingTarget, setBookingTarget] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [viewingSpecialist, setViewingSpecialist] = useState(null)
  const [appointmentBadge, setAppointmentBadge] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const isAdmin = user?.email === 'bmimp1@gmail.com'

  useEffect(() => {
    if (!user) { setRoleLoading(false); return }

    async function detectRole() {
      const metaRole = user.user_metadata?.role
      if (metaRole === 'specialist') {
        setRole('specialist')
        setOnboarded(!!localStorage.getItem(SPECIALIST_ONBOARDING_KEY))
        setRoleLoading(false)
        return
      }

      const { data: specialistProfile } = await supabase
        .from('specialist_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (specialistProfile) {
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
        .in('status', ['accepted', 'declined', 'completed'])
        .then(({ data }) => {
          if (!data) return
          const seen = JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || '[]')
          const unseen = data.filter(b => !seen.includes(b.id))
          setAppointmentBadge(unseen.length)
        })
    }

    detectRole()
    if (!Capacitor.isNativePlatform()) registerWebPush(user.id)
  }, [user])

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    if (user.user_metadata?.role !== 'specialist') return
    import('@revenuecat/purchases-capacitor').then(({ Purchases }) => {
      Purchases.configure({
        apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
        appUserID: user.id,
      })
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

  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') setShowPasswordReset(true)
  }, [authEvent])

  if (showPasswordReset) {
    return <PasswordResetPage onDone={() => setShowPasswordReset(false)} />
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-800">
        <p className="text-stone-600 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/specialist/signup" element={<SpecialistSignupPage />} />
        <Route path="/specialist/:id" element={<SpecialistPublicPage />} />
        <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
        <Route
          path="*"
          element={
            !user ? <LandingPage /> :
            !onboarded && role === 'specialist' ? <SpecialistOnboardingPage user={user} onDone={completeOnboarding} /> :
            !onboarded && role === 'client' ? <OnboardingPage user={user} onDone={completeOnboarding} /> :
            showAdmin ? <AdminPage onBack={() => setShowAdmin(false)} /> :
            role === 'specialist' ? <SpecialistProfilePage user={user} onAdmin={isAdmin ? () => setShowAdmin(true) : undefined} /> :
            <>
              {showSettings && (
                <AccountSettingsPage user={user} onBack={() => setShowSettings(false)} />
              )}

              {showFeedback && (
                <FeedbackModal userId={user.id} role="client" onClose={() => setShowFeedback(false)} />
              )}

              {viewingSpecialist && (
                <SpecialistDetailPage
                  specialist={viewingSpecialist}
                  currentUserId={user.id}
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
                {activeTab === 'bookings' && <ClientBookingsPage user={user} onBook={s => { setActiveTab('discover'); setBookingTarget(s) }} />}
              </div>

              <nav className="fixed bottom-0 left-0 right-0 bg-stone-800 border-t border-stone-600 flex">
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
                        .in('status', ['accepted', 'declined', 'completed'])
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
                {isAdmin && (
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="flex-1 py-4 text-xs font-medium transition-colors text-amber-600 hover:text-amber-400"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 py-4 text-xs font-medium transition-colors text-stone-600 hover:text-stone-400"
                >
                  Settings
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
