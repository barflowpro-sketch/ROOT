import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let body: { event?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response('invalid json', { status: 400 })
  }

  const event = body.event
  if (!event) return new Response('no event', { status: 400 })

  const userId = event.app_user_id as string
  const expirationMs = event.expiration_at_ms as number | null
  const subscribedUntil = expirationMs ? new Date(expirationMs).toISOString() : null

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'NON_RENEWING_PURCHASE': {
      await supabase
        .from('specialist_profiles')
        .update({ subscription_status: 'active', subscribed_until: subscribedUntil })
        .eq('user_id', userId)
      break
    }
    case 'CANCELLATION': {
      // Still active until period end — update expiry date only
      if (subscribedUntil) {
        await supabase
          .from('specialist_profiles')
          .update({ subscribed_until: subscribedUntil })
          .eq('user_id', userId)
      }
      break
    }
    case 'EXPIRATION':
    case 'BILLING_ISSUE': {
      await supabase
        .from('specialist_profiles')
        .update({ subscription_status: 'expired', subscribed_until: null })
        .eq('user_id', userId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
