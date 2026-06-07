export default function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col" style={{background: '#fdf7f0', color: '#1a0e06'}}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b" style={{borderColor: '#e4d0b8', background: '#fdf7f0'}}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Root" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight" style={{color: '#1a0e06'}}>Root</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors" style={{background: '#f0e4d2', border: '1px solid #e4d0b8', color: '#4a3728'}}>
            Join as client
          </a>
          <a href="/specialist/signup" className="text-sm font-semibold px-4 py-2 bg-amber-700 text-amber-50 rounded-xl hover:bg-amber-600 transition-colors">
            Join as specialist
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <h1 className="text-5xl font-black tracking-tight leading-tight mb-6 max-w-sm" style={{color: '#1a0e06'}}>
          Your hair story,<br />
          <span className="text-amber-600">always with you.</span>
        </h1>

        <p className="text-base leading-relaxed max-w-xs mb-10" style={{color: '#7c5c3e'}}>
          Root connects clients and hair specialists — with every client's full hair history shared automatically at every booking.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-bold shadow-lg shadow-amber-900/20 text-center">
            Get started — it's free
          </div>
        </div>

        <p className="text-xs mt-5" style={{color: '#b8a090'}}>No credit card required · Free for clients</p>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16">
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {[
            { value: '100%', label: 'Free for clients' },
            { value: 'Free', label: 'Specialist basic plan' },
            { value: '$15', label: 'Founding price/mo' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={{background: '#f5ede0', border: '1px solid #e4d0b8'}}>
              <p className="text-2xl font-black text-amber-700">{value}</p>
              <p className="text-xs mt-1 leading-tight" style={{color: '#9c7a5e'}}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For clients */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto rounded-3xl p-6" style={{background: '#f5ede0', border: '1px solid #e4d0b8'}}>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">For clients</p>
          <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight" style={{color: '#1a0e06'}}>
            Stop re-explaining<br />your hair.
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{color: '#7c5c3e'}}>
            Build your hair file once — photos, history, allergies, and preferences. Root sends it automatically every time you book a specialist.
          </p>

          <div className="space-y-3 mb-6">
            {[
              'Build your hair file in minutes',
              'Find specialists in your city',
              'Book in seconds — hair file sent automatically',
              'Free forever for clients',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.3)'}}>
                  <span className="text-amber-700 text-xs">✓</span>
                </div>
                <span className="text-sm" style={{color: '#4a3728'}}>{item}</span>
              </div>
            ))}
          </div>

          <a
            href="/login"
            className="block w-full py-4 rounded-2xl text-sm font-bold transition-colors text-center"
            style={{background: '#e8d5b7', border: '1px solid #d4b896', color: '#4a3728'}}
          >
            Join as a client — free →
          </a>
        </div>
      </section>

      {/* For specialists */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto rounded-3xl p-6" style={{background: '#f5ede0', border: '1px solid #e4d0b8'}}>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">For specialists</p>
          <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight" style={{color: '#1a0e06'}}>
            Know every client<br />before they arrive.
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{color: '#7c5c3e'}}>
            Every client on Root carries a full hair file — sent to you automatically when they book.
          </p>

          {/* Free vs Premium tiers */}
          <div className="space-y-3 mb-6">
            {/* Free */}
            <div className="rounded-2xl p-4" style={{background: '#fdf7f0', border: '1px solid #e4d0b8'}}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{color: '#1a0e06'}}>Free</p>
                <span className="text-xs font-bold" style={{color: '#9c7a5e'}}>$0 / month</span>
              </div>
              <div className="space-y-2">
                {[
                  'Profile visible to clients',
                  'Receive client hair files',
                  'Up to 3 bookings / month',
                  'Portfolio photos',
                  'Calendar management',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-amber-600 text-xs">✓</span>
                    <span className="text-xs" style={{color: '#7c5c3e'}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium */}
            <div className="rounded-2xl p-4 relative overflow-hidden" style={{background: '#1a0e06', border: '1px solid rgba(180,83,9,0.4)'}}>
              <div className="absolute top-0 right-0 bg-amber-700 text-amber-50 text-xs font-bold px-3 py-1 rounded-bl-xl">
                Premium
              </div>
              <div className="flex items-center justify-between mb-3 pr-16">
                <p className="text-sm font-bold text-stone-100">Premium</p>
                <span className="text-xs font-bold text-amber-500">$17.99 / month</span>
              </div>
              <div className="space-y-2">
                {[
                  'Everything in Free',
                  'Unlimited booking requests',
                  'Messaging with clients',
                  'Appear higher in search results',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-amber-600 text-xs">✓</span>
                    <span className="text-xs text-stone-300">{item}</span>
                  </div>
                ))}
              </div>

              {/* Founding offer */}
              <div className="mt-4 pt-3" style={{borderTop: '1px solid rgba(180,83,9,0.2)'}}>
                <p className="text-xs font-bold text-amber-500 mb-1">Founding member offer</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-100">$15</span>
                  <span className="text-xs text-stone-400">/ mo for first 3 months</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">Only 30 spots remaining</p>
              </div>
            </div>
          </div>

          {/* Switching banner */}
          <div className="rounded-2xl p-4 mb-6" style={{background: '#fdf7f0', border: '1px solid #e4d0b8'}}>
            <p className="text-xs font-bold text-amber-700 mb-1">Already on Booksy or Vagaro?</p>
            <p className="text-xs leading-relaxed" style={{color: '#7c5c3e'}}>
              Bring your clients with you. Upload your client list and Root emails every one of them for you — automatically. One upload, done.
            </p>
          </div>

          <a
            href="/specialist/signup"
            className="block w-full py-4 bg-amber-700 text-amber-50 rounded-2xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-900/20 text-center"
          >
            Claim your founding spot →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-8" style={{borderTop: '1px solid #e4d0b8', background: '#f0e4d2'}}>
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Root" className="w-7 h-7 rounded-lg" />
            <span className="font-bold" style={{color: '#1a0e06'}}>Root</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{color: '#9c7a5e'}}>
            The hair booking app that ends cold consultations. For clients and specialists.
          </p>
          <div className="flex flex-wrap gap-4 text-xs" style={{color: '#9c7a5e'}}>
            <a href="/privacy" className="hover:text-amber-700 transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:text-amber-700 transition-colors">Terms & Conditions</a>
            <a href="mailto:hello@rootbook.org" className="hover:text-amber-700 transition-colors">hello@rootbook.org</a>
          </div>

          {/* Social links */}
          <div className="flex flex-col gap-3 mt-5">
            <a href="https://www.instagram.com/rootbookapp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <span className="text-xs transition-colors group-hover:text-amber-700" style={{color: '#9c7a5e'}}>@rootbookapp</span>
            </a>

            <a href="https://www.tiktok.com/@root84509" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: '#010101'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                </svg>
              </div>
              <span className="text-xs transition-colors group-hover:text-amber-700" style={{color: '#9c7a5e'}}>@root84509</span>
            </a>

            <a href="https://www.facebook.com/RootHairBookingApp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: '#1877F2'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-xs transition-colors group-hover:text-amber-700" style={{color: '#9c7a5e'}}>Root Hair Booking App</span>
            </a>
          </div>

          <p className="text-xs mt-5" style={{color: '#b8a090'}}>© 2026 Root · rootbook.org</p>
        </div>
      </footer>

    </div>
  )
}
