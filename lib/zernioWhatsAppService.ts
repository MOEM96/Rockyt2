import { Zernio } from '@zernio/node';

export class ZernioWhatsAppService {
  private static zernioClient: Zernio | null = null;

  private static getClient(): Zernio {
    if (!this.zernioClient) {
      const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY || 'dummy_dev_key';
      this.zernioClient = new Zernio({ apiKey });
    }
    return this.zernioClient;
  }

  /**
   * List inbox conversations for a given tenant profile
   */
  public static async listConversations(profileId?: string, limit: number = 50) {
    const client = this.getClient();
    try {
      if (client.messages?.listInboxConversations) {
        return await client.messages.listInboxConversations({
          query: {
            profileId,
            status: 'active',
            limit,
          },
        });
      }
    } catch (err: any) {
      console.warn('[Zernio SDK listConversations Notice]:', err.message);
    }
    return null;
  }

  /**
   * Send WhatsApp message to a conversation
   */
  public static async sendInboxMessage(conversationId: string, text?: string, mediaUrl?: string) {
    const client = this.getClient();
    try {
      if (client.messages?.sendInboxMessage) {
        return await client.messages.sendInboxMessage({
          path: { conversationId },
          body: { text: text || '', mediaUrl },
        });
      }
    } catch (err: any) {
      console.warn('[Zernio SDK sendInboxMessage Notice]:', err.message);
    }
    return null;
  }

  /**
   * Send typing indicator to WhatsApp thread
   */
  public static async sendTypingIndicator(conversationId: string) {
    const client = this.getClient();
    try {
      if ((client.messages as any)?.sendTypingIndicator) {
        return await (client.messages as any).sendTypingIndicator({
          path: { conversationId },
        });
      }
    } catch (err: any) {
      // Quietly ignore typing indicator errors
    }
    return null;
  }

  /**
   * Mark conversation as read
   */
  public static async markConversationRead(conversationId: string) {
    const client = this.getClient();
    try {
      if ((client.messages as any)?.markConversationRead) {
        return await (client.messages as any).markConversationRead({
          path: { conversationId },
        });
      }
    } catch (err: any) {
      // Quietly ignore
    }
    return null;
  }
}
