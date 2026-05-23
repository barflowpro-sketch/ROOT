import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatDuration(mins) {
  if (!mins) return ''
  const m = parseInt(mins)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h} hr ${rem} min` : `${h} hr`
}

function StarDisplay({ rating, count }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= rounded ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
      ))}
      <span className="text-stone-500 text-xs ml-1">{rating.toFixed(1)} ({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

export default function SpecialistPublicPage() {
  const { id } = useParams()
  const [specialist, setSpecialist] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: sp }, { data: pf }, { data: rv }] = await Promise.all([
        supabase.from('specialist_profiles').select('*').eq('user_id', id).single(),
        supabase.from('portfolio_photos').select('*').eq('specialist_id', id).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, profiles(name)').eq('specialist_id', id).order('created_at', { ascending: false }),
      ])

      if (!sp) { setNotFound(true); setLoading(false); return }
      setSpecialist(sp)
      setPortfolio(pf || [])
      setReviews(rv || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-800">
        <p className="text-stone-600 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-stone-800">
        <p className="text-stone-500 text-sm">Specialist not found.</p>
      </div>
    )
  }

  const allServices = Object.values(specialist.service_groups || {}).flat()
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

  return (
    <div className="min-h-svh bg-stone-800">
      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4">
        <h1 className="text-xl font-bold text-stone-100 tracking-tight">Root</h1>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

        {/* Profile */}
        <div className="space-y-4">
          <div className="w-full h-56 rounded-2xl bg-stone-600 overflow-hidden flex items-center justify-center">
            {specialist.photo
              ? <img src={specialist.photo} alt="" className="w-full h-full object-cover" />
              : <span className="text-stone-600 text-6xl font-semibold">{specialist.name?.charAt(0) || '?'}</span>
            }
          </div>

          <div>
            <h2 className="text-2xl font-bold text-stone-100 tracking-tight">{specialist.name}</h2>
            {specialist.city && <p className="text-sm text-stone-500 mt-0.5">{specialist.city}</p>}
            {avgRating && (
              <div className="mt-2">
                <StarDisplay rating={avgRating} count={reviews.length} />
              </div>
            )}
          </div>

          {specialist.bio && (
            <p className="text-sm text-stone-400 leading-relaxed">{specialist.bio}</p>
          )}
        </div>

        {/* Services */}
        {allServices.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Services</h3>
            <div className="space-y-2">
              {allServices.map(s => {
                const dur = formatDuration(specialist.service_durations?.[s])
                return (
                  <div key={s} className="flex items-center justify-between py-2.5 border-b border-stone-600 last:border-0">
                    <div>
                      <span className="text-sm text-stone-200">{s}</span>
                      {dur && <span className="text-xs text-stone-500 ml-2">{dur}</span>}
                    </div>
                    {specialist.service_prices?.[s] && (
                      <span className="text-sm font-medium text-amber-500">${specialist.service_prices[s]}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Portfolio</h3>
            <div className="grid grid-cols-3 gap-2">
              {portfolio.map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-stone-600">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Reviews</h3>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-stone-700 border border-stone-600 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-300">{r.profiles?.name || 'Client'}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-sm ${i <= r.rating ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-stone-400 leading-relaxed">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-stone-700 border border-stone-600 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-stone-100">Book with {specialist.name}</p>
          <p className="text-xs text-stone-500">Download Root to request an appointment and send your hair profile automatically.</p>
          <a
            href={appUrl}
            className="block w-full py-3 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold text-center hover:bg-amber-600 transition-colors"
          >
            Open Root to book
          </a>
        </div>
      </div>
    </div>
  )
}
