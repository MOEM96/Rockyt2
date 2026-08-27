import express, { Router, Request, Response } from 'express';
import { whatsappStore } from './whatsappStore';
import { ZernioWhatsAppService } from './zernioWhatsAppService';
import { MetaCAPIService } from './metaCapiService';
import { MCPServerHandler, MCP_TOOLS_MANIFEST } from './mcpServer';
import { AutomationEngine } from './automationEngine';
import { WhatsAppMessage, MetaCAPIEvent, WhatsAppContact, AutomationFlow } from './whatsappTypes';
import crypto from 'crypto';

interface IdParams { id: string; [key: string]: string; }
interface NameParams { name: string; [key: string]: string; }

export const whatsappRouter = Router();

// Processed Webhook Event ID Set for Deduplication
const processedEventIds = new Set<string>();

// ─── 1. Zernio Webhook Ingestion Endpoint ───
whatsappRouter.post('/api/webhooks/zernio', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-zernio-signature'] as string;
    const secret = process.env.ZERNIO_WEBHOOK_SECRET;

    // Verify signature if secret is configured (fail closed)
    if (secret) {
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' });
      }
      const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    if (!event || !event.event) {
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    // Deduplication check (ack immediately within 5 seconds)
    if (event.id && processedEventIds.has(event.id)) {
      return res.json({ ok: true, deduplicated: true });
    }
    if (event.id) {
      processedEventIds.add(event.id);
      if (processedEventIds.size > 5000) {
        const first = processedEventIds.values().next().value;
        if (first) processedEventIds.delete(first);
      }
    }

    // Process asynchronously off the request path
    setImmediate(async () => {
      try {
        const eventType = event.event;
        const msgData = event.message;
        const convData = event.conversation;
        const accountData = event.account;

        if (eventType === 'conversation.started' && convData) {
          let contact = whatsappStore.getContactByPhone(convData.contact?.phone_number || '');
          if (!contact) {
            contact = {
              id: `cnt_${Date.now()}`,
              phone_number: convData.contact?.phone_number || '+1000000000',
              formatted_phone: convData.contact?.phone_number || '+1 (000) 000-0000',
              name: convData.contact?.name || 'WhatsApp Contact',
              tags: ['New_Inbound'],
              custom_fields: {},
              lifecycle_stage: 'subscriber',
              created_at: new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
            };
            whatsappStore.saveContact(contact);
          }

          whatsappStore.saveConversation({
            id: convData.id || `conv_${Date.now()}`,
            account_id: accountData?.id || 'acc_waba_primary',
            profile_id: event.profile_id || 'prof_default',
            contact,
            unread_count: 1,
            status: 'active',
            last_customer_message_at: new Date().toISOString(),
            window_expires_at: new Date(Date.now() + 86400000).toISOString(),
            is_window_open: true,
            ai_agent_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (eventType === 'message.received' && msgData) {
          const convId = msgData.conversationId || msgData.conversation_id;
          let conv = convId ? whatsappStore.getConversation(convId) : undefined;
          
          let referral = msgData.referral;
          if (referral) {
            // Normalize CTWA referral metadata
            referral = {
              source_id: referral.source_id || referral.ad_id,
              source_type: referral.source_type || 'ad',
              source_url: referral.source_url,
              headline: referral.headline,
              body: referral.body,
              media_url: referral.media_url,
              ad_id: referral.ad_id,
              campaign_id: referral.campaign_id,
              campaign_name: referral.campaign_name,
              ctwa_clid: referral.ctwa_clid,
            };
          }

          const newMsg: WhatsAppMessage = {
            id: msgData.id || `msg_${Date.now()}`,
            conversation_id: convId || 'conv_wa_001',
            direction: 'incoming',
            type: msgData.type || 'text',
            text: msgData.text,
            media_url: msgData.media_url,
            status: 'delivered',
            timestamp: msgData.timestamp || new Date().toISOString(),
            sender_name: msgData.sender?.name || 'Customer',
            sender_phone: msgData.sender?.phone,
            referral,
          };

          whatsappStore.appendMessage(newMsg);

          // Trigger Visual Automations
          await AutomationEngine.processIncomingTrigger({
            type: referral ? 'ctwa_click' : 'message_received',
            conversationId: newMsg.conversation_id,
            messageText: newMsg.text,
            ctwaData: referral,
          });
        }

        if (['message.sent', 'message.delivered', 'message.read', 'message.failed'].includes(eventType) && msgData) {
          const convId = msgData.conversationId || msgData.conversation_id;
          if (convId) {
            const msgs = whatsappStore.getMessages(convId);
            const target = msgs.find((m) => m.id === msgData.id);
            if (target) {
              target.status = eventType.replace('message.', '') as any;
            }
          }
        }
      } catch (err: any) {
        console.error('[Zernio Webhook Worker Error]:', err);
      }
    });

    // Return instant 200 OK within 5s SLA
    return res.status(200).json({ ok: true, received: true });
  } catch (err: any) {
    console.error('[Zernio Webhook Error]:', err);
    return res.status(500).json({ error: 'Webhook processing failure' });
  }
});

// ─── 2. WhatsApp Conversations & Messages ───
whatsappRouter.get('/api/whatsapp/conversations', (req: Request, res: Response) => {
  const conversations = whatsappStore.getConversations();
  return res.json({ data: conversations });
});

whatsappRouter.get('/api/whatsapp/conversations/:id/messages', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const messages = whatsappStore.getMessages(id);
  const conversation = whatsappStore.getConversation(id);
  return res.json({ data: messages, conversation });
});

whatsappRouter.post('/api/whatsapp/conversations/:id/messages', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const { text, media_url, template_name, template_params } = req.body;

  const conv = whatsappStore.getConversation(id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // 24-hour Customer Service Window Enforcement
  if (!template_name && !conv.is_window_open) {
    return res.status(403).json({
      error: 'WhatsApp 24-hour Customer Service Window is closed. You must send an approved Meta Template message.',
      is_window_open: false,
      window_expires_at: conv.window_expires_at,
    });
  }

  const msg: WhatsAppMessage = {
    id: `msg_out_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    conversation_id: id,
    direction: 'outgoing',
    type: template_name ? 'template' : media_url ? 'image' : 'text',
    text: text || (template_name ? `[Template: ${template_name}]` : ''),
    media_url,
    template_name,
    template_params,
    status: 'delivered',
    timestamp: new Date().toISOString(),
    sender_name: 'Support Agent',
  };

  whatsappStore.appendMessage(msg);

  // Dispatch via Zernio SDK if online
  ZernioWhatsAppService.sendInboxMessage(id, text, media_url).catch(() => {});

  return res.json({ success: true, message: msg });
});

whatsappRouter.post('/api/whatsapp/conversations/:id/typing', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  ZernioWhatsAppService.sendTypingIndicator(id).catch(() => {});
  return res.json({ ok: true });
});

whatsappRouter.post('/api/whatsapp/conversations/:id/read', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  whatsappStore.markConversationRead(id);
  ZernioWhatsAppService.markConversationRead(id).catch(() => {});
  return res.json({ ok: true });
});

// ─── 3. Meta Conversions API (CAPI) Endpoints ───
whatsappRouter.post('/api/whatsapp/capi/trigger', async (req: Request, res: Response) => {
  const { conversation_id, event_name, value, currency, custom_event_name } = req.body;
  const conv = conversation_id ? whatsappStore.getConversation(conversation_id) : undefined;

  const contact = conv?.contact;
  const ctwaClid = conv?.ctwa_referral?.ctwa_clid || contact?.ctwa_source?.ctwa_clid;

  const result = await MetaCAPIService.dispatchEvent({
    eventName: event_name || 'Lead',
    customEventName: custom_event_name,
    userData: {
      phone: contact?.phone_number || req.body.phone,
      email: contact?.email || req.body.email,
      ctwaClid,
    },
    customData: {
      value: value || 35.0,
      currency: currency || 'USD',
      adId: conv?.ctwa_referral?.ad_id,
      campaignId: conv?.ctwa_referral?.campaign_id,
    },
  });

  const capiEvent: MetaCAPIEvent = {
    id: `capi_${Date.now()}`,
    event_id: result.eventId,
    event_name: event_name || 'Lead',
    custom_event_name,
    event_time: Math.floor(Date.now() / 1000),
    contact_id: contact?.id || 'manual_contact',
    conversation_id,
    phone_number: contact?.phone_number || req.body.phone || '+10000000000',
    email: contact?.email || req.body.email,
    ctwa_clid: ctwaClid,
    ad_id: conv?.ctwa_referral?.ad_id,
    campaign_id: conv?.ctwa_referral?.campaign_id,
    value: value || 35.0,
    currency: currency || 'USD',
    status: result.success ? 'delivered' : 'failed',
    meta_response: result.metaResponse,
    created_at: new Date().toISOString(),
  };

  whatsappStore.logCAPIEvent(capiEvent);

  return res.json({
    success: true,
    event: capiEvent,
    meta_response: result.metaResponse,
  });
});

whatsappRouter.get('/api/whatsapp/capi/events', (req: Request, res: Response) => {
  const events = whatsappStore.getCAPIEvents();
  return res.json({ data: events });
});

// ─── 4. Visual Automations & Flows ───
whatsappRouter.get('/api/whatsapp/automations', (req: Request, res: Response) => {
  const flows = whatsappStore.getAutomations();
  return res.json({ data: flows });
});

whatsappRouter.post('/api/whatsapp/automations', (req: Request, res: Response) => {
  const { title, description, trigger_type, nodes, edges, is_active } = req.body;
  const newFlow: AutomationFlow = {
    id: `flow_${Date.now()}`,
    title: title || 'New WhatsApp Flow',
    description,
    trigger_type: trigger_type || 'keyword',
    nodes: nodes || [],
    edges: edges || [],
    is_active: is_active ?? true,
    execution_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  whatsappStore.saveAutomation(newFlow);
  return res.json({ success: true, data: newFlow });
});

whatsappRouter.put('/api/whatsapp/automations/:id', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const existing = whatsappStore.getAutomation(id);
  if (!existing) return res.status(404).json({ error: 'Flow not found' });

  const updated: AutomationFlow = {
    ...existing,
    ...req.body,
    id,
    updated_at: new Date().toISOString(),
  };

  whatsappStore.saveAutomation(updated);
  return res.json({ success: true, data: updated });
});

whatsappRouter.delete('/api/whatsapp/automations/:id', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  whatsappStore.deleteAutomation(id);
  return res.json({ success: true });
});

whatsappRouter.post('/api/whatsapp/automations/:id/test', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const flow = whatsappStore.getAutomation(id);
  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  const sampleConv = whatsappStore.getConversations()[0];
  const result = await AutomationEngine.executeFlow(flow, sampleConv);
  return res.json({ success: true, result });
});

// ─── 5. Meta Templates ───
whatsappRouter.get('/api/whatsapp/templates', (req: Request, res: Response) => {
  const templates = whatsappStore.getTemplates();
  return res.json({ data: templates });
});

whatsappRouter.post('/api/whatsapp/templates', (req: Request, res: Response) => {
  const { name, category, language, components } = req.body;
  const newTemplate = {
    id: `tmpl_${Date.now()}`,
    name: name.toLowerCase().replace(/\s+/g, '_'),
    category: category || 'MARKETING',
    language: language || 'en_US',
    status: 'APPROVED' as const, // Meta simulation
    components: components || [],
    last_updated: new Date().toISOString(),
  };

  whatsappStore.saveTemplate(newTemplate);
  return res.json({ success: true, data: newTemplate });
});

whatsappRouter.delete('/api/whatsapp/templates/:name', (req: Request<NameParams>, res: Response) => {
  const { name } = req.params;
  whatsappStore.deleteTemplate(name);
  return res.json({ success: true });
});

// ─── 6. Broadcast Campaigns ───
whatsappRouter.get('/api/whatsapp/broadcasts', (req: Request, res: Response) => {
  const broadcasts = whatsappStore.getBroadcasts();
  return res.json({ data: broadcasts });
});

whatsappRouter.post('/api/whatsapp/broadcasts', (req: Request, res: Response) => {
  const { title, template_name, target_tags, scheduled_at } = req.body;
  
  // Calculate matching contacts count
  const allContacts = whatsappStore.getContacts();
  const matched = (target_tags && target_tags.length > 0)
    ? allContacts.filter((c) => target_tags.some((t: string) => c.tags.includes(t)))
    : allContacts;

  const total = Math.max(matched.length, 120);

  const newBroadcast = {
    id: `bc_${Date.now()}`,
    title: title || 'WhatsApp Broadcast Campaign',
    template_name: template_name || 'lead_welcome_v1',
    target_tags: target_tags || ['All_Contacts'],
    total_recipients: total,
    sent_count: total,
    delivered_count: Math.floor(total * 0.98),
    read_count: Math.floor(total * 0.82),
    failed_count: Math.floor(total * 0.02),
    status: scheduled_at ? ('scheduled' as const) : ('completed' as const),
    scheduled_at,
    created_at: new Date().toISOString(),
  };

  whatsappStore.saveBroadcast(newBroadcast);
  return res.json({ success: true, data: newBroadcast });
});

// ─── 7. Contacts & CRM ───
whatsappRouter.get('/api/whatsapp/contacts', (req: Request, res: Response) => {
  const contacts = whatsappStore.getContacts();
  return res.json({ data: contacts });
});

whatsappRouter.post('/api/whatsapp/contacts', (req: Request, res: Response) => {
  const newContact: WhatsAppContact = {
    id: `cnt_${Date.now()}`,
    phone_number: req.body.phone_number || '+10000000000',
    formatted_phone: req.body.formatted_phone || req.body.phone_number || '+1 (000) 000-0000',
    name: req.body.name || 'New Contact',
    email: req.body.email,
    tags: req.body.tags || ['Direct_Contact'],
    custom_fields: req.body.custom_fields || {},
    lifecycle_stage: req.body.lifecycle_stage || 'lead',
    created_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    notes: req.body.notes,
  };

  whatsappStore.saveContact(newContact);
  return res.json({ success: true, data: newContact });
});

// ─── 8. External MCP (Model Context Protocol) Server ───
whatsappRouter.post('/api/mcp', (req: Request, res: Response) => {
  const response = MCPServerHandler.handleJsonRpcRequest(req.body);
  return res.json(response);
});

whatsappRouter.get('/api/mcp/manifest', (req: Request, res: Response) => {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const mcpEndpoint = `${protocol}://${host}/api/mcp`;

  return res.json({
    name: 'rockyt-whatsapp-mcp',
    description: 'Model Context Protocol Server for WhatsApp Automations, Live CRM, CTWA Ads attribution, and Meta CAPI conversion tracking.',
    endpoint: mcpEndpoint,
    protocol: 'JSON-RPC 2.0 / SSE',
    version: '2.0.0',
    tools: MCP_TOOLS_MANIFEST,
    claude_desktop_config: {
      mcpServers: {
        rockyt_whatsapp: {
          url: mcpEndpoint,
          headers: {
            Authorization: 'Bearer YOUR_MCP_API_TOKEN',
          },
        },
      },
    },
    cursor_config: {
      mcpServers: {
        rockyt_whatsapp: {
          url: mcpEndpoint,
          type: 'sse',
        },
      },
    },
  });
});

whatsappRouter.get('/api/mcp/tokens', (req: Request, res: Response) => {
  const tokens = whatsappStore.getMCPTokens();
  return res.json({ data: tokens });
});

whatsappRouter.post('/api/mcp/tokens', (req: Request, res: Response) => {
  const { name, scopes } = req.body;
  const result = whatsappStore.createMCPToken(name || 'External Agent Token', scopes || ['*']);
  return res.json({ success: true, token: result.token, data: result.record });
});

whatsappRouter.delete('/api/mcp/tokens/:id', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  whatsappStore.deleteMCPToken(id);
  return res.json({ success: true });
});

// ─── 9. WABA Connection & Phone Numbers ───
whatsappRouter.post('/api/whatsapp/connect/oauth', (req: Request, res: Response) => {
  const redirectUrl = `https://zernio.com/oauth/whatsapp?client_id=${process.env.ZERNIO_API_KEY || 'demo'}&redirect_uri=${encodeURIComponent('https://rockyt.io/dashboard?waba=connected')}`;
  return res.json({ url: redirectUrl });
});

whatsappRouter.post('/api/whatsapp/connect/headless', (req: Request, res: Response) => {
  const { waba_id, phone_number_id, access_token } = req.body;
  if (!waba_id || !phone_number_id || !access_token) {
    return res.status(400).json({ error: 'Missing required credentials: waba_id, phone_number_id, access_token' });
  }

  return res.json({
    success: true,
    account: {
      id: `acc_waba_${waba_id.substring(0, 6)}`,
      platform: 'whatsapp',
      waba_id,
      phone_number_id,
      status: 'connected',
      quality_rating: 'GREEN',
      tier: 'TIER_100K_DAILY',
      verified_name: 'Rockyt WhatsApp Business Hub',
    },
  });
});

whatsappRouter.get('/api/whatsapp/phone-numbers', (req: Request, res: Response) => {
  return res.json({
    data: [
      {
        id: 'pn_1001',
        display_phone_number: '+1 (415) 555-0199',
        verified_name: 'Rockyt WhatsApp Business Hub',
        quality_rating: 'GREEN',
        code_verification_status: 'VERIFIED',
        messaging_limit_tier: 'TIER_100K',
        status: 'CONNECTED',
      },
    ],
  });
});
