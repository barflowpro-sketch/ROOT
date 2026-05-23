import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const RADII = [
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '50 mi', value: 50 },
]

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function StarDisplay({ rating, count }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-500 text-xs leading-none">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= rounded ? 'text-amber-500' : 'text-stone-700'}>★</span>
        ))}
      </span>
      <span className="text-stone-500 text-xs">{rating.toFixed(1)} ({count})</span>
    </div>
  )
}

export default function DiscoveryPage({ user, onView }) {
  const [city, setCity] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nearMe, setNearMe] = useState(false)
  const [radius, setRadius] = useState(25)
  const [locationError, setLocationError] = useState(null)
  const [sortBy, setSortBy] = useState('rating')
  const [rawNearby, setRawNearby] = useState([])

  function filterByService(data) {
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return data
    return data.filter(s => {
      const flat = s.services || []
      const grouped = Object.values(s.service_groups || {}).flat()
      return [...flat, ...grouped].some(svc => svc.toLowerCase().includes(q))
    })
  }

  async function attachRatings(filtered) {
    if (filtered.length === 0) return []
    const specialistIds = filtered.map(s => s.user_id)
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('specialist_id, rating')
      .in('specialist_id', specialistIds)

    const ratingMap = {}
    reviewData?.forEach(r => {
      if (!ratingMap[r.specialist_id]) ratingMap[r.specialist_id] = { sum: 0, count: 0 }
      ratingMap[r.specialist_id].sum += r.rating
      ratingMap[r.specialist_id].count += 1
    })

    return filtered.map(s => ({
      ...s,
      avgRating: ratingMap[s.user_id] ? ratingMap[s.user_id].sum / ratingMap[s.user_id].count : null,
      ratingCount: ratingMap[s.user_id]?.count || 0,
    }))
  }

  async function search() {
    if (!city.trim()) return
    setLoading(true)
    setSearched(true)
    setNearMe(false)
    setLocationError(null)

    const { data } = await supabase
      .from('specialist_profiles')
      .select('*')
      .ilike('city', `%${city.trim()}%`)
      .not('name', 'is', null)
      .neq('name', '')

    const now = new Date().toISOString()
    const visible = (data || []).filter(s =>
      s.subscription_status === 'active' ||
      (s.subscription_status === 'trial' && s.trial_ends_at && s.trial_ends_at > now) ||
      !s.subscription_status
    )
    const filtered = filterByService(visible)
    setResults(await attachRatings(filtered))
    setLoading(false)
  }

  async function searchNearMe() {
    setLocationError(null)
    setLoading(true)
    setSearched(true)
    setNearMe(true)

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords

        const { data } = await supabase
          .from('specialist_profiles')
          .select('*')
          .not('name', 'is', null)
          .neq('name', '')
          .not('lat', 'is', null)
          .not('lng', 'is', null)

        const now2 = new Date().toISOString()
        const visibleNearby = (data || []).filter(s =>
          s.subscription_status === 'active' ||
          (s.subscription_status === 'trial' && s.trial_ends_at && s.trial_ends_at > now2) ||
          !s.subscription_status
        )
        const withDistance = filterByService(visibleNearby)
          .map(s => ({ ...s, distance: haversineDistance(latitude, longitude, s.lat, s.lng) }))
        setRawNearby(withDistance)

        const nearby = withDistance.filter(s => s.distance <= radius).sort((a, b) => a.distance - b.distance)
        setResults(await attachRatings(nearby))
        setLoading(false)
      },
      () => {
        setLocationError('Could not get your location. Please allow location access and try again.')
        setLoading(false)
        setSearched(false)
      }
    )
  }

  useEffect(() => {
    if (!nearMe || rawNearby.length === 0) return
    const filtered = rawNearby.filter(s => s.distance <= radius).sort((a, b) => a.distance - b.distance)
    attachRatings(filtered).then(setResults)
  }, [radius])

  return (
    <div className="min-h-svh bg-stone-800">
      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100 tracking-tight">Find a Specialist</h1>
          <p className="text-xs text-stone-500 mt-0.5">Search by city or use your location</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-stone-600 hover:text-stone-400 transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        <div className="space-y-3">

          {/* Search row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="flex-1 px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
              placeholder="City (e.g. Austin, TX)"
            />
            <button
              onClick={searchNearMe}
              disabled={loading}
              className="px-4 py-3 rounded-xl border border-stone-700 bg-stone-700 text-stone-300 text-sm hover:border-amber-700 hover:text-amber-500 transition-colors disabled:opacity-50"
              title="Search near me"
            >
              ◎
            </button>
          </div>

          {/* Radius selector — only shown in near me mode */}
          {nearMe && (
            <div className="flex gap-2">
              {RADII.map(r => (
                <button
                  key={r.value}
                  onClick={() => { setRadius(r.value) }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    radius === r.value
                      ? 'bg-amber-700 border-amber-700 text-amber-50'
                      : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {locationError && <p className="text-red-400 text-xs">{locationError}</p>}

          {/* Service filter */}
          <input
            type="text"
            value={serviceQuery}
            onChange={e => setServiceQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Service (e.g. Box Braids, Loc Retwist…)"
            className="w-full px-4 py-3 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
          />

          <button
            onClick={search}
            disabled={loading || !city.trim()}
            className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {searched && !loading && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-stone-500 text-sm">
                  {nearMe ? `No specialists found within ${radius} miles.` : `No specialists found in ${city}.`}
                </p>
                <p className="text-stone-600 text-xs mt-1">
                  {nearMe ? 'Try a larger radius or different service.' : 'Try a different city or service.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">{results.length} specialist{results.length !== 1 ? 's' : ''} found</p>
                  <div className="flex gap-1">
                    {[
                      { key: 'rating', label: 'Top rated' },
                      { key: 'distance', label: 'Nearest' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          sortBy === opt.key ? 'bg-amber-700 border-amber-700 text-amber-50' : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {[...results].sort((a, b) => {
                  if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0)
                  if (sortBy === 'distance') return (a.distance ?? Infinity) - (b.distance ?? Infinity)
                  return 0
                }).map(specialist => (
                <div key={specialist.id} className="bg-stone-700 border border-stone-600 rounded-2xl overflow-hidden">
                  <div className="w-full h-48 bg-stone-600">
                    {specialist.photo
                      ? <img src={specialist.photo} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-stone-500 text-5xl font-semibold">
                          {specialist.name?.charAt(0) || '?'}
                        </div>
                    }
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-semibold text-stone-100">{specialist.name}</h3>
                        {specialist.distance != null && (
                          <span className="text-xs text-amber-500 font-medium">{specialist.distance.toFixed(1)} mi</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{specialist.city}</p>
                      {specialist.avgRating && (
                        <div className="mt-1">
                          <StarDisplay rating={specialist.avgRating} count={specialist.ratingCount} />
                        </div>
                      )}
                    </div>

                    {specialist.bio && (
                      <p className="text-xs text-stone-400 leading-relaxed">{specialist.bio}</p>
                    )}

                    {(() => {
                      const fromGroups = Object.values(specialist.service_groups || {}).flat().filter(Boolean)
                      const allSvcs = fromGroups.length > 0 ? fromGroups : (specialist.services || [])
                      return allSvcs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {allSvcs.slice(0, 4).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-stone-600 text-stone-400 rounded-full text-xs">{s}</span>
                          ))}
                          {allSvcs.length > 4 && (
                            <span className="px-2 py-0.5 text-stone-600 text-xs">+{allSvcs.length - 4} more</span>
                          )}
                        </div>
                      )
                    })()}

                    <button
                      onClick={() => onView(specialist)}
                      className="w-full py-2.5 bg-amber-700 text-amber-50 rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
                    >
                      View profile
                    </button>
                  </div>
                </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
