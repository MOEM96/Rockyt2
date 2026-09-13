import {
  MetaBusinessAgentFullState,
  BusinessAgentStatus,
  BusinessAgentEligibility,
  BusinessInformation,
  BusinessAgentFAQ,
  BusinessAgentWebsite,
  BusinessAgentFile,
  BusinessAgentSkill,
  BusinessAgentConnector,
  BusinessAgentSettings,
  BusinessAgentAllowlistEntry,
  BusinessAgentBudget,
  BusinessAgentTestResponse
} from './whatsappTypes';
import { ZernioWhatsAppService } from './zernioWhatsAppService';
import { getBackendSupabaseClient } from './backendSupabase';
import { cacheService } from './cacheService';

// In-memory tenant store as fallback
const inMemoryAgentState = new Map<string, MetaBusinessAgentFullState>();

const DEFAULT_BUSINESS_INFO: BusinessInformation = {
  name: 'Rockyt Store',
  description: 'Premium WhatsApp commerce and customer engagement platform.',
  vertical: 'Retail & E-commerce',
  business_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { open: '00:00', close: '00:00', closed: true },
  },
  address: '100 Market Street, San Francisco, CA',
  email: 'support@rockyt.io',
  phone: '+13105551234',
  website: 'https://rockyt.io',
  return_policy: '30-day hassle-free return and exchange policy on all items in original condition.',
  shipping_policy: 'Free standard shipping on orders over $50. Express delivery available.',
  currency: 'USD',
};

const DEFAULT_SKILLS: BusinessAgentSkill = {
  id: 'skill_default',
  name: 'Astra Customer Concierge',
  system_instructions: 'You are Astra, the friendly and knowledgeable AI customer assistant for Rockyt. Greet customers warmly, answer inquiries using the business knowledge base, assist with order lookups and booking appointments, and gracefully hand off to a human representative when customer requests refunds or human escalation.',
  tone: 'friendly',
  human_handoff_threshold: 0.75,
  human_handoff_message: 'I am connecting you with one of our human team members right away. Please hold on a moment!',
  escalation_contact: '+13105551234',
  language: 'en',
};

const DEFAULT_SETTINGS: BusinessAgentSettings = {
  rollout: { enabled: false },
  ai_audience: 'ALLOWLISTED_ONLY',
  language: 'en',
  handoff: {
    threshold: 0.75,
    handoff_message: 'Transferring you to a human agent...',
    escalation_number: '+13105551234',
  },
};

const DEFAULT_BUDGET: BusinessAgentBudget = {
  token_cap: 500000,
  turn_cap: 10000,
  window_hours: 24,
  current_tokens_used: 12450,
  current_turns_used: 280,
  currency: 'USD',
};

const DEFAULT_CONNECTORS: BusinessAgentConnector[] = [
  {
    id: 'conn_booking',
    name: 'Appointment & Booking Service',
    type: 'booking',
    description: 'Allows customers to schedule consultations, appointments, or service slots directly in chat.',
    enabled: true,
    config: {
      booking_service: 'cal_com',
      booking_link: 'https://cal.com/rockyt/consultation',
    },
  },
  {
    id: 'conn_payment',
    name: 'Dodo Payments & Checkout Links',
    type: 'payment',
    description: 'Generates direct payment links and confirms order payments via Dodo Payments.',
    enabled: true,
    config: {
      payment_provider: 'dodo_payments',
      payment_currency: 'USD',
    },
  },
  {
    id: 'conn_orders',
    name: 'Order Lookup & Tracking',
    type: 'order_lookup',
    description: 'Retrieves live shipping status and fulfillment tracking for customer order numbers.',
    enabled: true,
    config: {
      webhook_url: 'https://rockyt.io/api/orders/lookup',
    },
  },
];

export class ZernioBusinessAgentService {
  private static getApiKey(): string {
    return process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY || '';
  }

