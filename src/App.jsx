import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SharePage from './pages/SharePage'

function App() {
  const { user, loading } = useAuth()

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
        <Route path="*" element={user ? <ProfilePage user={user} /> : <AuthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
