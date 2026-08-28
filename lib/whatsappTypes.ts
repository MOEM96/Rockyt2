export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface CTWAReferral {
  source_id?: string;
  source_type?: 'ad' | 'post';
  source_url?: string;
  headline?: string;
  body?: string;
  media_url?: string;
  ad_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  ctwa_clid?: string; // Click-to-WhatsApp Click ID from Meta
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio' | 'interactive' | 'location';
  text?: string;
  media_url?: string;
  media_caption?: string;
  template_name?: string;
  template_params?: Record<string, string>;
  status: MessageStatus;
  timestamp: string;
  sender_name?: string;
  sender_phone?: string;
  error_message?: string;
  referral?: CTWAReferral;
}

export interface WhatsAppContact {
  id: string;
  phone_number: string;
  formatted_phone: string;
  name: string;
  email?: string;
  avatar_url?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  lifecycle_stage: 'subscriber' | 'lead' | 'qualified_lead' | 'customer' | 'churned';
  created_at: string;
  last_activity_at: string;
  ctwa_source?: CTWAReferral;
  notes?: string;
  assigned_agent?: string;
}

export interface WhatsAppConversation {
  id: string;
  account_id: string;
  profile_id: string;
  contact: WhatsAppContact;
  last_message?: WhatsAppMessage;
  unread_count: number;
  status: 'active' | 'archived' | 'spam';
  last_customer_message_at: string; // Used to calculate 24-hour customer service window
  window_expires_at: string; // ISO timestamp
  is_window_open: boolean;
  ctwa_referral?: CTWAReferral;
  ai_agent_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetaCAPIEvent {
  id: string;
  event_id: string;
  event_name: 'Lead' | 'Purchase' | 'Schedule' | 'Contact' | 'CompleteRegistration' | 'InitiateCheckout' | 'Custom';
  custom_event_name?: string;
  event_time: number; // Unix timestamp
  contact_id: string;
  conversation_id?: string;
  phone_number: string;
  email?: string;
  ctwa_clid?: string;
  ad_id?: string;
  campaign_id?: string;
  value?: number;
  currency?: string;
  status: 'sent' | 'delivered' | 'failed' | 'simulated';
  meta_response?: {
    events_received: number;
    fbtrace_id?: string;
    messages?: string[];
  };
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }[];
  last_updated: string;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  template_name: string;
  target_tags: string[];
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduled_at?: string;
  created_at: string;
}

export type AutomationNodeType =
  | 'trigger_incoming_message'
  | 'trigger_ctwa_click'
  | 'trigger_tag_added'
  | 'condition_keyword'
  | 'condition_24h_window'
  | 'condition_tag'
  | 'action_send_message'
  | 'action_send_template'
  | 'action_send_media'
  | 'action_trigger_capi'
  | 'action_add_tag'
  | 'action_handoff_agent'
  | 'action_delay';

export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
}

export interface AutomationFlow {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  trigger_type: 'ctwa' | 'keyword' | 'new_conversation' | 'tag';
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  execution_count: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MCPToken {
  id: string;
  name: string;
  token_prefix: string;
  token_hash: string;
  scopes: string[];
  last_used_at?: string;
  created_at: string;
}

export interface WhatsAppAccount {
  id: string;
  platform: 'whatsapp';
  name: string;
  phone_number: string;
  phone_number_id?: string;
  waba_id?: string;
  status: 'connected' | 'disconnected' | 'pending' | 'sandbox';
  mode: 'production' | 'sandbox';
  quality_rating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messaging_limit_tier?: string;
  verified_name?: string;
  connected_at: string;
}

export interface WhatsAppSandboxSession {
  id: string;
  phone_number: string;
  formatted_phone: string;
  sandbox_number: string;
  join_code: string;
  instructions: string;
  status: 'active' | 'expired' | 'pending';
  expires_at: string;
  created_at: string;
  user_id?: string;
  profile_id?: string;
}
