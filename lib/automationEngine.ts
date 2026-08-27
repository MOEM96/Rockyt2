import { AutomationFlow, AutomationNode, WhatsAppMessage } from './whatsappTypes';
import { whatsappStore } from './whatsappStore';
import { MetaCAPIService } from './metaCapiService';
import crypto from 'crypto';

export class AutomationEngine {
  /**
   * Evaluate active flows when an incoming message or CTWA click is detected
   */
  public static async processIncomingTrigger(params: {
    type: 'message_received' | 'ctwa_click';
    conversationId: string;
    messageText?: string;
    ctwaData?: any;
  }) {
    const flows = whatsappStore.getAutomations().filter((f) => f.is_active);
    const conv = whatsappStore.getConversation(params.conversationId);
    if (!conv) return;

    for (const flow of flows) {
      let shouldRun = false;

      if (params.type === 'ctwa_click' && flow.trigger_type === 'ctwa') {
        shouldRun = true;
      } else if (params.type === 'message_received') {
        if (flow.trigger_type === 'keyword') {
          // Check if any keyword trigger node matches
          const triggerNode = flow.nodes.find((n) => n.type === 'trigger_incoming_message' || n.type === 'condition_keyword');
          const kw = triggerNode?.config?.keyword?.toLowerCase();
          if (kw && params.messageText?.toLowerCase().includes(kw)) {
            shouldRun = true;
          }
        } else if (flow.trigger_type === 'new_conversation' && conv.unread_count <= 1) {
          shouldRun = true;
        }
      }

      if (shouldRun) {
        await this.executeFlow(flow, conv);
      }
    }
  }

  /**
   * Execute an automation flow graph for a conversation
   */
  public static async executeFlow(flow: AutomationFlow, conv: any): Promise<{ log: string[] }> {
    const executionLogs: string[] = [];
    executionLogs.push(`[${new Date().toISOString()}] Started flow "${flow.title}" (ID: ${flow.id})`);

    // Increment execution count
    flow.execution_count = (flow.execution_count || 0) + 1;
    flow.last_triggered_at = new Date().toISOString();
    whatsappStore.saveAutomation(flow);

    // Find trigger node (source nodes without incoming edges)
    const triggerNode = flow.nodes.find((n) => n.type.startsWith('trigger_')) || flow.nodes[0];
    if (!triggerNode) {
      executionLogs.push('No trigger node found in flow graph.');
      return { log: executionLogs };
    }

    let currentNode: AutomationNode | undefined = triggerNode;
    let iterations = 0;

    while (currentNode && iterations < 15) {
      iterations++;
      executionLogs.push(`Executing node: ${currentNode.title} (${currentNode.type})`);

      if (currentNode.type === 'condition_24h_window') {
        const isWindowOpen = conv.is_window_open;
        executionLogs.push(`24-hour Customer Service Window is currently: ${isWindowOpen ? 'OPEN (Free-form allowed)' : 'CLOSED (Approved template required)'}`);
        
        // Find matching branch edge
        const edge = flow.edges.find((e) => e.source === currentNode?.id && (
          isWindowOpen ? (e.label?.toLowerCase().includes('open') || !e.label) : (e.label?.toLowerCase().includes('close') || e.label?.toLowerCase().includes('template'))
        ));
        
        currentNode = edge ? flow.nodes.find((n) => n.id === edge.target) : undefined;
        continue;
      }

      if (currentNode.type === 'action_send_message') {
        if (!conv.is_window_open) {
          executionLogs.push('WARN: 24h window is closed. Free-form text was prevented to maintain Meta compliance.');
        } else {
          const text = currentNode.config.text || 'Thank you for connecting with us!';
          const msg: WhatsAppMessage = {
            id: `msg_auto_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            conversation_id: conv.id,
            direction: 'outgoing',
            type: 'text',
            text,
            status: 'delivered',
            timestamp: new Date().toISOString(),
            sender_name: 'Automation Bot',
          };
          whatsappStore.appendMessage(msg);
          executionLogs.push(`Sent free-form automated reply: "${text.substring(0, 40)}..."`);
        }
      }

      if (currentNode.type === 'action_send_template') {
        const templateName = currentNode.config.template_name || 'lead_welcome_v1';
        const tmpl = whatsappStore.getTemplate(templateName);
        const msg: WhatsAppMessage = {
          id: `msg_auto_tmpl_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          conversation_id: conv.id,
          direction: 'outgoing',
          type: 'template',
          template_name: templateName,
          text: `[Approved Template: ${templateName}]`,
          status: 'delivered',
          timestamp: new Date().toISOString(),
          sender_name: 'Automation Bot',
        };
        whatsappStore.appendMessage(msg);
        executionLogs.push(`Sent Meta-approved template "${templateName}"`);
      }

      if (currentNode.type === 'action_trigger_capi') {
        const eventName = currentNode.config.event_name || 'Lead';
        const ctwaClid = conv.ctwa_referral?.ctwa_clid || conv.contact?.ctwa_source?.ctwa_clid;
        
        const result = await MetaCAPIService.dispatchEvent({
          eventName,
          userData: {
            phone: conv.contact.phone_number,
            email: conv.contact.email,
            ctwaClid,
          },
          customData: {
            value: currentNode.config.default_value || 25,
            currency: 'USD',
            adId: conv.ctwa_referral?.ad_id,
            campaignId: conv.ctwa_referral?.campaign_id,
          },
        });

        whatsappStore.logCAPIEvent({
          id: `capi_auto_${Date.now()}`,
          event_id: result.eventId,
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          contact_id: conv.contact.id,
          conversation_id: conv.id,
          phone_number: conv.contact.phone_number,
          email: conv.contact.email,
          ctwa_clid: ctwaClid,
          ad_id: conv.ctwa_referral?.ad_id,
          campaign_id: conv.ctwa_referral?.campaign_id,
          value: currentNode.config.default_value || 25,
          currency: 'USD',
          status: result.success ? 'delivered' : 'failed',
          meta_response: result.metaResponse,
          created_at: new Date().toISOString(),
        });

        executionLogs.push(`Dispatched Meta CAPI Event "${eventName}" with CTWA click ID: ${ctwaClid || 'None (organic)'}`);
      }

      if (currentNode.type === 'action_add_tag') {
        const tag = currentNode.config.tag || 'Automated_Lead';
        if (conv.contact) {
          conv.contact.tags = Array.from(new Set([...conv.contact.tags, tag]));
          whatsappStore.saveContact(conv.contact);
          executionLogs.push(`Added CRM tag "${tag}" to contact`);
        }
      }

      // Next default edge
      const defaultEdge = flow.edges.find((e) => e.source === currentNode?.id);
      currentNode = defaultEdge ? flow.nodes.find((n) => n.id === defaultEdge.target) : undefined;
    }

    executionLogs.push(`Flow execution completed successfully (${iterations} steps).`);
    return { log: executionLogs };
  }
}
