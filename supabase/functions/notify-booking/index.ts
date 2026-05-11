import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

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

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record
  const old = payload.old_record

  // New booking created — notify specialist
  if (payload.type === 'INSERT') {
    const { data: specialist } = await fetchUser(record.specialist_id)
    const { data: clientProfile } = await fetchProfile(record.client_id)

    if (specialist?.email) {
      await sendEmail({
        to: specialist.email,
        subject: 'New booking request on Root',
        html: `
          <p>You have a new booking request${clientProfile?.name ? ` from <strong>${clientProfile.name}</strong>` : ''}.</p>
          <p><strong>Date:</strong> ${record.requested_date} at ${record.requested_time?.slice(0, 5)}</p>
          ${record.client_note ? `<p><strong>Note:</strong> ${record.client_note}</p>` : ''}
          ${clientProfile?.share_token ? `<p><a href="${Deno.env.get('APP_URL')}/share/${clientProfile.share_token}">View their hair profile →</a></p>` : ''}
          <p>Sign in to Root to accept or decline.</p>
        `,
      })
    }
  }

  // Booking status updated — notify client
  if (payload.type === 'UPDATE' && old?.status === 'pending' && record.status !== 'pending') {
    const { data: client } = await fetchUser(record.client_id)
    const { data: specialistProfile } = await fetchSpecialistProfile(record.specialist_id)

    if (client?.email) {
      const accepted = record.status === 'accepted'
      await sendEmail({
        to: client.email,
        subject: accepted ? 'Your appointment was confirmed' : 'Your appointment request was declined',
        html: accepted
          ? `<p>Your appointment request with <strong>${specialistProfile?.name || 'your specialist'}</strong> has been confirmed for ${record.requested_date} at ${record.requested_time?.slice(0, 5)}.</p><p>See you then!</p>`
          : `<p>Your appointment request with <strong>${specialistProfile?.name || 'your specialist'}</strong> was declined. You can find another specialist on Root.</p>`,
      })
    }
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
