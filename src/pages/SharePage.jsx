import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  { key: 'history', label: 'Hair History' },
  { key: 'loves', label: 'What They Love' },
  { key: 'hates', label: 'What They Hate' },
  { key: 'sensitivities', label: 'Allergies & Sensitivities' },
  { key: 'notes', label: 'Other Notes' },
]

export default function SharePage() {
  const { token } = useParams()
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('share_token', token)
        .single()

      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(data)

      const { data: photoData } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', data.user_id)
        .order('created_at', { ascending: false })

      if (photoData) setPhotos(photoData)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-50 px-6">
        <div className="text-center">
          <p className="text-stone-900 font-medium">Profile not found</p>
          <p className="text-stone-500 text-sm mt-1">This link may have expired or been removed.</p>
        </div>
      </div>
    )
  }

  const filled = SECTIONS.filter(s => profile[s.key]?.trim())

  return (
    <div className="min-h-svh bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Root — Hair Profile</p>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        {/* Identity */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{profile.name || 'Your client'}</h1>
          <p className="text-stone-500 text-sm mt-1">Shared their hair history with you.</p>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-stone-700 mb-3">Photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                <div key={photo.id} className="aspect-square">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensitivities — always show first if filled */}
        {profile.sensitivities?.trim() && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-amber-800 mb-2">⚠ Allergies & Sensitivities</h2>
            <p className="text-sm text-amber-900 whitespace-pre-line">{profile.sensitivities}</p>
          </div>
        )}

        {/* Other sections */}
        {filled
          .filter(s => s.key !== 'sensitivities')
          .map(({ key, label }) => (
            <div key={key}>
              <h2 className="text-sm font-medium text-stone-700 mb-2">{label}</h2>
              <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">{profile[key]}</p>
            </div>
          ))}

        <div className="border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-400">Shared via Root · The client owns this profile</p>
        </div>
      </div>
    </div>
  )
}
