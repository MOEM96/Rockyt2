import { WhatsAppMessage, WhatsAppConversation, WhatsAppTemplate, MessageDirection } from './whatsappTypes';

/**
 * Parses and replaces placeholders {{1}}, {{name}}, etc. in a WhatsApp template text
 */
export function interpolateTemplateText(
  rawText: string,
  params?: Record<string, string> | Array<string>
): string {
  if (!rawText || !params) return rawText || '';
  let result = rawText;
  if (Array.isArray(params)) {
    params.forEach((val, idx) => {
      result = result.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), String(val));
    });
  } else if (typeof params === 'object') {
    for (const [key, val] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
    }
  }
  return result;
}

/**
 * Normalizes any raw message from Zernio API, Meta Webhooks, or internal DB
 * ensuring templates, buttons, interactive payloads, and media attachments
 * are fully unpacked into rich structures rather than generic "[Unsupported message]".
 */
export function normalizeWhatsAppMessage(
  m: any,
  conversation?: WhatsAppConversation,
  fallbackDirection?: MessageDirection,
  registeredTemplates?: WhatsAppTemplate[]
): WhatsAppMessage {
  if (!m) {
    return {
      id: `msg_${Date.now()}`,
      conversation_id: conversation?.id || '',
      direction: fallbackDirection || 'incoming',
      type: 'text',
      text: '',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };
  }

  // 1. Direction detection
  const contactPhone = conversation?.contact?.phone_number || '';
  const isFromContact = 
    (contactPhone && m.senderId === contactPhone) ||
    (contactPhone && m.senderPhone === contactPhone) ||
    m.source === 'contact' ||
    m.direction === 'incoming' ||
    m.fromMe === false;

  const direction: MessageDirection = m.direction
    ? (m.direction as MessageDirection)
    : isFromContact
    ? 'incoming'
    : (fallbackDirection || 'incoming');

  // 2. Attachments & Media extraction
  const rawAttachments = Array.isArray(m.attachments) ? m.attachments : [];
  const primaryAttachment = rawAttachments[0] || {};
  const templateAttachment = rawAttachments.find((a: any) => a?.type === 'template');
  const shareAttachment = rawAttachments.find((a: any) => a?.type === 'share');

  const mediaUrl =
    m.media_url ||
    m.mediaUrl ||
    m.attachmentUrl ||
    primaryAttachment.url ||
    m.image?.url ||
    m.video?.url ||
    m.audio?.url ||
    m.document?.url;

  let mediaType = m.media_type || primaryAttachment.type;
  if (!mediaType && mediaUrl) {
    if (/\.(jpg|jpeg|png|webp|gif)/i.test(mediaUrl) || m.type === 'image' || m.image) mediaType = 'image';
    else if (/\.(mp4|mov|avi|webm)/i.test(mediaUrl) || m.type === 'video' || m.video) mediaType = 'video';
    else if (/\.(mp3|ogg|wav|m4a|aac)/i.test(mediaUrl) || m.type === 'audio' || m.audio || m.voiceNote) mediaType = 'audio';
    else mediaType = 'document';
  }

  const filename = m.filename || m.attachmentName || primaryAttachment.filename || m.document?.filename;

  // 3. Interactive & Buttons extraction
  let interactiveData: WhatsAppMessage['interactive_data'] = m.interactive_data || undefined;
  const rawInteractive = m.interactive || m.metadata?.waInteractive || m.metadata?.interactive;
  const rawButtons = m.buttons || m.quickReplies || m.metadata?.buttons || rawInteractive?.action?.buttons;

  const selectedButtonTitle =
    m.interactive?.button_reply?.title ||
    m.interactive?.list_reply?.title ||
    m.button?.text ||
    m.metadata?.buttonTitle ||
    m.metadata?.selectedButtonTitle;

  const selectedButtonId =
    m.interactive?.button_reply?.id ||
    m.interactive?.list_reply?.id ||
    m.button?.payload ||
    m.metadata?.interactiveId ||
    m.metadata?.selectedButtonId;

  const headerText = rawInteractive?.header?.text || rawInteractive?.header;
  const bodyText = rawInteractive?.body?.text || rawInteractive?.body;
  const footerText = rawInteractive?.footer?.text || rawInteractive?.footer;

  const parsedButtons: Array<{
    id?: string;
    title: string;
    type?: string;
    url?: string;
    phone_number?: string;
    payload?: string;
  }> = [];

  if (Array.isArray(rawButtons)) {
    for (const b of rawButtons) {
      if (typeof b === 'string') {
        parsedButtons.push({ id: b, title: b });
      } else if (b && typeof b === 'object') {
        const bTitle = b.title || b.text || b.reply?.title || b.name || '';
        const bId = b.id || b.payload || b.reply?.id || bTitle;
        if (bTitle) {
          parsedButtons.push({
            id: bId,
            title: bTitle,
            type: b.type,
            url: b.url,
            phone_number: b.phone_number,
            payload: b.payload,
          });
        }
      }
    }
  }

  // 4. WhatsApp Flows extraction (Flow message & Flow completion response)
  const nfmReply = m.interactive?.nfm_reply || rawInteractive?.nfm_reply || m.metadata?.nfm_reply;
  const isFlowResponse = m.type === 'nfm_reply' || rawInteractive?.type === 'nfm_reply' || !!nfmReply;

  const rawFlowAction = rawInteractive?.action?.name === 'flow' ? rawInteractive?.action : undefined;
  const rawFlowParams = rawFlowAction?.parameters || m.flow || m.metadata?.flow;
  const isFlowPrompt = m.type === 'flow' || rawInteractive?.type === 'flow' || !!rawFlowAction || !!rawFlowParams;

  let flowData: WhatsAppMessage['flow_data'] = m.flow_data || undefined;

  if (isFlowResponse && nfmReply) {
    let parsedFields: Record<string, any> | undefined = undefined;
    let rawJsonStr = nfmReply.response_json || nfmReply.response || '';
    if (typeof rawJsonStr === 'string' && rawJsonStr.trim().startsWith('{')) {
      try {
        parsedFields = JSON.parse(rawJsonStr);
      } catch {}
    } else if (typeof rawJsonStr === 'object') {
      parsedFields = rawJsonStr;
      rawJsonStr = JSON.stringify(rawJsonStr);
    }

    flowData = {
      flow_id: nfmReply.flow_id || m.metadata?.flowId,
      flow_token: nfmReply.flow_token || m.metadata?.flowToken,
      flow_name: nfmReply.body || nfmReply.name || 'WhatsApp Flow Response',
      response_json: rawJsonStr,
      submitted_fields: parsedFields,
    };
  } else if (isFlowPrompt && rawFlowParams) {
    flowData = {
      flow_id: rawFlowParams.flow_id || rawFlowParams.id,
      flow_token: rawFlowParams.flow_token || rawFlowParams.token,
      flow_name: rawFlowParams.flow_name || rawFlowParams.name || headerText || 'Interactive Form',
      flow_cta: rawFlowParams.flow_cta || rawFlowAction?.button || 'Start Flow',
      flow_action: rawFlowParams.flow_action || 'navigate',
      screen: rawFlowParams.flow_action_payload?.screen || rawFlowParams.screen,
      data: rawFlowParams.flow_action_payload?.data || rawFlowParams.data,
    };
  }

  // 5. Template extraction & component resolution (including attachments[].payload from Sep 17 changelog)
  const tmplPayload = templateAttachment?.payload || {};
  const templateName =
    m.template_name ||
    m.templateName ||
    m.template?.name ||
    m.template?.elements?.[0]?.name ||
    tmplPayload.name ||
    tmplPayload.templateName ||
    tmplPayload.template_name ||
    m.metadata?.template?.name ||
    m.metadata?.templateName;

  const templateParams = m.template_params || m.templateParams || tmplPayload.params || m.metadata?.template?.params;
  let templateData = m.template_data || m.template || tmplPayload || m.metadata?.template;

  if (templateName && !templateData && registeredTemplates && Array.isArray(registeredTemplates)) {
    templateData = registeredTemplates.find(
      (t) => t.name.toLowerCase() === templateName.toLowerCase()
    );
  }

  // If template has buttons in payload (from Sep 17 changelog attachment payload), unpack them
  if (tmplPayload.buttons && Array.isArray(tmplPayload.buttons) && parsedButtons.length === 0) {
    for (const b of tmplPayload.buttons) {
      parsedButtons.push({
        id: b.id || b.title || b.text,
        title: b.title || b.text || 'Action',
        type: b.type,
        url: b.url,
        phone_number: b.phone_number,
      });
    }
  }

  if (!interactiveData && (rawInteractive || parsedButtons.length > 0 || selectedButtonTitle || isFlowPrompt)) {
    interactiveData = {
      header: typeof headerText === 'string' ? headerText : (tmplPayload.title || undefined),
      body: typeof bodyText === 'string' ? bodyText : (tmplPayload.body || undefined),
      footer: typeof footerText === 'string' ? footerText : (tmplPayload.footer || undefined),
      buttons: parsedButtons.length > 0 ? parsedButtons : undefined,
      selected_button_id: selectedButtonId,
      selected_button_title: selectedButtonTitle,
    };
  }

  // 6. Intelligent Text & Type resolution
  let rawText = m.message || m.text || m.body || m.caption || m.metadata?.messagePreview || '';

  let resolvedText = rawText;
  let finalType: WhatsAppMessage['type'] = m.type || 'text';

  if (isFlowResponse) {
    finalType = 'flow_response';
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      const keys = flowData?.submitted_fields ? Object.keys(flowData.submitted_fields) : [];
      resolvedText = keys.length > 0
        ? `Flow Response: ${keys.slice(0, 3).map(k => `${k}=${flowData!.submitted_fields![k]}`).join(', ')}`
        : 'WhatsApp Flow Completed';
    }
  } else if (isFlowPrompt) {
    finalType = 'flow';
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      resolvedText = headerText || bodyText || `Flow: ${flowData?.flow_name || 'Interactive Flow'}`;
    }
  } else if (templateName || templateAttachment) {
    finalType = 'template';
    let tmplBody = tmplPayload.body || '';
    if (!tmplBody && templateData?.components && Array.isArray(templateData.components)) {
      const bodyComp = templateData.components.find(
        (c: any) => (c.type || '').toUpperCase() === 'BODY'
      );
      if (bodyComp?.text) {
        tmplBody = interpolateTemplateText(bodyComp.text, templateParams);
      }
    }
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      resolvedText = tmplBody || tmplPayload.title || `[Template: ${templateName || 'Message'}]`;
    }
  } else if (shareAttachment) {
    finalType = 'share';
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      resolvedText = shareAttachment.title || shareAttachment.url || 'Shared Content';
    }
  } else if (selectedButtonTitle) {
    finalType = 'button_reply';
    resolvedText = selectedButtonTitle;
  } else if (interactiveData?.buttons && interactiveData.buttons.length > 0) {
    finalType = 'interactive';
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      resolvedText = interactiveData.body || interactiveData.header || 'Please select an option below:';
    }
  } else if (mediaUrl) {
    finalType = (mediaType as any) || 'image';
    if (!resolvedText || resolvedText === '[Unsupported message]') {
      if (finalType === 'image') resolvedText = 'Photo';
      else if (finalType === 'video') resolvedText = 'Video';
      else if (finalType === 'audio') resolvedText = 'Voice note';
      else resolvedText = filename ? `Document: ${filename}` : 'Document attachment';
    }
  } else if (m.location) {
    finalType = 'location';
    resolvedText = m.location.name || m.location.address || 'Shared location';
  } else if (!resolvedText || resolvedText === '[Unsupported message]') {
    if (m.interactive || m.metadata?.waInteractive || m.metadata?.interactiveType) {
      finalType = 'interactive';
      resolvedText = interactiveData?.body || 'WhatsApp Interactive Message';
    } else {
      resolvedText = direction === 'incoming' ? 'WhatsApp interaction' : 'Message';
    }
  }

  return {
    id: m.id || m.messageId || m._id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversation_id: conversation?.id || m.conversation_id || m.conversationId || '',
    direction,
    type: finalType,
    text: resolvedText,
    media_url: mediaUrl,
    media_type: mediaType,
    filename,
    template_name: templateName,
    template_params: templateParams,
    template_data: templateData,
    flow_data: flowData,
    interactive_data: interactiveData,
    attachments:
      rawAttachments.length > 0
        ? rawAttachments
        : mediaUrl
        ? [{ type: mediaType, url: mediaUrl, filename }]
        : undefined,
    status: m.status || m.deliveryStatus || (direction === 'outgoing' ? 'sent' : 'delivered'),
    timestamp: m.createdAt || m.timestamp || m.sentAt || new Date().toISOString(),
    sender_name:
      m.sender_name ||
      m.senderName ||
      (direction === 'incoming' ? conversation?.contact?.name || 'Customer' : 'Support Agent'),
    sender_phone:
      m.sender_phone ||
      m.senderPhone ||
      (direction === 'incoming' ? conversation?.contact?.phone_number : undefined),
    metadata: m.metadata,
  };
}

