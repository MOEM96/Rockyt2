// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const dodoWebhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')
    if (dodoWebhookSecret) {
      const webhookId = req.headers.get('webhook-id')
      const webhookSignature = req.headers.get('webhook-signature')
      const webhookTimestamp = req.headers.get('webhook-timestamp')

      if (!webhookId || !webhookSignature || !webhookTimestamp) {
        console.error('Dodo Webhook Signature verification headers missing')
        return new Response(JSON.stringify({ error: 'Missing webhook verification headers' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const rawBody = await req.clone().text()
      const encoder = new TextEncoder()
      const keyData = encoder.encode(dodoWebhookSecret)
      const messageData = encoder.encode(`${webhookId}.${webhookTimestamp}.${rawBody}`)

      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        messageData
      )

      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")

      if (computedSignature !== webhookSignature) {
        console.error('Dodo Webhook Signature verification failed')
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }
    }

    const payload = await req.json()
    console.log('Received Dodo Webhook:', payload)

    const eventType = payload.event_type
    const data = payload.data
    
    // Extract User ID from metadata
    // Dodo puts metadata in customer.metadata or data.metadata depending on event
    const userId = data.customer?.metadata?.user_id || data.metadata?.user_id || data.customer_metadata?.user_id
    
    if (!userId) {
      console.error('No user_id found in webhook metadata')
      return new Response(JSON.stringify({ error: 'No user_id found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let status = 'active'
    let subscriptionId = data.subscription_id || data.id
    
    // Simple mapping of Dodo events to our internal status
    if (eventType.includes('failed') || eventType.includes('expired')) {
      status = 'past_due'
    } else if (eventType.includes('canceled')) {
      status = 'canceled'
    } else if (eventType.includes('succeeded') || eventType.includes('active') || eventType.includes('created')) {
      status = 'active'
    }

    // Map Product ID to plan name & limit
    const productId = data.product_id || data.product_cart?.[0]?.product_id || data.items?.[0]?.product_id
    let planName = null
    let maxAccounts = 5

    if (productId === 'pdt_0NWDjeAeatQKryEvRe4eb') {
      planName = 'Growth'
      maxAccounts = 5
    } else if (productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ') {
      planName = 'Scale'
      maxAccounts = 10
    }

    console.log(`Updating user ${userId} to status: ${status}, plan: ${planName}, maxAccounts: ${maxAccounts}`)

    const updateData: any = {
      subscription_status: status,
      subscription_id: subscriptionId,
      is_trial: false
    }

    if (planName) {
      updateData.plan = planName
      updateData.max_accounts = maxAccounts
    }

    const { error } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) throw error

    return new Response(JSON.stringify({ message: 'Success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
