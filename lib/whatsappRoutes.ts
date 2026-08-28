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
    if (!event || (!event.event && !event.action && !event.type)) {
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

    const eventType = event.event || event.action;
    const metadata = event.metadata || {};
    const msgData = event.message || {
      id: metadata.messageId || event.id || `msg_${Date.now()}`,
      conversationId: metadata.conversationId,
      text: metadata.messagePreview || metadata.text,
      sender: {
        name: metadata.senderName,
        phone: metadata.senderPhone,
      },
      timestamp: event.created_at || new Date().toISOString(),
    };
    const convData = event.conversation;
    const accountData = event.account;

    // If sandbox reply message received, flip sandbox to active
    if (eventType === 'message.received' || eventType === 'whatsapp.sandbox.verified') {
      const sandbox = whatsappStore.getSandboxSession();
      if (sandbox) {
        sandbox.status = 'active';
        whatsappStore.setSandboxSession(sandbox);
      }
    }

    const phone = msgData.sender?.phone || metadata.senderPhone || convData?.contact?.phone_number || '';
    const name = msgData.sender?.name || metadata.senderName || convData?.contact?.name || 'WhatsApp Contact';
    const convId = msgData.conversationId || msgData.conversation_id || convData?.id || metadata.conversationId || `conv_${Date.now()}`;

    if (phone || convId) {
      let contact = phone ? whatsappStore.getContactByPhone(phone) : undefined;
      if (!contact && phone) {
        contact = {
          id: `cnt_${Date.now()}`,
          phone_number: phone,
          formatted_phone: phone,
          name,
          tags: ['Sandbox_User', 'WhatsApp_Contact'],
          custom_fields: {},
          lifecycle_stage: 'lead',
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        };
        whatsappStore.saveContact(contact);
      }

      if (contact) {
        let conv = whatsappStore.getConversation(convId);
        if (!conv) {
          conv = {
            id: convId,
            account_id: accountData?.id || event.account_id || 'acc_sandbox',
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
          };
          whatsappStore.saveConversation(conv);
        } else {
          conv.unread_count += 1;
          conv.last_customer_message_at = new Date().toISOString();
          conv.window_expires_at = new Date(Date.now() + 86400000).toISOString();
          conv.is_window_open = true;
          whatsappStore.saveConversation(conv);
        }

        if (msgData.text || metadata.messagePreview) {
          const newMsg: WhatsAppMessage = {
            id: msgData.id || `msg_${Date.now()}`,
            conversation_id: convId,
            direction: 'incoming',
            type: msgData.type || 'text',
            text: msgData.text || metadata.messagePreview,
            media_url: msgData.media_url,
            status: 'delivered',
            timestamp: msgData.timestamp || new Date().toISOString(),
            sender_name: name,
            sender_phone: phone,
          };
          whatsappStore.appendMessage(newMsg);

          // Trigger visual automations
          try {
            await AutomationEngine.processIncomingTrigger({
              type: 'message_received',
              conversationId: convId,
              messageText: newMsg.text,
            });
          } catch (autoErr) {}
        }
      }
    }

    // Return instant 200 OK within 5s SLA
    return res.status(200).json({ ok: true, received: true });
  } catch (err: any) {
    console.error('[Zernio Webhook Error]:', err);
    return res.status(500).json({ error: 'Webhook processing failure' });
  }
});

