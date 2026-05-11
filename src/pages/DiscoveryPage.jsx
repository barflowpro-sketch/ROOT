import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SERVICES = [
  'Hair color',
  'Haircut',
  'Braids & locs',
  'Natural hair',
  'Beard grooming',
]

export default function DiscoveryPage({ user, onBook }) {
  const [city, setCity] = useState('')
  const [service, setService] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!city.trim()) return
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('specialist_profiles')
      .select('*')
      .ilike('city', `%${city.trim()}%`)

    if (service) {
      query = query.contains('services', [service])
    }

    const { data } = await query
    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-svh bg-stone-950">
      <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Find a Specialist</h1>
          <p className="text-xs text-stone-500 mt-0.5">Search by city and service</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* Search */}
        <div className="space-y-3">
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
            placeholder="City (e.g. Austin, TX)"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setService('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                service === ''
                  ? 'bg-amber-700 border-amber-700 text-amber-50'
                  : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              All
            </button>
            {SERVICES.map(s => (
              <button
                key={s}
                onClick={() => setService(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  service === s
                    ? 'bg-amber-700 border-amber-700 text-amber-50'
                    : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={search}
            disabled={loading || !city.trim()}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-stone-500 text-sm">No specialists found in {city}.</p>
                <p className="text-stone-600 text-xs mt-1">Try a different city or service.</p>
              </div>
            ) : (
              results.map(specialist => (
                <div key={specialist.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-stone-800 overflow-hidden flex-shrink-0">
                      {specialist.photo
                        ? <img src={specialist.photo} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-stone-600 text-lg font-semibold">
                            {specialist.name?.charAt(0) || '?'}
                          </div>
                      }
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-100">{specialist.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{specialist.city}</p>
                    </div>
                  </div>

                  {specialist.bio && (
                    <p className="text-xs text-stone-400 leading-relaxed">{specialist.bio}</p>
                  )}

                  {specialist.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {specialist.services.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-stone-800 text-stone-400 rounded-full text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => onBook(specialist)}
                    className="w-full py-2.5 bg-amber-700 text-amber-50 rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Request appointment
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