/**
 * Returns a human-friendly preview string for the sidebar conversation item
 */
export function getMessagePreviewText(
  msg?: WhatsAppMessage | any,
  fallbackText?: string,
  templateName?: string
): string {
  if (!msg) {
    if (templateName) return `📋 Template: ${templateName}`;
    if (!fallbackText || fallbackText === '[Unsupported message]') return '💬 WhatsApp interaction';
    return fallbackText;
  }

  const tmpl = msg.template_name || templateName;
  if (tmpl) return `📋 Template: ${tmpl}`;

  if (msg.type === 'flow') {
    return `⚡ Flow: ${msg.flow_data?.flow_name || 'Interactive Flow'}`;
  }
  if (msg.type === 'flow_response') {
    const fieldCount = msg.flow_data?.submitted_fields ? Object.keys(msg.flow_data.submitted_fields).length : 0;
    return `📝 Form response (${fieldCount} answer${fieldCount === 1 ? '' : 's'})`;
  }
  if (msg.type === 'share') {
    return `🔗 Shared content`;
  }

  if (msg.type === 'image' || msg.media_type === 'image') {
    const caption = msg.text && msg.text !== 'Photo' && msg.text !== '[Unsupported message]' ? `: ${msg.text}` : '';
    return `📷 Photo${caption}`;
  }
  if (msg.type === 'video' || msg.media_type === 'video') return '🎥 Video';
  if (msg.type === 'audio' || msg.media_type === 'audio') return '🎤 Voice note';
  if (msg.type === 'document' || msg.media_type === 'document') {
    return `📄 ${msg.filename || 'Document'}`;
  }
  if (msg.interactive_data?.selected_button_title) {
    return `🔘 ${msg.interactive_data.selected_button_title}`;
  }
  if (msg.type === 'button_reply') {
    return `🔘 ${msg.text || 'Button reply'}`;
  }
  if (msg.interactive_data?.buttons && msg.interactive_data.buttons.length > 0) {
    return `🔘 ${msg.interactive_data.body || msg.interactive_data.buttons[0].title || 'Interactive prompt'}`;
  }
  if (msg.type === 'location') return '📍 Location';

  const text = msg.text || fallbackText;
  if (!text || text === '[Unsupported message]') {
    return '💬 WhatsApp interaction';
  }
  return text;
}
