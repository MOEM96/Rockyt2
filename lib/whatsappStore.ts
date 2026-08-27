import {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppTemplate,
  BroadcastCampaign,
  AutomationFlow,
  MetaCAPIEvent,
  MCPToken,
} from './whatsappTypes';
import crypto from 'crypto';

class WhatsAppStore {
  private contacts: Map<string, WhatsAppContact> = new Map();
  private conversations: Map<string, WhatsAppConversation> = new Map();
  private messages: Map<string, WhatsAppMessage[]> = new Map();
  private templates: Map<string, WhatsAppTemplate> = new Map();
  private broadcasts: Map<string, BroadcastCampaign> = new Map();
  private automations: Map<string, AutomationFlow> = new Map();
  private capiEvents: MetaCAPIEvent[] = [];
  private mcpTokens: Map<string, MCPToken> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Sample Contacts
    const contact1: WhatsAppContact = {
      id: 'cnt_101',
      phone_number: '+14155552671',
      formatted_phone: '+1 (415) 555-2671',
      name: 'Sarah Jenkins',
      email: 'sarah.j@techflow.io',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      tags: ['CTWA_Lead', 'High_Intent', 'Enterprise'],
      custom_fields: { company: 'TechFlow', size: '50-100', budget: '$5,000+' },
      lifecycle_stage: 'qualified_lead',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      last_activity_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      ctwa_source: {
        source_id: 'ad_9823412093',
        source_type: 'ad',
        source_url: 'https://fb.me/ad_demo_whatsapp_scale',
        headline: 'Automate WhatsApp Sales with AI',
        body: 'Click to start a conversation with our AI consultant now.',
        ad_id: '9823412093',
        campaign_id: 'cmp_ctwa_enterprise_scale',
        campaign_name: 'CTWA_Q3_Scale_Inbound',
        ctwa_clid: 'ctwa_clid_8f7b2a9e1d4c6',
      },
      notes: 'Came via Meta CTWA Ad. Looking for automated WhatsApp order booking and CAPI conversion sync.',
    };

    const contact2: WhatsAppContact = {
      id: 'cnt_102',
      phone_number: '+447911123456',
      formatted_phone: '+44 7911 123456',
      name: 'Alexander Rossi',
      email: 'alex.rossi@luxe-retail.co.uk',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      tags: ['ECommerce', 'VIP_Customer'],
      custom_fields: { store_type: 'Luxury Fashion', order_volume: '1500/mo' },
      lifecycle_stage: 'customer',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      last_activity_at: new Date(Date.now() - 3600000 * 26).toISOString(), // 26 hours ago (outside 24h window)
      notes: 'Customer requires template messages to resume conversation outside 24h window.',
    };

    const contact3: WhatsAppContact = {
      id: 'cnt_103',
      phone_number: '+971501234567',
      formatted_phone: '+971 50 123 4567',
      name: 'Mariam Al-Mansoor',
      email: 'mariam@gulfcapital.ae',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      tags: ['CTWA_Lead', 'Demo_Booked'],
      custom_fields: { region: 'MENA', interested_product: 'WhatsApp CRM Pro' },
      lifecycle_stage: 'lead',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      last_activity_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      ctwa_source: {
        source_id: 'ad_4421098871',
        source_type: 'ad',
        source_url: 'https://fb.me/ad_dubai_b2b',
        headline: 'Scale WhatsApp Support in UAE',
        ad_id: '4421098871',
        campaign_id: 'cmp_mena_b2b_growth',
        campaign_name: 'MENA_B2B_LeadGen',
        ctwa_clid: 'ctwa_clid_3309aef81923',
      },
    };

    this.contacts.set(contact1.id, contact1);
    this.contacts.set(contact2.id, contact2);
    this.contacts.set(contact3.id, contact3);

    // Seed Conversations
    const conv1Id = 'conv_wa_001';
    const lastCustomerMsg1 = new Date(Date.now() - 1000 * 60 * 12);
    const expiresAt1 = new Date(lastCustomerMsg1.getTime() + 86400000);
    this.conversations.set(conv1Id, {
      id: conv1Id,
      account_id: 'acc_waba_primary',
      profile_id: 'prof_default',
      contact: contact1,
      unread_count: 1,
      status: 'active',
      last_customer_message_at: lastCustomerMsg1.toISOString(),
      window_expires_at: expiresAt1.toISOString(),
      is_window_open: true,
      ctwa_referral: contact1.ctwa_source,
      ai_agent_enabled: true,
      created_at: contact1.created_at,
      updated_at: new Date().toISOString(),
    });

