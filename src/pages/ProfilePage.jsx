import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  { key: 'history', label: 'Hair History', placeholder: 'e.g. Heavily bleached 2021–2022, spent 2 years growing it out. Natural color is dark brown.' },
  { key: 'loves', label: 'What I Love', placeholder: 'e.g. Warm tones, lived-in color, volume at the root.' },
  { key: 'hates', label: 'What I Hate', placeholder: 'e.g. Anything too ashy, over-processed ends, helmet-head blowouts.' },
  { key: 'sensitivities', label: 'Allergies & Sensitivities', placeholder: 'e.g. Scalp reacts to ammonia-heavy bleach. Always patch test.' },
  { key: 'notes', label: 'Anything Else', placeholder: 'e.g. I process fast. I always want to go lighter than I think I do.' },
]

const LABELS = [
  { key: 'before', text: 'Before', desc: 'My current state' },
  { key: 'after', text: 'After', desc: 'A result I loved' },
  { key: 'reference', text: 'Reference', desc: 'My goal / inspiration' },
  { key: 'never-again', text: 'Never Again', desc: 'A result I hated' },
]

function LabelPicker({ onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl p-6 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-stone-100 mb-4">What kind of photo is this?</p>
        {LABELS.map(({ key, text, desc }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-700 hover:bg-stone-800 transition-colors"
          >
            <span className="text-sm font-medium text-stone-100">{text}</span>
            <span className="text-xs text-stone-500">{desc}</span>
          </button>
        ))}
        <button
          onClick={onCancel}
          className="w-full py-3 text-sm text-stone-600 hover:text-stone-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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

const SHARE_LABEL_COLORS = {
  'before': 'text-blue-400',
  'after': 'text-green-400',
  'reference': 'text-purple-400',
  'never-again': 'text-red-400',
}

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState({
    name: '',
    history: '',
    loves: '',
    hates: '',
    sensitivities: '',
    notes: '',
  })
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfile({
          name: data.name || '',
          history: data.history || '',
          loves: data.loves || '',
          hates: data.hates || '',
          sensitivities: data.sensitivities || '',
          notes: data.notes || '',
        })
        setShareUrl(`${window.location.origin}/share/${data.share_token}`)
      }

      const { data: photoData } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (photoData) setPhotos(photoData)
    }
    load()
  }, [user.id])

  async function save() {
    setSaving(true)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, share_token')
      .eq('user_id', user.id)
      .single()

    const shareToken = existing?.share_token || crypto.randomUUID()
    const payload = { ...profile, user_id: user.id, share_token: shareToken }

    if (existing) {
      const { error } = await supabase.from('profiles').update(payload).eq('user_id', user.id)
      if (error) { alert(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('profiles').insert(payload)
      if (error) { alert(error.message); setSaving(false); return }
    }

    setShareUrl(`${window.location.origin}/share/${shareToken}`)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPendingFile(file)
    fileRef.current.value = ''
  }

  async function handleLabelSelect(label) {
    const file = pendingFile
    setPendingFile(null)
    setUploading(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target.result

      const { data: photoRow, error } = await supabase
        .from('photos')
        .insert({ user_id: user.id, url: base64, storage_path: '', label })
        .select()
        .single()

      if (error) alert(error.message)
      if (photoRow) setPhotos(prev => [photoRow, ...prev])
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function deletePhoto(photo) {
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const completionItems = [
    { label: 'Name', done: !!profile.name.trim() },
    { label: 'Photo', done: photos.length > 0 },
    { label: 'Hair History', done: !!profile.history.trim() },
    { label: 'What I Love', done: !!profile.loves.trim() },
    { label: 'What I Hate', done: !!profile.hates.trim() },
    { label: 'Allergies', done: !!profile.sensitivities.trim() },
  ]
  const completedCount = completionItems.filter(i => i.done).length
  const total = completionItems.length
  const pct = Math.round((completedCount / total) * 100)
  const isComplete = completedCount === total

  return (
    <div className="min-h-svh bg-stone-950">
      {pendingFile && (
        <LabelPicker
          onSelect={handleLabelSelect}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-100 tracking-tight">Root</h1>
        <button onClick={signOut} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      {/* Completeness bar */}
      <div className="bg-stone-900 border-b border-stone-800 px-6 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-stone-500">
              {isComplete ? 'Profile complete — ready to share!' : `${completedCount} of ${total} sections complete`}
            </span>
            <span className="text-xs font-medium text-amber-600">{pct}%</span>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-amber-700'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!isComplete && (
            <p className="text-xs text-stone-600 mt-1.5">
              Missing: {completionItems.filter(i => !i.done).map(i => i.label).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">Your name</label>
          <input
            type="text"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
            placeholder="What should your stylist call you?"
          />
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider">Photos</h2>
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="text-xs font-medium text-amber-600 hover:text-amber-500 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Add photo'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {photos.length === 0 ? (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-stone-800 rounded-2xl py-10 text-stone-600 text-sm hover:border-stone-700 transition-colors"
            >
              Add your first photo — before, after, reference, or "never again"
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                <div key={photo.id} className="relative group aspect-square">
                  <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                  {photo.label && (
                    <span className={`absolute bottom-1 left-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${LABEL_COLORS[photo.label] || 'bg-stone-800 text-stone-400'}`}>
                      {LABEL_TEXT[photo.label] || photo.label}
                    </span>
                  )}
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="aspect-square border-2 border-dashed border-stone-800 rounded-xl text-stone-600 text-2xl hover:border-stone-700 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Text sections */}
        {SECTIONS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
            <textarea
              value={profile[key]}
              onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 resize-none placeholder:text-stone-600"
              placeholder={placeholder}
            />
          </div>
        ))}

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
        </button>

        {/* Share link */}
        {shareUrl && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <p className="text-sm font-medium text-stone-100 mb-1">Share with your stylist</p>
            <p className="text-xs text-stone-500 mb-3">Send this link before your first appointment — no app required for them.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-400 truncate"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-amber-700 text-amber-50 rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
