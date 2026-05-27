export default function LandingPage() {
  return (
    <div className="min-h-svh bg-stone-900 text-stone-100 flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Root" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">Root</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold px-4 py-2 bg-stone-700 border border-stone-600 text-stone-200 rounded-xl hover:bg-stone-600 transition-colors">
            Join as client
          </a>
          <a
            href="/specialist/signup"
            className="text-sm font-semibold px-4 py-2 bg-amber-700 text-amber-50 rounded-xl hover:bg-amber-600 transition-colors"
          >
            Join as specialist
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <h1 className="text-5xl font-black tracking-tight leading-tight mb-6 max-w-sm">
          Your hair story,<br />
          <span className="text-amber-500">always with you.</span>
        </h1>

        <p className="text-stone-400 text-base leading-relaxed max-w-xs mb-10">
          Root connects clients and hair specialists — with every client's full hair history shared automatically at every booking.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a
            href="/login"
            className="w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-bold hover:bg-amber-600 active:bg-amber-800 transition-colors shadow-lg shadow-amber-900/30 text-center"
          >
            Get started — it's free
          </a>
          <a
            href="/specialist/signup"
            className="w-full py-4 bg-stone-800 border border-stone-700 text-stone-300 rounded-2xl text-sm font-semibold hover:bg-stone-700 transition-colors text-center"
          >
            I'm a hair specialist →
          </a>
        </div>

        <p className="text-xs text-stone-700 mt-5">No credit card required · Free for clients</p>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16">
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {[
            { value: '100%', label: 'Free for clients' },
            { value: '14', label: 'Day free trial' },
            { value: '$15', label: 'Founding price/mo' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-amber-500">{value}</p>
              <p className="text-xs text-stone-500 mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — clients */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">For clients</p>
          <h2 className="text-3xl font-black tracking-tight mb-8 leading-tight">
            Stop re-explaining<br />your hair.
          </h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Build your hair file', desc: 'Add your photos, hair type, allergies, history, and what you love or hate.' },
              { step: '02', title: 'Find a specialist', desc: 'Browse specialists in your city by specialty, availability, and price.' },
              { step: '03', title: 'Book in seconds', desc: 'Your full hair file is sent automatically. Your specialist knows you before you arrive.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 bg-stone-800 border border-stone-700 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-500 text-xs font-black">{step}</span>
                </div>
                <div>
                  <p className="text-stone-100 text-sm font-semibold">{title}</p>
                  <p className="text-stone-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For specialists */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto bg-stone-800 border border-stone-700 rounded-3xl p-6">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">For specialists</p>
          <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">
            Know every client<br />before they arrive.
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-6">
            Every client on Root carries a full hair file. It's sent to you automatically when they book — photos, history, allergies, and preferences included.
          </p>

          <div className="space-y-3 mb-6">
            {[
              'No more cold consultations',
              'Get discovered by clients in your city',
              'Manage bookings all in one place',
              'Portfolio, calendar & messaging included',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-700/20 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-500 text-xs">✓</span>
                </div>
                <span className="text-sm text-stone-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Founding offer */}
          <div className="bg-stone-900 border border-amber-700/30 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Founding member offer</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-stone-100">$15</span>
              <div>
                <p className="text-xs text-stone-400">/ month for 3 months</p>
                <p className="text-xs text-stone-600 line-through">$17.99 / month after</p>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">Only 30 spots · 14-day free trial included</p>
          </div>

          <a
            href="/specialist/signup"
            className="block w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-900/30 text-center"
          >
            Claim your founding spot →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-800 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Root" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-stone-300">Root</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-4">
            The hair booking app that ends cold consultations. For clients and specialists.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-stone-600">
            <a href="/privacy" className="hover:text-stone-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-stone-400 transition-colors">Terms & Conditions</a>
            <a href="mailto:hello@rootbook.org" className="hover:text-stone-400 transition-colors">hello@rootbook.org</a>
          </div>
          <p className="text-xs text-stone-700 mt-6">© 2026 Root · rootbook.org</p>
        </div>
      </footer>

    </div>
  )
}
