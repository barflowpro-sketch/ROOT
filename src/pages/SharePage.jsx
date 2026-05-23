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

const PHOTO_GROUPS = [
  { key: 'before', label: 'Before' },
  { key: 'after', label: 'After' },
  { key: 'reference', label: 'Reference' },
  { key: 'never-again', label: 'Never Again' },
]

const LABEL_COLORS = {
  'before': 'text-blue-400',
  'after': 'text-green-400',
  'reference': 'text-purple-400',
  'never-again': 'text-red-400',
}

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
      <div className="min-h-svh flex items-center justify-center bg-stone-800">
        <p className="text-stone-600 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-800 px-6">
        <div className="text-center">
          <p className="text-stone-100 font-medium">Profile not found</p>
          <p className="text-stone-500 text-sm mt-1">This link may have expired or been removed.</p>
        </div>
      </div>
    )
  }

  const filled = SECTIONS.filter(s => profile[s.key]?.trim())
  const unlabeled = photos.filter(p => !p.label)
  const hasPhotos = photos.length > 0

  return (
    <div className="min-h-svh bg-stone-800">
      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4">
        <p className="text-xs text-stone-600 uppercase tracking-widest font-medium">Root — Hair Profile</p>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        {/* Identity */}
        <div>
          <h1 className="text-2xl font-bold text-stone-100">{profile.name || 'Your client'}</h1>
          <p className="text-stone-500 text-sm mt-1">Shared their hair history with their specialist.</p>
        </div>

        {/* Sensitivities — always first */}
        {profile.sensitivities?.trim() && (
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-amber-500 mb-2">⚠ Allergies & Sensitivities</h2>
            <p className="text-sm text-amber-200 whitespace-pre-line">{profile.sensitivities}</p>
          </div>
        )}

        {/* Photos grouped by label */}
        {hasPhotos && (
          <div className="space-y-6">
            {PHOTO_GROUPS.map(({ key, label }) => {
              const group = photos.filter(p => p.label === key)
              if (group.length === 0) return null
              return (
                <div key={key}>
                  <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${LABEL_COLORS[key]}`}>{label}</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {group.map(photo => (
                      <div key={photo.id} className="aspect-square">
                        <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {unlabeled.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {unlabeled.map(photo => (
                    <div key={photo.id} className="aspect-square">
                      <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other sections */}
        {filled
          .filter(s => s.key !== 'sensitivities')
          .map(({ key, label }) => (
            <div key={key}>
              <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">{label}</h2>
              <p className="text-sm text-stone-300 whitespace-pre-line leading-relaxed">{profile[key]}</p>
            </div>
          ))}

        <div className="border-t border-stone-600 pt-6 text-center">
          <p className="text-xs text-stone-700">Shared via Root · The client owns this profile</p>
        </div>
      </div>
    </div>
  )
}
