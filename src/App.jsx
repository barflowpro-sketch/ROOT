import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SharePage from './pages/SharePage'
import OnboardingPage from './pages/OnboardingPage'

const ONBOARDING_KEY = 'root_onboarded'

function App() {
  const { user, loading } = useAuth()
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem(ONBOARDING_KEY))

  useEffect(() => {
    if (user && onboarded) {
      localStorage.setItem(ONBOARDING_KEY, '1')
    }
  }, [user, onboarded])

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboarded(true)
  }

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:token" element={<SharePage />} />
        <Route
          path="*"
          element={
            !user ? <AuthPage /> :
            !onboarded ? <OnboardingPage onDone={completeOnboarding} /> :
            <ProfilePage user={user} />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