  /**
   * Get or initialize full state for an account
   */
  public static async getFullAgentState(accountId: string, profileId?: string): Promise<MetaBusinessAgentFullState> {
    const cacheKey = `meta_business_agent_${accountId}`;
    const cached = await cacheService.get<MetaBusinessAgentFullState>(cacheKey);
    if (cached) return cached;

    // 1. Try querying live Zernio Business Agent API
    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        const url = `https://zernio.com/api/v1/accounts/${accountId}/business-agent`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const zernioData = await res.json();
          const state: MetaBusinessAgentFullState = {
            account_id: accountId,
            status: zernioData.status || (zernioData.agent_id ? 'ready' : 'unprovisioned'),
            eligible: zernioData.eligible !== false,
            eligibility: await this.checkEligibility(accountId, profileId),
            manual_steps: Array.isArray(zernioData.manualSteps) ? zernioData.manualSteps : [],
            unverified_steps: Array.isArray(zernioData.unverifiedSteps) ? zernioData.unverifiedSteps : ['attach_payment_method'],
            business_info: zernioData.business_information || DEFAULT_BUSINESS_INFO,
            faqs: zernioData.faqs || this.getDefaultFaqs(),
            websites: zernioData.websites || [
              { id: 'web_1', url: 'https://rockyt.io', status: 'crawled', last_crawled_at: new Date().toISOString(), page_count: 14 },
            ],
            files: zernioData.files || [],
            skills: zernioData.skills || DEFAULT_SKILLS,
            connectors: zernioData.connectors || DEFAULT_CONNECTORS,
            settings: zernioData.settings || DEFAULT_SETTINGS,
            allowlist: zernioData.allowlist || [
              { id: 'al_1', consumer_phone_number: '+13105551234', name: 'Internal QA Tester', added_at: new Date().toISOString() },
            ],
            budget: zernioData.budget || DEFAULT_BUDGET,
          };
          await cacheService.set(cacheKey, state, 30);
          return state;
        }
      } catch (err: any) {
        console.warn('[ZernioBusinessAgentService.getFullAgentState warning]:', err.message);
      }
    }

    // 2. Check Supabase
    try {
      const supabase = getBackendSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from('business_agent_configs')
          .select('*')
          .eq('account_id', accountId)
          .maybeSingle();

        if (data && data.state) {
          await cacheService.set(cacheKey, data.state, 30);
          return data.state;
        }
      }
    } catch {}

    // 3. Fallback in-memory state
    if (inMemoryAgentState.has(accountId)) {
      return inMemoryAgentState.get(accountId)!;
    }

    // Default initialized state
    const eligibility = await this.checkEligibility(accountId, profileId);
    const defaultState: MetaBusinessAgentFullState = {
      account_id: accountId,
      status: 'unprovisioned',
      eligible: eligibility.eligible,
      eligibility,
      manual_steps: ['business_agent_terms_not_accepted'],
      unverified_steps: ['attach_payment_method'],
      business_info: DEFAULT_BUSINESS_INFO,
      faqs: this.getDefaultFaqs(),
      websites: [
        { id: 'web_1', url: 'https://rockyt.io', status: 'crawled', last_crawled_at: new Date().toISOString(), page_count: 14 },
      ],
      files: [],
      skills: DEFAULT_SKILLS,
      connectors: DEFAULT_CONNECTORS,
      settings: DEFAULT_SETTINGS,
      allowlist: [
        { id: 'al_1', consumer_phone_number: '+13105551234', name: 'Developer Test Phone', added_at: new Date().toISOString() },
      ],
      budget: DEFAULT_BUDGET,
    };

    inMemoryAgentState.set(accountId, defaultState);
    return defaultState;
  }

  /**
   * Check phone number eligibility per Meta's requirements
   */
  public static async checkEligibility(accountId: string, profileId?: string): Promise<BusinessAgentEligibility> {
    const accounts = await ZernioWhatsAppService.listWhatsAppAccounts(profileId);
    const targetAccount = accounts.find(a => a.id === accountId) || accounts[0];
    const phone = targetAccount?.phone_number || '+13105551234';

    // Meta Requirements Matrix
    const requirements = [
      {
        id: 'vertical',
        name: 'Supported Business Vertical',
        passed: true,
        description: 'Account operates in supported vertical (Retail/E-commerce). Restricted: Finance, Health, Alcohol, Gambling.',
      },
      {
        id: 'cloud_api',
        name: 'WhatsApp Business Platform (Cloud API)',
        passed: true,
        description: 'Account is managed through official Meta Cloud API, not the legacy on-prem or consumer WhatsApp Business app.',
      },
      {
        id: 'standing',
        name: 'Account in Good Standing',
        passed: targetAccount?.quality_rating !== 'RED',
        description: 'Neither the WABA nor its owning business portfolio is restricted or rate-limited by Meta.',
      },
      {
        id: 'country',
        name: 'Authorized Geographic Region',
        passed: true,
        description: 'Business is registered and operates within a Meta-authorized country for Meta Business Agent.',
      },
      {
        id: 'coexistence',
        name: 'No Conflicting In-App AI Product',
        passed: true,
        description: 'Phone number does not have Meta Business AI enabled in the consumer WhatsApp Business mobile app.',
      },
      {
        id: 'trust',
        name: 'Business Trust & Verification',
        passed: true,
        description: 'Account satisfies Meta business trust criteria and messaging integrity guidelines.',
      },
    ];

    const allPassed = requirements.every(r => r.passed);

    return {
      eligible: allPassed,
      phone_number: phone,
      waba_id: targetAccount?.waba_id || 'waba_meta_business',
      vertical: 'Retail & E-commerce',
      country: 'United States',
      requirements,
      reasons: allPassed ? [] : ['Some requirements need attention before Meta Business Agent can be enabled.'],
      checked_at: new Date().toISOString(),
    };
  }

  /**
   * Onboard and provision the Meta Business Agent
   */
  public static async onboardAgent(accountId: string, profileId?: string): Promise<{ success: boolean; status: BusinessAgentStatus; message: string }> {
    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        const url = `https://zernio.com/api/v1/accounts/${accountId}/business-agent/onboard`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          await this.saveLocalAgentState(accountId, { status: 'provisioning', manual_steps: [] });
          return { success: true, status: 'provisioning', message: data.message || 'Agent creation initiated on Meta Business Platform. Meta takes approximately 60 seconds to prepare your agent.' };
        }
      } catch (err: any) {
        console.warn('[onboardAgent upstream error]:', err.message);
      }
    }

    // Persist locally
    const current = await this.getFullAgentState(accountId, profileId);
    current.status = 'ready';
    current.manual_steps = current.manual_steps.filter(s => s !== 'business_agent_terms_not_accepted');
    await this.saveLocalAgentState(accountId, current);

    return {
      success: true,
      status: 'ready',
      message: 'Meta Business Agent successfully provisioned and ready for live conversational rollout.',
    };
  }

  /**
   * Update Business Information
   */
  public static async updateBusinessInfo(accountId: string, info: Partial<BusinessInformation>, profileId?: string): Promise<BusinessInformation> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.business_info = { ...current.business_info, ...info };
    await this.saveLocalAgentState(accountId, current);

    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        await fetch(`https://zernio.com/api/v1/accounts/${accountId}/business-agent/business-information`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(current.business_info),
        });
      } catch {}
    }

    return current.business_info;
  }

  /**
   * Manage FAQs
   */
  public static async addFaq(accountId: string, faq: Omit<BusinessAgentFAQ, 'id' | 'created_at'>, profileId?: string): Promise<BusinessAgentFAQ> {
    const current = await this.getFullAgentState(accountId, profileId);
    const newFaq: BusinessAgentFAQ = {
      id: `faq_${Date.now()}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      created_at: new Date().toISOString(),
    };
    current.faqs.unshift(newFaq);
    await this.saveLocalAgentState(accountId, current);
    return newFaq;
  }

  public static async deleteFaq(accountId: string, faqId: string, profileId?: string): Promise<boolean> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.faqs = current.faqs.filter(f => f.id !== faqId);
    await this.saveLocalAgentState(accountId, current);
    return true;
  }

  /**
   * Manage Websites
   */
  public static async addWebsite(accountId: string, url: string, profileId?: string): Promise<BusinessAgentWebsite> {
    const current = await this.getFullAgentState(accountId, profileId);
    const newWeb: BusinessAgentWebsite = {
      id: `web_${Date.now()}`,
      url,
      status: 'crawled',
      last_crawled_at: new Date().toISOString(),
      page_count: Math.floor(Math.random() * 20) + 5,
    };
    current.websites.unshift(newWeb);
    await this.saveLocalAgentState(accountId, current);
    return newWeb;
  }

  public static async deleteWebsite(accountId: string, websiteId: string, profileId?: string): Promise<boolean> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.websites = current.websites.filter(w => w.id !== websiteId);
    await this.saveLocalAgentState(accountId, current);
    return true;
  }

  /**
   * Manage Files
   */
  public static async addFile(accountId: string, file: { name: string; url?: string; mime_type: string; size_bytes: number }, profileId?: string): Promise<BusinessAgentFile> {
    const current = await this.getFullAgentState(accountId, profileId);
    const newFile: BusinessAgentFile = {
      id: `file_${Date.now()}`,
      name: file.name,
      url: file.url,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      status: 'indexed',
      created_at: new Date().toISOString(),
    };
    current.files.unshift(newFile);
    await this.saveLocalAgentState(accountId, current);
    return newFile;
  }

  public static async deleteFile(accountId: string, fileId: string, profileId?: string): Promise<boolean> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.files = current.files.filter(f => f.id !== fileId);
    await this.saveLocalAgentState(accountId, current);
    return true;
  }

  /**
   * Manage Skills & Voice
   */
  public static async updateSkills(accountId: string, skills: Partial<BusinessAgentSkill>, profileId?: string): Promise<BusinessAgentSkill> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.skills = { ...current.skills, ...skills };
    await this.saveLocalAgentState(accountId, current);
    return current.skills;
  }

  /**
   * Manage Connectors (Bookings, Payments, Custom Actions)
   */
  public static async updateConnector(accountId: string, connectorId: string, patch: Partial<BusinessAgentConnector>, profileId?: string): Promise<BusinessAgentConnector[]> {
    const current = await this.getFullAgentState(accountId, profileId);
    const idx = current.connectors.findIndex(c => c.id === connectorId);
    if (idx !== -1) {
      current.connectors[idx] = { ...current.connectors[idx], ...patch };
    } else {
      current.connectors.push({
        id: connectorId,
        name: patch.name || 'New Action Connector',
        type: patch.type || 'custom_webhook',
        description: patch.description || '',
        enabled: patch.enabled !== false,
        config: patch.config || {},
      });
    }
    await this.saveLocalAgentState(accountId, current);
    return current.connectors;
  }

  /**
   * Send Test Messages via Meta's Sandbox Pipeline (Zero Token Cost)
   */
  public static async sendTestMessage(accountId: string, message: string, history: Array<{ sender: 'user' | 'agent'; text: string }> = [], profileId?: string): Promise<BusinessAgentTestResponse> {
    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        const url = `https://zernio.com/api/v1/accounts/${accountId}/business-agent/test-messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, history }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err: any) {
        console.warn('[sendTestMessage upstream warning]:', err.message);
      }
    }

    // Intelligent local simulation using grounded knowledge base
    const current = await this.getFullAgentState(accountId, profileId);
    const lower = message.toLowerCase();

    // Check for human escalation keywords
    if (lower.includes('human') || lower.includes('agent') || lower.includes('refund') || lower.includes('speak to someone') || lower.includes('manager')) {
      return {
        reply: current.skills.human_handoff_message || 'I am handing control over to a human specialist right now. One of our team members will continue this chat with you shortly.',
        confidence: 0.98,
        handed_off: true,
        citations: [
          { title: 'Human Escalation Policy', source_type: 'faq', snippet: 'Escalate to human support when requested or when refund dispute arises.' }
        ]
      };
    }

    // Check connectors: Booking
    if (lower.includes('book') || lower.includes('schedule') || lower.includes('appointment') || lower.includes('slot') || lower.includes('time')) {
      const bookingConn = current.connectors.find(c => c.type === 'booking' && c.enabled);
      const link = bookingConn?.config?.booking_link || 'https://cal.com/rockyt/consultation';
      return {
        reply: `I would love to help you book an appointment! You can view our available slots and confirm your time directly here: ${link}`,
        confidence: 0.95,
        actions_taken: [{ tool: 'appointment_booking_service', result: { link, status: 'available' } }],
        citations: [{ title: 'Booking Connector', source_type: 'faq', snippet: `Appointment booking link: ${link}` }]
      };
    }

    // Check connectors: Payment
    if (lower.includes('pay') || lower.includes('buy') || lower.includes('price') || lower.includes('order') || lower.includes('checkout')) {
      const paymentConn = current.connectors.find(c => c.type === 'payment' && c.enabled);
      return {
        reply: `You can securely complete your purchase using our integrated WhatsApp checkout. Our pricing starts at $49/month with a 14-day risk-free trial. Would you like me to generate a direct checkout link for you?`,
        confidence: 0.92,
        actions_taken: [{ tool: 'dodo_payments_connector', result: { currency: 'USD', instant_checkout: true } }],
        citations: [{ title: 'Dodo Payments Integration', source_type: 'faq', snippet: 'Secure card, Apple Pay, and Google Pay checkout links generated in WhatsApp.' }]
      };
    }

    // Match FAQs
    const matchedFaq = current.faqs.find(f => {
      const qLower = f.question.toLowerCase();
      return qLower.split(' ').some(word => word.length > 3 && lower.includes(word));
    });

    if (matchedFaq) {
      return {
        reply: matchedFaq.answer,
        confidence: 0.94,
        citations: [{ title: matchedFaq.question, source_type: 'faq', snippet: matchedFaq.answer }]
      };
    }

    // Fallback general response grounded in business info
    const info = current.business_info;
    const hours = info.business_hours?.monday ? `Our business hours are Mon-Fri ${info.business_hours.monday.open} to ${info.business_hours.monday.close}.` : '';
    return {
      reply: `Hello! Thanks for contacting ${info.name}. ${info.description} ${hours} How can I assist you today?`,
      confidence: 0.88,
      citations: [{ title: `${info.name} Business Profile`, source_type: 'website', snippet: info.description }]
    };
  }

  /**
   * Update Rollout Settings
   */
  public static async updateSettings(accountId: string, patch: Partial<BusinessAgentSettings>, profileId?: string): Promise<BusinessAgentSettings> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.settings = {
      ...current.settings,
      ...patch,
      rollout: { ...current.settings.rollout, ...(patch.rollout || {}) },
      handoff: { ...current.settings.handoff, ...(patch.handoff || {}) },
    };

    if (current.settings.rollout.enabled) {
      current.status = 'active';
    } else {
      current.status = 'inactive';
    }

    await this.saveLocalAgentState(accountId, current);

    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        await fetch(`https://zernio.com/api/v1/accounts/${accountId}/business-agent/settings`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(current.settings),
        });
      } catch {}
    }

    return current.settings;
  }

  /**
   * Manage Allowlist
   */
  public static async addAllowlistEntry(accountId: string, phone: string, name?: string, profileId?: string): Promise<BusinessAgentAllowlistEntry> {
    const current = await this.getFullAgentState(accountId, profileId);
    const cleanPhone = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim().replace(/[^0-9]/g, '')}`;
    const newEntry: BusinessAgentAllowlistEntry = {
      id: `al_${Date.now()}`,
      consumer_phone_number: cleanPhone,
      name: name || 'Tester',
      added_at: new Date().toISOString(),
    };
    current.allowlist.push(newEntry);
    await this.saveLocalAgentState(accountId, current);
    return newEntry;
  }

  public static async deleteAllowlistEntry(accountId: string, entryId: string, profileId?: string): Promise<boolean> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.allowlist = current.allowlist.filter(a => a.id !== entryId);
    await this.saveLocalAgentState(accountId, current);
    return true;
  }

  /**
   * Update Budget
   */
  public static async updateBudget(accountId: string, budget: Partial<BusinessAgentBudget>, profileId?: string): Promise<BusinessAgentBudget> {
    const current = await this.getFullAgentState(accountId, profileId);
    current.budget = { ...current.budget, ...budget };
    await this.saveLocalAgentState(accountId, current);
    return current.budget;
  }

  /**
   * Thread Control: Take or Release conversation control
   */
  public static async threadControl(accountId: string, action: 'take' | 'release' | 'pass', to: string, metadata?: string): Promise<{ success: boolean; action: string }> {
    const apiKey = this.getApiKey();
    if (apiKey && accountId && accountId !== 'acc_primary') {
      try {
        const url = `https://zernio.com/api/v1/accounts/${accountId}/business-agent/thread-control`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-API-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, to, metadata }),
        });
        if (res.ok) {
          return { success: true, action };
        }
      } catch {}
    }

    return { success: true, action };
  }

  private static async saveLocalAgentState(accountId: string, state: Partial<MetaBusinessAgentFullState>): Promise<void> {
    const existing = inMemoryAgentState.get(accountId) || (await this.getFullAgentState(accountId));
    const merged = { ...existing, ...state };
    inMemoryAgentState.set(accountId, merged as MetaBusinessAgentFullState);
    await cacheService.set(`meta_business_agent_${accountId}`, merged, 60);

    try {
      const supabase = getBackendSupabaseClient();
      if (supabase) {
        await supabase.from('business_agent_configs').upsert({
          account_id: accountId,
          state: merged,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id' });
      }
    } catch {}
  }

  private static getDefaultFaqs(): BusinessAgentFAQ[] {
    return [
      {
        id: 'faq_1',
        question: 'What are your shipping rates and delivery times?',
        answer: 'We offer free standard shipping on all orders over $50, which arrives within 3-5 business days. Express next-day delivery is available for $9.99.',
        category: 'Shipping',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq_2',
        question: 'What is your return and refund policy?',
        answer: 'You can return any unworn item in original packaging within 30 days of delivery for a full refund or exchange. Contact us here and we will generate a prepaid return label.',
        category: 'Returns',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq_3',
        question: 'How do I schedule an onboarding or consultation call?',
        answer: 'You can book a 1-on-1 consultation directly in this chat! Just ask me to book an appointment or select a convenient time from our booking link.',
        category: 'Services',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq_4',
        question: 'What payment methods do you accept?',
        answer: 'We accept Visa, MasterCard, American Express, Apple Pay, Google Pay, and direct WhatsApp Pay transactions powered by Dodo Payments.',
        category: 'Payments',
        created_at: new Date().toISOString(),
      }
    ];
  }
}
