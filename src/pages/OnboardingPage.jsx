import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function OnboardingPage({ user, onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function advance() {
    if (step === 1 && !name.trim()) return

    if (step === 2) {
      setSaving(true)
      const shareToken = crypto.randomUUID()
      await supabase.from('profiles').upsert({
        user_id: user.id,
        name: name.trim(),
        share_token: shareToken,
      }, { onConflict: 'user_id' })
      setSaving(false)
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  const features = [
    {
      icon: '◈',
      title: 'Document your hair',
      desc: 'Add photos — before, after, inspiration, and the ones you never want repeated.',
    },
    {
      icon: '◉',
      title: 'Build your hair file',
      desc: 'Record your history, what you love, what you hate, and any allergies.',
    },
    {
      icon: '◎',
      title: 'Book with confidence',
      desc: 'Find a specialist and send your full hair profile with every booking.',
    },
  ]

  return (
    <div className="min-h-svh bg-stone-900 flex flex-col">

      {/* Progress bar */}
      <div className="flex gap-1 px-6 pt-14">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-stone-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${i <= step ? 'bg-amber-600' : 'bg-transparent'}`}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-12">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col">
            <img src="/logo.png" alt="Root" className="w-16 h-16 rounded-2xl mb-8 shadow-xl" />
            <h1 className="text-4xl font-bold text-stone-100 tracking-tight leading-tight mb-4">
              Your hair story,<br />always with you.
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
              Stop re-explaining your hair to every new specialist. Root keeps your full story in one place — photos, history, allergies, and everything you love.
            </p>
            <div className="mt-10 space-y-3">
              {[
                'No more forgotten consultations',
                'Specialists know you before you arrive',
                'Every visit starts exactly right',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-amber-700 text-xs">✦</span>
                  <span className="text-xs text-stone-500">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-stone-100 tracking-tight mb-2">
              What's your name?
            </h1>
            <p className="text-stone-500 text-sm mb-10">Your specialist will use this to greet you.</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && advance()}
              autoFocus
              placeholder="Your name"
              className="w-full px-5 py-4 rounded-2xl border border-stone-700 bg-stone-800 text-stone-100 text-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent placeholder:text-stone-600"
            />
          </div>
        )}

        {/* Step 2 — Features */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-stone-100 tracking-tight mb-2">
              {name ? `Welcome, ${name.split(' ')[0]}.` : 'Here\'s how it works.'}
            </h1>
            <p className="text-stone-500 text-sm mb-10">Everything you need, in one place.</p>
            <div className="space-y-4">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 items-start bg-stone-800 border border-stone-700 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 text-lg">{icon}</span>
                  </div>
                  <div>
                    <p className="text-stone-100 text-sm font-semibold">{title}</p>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 pt-8 space-y-3">
        <button
          onClick={advance}
          disabled={saving || (step === 1 && !name.trim())}
          className="w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-semibold hover:bg-amber-600 active:bg-amber-800 transition-colors disabled:opacity-50 shadow-lg shadow-amber-900/30"
        >
          {saving ? 'Setting up…' : step === 0 ? 'Get started' : step === 1 ? 'Continue' : 'Build my hair file'}
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
          <p className="text-center text-xs text-stone-700">Your data stays yours. Always.</p>
        )}
      </div>
    </div>
  )
}
