import {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppTemplate,
  BroadcastCampaign,
  AutomationFlow,
  MetaCAPIEvent,
  MCPToken,
  WhatsAppAccount,
  WhatsAppSandboxSession,
} from './whatsappTypes';
import crypto from 'crypto';

class WhatsAppStore {
  private connectedAccount: WhatsAppAccount | null = null;
  private sandboxSession: WhatsAppSandboxSession | null = null;
  private contacts: Map<string, WhatsAppContact> = new Map();
  private conversations: Map<string, WhatsAppConversation> = new Map();
  private messages: Map<string, WhatsAppMessage[]> = new Map();
  private templates: Map<string, WhatsAppTemplate> = new Map();
  private broadcasts: Map<string, BroadcastCampaign> = new Map();
  private automations: Map<string, AutomationFlow> = new Map();
  private capiEvents: MetaCAPIEvent[] = [];
  private mcpTokens: Map<string, MCPToken> = new Map();

  constructor() {
    // Initialized completely empty — no fake mock data.
    // Data is populated in real-time when user connects their WABA or activates Sandbox.
  }

  // --- Account & Connection Management ---
  public getAccount(): WhatsAppAccount | null {
    return this.connectedAccount;
  }

  public setAccount(account: WhatsAppAccount): WhatsAppAccount {
    this.connectedAccount = account;
    return account;
  }

  public disconnectAccount(): void {
    this.connectedAccount = null;
    this.sandboxSession = null;
  }

  public getSandboxSession(): WhatsAppSandboxSession | null {
    return this.sandboxSession;
  }

  public setSandboxSession(session: WhatsAppSandboxSession): WhatsAppSandboxSession {
    this.sandboxSession = session;
    // When sandbox session is activated, set account mode to sandbox
    this.connectedAccount = {
      id: `acc_sandbox_${session.id}`,
      platform: 'whatsapp',
      name: `WhatsApp Sandbox (${session.formatted_phone || session.phone_number})`,
      phone_number: session.phone_number,
      phone_number_id: `pn_sandbox_${session.id}`,
      status: 'sandbox',
      mode: 'sandbox',
      quality_rating: 'GREEN',
      messaging_limit_tier: 'SANDBOX_DEV',
      verified_name: 'Zernio Dev Sandbox',
      connected_at: session.created_at,
    };
    return session;
  }

  public deleteSandboxSession(): void {
    this.sandboxSession = null;
    if (this.connectedAccount?.mode === 'sandbox') {
      this.connectedAccount = null;
    }
  }

  public isConnected(): boolean {
    return this.connectedAccount !== null && this.connectedAccount.status !== 'disconnected';
  }

