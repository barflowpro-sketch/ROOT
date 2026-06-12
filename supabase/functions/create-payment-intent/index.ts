import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { amount } = await req.json()
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  })

  return new Response(
    JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