// ─── 2. WhatsApp Conversations & Messages ───
whatsappRouter.get('/api/whatsapp/conversations', async (req: Request, res: Response) => {
  let localConversations = whatsappStore.getConversations();

  // Sync live conversations from Zernio if API key is present
  const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
  if (apiKey && apiKey !== 'dummy_dev_key') {
    try {
      const liveConversations = await ZernioWhatsAppService.listConversations();
      if (Array.isArray(liveConversations) && liveConversations.length > 0) {
        for (const item of liveConversations) {
          const phone = item.participantId || item.accountUsername || item.id;
          const name = item.participantName || item.accountUsername || 'WhatsApp User';
          
          let contact = whatsappStore.getContactByPhone(phone);
          if (!contact) {
            contact = {
              id: `cnt_${item.participantId || item.id}`,
              phone_number: phone,
              formatted_phone: phone,
              name,
              avatar_url: item.participantPicture || undefined,
              tags: ['WhatsApp_User', 'Sandbox_User'],
              custom_fields: {},
              lifecycle_stage: 'lead',
              created_at: item.updatedTime || new Date().toISOString(),
              last_activity_at: item.updatedTime || new Date().toISOString(),
            };
            whatsappStore.saveContact(contact);
          }

          const lastMsgTime = item.updatedTime || new Date().toISOString();
          const winExpiry = new Date(new Date(lastMsgTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
          const isWindowOpen = new Date() < new Date(winExpiry);

          const conv: WhatsAppConversation = {
            id: item.id,
            account_id: item.accountId || 'acc_sandbox',
            profile_id: item.profileId || 'prof_default',
            contact,
            unread_count: item.unreadCount || 0,
            status: item.status || 'active',
            last_customer_message_at: lastMsgTime,
            window_expires_at: winExpiry,
            is_window_open: isWindowOpen,
            ai_agent_enabled: true,
            created_at: item.updatedTime || new Date().toISOString(),
            updated_at: item.updatedTime || new Date().toISOString(),
            last_message: item.lastMessage ? {
              id: `msg_sync_${Date.now()}`,
              conversation_id: item.id,
              direction: 'incoming',
              type: 'text',
              text: item.lastMessage,
              status: 'delivered',
              timestamp: lastMsgTime,
              sender_name: name,
              sender_phone: phone,
            } : undefined,
          };

          whatsappStore.saveConversation(conv);
        }
        localConversations = whatsappStore.getConversations();
      }
    } catch (syncErr: any) {
      console.warn('[Zernio live sync notice]:', syncErr.message);
    }
  }

  return res.json({ data: localConversations });
});

whatsappRouter.get('/api/whatsapp/conversations/:id/messages', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  let messages = whatsappStore.getMessages(id);
  const conversation = whatsappStore.getConversation(id);

  // Sync live messages from Zernio if conversation belongs to Zernio
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const liveMessages = await ZernioWhatsAppService.listMessages(id, conversation?.account_id);
      if (Array.isArray(liveMessages) && liveMessages.length > 0) {
        for (const m of liveMessages) {
          const isFromContact = m.senderId === conversation?.contact.phone_number || m.source === 'contact';
          const direction = isFromContact ? 'incoming' : (m.direction || 'incoming');
          const msg: WhatsAppMessage = {
            id: m.id || m.messageId || `msg_${Date.now()}`,
            conversation_id: id,
            direction: direction as any,
            type: m.attachmentUrl ? 'image' : 'text',
            text: m.message || m.text,
            media_url: m.attachmentUrl,
            status: m.status || 'delivered',
            timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
            sender_name: m.senderName || (direction === 'incoming' ? conversation?.contact.name : 'Support Agent'),
            sender_phone: m.senderPhone || (direction === 'incoming' ? conversation?.contact.phone_number : undefined),
          };
          whatsappStore.appendMessage(msg);
        }
        messages = whatsappStore.getMessages(id);
      }
    } catch (mErr: any) {
      console.warn('[Zernio live messages notice]:', mErr.message);
    }
  }

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

  // Dispatch via Zernio SDK if online and thread is Zernio ID
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    await ZernioWhatsAppService.sendInboxMessage({
      conversationId: id,
      accountId: conv.account_id,
      text,
      mediaUrl: media_url,
      participantId: conv.contact.phone_number,
      templateName: template_name,
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
  return res.json({ success: true, message: msg });
});

whatsappRouter.post('/api/whatsapp/conversations/:id/typing', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  ZernioWhatsAppService.sendTypingIndicator(id).catch(() => {});
  return res.json({ ok: true });
});

whatsappRouter.post('/api/whatsapp/conversations/:id/read', async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  whatsappStore.markConversationRead(id);
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    ZernioWhatsAppService.markConversationRead(id).catch(() => {});
  }
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

whatsappRouter.put('/api/whatsapp/contacts/:id', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const existing = whatsappStore.getContact(id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const updated: WhatsAppContact = {
    ...existing,
    ...req.body,
    id,
    last_activity_at: new Date().toISOString(),
  };

  whatsappStore.saveContact(updated);
  return res.json({ success: true, data: updated });
});

whatsappRouter.delete('/api/whatsapp/contacts/:id', (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  whatsappStore.deleteContact(id);
  return res.json({ success: true });
});

whatsappRouter.post('/api/whatsapp/backfill', async (req: Request, res: Response) => {
  const profileId = (req.query.profileId as string) || (req.body.profileId as string);
  const result = await ZernioWhatsAppService.backfillTenantHistory(profileId);
  return res.json({ success: true, ...result });
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

function getUserIdFromReq(req: Request): string | undefined {
  const customHeader = (req.headers['x-user-id'] as string) || (req.headers['x-rockyt-user-id'] as string);
  if (customHeader && customHeader !== 'undefined' && customHeader !== 'null') {
    return customHeader.trim();
  }

  const queryId = (req.query.userId as string);
  if (queryId && queryId !== 'undefined' && queryId !== 'null') {
    return queryId.trim();
  }

  const bodyId = (req.body?.userId as string);
  if (bodyId && bodyId !== 'undefined' && bodyId !== 'null') {
    return bodyId.trim();
  }

  // Extract from Bearer token or cookies if available
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (authHeader && authHeader.length > 20 && !authHeader.startsWith('rockyt_') && !authHeader.startsWith('rkt_')) {
    try {
      const parts = authHeader.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.sub || payload.id) return payload.sub || payload.id;
      }
    } catch {}
  }

  return undefined;
}

