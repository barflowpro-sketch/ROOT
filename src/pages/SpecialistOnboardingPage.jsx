import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SLIDES = [
  {
    title: 'Know your clients before they walk in.',
    subtitle: null,
    body: 'Root gives every client a digital hair file — photos, history, allergies, and preferences — that they share with you automatically when booking.',
    cta: 'See how it works',
  },
  {
    title: 'Built for specialists.',
    subtitle: null,
    features: [
      { icon: '📋', title: 'Clients come prepared', desc: 'Full hair history, allergies, and photos attached to every booking request.' },
      { icon: '🔍', title: 'Get discovered', desc: 'Clients in your city searching for your specialty will find your profile.' },
      { icon: '📅', title: 'One-tap booking', desc: 'Accept or decline requests, message clients, and manage your calendar — all in one place.' },
    ],
    cta: 'Continue',
  },
  {
    title: "What's your name?",
    subtitle: 'This is what clients will see on your profile.',
    body: null,
    cta: 'Build my profile',
    nameInput: true,
  },
]

export default function SpecialistOnboardingPage({ user, onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1
  const isNameStep = slide.nameInput

  async function advance() {
    if (isNameStep && !name.trim()) return

    if (isLast) {
      setSaving(true)
      await supabase.from('specialist_profiles').upsert({
        user_id: user.id,
        name: name.trim(),
      }, { onConflict: 'user_id' })
      setSaving(false)
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-svh bg-stone-800 flex flex-col px-6 py-14">

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-12">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-amber-600' : i < step ? 'w-3 bg-amber-800' : 'w-3 bg-stone-600'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className={`font-bold text-stone-100 tracking-tight leading-tight ${step === 0 ? 'text-3xl' : 'text-2xl'}`}>
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-stone-500 text-sm mt-2">{slide.subtitle}</p>
          )}
        </div>

        {slide.body && (
          <p className="text-stone-400 text-sm leading-relaxed">{slide.body}</p>
        )}

        {isNameStep && (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && advance()}
            autoFocus
            placeholder="Your name or salon name"
            className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
          />
        )}

        {slide.features && (
          <div className="space-y-5">
            {slide.features.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-stone-100 text-sm font-medium">{title}</p>
                  <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-8">
        <button
          onClick={advance}
          disabled={saving || (isNameStep && !name.trim())}
          className="w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Setting up…' : slide.cta}
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full py-2 text-xs text-stone-600 hover:text-stone-400 transition-colors"
          >
            Back
          </button>
        )}
        {step === 0 && (
          <p className="text-center text-xs text-stone-600">Free to join. Always.</p>
        )}
      </div>
    </div>
  )
}
