import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ReportModal from './ReportModal'

export default function MessagingModal({ booking, currentUserId, otherName, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const bottomRef = useRef()
  const pollRef = useRef()
  const otherUserId = currentUserId === booking.client_id ? booking.specialist_id : booking.client_id

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  useEffect(() => {
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [booking.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    await supabase.from('messages').insert({
      booking_id: booking.id,
      sender_id: currentUserId,
      content,
    })
    await fetchMessages()
    setSending(false)
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-800 flex flex-col">
      {showReport && (
        <ReportModal
          reporterId={currentUserId}
          reportedUserId={otherUserId}
          context="message"
          onClose={() => setShowReport(false)}
        />
      )}
      <header className="bg-stone-800 border-b border-stone-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors text-sm flex items-center gap-1.5"
          >
            ← Back
          </button>
          <div>
            <p className="text-sm font-semibold text-stone-100">{otherName}</p>
            <p className="text-xs text-stone-500">
              {new Date(booking.requested_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="text-xs text-stone-600 hover:text-red-400 transition-colors"
        >
          Report
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-stone-600 text-sm py-10">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId
          const showTime = i === messages.length - 1 ||
            messages[i + 1]?.sender_id !== msg.sender_id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] space-y-0.5`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-amber-700 text-amber-50 rounded-br-sm'
                    : 'bg-stone-600 text-stone-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                {showTime && (
                  <p className={`text-xs text-stone-600 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-stone-600 px-4 py-3 flex gap-2 bg-stone-800">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 placeholder:text-stone-600"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 bg-amber-700 text-amber-50 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