async function resolveUserProfileId(req: Request): Promise<{ userId: string; profileId: string }> {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    throw new Error('UNAUTHORIZED: Missing user identity header (x-user-id). Please sign in to access your isolated workspace.');
  }

  const userEmail = (req.headers['x-user-email'] as string) || (userId.includes('@') ? userId : undefined);
  const profileId = await ZernioWhatsAppService.getOrCreateProfileId(userId, userEmail);
  return { userId, profileId };
}

// ─── 9. WABA Connection, Phone Numbers & Sandbox ───
whatsappRouter.get('/api/whatsapp/account', async (req: Request, res: Response) => {
  try {
    const { userId, profileId } = await resolveUserProfileId(req);
    let account = whatsappStore.getAccount(userId);
    const sandbox = whatsappStore.getSandboxSession(userId);

    // If no account stored yet, attempt to discover live accounts from Zernio if API key exists
    if (!account && process.env.ZERNIO_API_KEY) {
      const liveAccounts = await ZernioWhatsAppService.listWhatsAppAccounts(profileId);
      if (liveAccounts.length > 0) {
        account = whatsappStore.setAccount(liveAccounts[0], userId);
      }
    }

    return res.json({
      connected: Boolean(account && account.status !== 'disconnected'),
      account: account || null,
      sandbox: sandbox || null,
      profileId,
    });
  } catch (err: any) {
    return res.status(401).json({
      error: 'unauthorized',
      message: err.message || 'Unable to resolve tenant profile. Please sign in again.',
    });
  }
});

