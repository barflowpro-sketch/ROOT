import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Root <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  return res.json()
}

async function sendPush(token: string, title: string, body: string) {
  if (!FCM_SERVER_KEY || !token) return
  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
      priority: 'high',
    }),
  })
}

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record
  const old = payload.old_record

  // New booking created — notify specialist
  if (payload.type === 'INSERT') {
    const { data: specialist } = await fetchUser(record.specialist_id)
    const { data: clientProfile } = await fetchProfile(record.client_id)
    const specialistToken = await fetchPushToken(record.specialist_id)

    const clientName = clientProfile?.name || 'Someone'
    const dateStr = `${record.requested_date} at ${record.requested_time?.slice(0, 5)}`

    if (specialist?.email) {
      await sendEmail({
        to: specialist.email,
        subject: 'New booking request on Root',
        html: `
          <p>You have a new booking request${clientProfile?.name ? ` from <strong>${clientProfile.name}</strong>` : ''}.</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          ${record.client_note ? `<p><strong>Note:</strong> ${record.client_note}</p>` : ''}
          ${clientProfile?.share_token ? `<p><a href="${Deno.env.get('APP_URL')}/share/${clientProfile.share_token}">View their hair profile →</a></p>` : ''}
          <p>Sign in to Root to accept or decline.</p>
        `,
      })
    }

    await sendPush(specialistToken, 'New booking request', `${clientName} wants to book on ${dateStr}`)
  }

  // Booking status updated — notify client
  if (payload.type === 'UPDATE' && old?.status === 'pending' && record.status !== 'pending') {
    const { data: client } = await fetchUser(record.client_id)
    const { data: specialistProfile } = await fetchSpecialistProfile(record.specialist_id)
    const clientToken = await fetchPushToken(record.client_id)

    const specialistName = specialistProfile?.name || 'Your specialist'
    const accepted = record.status === 'accepted'

    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: accepted ? 'Your appointment was confirmed' : 'Your appointment request was declined',
        html: accepted
          ? `<p>Your appointment request with <strong>${specialistName}</strong> has been confirmed for ${record.requested_date} at ${record.requested_time?.slice(0, 5)}.</p><p>See you then!</p>`
          : `<p>Your appointment request with <strong>${specialistName}</strong> was declined. You can find another specialist on Root.</p>`,
      })
    }

    await sendPush(
      clientToken,
      accepted ? 'Appointment confirmed!' : 'Appointment declined',
      accepted
        ? `${specialistName} confirmed your appointment on ${record.requested_date}`
        : `${specialistName} couldn't take your request. Find another specialist on Root.`
    )
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})

async function fetchUser(userId: string) {
  const res = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users/${userId}`,
    { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } }
  )
  return res.json()
}

async function fetchProfile(userId: string) {
  const res = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?user_id=eq.${userId}&select=name,share_token`,
    { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } }
  )
  const data = await res.json()
  return { data: data?.[0] }
}

async function fetchSpecialistProfile(userId: string) {
  const res = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/specialist_profiles?user_id=eq.${userId}&select=name`,
    { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } }
  )
  const data = await res.json()
  return data?.[0]
}

async function fetchPushToken(userId: string) {
  const res = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/push_tokens?user_id=eq.${userId}&select=token`,
    { headers: { 'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } }
  )
  const data = await res.json()
  return data?.[0]?.token || ''
}