    const conv2Id = 'conv_wa_002';
    const lastCustomerMsg2 = new Date(Date.now() - 3600000 * 26);
    const expiresAt2 = new Date(lastCustomerMsg2.getTime() + 86400000);
    this.conversations.set(conv2Id, {
      id: conv2Id,
      account_id: 'acc_waba_primary',
      profile_id: 'prof_default',
      contact: contact2,
      unread_count: 0,
      status: 'active',
      last_customer_message_at: lastCustomerMsg2.toISOString(),
      window_expires_at: expiresAt2.toISOString(),
      is_window_open: false, // Window closed!
      ai_agent_enabled: false,
      created_at: contact2.created_at,
      updated_at: lastCustomerMsg2.toISOString(),
    });

    const conv3Id = 'conv_wa_003';
    const lastCustomerMsg3 = new Date(Date.now() - 1000 * 60 * 45);
    const expiresAt3 = new Date(lastCustomerMsg3.getTime() + 86400000);
    this.conversations.set(conv3Id, {
      id: conv3Id,
      account_id: 'acc_waba_primary',
      profile_id: 'prof_default',
      contact: contact3,
      unread_count: 0,
      status: 'active',
      last_customer_message_at: lastCustomerMsg3.toISOString(),
      window_expires_at: expiresAt3.toISOString(),
      is_window_open: true,
      ctwa_referral: contact3.ctwa_source,
      ai_agent_enabled: true,
      created_at: contact3.created_at,
      updated_at: new Date().toISOString(),
    });

    // Seed Messages
    this.messages.set(conv1Id, [
      {
        id: 'msg_1001',
        conversation_id: conv1Id,
        direction: 'incoming',
        type: 'text',
        text: 'Hi! I saw your Meta Ad about WhatsApp automation. Can we sync with our custom CRM and track Meta CAPI conversions?',
        status: 'read',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        referral: contact1.ctwa_source,
      },
      {
        id: 'msg_1002',
        conversation_id: conv1Id,
        direction: 'outgoing',
        type: 'text',
        text: 'Hello Sarah! Absolutely. We support realtime Zernio webhooks, custom webhook actions, and automated Meta Conversions API (CAPI) events with CTWA attribution matching.',
        status: 'read',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'msg_1003',
        conversation_id: conv1Id,
        direction: 'incoming',
        type: 'text',
        text: 'That sounds perfect! Can you send me a quick breakdown or schedule a demo for our team?',
        status: 'delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ]);

    this.messages.set(conv2Id, [
      {
        id: 'msg_2001',
        conversation_id: conv2Id,
        direction: 'incoming',
        type: 'text',
        text: 'Hello, checking order status for shipment #LK-994.',
        status: 'read',
        timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
      {
        id: 'msg_2002',
        conversation_id: conv2Id,
        direction: 'outgoing',
        type: 'text',
        text: 'Your order #LK-994 has been dispatched with express tracking!',
        status: 'read',
        timestamp: new Date(Date.now() - 3600000 * 25).toISOString(),
      },
    ]);

    this.messages.set(conv3Id, [
      {
        id: 'msg_3001',
        conversation_id: conv3Id,
        direction: 'incoming',
        type: 'text',
        text: 'We are expanding our WhatsApp operations in the UAE and need multi-agent routing.',
        status: 'read',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        referral: contact3.ctwa_source,
      },
      {
        id: 'msg_3002',
        conversation_id: conv3Id,
        direction: 'outgoing',
        type: 'text',
        text: 'Hi Mariam! We offer multi-tenant team inboxes, automated agent assignment, and external MCP agents for autonomous workflows.',
        status: 'read',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ]);

    // Seed Meta Templates
    this.templates.set('lead_welcome_v1', {
      id: 'tmpl_001',
      name: 'lead_welcome_v1',
      category: 'MARKETING',
      language: 'en_US',
      status: 'APPROVED',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Welcome to {{1}}! 🚀',
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, thank you for reaching out through WhatsApp! Our AI assistant and team are here to help you automate customer journeys and track Meta conversions.',
        },
        {
          type: 'FOOTER',
          text: 'Reply STOP to opt out',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Book a Demo 📅' },
            { type: 'URL', text: 'Explore Dashboard', url: 'https://rockyt.io/dashboard' },
          ],
        },
      ],
      last_updated: new Date().toISOString(),
    });

    this.templates.set('order_update_alert', {
      id: 'tmpl_002',
      name: 'order_update_alert',
      category: 'UTILITY',
      language: 'en_US',
      status: 'APPROVED',
      components: [
        {
          type: 'BODY',
          text: 'Hello {{1}}, your order #{{2}} is currently {{3}}. Track your package in real-time below.',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'Track Order', url: 'https://rockyt.io/track/{{1}}' },
            { type: 'PHONE_NUMBER', text: 'Call Support', phone_number: '+18005550199' },
          ],
        },
      ],
      last_updated: new Date().toISOString(),
    });

