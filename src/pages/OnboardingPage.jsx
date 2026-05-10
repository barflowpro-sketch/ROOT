export default function OnboardingPage({ onDone }) {
  return (
    <div className="min-h-svh bg-stone-900 flex flex-col justify-between px-6 py-12">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Root</h1>
        <p className="text-stone-400 text-sm">Your hair history, wherever you go.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {[
            { icon: '📸', title: 'Document your hair', desc: 'Add photos — before, after, inspiration, and the ones you never want repeated.' },
            { icon: '📋', title: 'Build your hair file', desc: 'Record your history, what you love, what you hate, and any allergies or sensitivities.' },
            { icon: '🔗', title: 'Share with any stylist', desc: 'Send one link before your first appointment. No app required on their end.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-stone-400 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="w-full py-4 bg-white text-stone-900 rounded-2xl text-sm font-semibold hover:bg-stone-100 transition-colors"
        >
          Build my hair file
        </button>

        <p className="text-center text-xs text-stone-500">Your data stays yours. Always.</p>
      </div>
    </div>
  )
}
