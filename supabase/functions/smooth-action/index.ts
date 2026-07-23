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

      if (webhookId && webhookSignature && webhookTimestamp) {
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
    }

    const payload = await req.json()
    console.log('Received Dodo Webhook:', payload)

    const eventType = payload.event_type || payload.type || 'test_event'
    const data = payload.data || payload || {}
    
    const metadataUserId = data.customer?.metadata?.user_id || data.metadata?.user_id || payload.metadata?.user_id
    const customerEmail = data.customer?.email || data.email || payload.email
    const customerId = data.customer?.customer_id || data.customer_id
    const subscriptionId = data.subscription_id || data.id
    const sessionId = data.session_id || data.checkout_id

    let userId: string | null = metadataUserId || null
    let lookupMethod = userId ? 'metadata.user_id' : null

    // 1. Try lookup by dodo_session_id in checkout_sessions table
    if (!userId && sessionId) {
      const { data: sessionRow } = await supabaseClient
        .from('checkout_sessions')
        .select('user_id')
        .eq('dodo_session_id', sessionId)
        .maybeSingle()
      if (sessionRow?.user_id) {
        userId = sessionRow.user_id
        lookupMethod = 'checkout_sessions.dodo_session_id'
      }
    }

    // 2. Try lookup by dodo_customer_id in profiles table
    if (!userId && customerId) {
      const { data: profileRow } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('dodo_customer_id', customerId)
        .maybeSingle()
      if (profileRow?.id) {
        userId = profileRow.id
        lookupMethod = 'profiles.dodo_customer_id'
      }
    }

    // 3. Try lookup by subscription_id in profiles table
    if (!userId && subscriptionId) {
      const { data: profileRow } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .maybeSingle()
      if (profileRow?.id) {
        userId = profileRow.id
        lookupMethod = 'profiles.subscription_id'
      }
    }

    // 4. Try lookup by email in profiles table
    if (!userId && customerEmail) {
      const { data: profileRow } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()
      if (profileRow?.id) {
        userId = profileRow.id
        lookupMethod = 'profiles.email'
      }
    }

    console.log('[Webhook User Lookup Result]:', JSON.stringify({
      receivedKeys: { metadataUserId, customerEmail, customerId, subscriptionId, sessionId },
      matchedUserId: userId,
      lookupMethod: lookupMethod || 'NONE'
    }))

    // 1. Record raw webhook event into payment_events table
    try {
      await supabaseClient.from('payment_events').insert({
        event_type: eventType,
        dodo_event_id: payload.event_id || payload.id || null,
        user_id: userId || null,
        payload: payload,
        processed_at: new Date().toISOString()
      })
    } catch (evtErr: any) {
      console.warn('Non-fatal error logging payment_event:', evtErr?.message || evtErr)
    }

    // If test event or unlinked webhook call, return HTTP 200 so Dodo Payments / test curl receives success
    if (!userId) {
      console.log('No user_id matched for webhook payload. Responding 200 OK.')
      return new Response(JSON.stringify({
        message: 'Webhook received successfully',
        lookupDetails: { metadataUserId, customerEmail, customerId, subscriptionId, sessionId }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let status = 'active'
    if (eventType.includes('failed') || eventType.includes('expired')) {
      status = 'past_due'
    } else if (eventType.includes('canceled')) {
      status = 'canceled'
    } else if (eventType.includes('succeeded') || eventType.includes('active') || eventType.includes('created')) {
      status = 'active'
    }

    const productId = data.product_id || data.product_cart?.[0]?.product_id || data.items?.[0]?.product_id
    let planName = null
    let maxAccounts = 1

    if (productId === 'pdt_0NWDjeAeatQKryEvRe4eb') {
      planName = 'Growth'
      maxAccounts = 1
    } else if (productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ') {
      planName = 'Scale'
      maxAccounts = 10
    }

    console.log(`Updating user ${userId} to status: ${status}, plan: ${planName}, maxAccounts: ${maxAccounts}`)

    const updateData: any = {
      subscription_status: status,
      subscription_id: subscriptionId || null,
      is_trial: false,
      dodo_customer_id: data.customer?.customer_id || data.customer_id || null,
      plan_product_id: productId || null
    }

    if (planName) {
      updateData.plan = planName
      updateData.max_accounts = maxAccounts
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (profileError) console.error('Error updating profile:', profileError)

    if (sessionId) {
      await supabaseClient.from('checkout_sessions').update({
        status: status === 'active' ? 'completed' : 'failed',
        dodo_subscription_id: subscriptionId || null,
        completed_at: status === 'active' ? new Date().toISOString() : null,
      }).eq('dodo_session_id', sessionId)
    }

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
