import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { specialist_id, specialist_name, clients } = await req.json()

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let sent = 0
    let failed = 0
    const records: { specialist_id: string; client_email: string; client_name: string | null }[] = []

    for (const client of clients) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Root <hello@rootbook.org>',
            to: client.email,
            subject: `${specialist_name} has moved to Root`,
            html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:36px 32px;background:#1c1917;border-radius:20px;">
    <img src="https://rootbook.org/logo.png" alt="Root" style="width:48px;height:48px;border-radius:12px;margin-bottom:24px;display:block;" />
    <h2 style="font-size:20px;font-weight:800;color:#f5f5f4;margin:0 0 12px;letter-spacing:-0.3px;">
      Hi${client.name ? ` ${client.name}` : ''},
    </h2>
    <p style="font-size:14px;color:#a8a29e;line-height:1.7;margin:0 0 12px;">
      Your specialist <strong style="color:#f5f5f4;">${specialist_name}</strong> has moved to <strong style="color:#f59e0b;">Root</strong> — a free platform where your full hair history travels with you to every appointment.
    </p>
    <p style="font-size:14px;color:#a8a29e;line-height:1.7;margin:0 0 28px;">
      Build your hair profile once — photos, history, allergies — and it's sent automatically every time you book.
    </p>
    <a href="https://rootbook.org" style="display:inline-block;background:#b45309;color:#fef3c7;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:0.2px;">
      Get started — it's free →
    </a>
    <p style="font-size:12px;color:#57534e;margin-top:32px;padding-top:20px;border-top:1px solid #292524;">
      rootbook.org &nbsp;·&nbsp; <a href="mailto:hello@rootbook.org" style="color:#78716c;text-decoration:none;">hello@rootbook.org</a>
    </p>
  </div>
</body>
</html>`,
          }),
        })

        if (res.ok) {
          sent++
          records.push({ specialist_id, client_email: client.email, client_name: client.name || null })
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    if (records.length > 0) {
      await supabase.from('client_invites').insert(records)
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