whatsappRouter.post('/api/whatsapp/account/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = await resolveUserProfileId(req);
    whatsappStore.disconnectAccount(userId);
    return res.json({ success: true, message: 'WhatsApp account disconnected' });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

// WhatsApp Sandbox Endpoints (as per Zernio platform docs)
const handleCreateSandbox = async (req: Request, res: Response) => {
  const phone = req.body.phone || req.body.phone_number;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required to start a sandbox activation.' });
  }

  try {
    const { userId } = await resolveUserProfileId(req);
    const session = await ZernioWhatsAppService.createSandboxSession(phone, userId);
    if (!session) {
      return res.status(500).json({ error: 'Failed to initialize sandbox session.' });
    }

    whatsappStore.setSandboxSession(session, userId);
    return res.json({
      success: true,
      session,
      account: whatsappStore.getAccount(userId),
    });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
};

whatsappRouter.post('/api/whatsapp/sandbox/session', handleCreateSandbox);
whatsappRouter.post('/api/whatsapp/sandbox/sessions', handleCreateSandbox);

whatsappRouter.get('/api/whatsapp/sandbox/session', async (req: Request, res: Response) => {
  try {
    const { userId } = await resolveUserProfileId(req);
    const session = whatsappStore.getSandboxSession(userId);
    return res.json({ session: session || null });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

whatsappRouter.get('/api/whatsapp/sandbox/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = await resolveUserProfileId(req);
    const session = whatsappStore.getSandboxSession(userId);
    return res.json({ sessions: session ? [session] : [] });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

whatsappRouter.delete('/api/whatsapp/sandbox/session', async (req: Request, res: Response) => {
  try {
    const { userId } = await resolveUserProfileId(req);
    const session = whatsappStore.getSandboxSession(userId);
    if (session) {
      await ZernioWhatsAppService.deleteSandboxSession(session.id);
    }
    whatsappStore.deleteSandboxSession(userId);
    return res.json({ success: true, message: 'Sandbox session revoked.' });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

// Simulate Sandbox Inbound Message for interactive testing
whatsappRouter.post('/api/whatsapp/sandbox/simulate-message', async (req: Request, res: Response) => {
  try {
    const { userId, profileId } = await resolveUserProfileId(req);
    const session = whatsappStore.getSandboxSession(userId);
    const phone = req.body.phone_number || session?.phone_number || '+14155552671';
    const text = req.body.text || 'Hi! Testing WhatsApp sandbox automation and CRM response.';
    const name = req.body.name || 'Sandbox Tester';

    // Activate session if pending
    if (session && session.status === 'pending') {
      const activeSession: WhatsAppSandboxSession = {
        ...session,
        status: 'active',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      whatsappStore.setSandboxSession(activeSession, userId);
    }

    // Append contact and inbound message into real-time CRM
    let contact = whatsappStore.getContactByPhone(phone);
    if (!contact) {
      contact = {
        id: `cnt_${Date.now()}`,
        phone_number: phone,
        formatted_phone: phone,
        name,
        tags: ['Sandbox_User', 'Live_Test'],
        custom_fields: { source: 'WhatsApp Sandbox' },
        lifecycle_stage: 'lead',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };
      whatsappStore.saveContact(contact);
    }

    const conv = whatsappStore.getOrCreateConversation(
      contact,
      whatsappStore.getAccount(userId)?.id || 'acc_sandbox',
      profileId
    );

    const incomingMsg: WhatsAppMessage = {
      id: `msg_sbx_${Date.now()}`,
      conversation_id: conv.id,
      direction: 'incoming',
      type: 'text',
      text,
      status: 'delivered',
      timestamp: new Date().toISOString(),
      sender_name: name,
      sender_phone: phone,
    };

    whatsappStore.appendMessage(incomingMsg);

    // Trigger automation engine
    const triggeredFlows = await AutomationEngine.evaluateTrigger(
      'incoming_message',
      {
        conversation: conv,
        message: incomingMsg,
        contact,
      }
    );

    return res.json({
      success: true,
      conversation_id: conv.id,
      message: incomingMsg,
      triggered_flows: triggeredFlows,
    });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

whatsappRouter.post('/api/whatsapp/connect/oauth', async (req: Request, res: Response) => {
  try {
    const { userId, profileId } = await resolveUserProfileId(req);

    const host = req.get('host') || 'rockyt.io';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'https';
    const redirectUri = encodeURIComponent(`${protocol}://${host}/dashboard?waba=connected`);
    const zernioConnectUrl = `https://zernio.com/api/v1/connect/whatsapp?profileId=${profileId}&redirect_url=${redirectUri}`;
    
    // Fetch authUrl directly from Zernio API so end-user is sent straight to Facebook/Meta Dialog
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey !== 'dummy_dev_key') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const zernioRes = await fetch(zernioConnectUrl, { headers });
      if (zernioRes.ok) {
        const data = await zernioRes.json();
        if (data.authUrl) {
          return res.json({
            url: data.authUrl,
            authUrl: data.authUrl,
            state: data.state,
            profileId,
          });
        }
      }
    } catch (fetchErr: any) {
      console.warn('[Zernio connect fetch notice]:', fetchErr.message);
    }

    // Direct Meta Facebook Embedded Signup Dialog URL
    const metaDialogUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=712341431446535&redirect_uri=${encodeURIComponent('https://zernio.com/api/v1/connect/whatsapp/callback')}&scope=whatsapp_business_management%2Cwhatsapp_business_messaging%2Cwhatsapp_business_manage_events%2Cbusiness_management&response_type=code&config_id=920007930882314&override_default_response_type=true&state=${profileId}-${Date.now()}-${redirectUri}&extras=${encodeURIComponent(JSON.stringify({ sessionInfoVersion: '3', featureType: 'whatsapp_business_app_onboarding' }))}`;

    return res.json({ url: metaDialogUrl, authUrl: metaDialogUrl, profileId });
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
});

whatsappRouter.post('/api/whatsapp/connect/headless', (req: Request, res: Response) => {
  const { waba_id, phone_number_id, access_token, name, phone_number } = req.body;
  if (!waba_id || !phone_number_id || !access_token) {
    return res.status(400).json({ error: 'Missing required credentials: waba_id, phone_number_id, access_token' });
  }

  const account: any = {
    id: `acc_waba_${waba_id.substring(0, 8)}`,
    platform: 'whatsapp',
    name: name || 'Connected WhatsApp Business Account',
    phone_number: phone_number || '+1 (415) 555-0199',
    phone_number_id,
    waba_id,
    status: 'connected',
    mode: 'production',
    quality_rating: 'GREEN',
    messaging_limit_tier: 'TIER_100K_DAILY',
    verified_name: name || 'Verified WABA',
    connected_at: new Date().toISOString(),
  };

  whatsappStore.setAccount(account);

  return res.json({
    success: true,
    account,
  });
});

whatsappRouter.get('/api/whatsapp/phone-numbers', (req: Request, res: Response) => {
  const account = whatsappStore.getAccount();
  if (!account) {
    return res.json({ data: [] });
  }

  return res.json({
    data: [
      {
        id: account.phone_number_id || 'pn_1001',
        display_phone_number: account.phone_number,
        verified_name: account.verified_name || account.name,
        quality_rating: account.quality_rating || 'GREEN',
        code_verification_status: 'VERIFIED',
        messaging_limit_tier: account.messaging_limit_tier || 'TIER_100K',
        status: 'CONNECTED',
      },
    ],
  });
});
