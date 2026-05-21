import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPage({ onBack }) {
  const [stats, setStats] = useState(null)
  const [specialists, setSpecialists] = useState([])
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    async function load() {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString()

      const [
        { data: allSpecialists },
        { data: clients },
        { data: newSpecialists },
        { data: newClients },
        { data: bookings },
        { data: feedback },
      ] = await Promise.all([
        supabase.from('specialist_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, created_at'),
        supabase.from('specialist_profiles').select('id').gte('created_at', weekAgoStr),
        supabase.from('profiles').select('user_id').gte('created_at', weekAgoStr),
        supabase.from('bookings').select('id, status, created_at'),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      const all = allSpecialists || []
      const now = new Date().toISOString()

      setStats({
        totalSpecialists: all.length,
        activeSpecialists: all.filter(s => s.subscription_status === 'active').length,
        trialSpecialists: all.filter(s => s.subscription_status === 'trial' && s.trial_ends_at > now).length,
        expiredSpecialists: all.filter(s => s.subscription_status === 'expired' || (s.subscription_status === 'trial' && s.trial_ends_at <= now)).length,
        totalClients: (clients || []).length,
        newSpecialistsThisWeek: (newSpecialists || []).length,
        newClientsThisWeek: (newClients || []).length,
        totalBookings: (bookings || []).length,
        pendingBookings: (bookings || []).filter(b => b.status === 'pending').length,
        completedBookings: (bookings || []).filter(b => b.status === 'completed').length,
      })

      setSpecialists(all)
      setFeedbackList(feedback || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-svh bg-stone-800 flex items-center justify-center">
      <p className="text-stone-500 text-sm">Loading…</p>
    </div>
  )

  return (
    <div className="min-h-svh bg-stone-800">
      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Admin</h1>
          <p className="text-xs text-stone-500">Root dashboard</p>
        </div>
        <button onClick={onBack} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">← Back</button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-stone-600 px-6">
        {['overview', 'specialists', 'feedback'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-4 text-xs font-medium capitalize transition-colors relative ${tab === t ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">This week</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-amber-500">+{stats.newSpecialistsThisWeek}</p>
                <p className="text-xs text-stone-500 mt-0.5">New specialists</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-amber-500">+{stats.newClientsThisWeek}</p>
                <p className="text-xs text-stone-500 mt-0.5">New clients</p>
              </div>
            </div>

            <p className="text-xs text-stone-500 uppercase tracking-wider font-medium pt-2">Specialists</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-stone-100">{stats.totalSpecialists}</p>
                <p className="text-xs text-stone-500 mt-0.5">Total</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-green-400">{stats.activeSpecialists}</p>
                <p className="text-xs text-stone-500 mt-0.5">Active subscribers</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-amber-400">{stats.trialSpecialists}</p>
                <p className="text-xs text-stone-500 mt-0.5">In trial</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-red-400">{stats.expiredSpecialists}</p>
                <p className="text-xs text-stone-500 mt-0.5">Expired</p>
              </div>
            </div>

            <p className="text-xs text-stone-500 uppercase tracking-wider font-medium pt-2">Clients & Bookings</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-stone-100">{stats.totalClients}</p>
                <p className="text-xs text-stone-500 mt-0.5">Total clients</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-stone-100">{stats.totalBookings}</p>
                <p className="text-xs text-stone-500 mt-0.5">Total bookings</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-amber-400">{stats.pendingBookings}</p>
                <p className="text-xs text-stone-500 mt-0.5">Pending</p>
              </div>
              <div className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <p className="text-2xl font-bold text-green-400">{stats.completedBookings}</p>
                <p className="text-xs text-stone-500 mt-0.5">Completed</p>
              </div>
            </div>
          </>
        )}

        {/* Specialists list */}
        {tab === 'specialists' && (
          <div className="space-y-3">
            {specialists.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-8">No specialists yet.</p>
            ) : specialists.map(s => (
              <div key={s.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{s.name || 'No name'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{s.city || 'No city'}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{s.user_id}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    s.subscription_status === 'active' ? 'bg-green-900/40 text-green-400' :
                    s.subscription_status === 'trial' ? 'bg-amber-900/40 text-amber-400' :
                    'bg-red-900/40 text-red-400'
                  }`}>
                    {s.subscription_status || 'trial'}
                  </span>
                </div>
                {s.trial_ends_at && (
                  <p className="text-xs text-stone-600 mt-2">
                    Trial ends: {new Date(s.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {s.created_at && (
                  <p className="text-xs text-stone-600 mt-0.5">
                    Joined: {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {tab === 'feedback' && (
          <div className="space-y-3">
            {feedbackList.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-8">No feedback yet.</p>
            ) : feedbackList.map(f => (
              <div key={f.id} className="bg-stone-700 border border-stone-600 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.role === 'specialist' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'}`}>
                    {f.role}
                  </span>
                  <p className="text-xs text-stone-600">
                    {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">"{f.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
