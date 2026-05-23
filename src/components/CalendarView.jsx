import { useState } from 'react'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_BADGE = {
  pending: 'text-amber-500',
  accepted: 'text-green-500',
  declined: 'text-red-400',
  cancelled: 'text-stone-500',
}
const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

export default function CalendarView({ bookings, onMessage }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const bookingsByDate = {}
  bookings.forEach(b => {
    const d = b.requested_date
    if (!bookingsByDate[d]) bookingsByDate[d] = []
    bookingsByDate[d].push(b)
  })

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const todayStr = today.toISOString().split('T')[0]
  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : []

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.slice(0, 5).split(':').map(Number)
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const ampm = h < 12 ? 'AM' : 'PM'
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-600 transition-colors"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-stone-100">{MONTHS[month]} {year}</p>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-600 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <p key={d} className="text-center text-xs text-stone-600 font-medium py-1">{d}</p>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const ds = dateStr(day)
          const dayBookings = bookingsByDate[ds] || []
          const isToday = ds === todayStr
          const isSelected = ds === selectedDate
          const hasPending = dayBookings.some(b => b.status === 'pending')
          const hasAccepted = dayBookings.some(b => b.status === 'accepted')

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-sm transition-colors ${
                isSelected
                  ? 'bg-amber-700 text-amber-50'
                  : isToday
                  ? 'bg-stone-600 text-stone-100'
                  : 'text-stone-400 hover:bg-stone-600'
              }`}
            >
              {day}
              {dayBookings.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasPending && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-amber-500'}`} />}
                  {hasAccepted && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-green-200' : 'bg-green-500'}`} />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-stone-500">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-stone-500">Confirmed</span>
        </div>
      </div>

      {/* Selected day bookings */}
      {selectedDate && (
        <div className="space-y-2 pt-2 border-t border-stone-600">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedBookings.length === 0 ? (
            <p className="text-stone-600 text-sm py-4 text-center">No bookings this day.</p>
          ) : (
            selectedBookings.map(booking => (
              <div key={booking.id} className="bg-stone-700 border border-stone-600 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">
                      {booking.client_profile?.name || 'Client'}
                    </p>
                    <p className="text-xs text-stone-500">{formatTime(booking.requested_time)}</p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_BADGE[booking.status]}`}>
                    {STATUS_LABEL[booking.status]}
                  </span>
                </div>
                {booking.client_note && (
                  <p className="text-xs text-stone-400 bg-stone-600 rounded-lg px-3 py-2">{booking.client_note}</p>
                )}
                {onMessage && (
                  <button
                    onClick={() => onMessage(booking)}
                    className="w-full py-2 bg-stone-600 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors"
                  >
                    Message
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
