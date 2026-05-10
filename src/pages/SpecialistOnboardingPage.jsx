export default function SpecialistOnboardingPage({ onDone }) {
  return (
    <div className="min-h-svh bg-stone-950 flex flex-col justify-between px-6 py-14">
      <div>
        <h1 className="text-4xl font-bold text-stone-100 tracking-tight mb-2">Root</h1>
        <p className="text-stone-500 text-sm">For specialists.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          {[
            { icon: '📋', title: 'Clients come prepared', desc: 'Every new client shares their full hair history, allergies, and preferences before they walk in.' },
            { icon: '🔍', title: 'Get discovered', desc: 'Clients in your city looking for your specialty will find your profile.' },
            { icon: '📅', title: 'Simple booking', desc: 'Receive booking requests with the client\'s hair profile already attached. Accept or decline in one tap.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-stone-100 text-sm font-medium">{title}</p>
                <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={onDone}
            className="w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Build my specialist profile
          </button>
          <p className="text-center text-xs text-stone-600">Free to join. Always.</p>
        </div>
      </div>
    </div>
  )
}
