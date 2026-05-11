import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function SpecialistDetailPage({ specialist, onBook, onBack }) {
  const [reviews, setReviews] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('reviews')
        .select('*')
        .eq('specialist_id', specialist.user_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('portfolio_photos')
        .select('*')
        .eq('specialist_id', specialist.user_id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: reviewData }, { data: portfolioData }]) => {
      setReviews(reviewData || [])
      setPortfolio(portfolioData || [])
      setLoading(false)
    })
  }, [specialist.user_id])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="fixed inset-0 z-40 bg-stone-950 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-stone-950/95 backdrop-blur border-b border-stone-800 px-6 py-4 flex items-center gap-3 z-10">
        <button
          onClick={onBack}
          className="text-stone-400 hover:text-stone-200 transition-colors text-sm flex items-center gap-1.5"
        >
          ← Back
        </button>
      </header>

      {/* Hero photo */}
      <div className="w-full h-64 bg-stone-800">
        {specialist.photo
          ? <img src={specialist.photo} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-stone-600 text-7xl font-bold">
              {specialist.name?.charAt(0) || '?'}
            </div>
        }
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6 pb-32">

        {/* Name + rating */}
        <div>
          <h1 className="text-2xl font-bold text-stone-100">{specialist.name}</h1>
          <p className="text-sm text-stone-500 mt-0.5">{specialist.city}</p>
          {avgRating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={`text-lg ${i <= Math.round(avgRating) ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
                ))}
              </div>
              <span className="text-sm text-stone-400">{avgRating} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {specialist.bio && (
          <div>
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">About</h2>
            <p className="text-sm text-stone-300 leading-relaxed">{specialist.bio}</p>
          </div>
        )}

        {/* Services + Pricing */}
        {specialist.services?.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Services</h2>
            <div className="space-y-1.5">
              {specialist.services.map(s => {
                const price = specialist.service_prices?.[s]
                return (
                  <div key={s} className="flex items-center justify-between px-3 py-2 bg-stone-800 rounded-xl">
                    <span className="text-sm text-stone-300">{s}</span>
                    {price ? (
                      <span className="text-sm font-medium text-amber-500">${price}</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {!loading && portfolio.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Portfolio</h2>
            <div className="grid grid-cols-3 gap-2">
              {portfolio.map(photo => (
                <div key={photo.id} className="aspect-square">
                  <img src={photo.url} alt="" className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {specialist.available_days?.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Availability</h2>
            <div className="flex gap-1.5 mb-2">
              {DAYS.map(day => (
                <div
                  key={day}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center ${
                    specialist.available_days.includes(day)
                      ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                      : 'bg-stone-900 text-stone-700 border border-stone-800'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            {specialist.available_start && specialist.available_end && (
              <p className="text-xs text-stone-500">
                {formatTime(specialist.available_start)} – {formatTime(specialist.available_end)}
              </p>
            )}
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Reviews</h2>
          {loading ? (
            <p className="text-sm text-stone-600">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-stone-600">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-sm ${i <= review.rating ? 'text-amber-500' : 'text-stone-700'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-stone-600">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-stone-400 leading-relaxed">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky book button */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t border-stone-800 px-6 py-4">
        <button
          onClick={() => onBook(specialist)}
          className="w-full py-4 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          Request appointment
        </button>
      </div>
    </div>
  )
}