    this.templates.set('re_engage_promo_24h', {
      id: 'tmpl_003',
      name: 're_engage_promo_24h',
      category: 'MARKETING',
      language: 'en_US',
      status: 'APPROVED',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Exclusive Offer for {{1}} 🎁',
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, we noticed you were interested in our WhatsApp API & Automations suite. Enjoy 20% off your first 3 months with code WA20!',
        },
        {
          type: 'FOOTER',
          text: 'Valid for the next 48 hours only',
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Claim 20% Discount' },
            { type: 'QUICK_REPLY', text: 'Talk to an Agent' },
          ],
        },
      ],
      last_updated: new Date().toISOString(),
    });

    // Seed Broadcasts
    this.broadcasts.set('bc_001', {
      id: 'bc_001',
      title: 'Q3 Enterprise WhatsApp Onboarding Blast',
      template_name: 'lead_welcome_v1',
      target_tags: ['CTWA_Lead', 'High_Intent'],
      total_recipients: 1420,
      sent_count: 1420,
      delivered_count: 1398,
      read_count: 1145,
      failed_count: 22,
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    });

    this.broadcasts.set('bc_002', {
      id: 'bc_002',
      title: 'VIP Re-engagement Flash Promo',
      template_name: 're_engage_promo_24h',
      target_tags: ['VIP_Customer'],
      total_recipients: 450,
      sent_count: 450,
      delivered_count: 442,
      read_count: 389,
      failed_count: 8,
      status: 'completed',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    });

    // Seed Visual Automations
    this.automations.set('flow_ctwa_qualifier', {
      id: 'flow_ctwa_qualifier',
      title: 'CTWA Inbound Qualifier & Meta CAPI Sync',
      description: 'Auto-captures CTWA ad clicks, welcomes lead, checks 24h window, and fires Lead event to Meta CAPI.',
      is_active: true,
      trigger_type: 'ctwa',
      execution_count: 842,
      last_triggered_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date().toISOString(),
      nodes: [
        {
          id: 'node_1',
          type: 'trigger_ctwa_click',
          title: 'Trigger: CTWA Ad Click',
          config: { match_campaign: 'All CTWA Campaigns' },
          position: { x: 100, y: 150 },
        },
        {
          id: 'node_2',
          type: 'condition_24h_window',
          title: 'Condition: 24h Window Check',
          config: {},
          position: { x: 380, y: 150 },
        },
        {
          id: 'node_3',
          type: 'action_send_message',
          title: 'Action: Send Warm Welcome',
          config: { text: 'Hi! Welcome to our WhatsApp assistant. How can we help you scale your business today?' },
          position: { x: 660, y: 80 },
        },
        {
          id: 'node_4',
          type: 'action_send_template',
          title: 'Action: Send Approved Template',
          config: { template_name: 'lead_welcome_v1' },
          position: { x: 660, y: 240 },
        },
        {
          id: 'node_5',
          type: 'action_trigger_capi',
          title: 'Action: Fire Meta CAPI "Lead"',
          config: { event_name: 'Lead', include_ctwa_clid: true, default_value: 25 },
          position: { x: 940, y: 150 },
        },
        {
          id: 'node_6',
          type: 'action_add_tag',
          title: 'Action: Tag Contact',
          config: { tag: 'CTWA_Qualified' },
          position: { x: 1200, y: 150 },
        },
      ],
      edges: [
        { id: 'e1_2', source: 'node_1', target: 'node_2' },
        { id: 'e2_3', source: 'node_2', target: 'node_3', label: 'Window Open' },
        { id: 'e2_4', source: 'node_2', target: 'node_4', label: 'Window Closed' },
        { id: 'e3_5', source: 'node_3', target: 'node_5' },
        { id: 'e4_5', source: 'node_4', target: 'node_5' },
        { id: 'e5_6', source: 'node_5', target: 'node_6' },
      ],
    });

    // Seed Meta CAPI Events
    this.capiEvents = [
      {
        id: 'capi_log_001',
        event_id: 'wa_capi_1740689400_a1b2',
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000) - 720,
        contact_id: contact1.id,
        conversation_id: conv1Id,
        phone_number: contact1.phone_number,
        email: contact1.email,
        ctwa_clid: contact1.ctwa_source?.ctwa_clid,
        ad_id: contact1.ctwa_source?.ad_id,
        campaign_id: contact1.ctwa_source?.campaign_id,
        value: 45.0,
        currency: 'USD',
        status: 'delivered',
        meta_response: {
          events_received: 1,
          fbtrace_id: 'F4k_872xL9mN2q',
          messages: ['Event matched via ctwa_clid and hashed phone/email'],
        },
        created_at: new Date(Date.now() - 720000).toISOString(),
      },
      {
        id: 'capi_log_002',
        event_id: 'wa_capi_1740688100_c3d4',
        event_name: 'Schedule',
        event_time: Math.floor(Date.now() / 1000) - 2700,
        contact_id: contact3.id,
        conversation_id: conv3Id,
        phone_number: contact3.phone_number,
        email: contact3.email,
        ctwa_clid: contact3.ctwa_source?.ctwa_clid,
        ad_id: contact3.ctwa_source?.ad_id,
        campaign_id: contact3.ctwa_source?.campaign_id,
        value: 120.0,
        currency: 'USD',
        status: 'delivered',
        meta_response: {
          events_received: 1,
          fbtrace_id: 'M9v_112zP4sA7w',
          messages: ['Event matched via ctwa_clid with 99% match quality'],
        },
        created_at: new Date(Date.now() - 2700000).toISOString(),
      },
    ];

    // Seed MCP Access Tokens
    const defaultMcpToken: MCPToken = {
      id: 'mcp_tok_001',
      name: 'Claude Desktop Agent Token',
      token_prefix: 'mcp_wa_live_',
      token_hash: crypto.createHash('sha256').update('mcp_wa_live_demo_agent_key_2026').digest('hex'),
      scopes: ['whatsapp:read', 'whatsapp:write', 'capi:dispatch', 'contacts:manage'],
      last_used_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    };
    this.mcpTokens.set(defaultMcpToken.id, defaultMcpToken);
  }

  // --- Contacts ---
  public getContacts(): WhatsAppContact[] {
    return Array.from(this.contacts.values()).sort(
      (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );
  }

  public getContact(id: string): WhatsAppContact | undefined {
    return this.contacts.get(id);
  }

  public getContactByPhone(phone: string): WhatsAppContact | undefined {
    const clean = phone.replace(/[^0-9]/g, '');
    return Array.from(this.contacts.values()).find(
      (c) => c.phone_number.replace(/[^0-9]/g, '') === clean
    );
  }

  public saveContact(contact: WhatsAppContact): WhatsAppContact {
    this.contacts.set(contact.id, contact);
    return contact;
  }

  // --- Conversations ---
  public getConversations(): WhatsAppConversation[] {
    const list = Array.from(this.conversations.values());
    const now = Date.now();
    // Dynamically recompute 24-hour window status
    return list
      .map((conv) => {
        const expiresAt = new Date(conv.window_expires_at).getTime();
        const isOpen = expiresAt > now;
        const lastMsg = this.getLatestMessage(conv.id);
        return {
          ...conv,
          is_window_open: isOpen,
          last_message: lastMsg || conv.last_message,
        };
      })
      .sort((a, b) => {
        const timeA = a.last_message?.timestamp ? new Date(a.last_message.timestamp).getTime() : new Date(a.updated_at).getTime();
        const timeB = b.last_message?.timestamp ? new Date(b.last_message.timestamp).getTime() : new Date(b.updated_at).getTime();
        return timeB - timeA;
      });
  }

  public getConversation(id: string): WhatsAppConversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    const expiresAt = new Date(conv.window_expires_at).getTime();
    conv.is_window_open = expiresAt > Date.now();
    conv.last_message = this.getLatestMessage(id) || conv.last_message;
    return conv;
  }

  public saveConversation(conv: WhatsAppConversation): WhatsAppConversation {
    this.conversations.set(conv.id, conv);
    return conv;
  }

  // --- Messages ---
  public getMessages(conversationId: string): WhatsAppMessage[] {
    return this.messages.get(conversationId) || [];
  }

  public getLatestMessage(conversationId: string): WhatsAppMessage | undefined {
    const msgs = this.messages.get(conversationId);
    if (!msgs || msgs.length === 0) return undefined;
    return msgs[msgs.length - 1];
  }

  public appendMessage(msg: WhatsAppMessage): WhatsAppMessage {
    const existing = this.messages.get(msg.conversation_id) || [];
    existing.push(msg);
    this.messages.set(msg.conversation_id, existing);

    // Update conversation state
    const conv = this.conversations.get(msg.conversation_id);
    if (conv) {
      conv.last_message = msg;
      conv.updated_at = msg.timestamp;
      if (msg.direction === 'incoming') {
        conv.last_customer_message_at = msg.timestamp;
        conv.window_expires_at = new Date(new Date(msg.timestamp).getTime() + 86400000).toISOString();
        conv.is_window_open = true;
        conv.unread_count += 1;
        if (msg.referral) {
          conv.ctwa_referral = msg.referral;
          if (conv.contact) {
            conv.contact.ctwa_source = msg.referral;
          }
        }
      }
      this.conversations.set(conv.id, conv);
    }

    return msg;
  }

  public markConversationRead(conversationId: string) {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.unread_count = 0;
      this.conversations.set(conv.id, conv);
    }
  }

  // --- Templates ---
  public getTemplates(): WhatsAppTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(name: string): WhatsAppTemplate | undefined {
    return this.templates.get(name);
  }

  public saveTemplate(template: WhatsAppTemplate): WhatsAppTemplate {
    this.templates.set(template.name, template);
    return template;
  }

  public deleteTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  // --- Broadcasts ---
  public getBroadcasts(): BroadcastCampaign[] {
    return Array.from(this.broadcasts.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public saveBroadcast(bc: BroadcastCampaign): BroadcastCampaign {
    this.broadcasts.set(bc.id, bc);
    return bc;
  }

  // --- Automations ---
  public getAutomations(): AutomationFlow[] {
    return Array.from(this.automations.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  public getAutomation(id: string): AutomationFlow | undefined {
    return this.automations.get(id);
  }

  public saveAutomation(flow: AutomationFlow): AutomationFlow {
    this.automations.set(flow.id, flow);
    return flow;
  }

  public deleteAutomation(id: string): boolean {
    return this.automations.delete(id);
  }

  // --- CAPI Events ---
  public getCAPIEvents(): MetaCAPIEvent[] {
    return [...this.capiEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public logCAPIEvent(event: MetaCAPIEvent): MetaCAPIEvent {
    this.capiEvents.unshift(event);
    if (this.capiEvents.length > 500) {
      this.capiEvents.pop();
    }
    return event;
  }

  // --- MCP Tokens ---
  public getMCPTokens(): MCPToken[] {
    return Array.from(this.mcpTokens.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public createMCPToken(name: string, scopes: string[] = ['*']): { token: string; record: MCPToken } {
    const rawKey = `mcp_wa_${crypto.randomBytes(16).toString('hex')}`;
    const tokenRecord: MCPToken = {
      id: `tok_${Date.now()}`,
      name,
      token_prefix: rawKey.substring(0, 12) + '...',
      token_hash: crypto.createHash('sha256').update(rawKey).digest('hex'),
      scopes,
      created_at: new Date().toISOString(),
    };
    this.mcpTokens.set(tokenRecord.id, tokenRecord);
    return { token: rawKey, record: tokenRecord };
  }

  public deleteMCPToken(id: string): boolean {
    return this.mcpTokens.delete(id);
  }
}

export const whatsappStore = new WhatsAppStore();