  // --- Contacts ---
  public getContacts(): WhatsAppContact[] {
    return Array.from(this.contacts.values()).sort(
      (a, b) => new Date(b.last_activity_at || b.created_at).getTime() - new Date(a.last_activity_at || a.created_at).getTime()
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

  public deleteContact(id: string): boolean {
    return this.contacts.delete(id);
  }

  // --- Conversations ---
  public getConversations(): WhatsAppConversation[] {
    const list = Array.from(this.conversations.values());
    const now = Date.now();
    // Dynamically recompute 24-hour customer service window status
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

  public getOrCreateConversation(
    contact: WhatsAppContact,
    accountId: string = this.connectedAccount?.id || 'acc_primary',
    profileId: string = 'prof_default',
    initialReferral?: any
  ): WhatsAppConversation {
    let existing = Array.from(this.conversations.values()).find(
      (c) => c.contact.phone_number === contact.phone_number || c.contact.id === contact.id
    );

    if (existing) {
      existing.contact = contact;
      if (initialReferral && !existing.ctwa_referral) {
        existing.ctwa_referral = initialReferral;
      }
      return existing;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const newConvId = `conv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const newConv: WhatsAppConversation = {
      id: newConvId,
      account_id: accountId,
      profile_id: profileId,
      contact,
      unread_count: 0,
      status: 'active',
      last_customer_message_at: now.toISOString(),
      window_expires_at: expiresAt.toISOString(),
      is_window_open: true,
      ctwa_referral: initialReferral || contact.ctwa_source,
      ai_agent_enabled: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.conversations.set(newConvId, newConv);
    return newConv;
  }

  public markConversationRead(id: string): void {
    const conv = this.conversations.get(id);
    if (conv) {
      conv.unread_count = 0;
      conv.updated_at = new Date().toISOString();
    }
  }

  public toggleAIAgent(id: string, enabled: boolean): WhatsAppConversation | undefined {
    const conv = this.conversations.get(id);
    if (conv) {
      conv.ai_agent_enabled = enabled;
      conv.updated_at = new Date().toISOString();
    }
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
    const conv = this.conversations.get(msg.conversation_id);
    if (!this.messages.has(msg.conversation_id)) {
      this.messages.set(msg.conversation_id, []);
    }

    this.messages.get(msg.conversation_id)!.push(msg);

    if (conv) {
      conv.last_message = msg;
      conv.updated_at = msg.timestamp || new Date().toISOString();

      if (msg.direction === 'incoming') {
        conv.unread_count += 1;
        conv.last_customer_message_at = msg.timestamp || new Date().toISOString();
        // Reset 24-hour customer service window on every incoming message
        const newExpiry = new Date(new Date(conv.last_customer_message_at).getTime() + 24 * 60 * 60 * 1000);
        conv.window_expires_at = newExpiry.toISOString();
        conv.is_window_open = true;

        if (msg.referral && !conv.ctwa_referral) {
          conv.ctwa_referral = msg.referral;
        }
      }
    }

    return msg;
  }

  // --- Meta Templates ---
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

  public getBroadcast(id: string): BroadcastCampaign | undefined {
    return this.broadcasts.get(id);
  }

  public saveBroadcast(campaign: BroadcastCampaign): BroadcastCampaign {
    this.broadcasts.set(campaign.id, campaign);
    return campaign;
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
    flow.updated_at = new Date().toISOString();
    this.automations.set(flow.id, flow);
    return flow;
  }

  public deleteAutomation(id: string): boolean {
    return this.automations.delete(id);
  }

  // --- Meta CAPI Events ---
  public getCAPIEvents(): MetaCAPIEvent[] {
    return [...this.capiEvents].sort((a, b) => b.event_time - a.event_time);
  }

  public logCAPIEvent(event: MetaCAPIEvent): MetaCAPIEvent {
    this.capiEvents.unshift(event);
    if (this.capiEvents.length > 500) {
      this.capiEvents = this.capiEvents.slice(0, 500);
    }
    return event;
  }

  // --- MCP Tokens ---
  public getMCPTokens(): Array<Omit<MCPToken, 'token_hash'>> {
    return Array.from(this.mcpTokens.values()).map(({ token_hash, ...rest }) => rest);
  }

  public createMCPToken(name: string, scopes: string[] = ['*']): { token: string; record: MCPToken } {
    const rawSecret = `mcp_wa_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const tokenRecord: MCPToken = {
      id: `mcp_tok_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name,
      token_prefix: rawSecret.substring(0, 10),
      token_hash: tokenHash,
      scopes,
      created_at: new Date().toISOString(),
    };

    this.mcpTokens.set(tokenRecord.id, tokenRecord);
    return { token: rawSecret, record: tokenRecord };
  }

  public validateMCPToken(token: string): MCPToken | null {
    if (!token) return null;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const found = Array.from(this.mcpTokens.values()).find((t) => t.token_hash === tokenHash);
    if (found) {
      found.last_used_at = new Date().toISOString();
      return found;
    }
    return null;
  }

  public deleteMCPToken(id: string): boolean {
    return this.mcpTokens.delete(id);
  }

  // --- Clear / Reset ---
  public clearAllData(): void {
    this.contacts.clear();
    this.conversations.clear();
    this.messages.clear();
    this.templates.clear();
    this.broadcasts.clear();
    this.automations.clear();
    this.capiEvents = [];
    this.mcpTokens.clear();
    this.connectedAccount = null;
    this.sandboxSession = null;
  }
}

export const whatsappStore = new WhatsAppStore();
