import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LABEL_COLORS = {
  'before': 'bg-blue-900/60 text-blue-300',
  'after': 'bg-green-900/60 text-green-300',
  'reference': 'bg-purple-900/60 text-purple-300',
  'never-again': 'bg-red-900/60 text-red-300',
}

const LABEL_TEXT = {
  'before': 'Before',
  'after': 'After',
  'reference': 'Reference',
  'never-again': 'Never Again',
}

const SECTIONS = [
  { key: 'history', label: 'Hair History' },
  { key: 'loves', label: 'What They Love' },
  { key: 'hates', label: 'What They Hate' },
  { key: 'sensitivities', label: 'Allergies & Sensitivities' },
  { key: 'notes', label: 'Notes' },
]

export default function ClientHairProfileModal({ clientId, clientName, onClose }) {
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: profileData }, { data: photoData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', clientId).single(),
        supabase.from('photos').select('*').eq('user_id', clientId).order('created_at', { ascending: false }),
      ])
      setProfile(profileData || {})
      setPhotos(photoData || [])
      setLoading(false)
    }
    load()
  }, [clientId])

  const hasContent = profile && (
    photos.length > 0 || SECTIONS.some(s => profile[s.key])
  )

  return (
    <div className="fixed inset-0 z-50 bg-stone-800 overflow-y-auto">
      <header className="sticky top-0 bg-stone-800/95 backdrop-blur border-b border-stone-600 px-6 py-4 flex items-center gap-3 z-10">
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-200 transition-colors text-sm flex items-center gap-1.5"
        >
          ← Back
        </button>
        <span className="text-sm font-medium text-stone-300">{clientName}'s Hair Profile</span>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-stone-600 text-sm">Loading…</p>
        </div>
      ) : !hasContent ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-stone-600 text-sm text-center px-6">This client hasn't filled out their hair profile yet.</p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
          {photos.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Photos</h2>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-square">
                    <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                    {photo.label && (
                      <span className={`absolute bottom-1 left-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${LABEL_COLORS[photo.label] || 'bg-stone-600 text-stone-400'}`}>
                        {LABEL_TEXT[photo.label] || photo.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {SECTIONS.map(({ key, label }) =>
            profile[key] ? (
              <div key={key}>
                <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">{label}</h2>
                <p className="text-sm text-stone-300 leading-relaxed">{profile[key]}</p>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
