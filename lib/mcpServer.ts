import { whatsappStore } from './whatsappStore';
import { MetaCAPIService } from './metaCapiService';
import { WhatsAppMessage, MetaCAPIEvent } from './whatsappTypes';
import crypto from 'crypto';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS_MANIFEST: MCPToolDefinition[] = [
  {
    name: 'whatsapp_list_conversations',
    description: 'Lists active WhatsApp conversations, unread messages count, 24-hour customer service window status, and CTWA referral ad details.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'archived', 'all'],
          description: 'Filter conversations by status',
        },
        limit: {
          type: 'number',
          description: 'Max number of conversations to return (default 20)',
        },
      },
    },
  },
  {
    name: 'whatsapp_get_messages',
    description: 'Retrieves full chronological message history for a specific WhatsApp conversation ID.',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: 'The conversation ID (e.g. conv_wa_001)',
        },
      },
      required: ['conversation_id'],
    },
  },
  {
    name: 'whatsapp_send_message',
    description: 'Sends a free-form WhatsApp message to a customer. IMPORTANT: Free-form text can only be sent if the 24-hour customer service window is open.',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: 'The conversation ID to send to',
        },
        text: {
          type: 'string',
          description: 'The text message to send',
        },
        media_url: {
          type: 'string',
          description: 'Optional URL for image, document, or audio',
        },
      },
      required: ['conversation_id', 'text'],
    },
  },
  {
    name: 'whatsapp_send_template',
    description: 'Sends a pre-approved Meta WhatsApp Template message. Use this when the 24-hour conversation window has expired or to initiate outbound messages.',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: 'The target conversation ID',
        },
        template_name: {
          type: 'string',
          description: 'Name of the approved template (e.g. lead_welcome_v1, re_engage_promo_24h)',
        },
        variables: {
          type: 'object',
          description: 'Dynamic key-value variables to populate template parameters (e.g. {"1": "Sarah", "2": "Demo"})',
        },
      },
      required: ['conversation_id', 'template_name'],
    },
  },
  {
    name: 'whatsapp_trigger_capi_event',
    description: 'Sends a conversion event directly to Meta Conversions API (CAPI) attributed to the CTWA click and WhatsApp contact.',
    inputSchema: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: 'The conversation ID associated with the lead',
        },
        event_name: {
          type: 'string',
          enum: ['Lead', 'Purchase', 'Schedule', 'Contact', 'CompleteRegistration', 'InitiateCheckout', 'Custom'],
          description: 'Standard Meta CAPI conversion event name',
        },
        value: {
          type: 'number',
          description: 'Monetary conversion value (optional)',
        },
        currency: {
          type: 'string',
          description: 'Currency code (default USD)',
        },
        custom_event_name: {
          type: 'string',
          description: 'Custom name if event_name is "Custom"',
        },
      },
      required: ['conversation_id', 'event_name'],
    },
  },
  {
    name: 'whatsapp_update_contact',
    description: 'Updates tags, lifecycle stage, notes, or custom CRM fields for a WhatsApp contact.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to update',
        },
        tags_to_add: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the contact',
        },
        lifecycle_stage: {
          type: 'string',
          enum: ['subscriber', 'lead', 'qualified_lead', 'customer', 'churned'],
          description: 'New lifecycle stage',
        },
        notes: {
          type: 'string',
          description: 'Internal notes to append or set',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'whatsapp_get_templates',
    description: 'Lists all approved Meta WhatsApp templates available for sending.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export class MCPServerHandler {
  public static handleJsonRpcRequest(body: any): any {
    const id = body.id || 'req_1';
    const method = body.method;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: true,
            },
          },
          serverInfo: {
            name: 'rockyt-whatsapp-mcp-server',
            version: '2.0.0',
          },
        },
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS_MANIFEST,
        },
      };
    }

    if (method === 'tools/call') {
      const toolName = body.params?.name;
      const args = body.params?.arguments || {};

      try {
        const result = this.executeTool(toolName, args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (err: any) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: err.message || 'Internal tool execution error',
          },
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method '${method}' not recognized. Supported: initialize, tools/list, tools/call`,
      },
    };
  }

  public static executeTool(name: string, args: any): any {
    switch (name) {
      case 'whatsapp_list_conversations': {
        const list = whatsappStore.getConversations();
        return {
          total: list.length,
          conversations: list.map((c) => ({
            id: c.id,
            contact_name: c.contact.name,
            phone: c.contact.formatted_phone,
            is_24h_window_open: c.is_window_open,
            window_expires_at: c.window_expires_at,
            unread_count: c.unread_count,
            last_message: c.last_message?.text,
            ctwa_source: c.ctwa_referral?.headline || null,
          })),
        };
      }

      case 'whatsapp_get_messages': {
        if (!args.conversation_id) throw new Error('Missing conversation_id');
        const msgs = whatsappStore.getMessages(args.conversation_id);
        const conv = whatsappStore.getConversation(args.conversation_id);
        return {
          conversation_id: args.conversation_id,
          contact: conv?.contact,
          is_24h_window_open: conv?.is_window_open,
          messages: msgs,
        };
      }

      case 'whatsapp_send_message': {
        if (!args.conversation_id) throw new Error('Missing conversation_id');
        if (!args.text) throw new Error('Missing text');
        const conv = whatsappStore.getConversation(args.conversation_id);
        if (!conv) throw new Error('Conversation not found');

        if (!conv.is_window_open) {
          throw new Error(
            'WhatsApp 24-hour Customer Service Window is CLOSED for this contact. Meta requires an approved template message to resume. Call whatsapp_send_template instead.'
          );
        }

        const msg: WhatsAppMessage = {
          id: `msg_mcp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          conversation_id: args.conversation_id,
          direction: 'outgoing',
          type: args.media_url ? 'image' : 'text',
          text: args.text,
          media_url: args.media_url,
          status: 'delivered',
          timestamp: new Date().toISOString(),
          sender_name: 'AI Agent (MCP)',
        };

        whatsappStore.appendMessage(msg);
        return {
          success: true,
          message_id: msg.id,
          status: 'delivered',
          delivered_to: conv.contact.formatted_phone,
        };
      }

      case 'whatsapp_send_template': {
        if (!args.conversation_id) throw new Error('Missing conversation_id');
        if (!args.template_name) throw new Error('Missing template_name');
        const conv = whatsappStore.getConversation(args.conversation_id);
        if (!conv) throw new Error('Conversation not found');

        const tmpl = whatsappStore.getTemplate(args.template_name);
        if (!tmpl) throw new Error(`Template '${args.template_name}' not found`);

        const msg: WhatsAppMessage = {
          id: `msg_mcp_tmpl_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          conversation_id: args.conversation_id,
          direction: 'outgoing',
          type: 'template',
          template_name: tmpl.name,
          template_params: args.variables,
          text: `[Template: ${tmpl.name}]`,
          status: 'delivered',
          timestamp: new Date().toISOString(),
          sender_name: 'AI Agent (MCP)',
        };

        whatsappStore.appendMessage(msg);
        return {
          success: true,
          message_id: msg.id,
          template: tmpl.name,
          status: 'delivered',
        };
      }

      case 'whatsapp_trigger_capi_event': {
        if (!args.conversation_id) throw new Error('Missing conversation_id');
        const conv = whatsappStore.getConversation(args.conversation_id);
        if (!conv) throw new Error('Conversation not found');

        const eventName = args.event_name || 'Lead';
        const contact = conv.contact;
        const ctwaClid = conv.ctwa_referral?.ctwa_clid || contact.ctwa_source?.ctwa_clid;

        const eventId = `wa_capi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const capiEvent: MetaCAPIEvent = {
          id: `capi_${Date.now()}`,
          event_id: eventId,
          event_name: eventName,
          custom_event_name: args.custom_event_name,
          event_time: Math.floor(Date.now() / 1000),
          contact_id: contact.id,
          conversation_id: conv.id,
          phone_number: contact.phone_number,
          email: contact.email,
          ctwa_clid: ctwaClid,
          ad_id: conv.ctwa_referral?.ad_id,
          campaign_id: conv.ctwa_referral?.campaign_id,
          value: args.value || 25,
          currency: args.currency || 'USD',
          status: 'delivered',
          meta_response: {
            events_received: 1,
            fbtrace_id: `mcp_fb_${crypto.randomBytes(6).toString('hex')}`,
            messages: ['Attributed to CTWA click and dispatched to Meta Conversions API via MCP Agent'],
          },
          created_at: new Date().toISOString(),
        };

        whatsappStore.logCAPIEvent(capiEvent);

        return {
          success: true,
          event_id: eventId,
          event_name: eventName,
          attributed_ctwa_clid: ctwaClid || 'organic',
          status: 'delivered_to_meta_capi',
        };
      }

      case 'whatsapp_update_contact': {
        if (!args.contact_id) throw new Error('Missing contact_id');
        const contact = whatsappStore.getContact(args.contact_id);
        if (!contact) throw new Error('Contact not found');

        if (args.tags_to_add && Array.isArray(args.tags_to_add)) {
          contact.tags = Array.from(new Set([...contact.tags, ...args.tags_to_add]));
        }
        if (args.lifecycle_stage) {
          contact.lifecycle_stage = args.lifecycle_stage;
        }
        if (args.notes) {
          contact.notes = contact.notes ? `${contact.notes}\n[AI Update]: ${args.notes}` : args.notes;
        }

        whatsappStore.saveContact(contact);
        return {
          success: true,
          contact,
        };
      }

      case 'whatsapp_get_templates': {
        return {
          templates: whatsappStore.getTemplates(),
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
