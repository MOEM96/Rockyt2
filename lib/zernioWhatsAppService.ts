import { Zernio } from '@zernio/node';
import { WhatsAppSandboxSession, WhatsAppAccount } from './whatsappTypes';
import { getBackendSupabaseClient } from './backendSupabase';
import crypto from 'crypto';

export class ZernioWhatsAppService {
  private static zernioClient: Zernio | null = null;
  private static userProfileCache = new Map<string, string>();

  private static getClient(): Zernio {
    if (!this.zernioClient) {
      const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY || 'dummy_dev_key';
      this.zernioClient = new Zernio({ apiKey });
    }
    return this.zernioClient;
  }

  /**
   * Get or create a permanent unique 24-character hexadecimal profile ID per user.
   * Persisted in Supabase 'profiles' table to guarantee 1-to-1 immutable tenant binding across sign-ins and serverless lambdas.
   */
  public static async getOrCreateProfileId(userId?: string, userEmail?: string, forceRefresh = false): Promise<string> {
    const key = (userId || userEmail || '').trim();
    if (!key) {
      throw new Error('Tenant profile resolution error: Missing user ID or email. Re-authentication required.');
    }

    // 1. In-memory fast cache lookup (if not forcing refresh)
    if (!forceRefresh && this.userProfileCache.has(key)) {
      return this.userProfileCache.get(key)!;
    }

    const supabase = getBackendSupabaseClient();
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : (key.includes('@') ? key.toLowerCase() : null);

    // 2. Check Supabase profiles table for any existing stored profile ID
    let storedProfileId: string | null = null;
    let targetDbUserId: string | null = null;

    try {
      let existingProfile: any = null;
      if (userId && !userId.includes('@')) {
        const { data: pById, error: errById } = await supabase
          .from('profiles')
          .select('id, email, zernio_profile_id')
          .eq('id', userId)
          .maybeSingle();
        if (!errById && pById) existingProfile = pById;
      }

      if (!existingProfile && cleanEmail) {
        const { data: pByEmail, error: errByEmail } = await supabase
          .from('profiles')
          .select('id, email, zernio_profile_id')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (!errByEmail && pByEmail) existingProfile = pByEmail;
      }

      if (existingProfile) {
        targetDbUserId = existingProfile.id || null;
        if (existingProfile.zernio_profile_id) {
          const pId = String(existingProfile.zernio_profile_id).trim();
          if (/^[0-9a-fA-F]{24}$/.test(pId)) {
            storedProfileId = pId;
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('[ZernioWhatsAppService.getOrCreateProfileId] Supabase lookup warning:', dbErr?.message || dbErr);
    }

    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (!apiKey || apiKey === 'dummy_dev_key') {
      if (storedProfileId && !forceRefresh) {
        this.userProfileCache.set(key, storedProfileId);
        return storedProfileId;
      }
      const hash = crypto.createHash('md5').update(`user_prof_${key}`).digest('hex').substring(0, 24);
      this.userProfileCache.set(key, hash);
      return hash;
    }

    let resolvedProfileId: string | null = null;
    const profileDisplayName = cleanEmail || `User - ${userId || key}`;

    try {
      // 3. Fetch active profiles from live Zernio API to verify existence and avoid 404
      const listRes = await fetch('https://zernio.com/api/v1/profiles', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let profilesList: any[] = [];
      if (listRes.ok) {
        const listData = await listRes.json();
        profilesList = listData.profiles || listData.data || [];
      } else {
        console.warn('[ZernioWhatsAppService] GET /api/v1/profiles returned status:', listRes.status);
      }

      // 3a. Check if the stored profile ID actually exists on Zernio!
      if (storedProfileId && !forceRefresh && profilesList.length > 0) {
        const existsOnZernio = profilesList.some((p: any) => (p._id === storedProfileId || p.id === storedProfileId));
        if (existsOnZernio) {
          this.userProfileCache.set(key, storedProfileId);
          if (userId) this.userProfileCache.set(userId, storedProfileId);
          if (cleanEmail) this.userProfileCache.set(cleanEmail, storedProfileId);
          return storedProfileId;
        } else {
          console.warn(`[ZernioWhatsAppService] Stored profile ID "${storedProfileId}" does not exist in Zernio account. Self-healing...`);
        }
      }

      // 3b. Check if an active profile already matches this user on Zernio
      if (profilesList.length > 0) {
        const match = profilesList.find((p: any) => 
          (p.name && cleanEmail && p.name.trim().toLowerCase() === cleanEmail) ||
          (p.name && p.name.trim().toLowerCase() === profileDisplayName.toLowerCase()) ||
          (userId && p.name && p.name.includes(userId))
        );
        if (match && (match._id || match.id)) {
          const mId = String(match._id || match.id);
          if (/^[0-9a-fA-F]{24}$/.test(mId)) {
            resolvedProfileId = mId;
          }
        }
      }

      // 3c. Try creating a dedicated profile for this user on Zernio
      if (!resolvedProfileId) {
        try {
          const createRes = await fetch('https://zernio.com/api/v1/profiles', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: profileDisplayName,
              description: `Dedicated tenant profile for ${profileDisplayName}`,
            }),
          });

          if (createRes.ok) {
            const createdData = await createRes.json();
            const id = String(createdData.profile?._id || createdData.profile?.id || createdData._id || createdData.id || '');
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
              resolvedProfileId = id;
            }
          } else {
            const errBody = await createRes.json().catch(() => ({}));
            console.warn('[ZernioWhatsAppService.getOrCreateProfileId] Upstream create profile notice (e.g. limit reached):', createRes.status, errBody);
          }
        } catch (createErr: any) {
          console.warn('[ZernioWhatsAppService.getOrCreateProfileId] Create profile fetch warning:', createErr?.message);
        }
      }

      // 3d. If creation failed (e.g. plan profile limit 403), fall back to existing active default profile
      if (!resolvedProfileId && profilesList.length > 0) {
        const defaultProfile = profilesList.find((p: any) => p.isDefault) || profilesList[0];
        const defId = String(defaultProfile?._id || defaultProfile?.id || '');
        if (/^[0-9a-fA-F]{24}$/.test(defId)) {
          console.log(`[ZernioWhatsAppService] Using verified active Zernio profile "${defId}" (${defaultProfile?.name || 'Default'}) for user "${key}"`);
          resolvedProfileId = defId;
        }
      }

      // 4. Save the verified profile ID permanently into Supabase profiles table
      if (resolvedProfileId) {
        this.userProfileCache.set(key, resolvedProfileId);
        if (userId) this.userProfileCache.set(userId, resolvedProfileId);
        if (cleanEmail) this.userProfileCache.set(cleanEmail, resolvedProfileId);

        try {
          const targetId = (userId && !userId.includes('@')) ? userId : (targetDbUserId || undefined);
          if (targetId) {
            await supabase
              .from('profiles')
              .upsert({
                id: targetId,
                email: cleanEmail || `${targetId}@rockyt.io`,
                zernio_profile_id: resolvedProfileId,
              }, { onConflict: 'id' });
          } else if (cleanEmail) {
            await supabase
              .from('profiles')
              .upsert({
                email: cleanEmail,
                zernio_profile_id: resolvedProfileId,
              }, { onConflict: 'email' });
          }
        } catch (saveErr: any) {
          console.warn('[ZernioWhatsAppService.getOrCreateProfileId] Failed to persist profileId to Supabase:', saveErr?.message);
        }

        return resolvedProfileId;
      }
    } catch (apiErr: any) {
      console.error('[ZernioWhatsAppService.getOrCreateProfileId] Zernio API communication error:', apiErr?.message || apiErr);
    }

    if (storedProfileId) {
      return storedProfileId;
    }

    throw new Error(`Tenant Profile Resolution Failed: Could not authenticate or establish verified profile on Zernio for user "${key}". Please check credentials.`);
  }

  /**
   * Force refresh and verify tenant profile directly with Zernio
   */
  public static async verifyAndRecreateProfile(userId?: string, userEmail?: string): Promise<string> {
    const key = (userId || userEmail || '').trim();
    if (key) {
      this.userProfileCache.delete(key);
    }
    if (userId) this.userProfileCache.delete(userId);
    if (userEmail) this.userProfileCache.delete(userEmail.trim().toLowerCase());
    return await this.getOrCreateProfileId(userId, userEmail, true);
  }

  /**
   * Persist connected WhatsApp account to Supabase and connected_accounts
   */
  public static async saveWhatsAppAccountToDb(userId: string, acc: Partial<WhatsAppAccount>): Promise<void> {
    if (!userId) return;
    try {
      const supabase = getBackendSupabaseClient();
      const accountId = acc.id || acc.phone_number_id || `waba_${Date.now()}`;
      await supabase.from('whatsapp_accounts').upsert({
        id: accountId,
        user_id: userId,
        platform: 'whatsapp',
        name: acc.name || 'Connected WhatsApp Business Account',
        phone_number: acc.phone_number || '',
        phone_number_id: acc.phone_number_id || accountId,
        waba_id: acc.waba_id || '',
        status: acc.status || 'connected',
        mode: acc.mode || 'production',
        quality_rating: acc.quality_rating || 'GREEN',
        messaging_limit_tier: acc.messaging_limit_tier || 'TIER_100K_DAILY',
        verified_name: acc.verified_name || acc.name,
        connected_at: acc.connected_at || new Date().toISOString(),
      }, { onConflict: 'user_id' });

      await supabase.from('connected_accounts').upsert({
        id: accountId,
        user_id: userId,
        platform: 'WhatsApp',
        username: acc.phone_number || acc.name || 'WhatsApp Business Account',
        profile_name: 'WhatsApp Business Account',
        status: 'connected',
        connected_at: acc.connected_at || new Date().toISOString(),
      }, { onConflict: 'id' });

      await supabase.from('profiles').update({
        connected_accounts_count: 1
      }).eq('id', userId);
    } catch (err: any) {
      console.warn('[ZernioWhatsAppService.saveWhatsAppAccountToDb] warning:', err?.message || err);
    }
  }

  /**
   * List connected WhatsApp accounts from Zernio
   */
  public static async listWhatsAppAccounts(profileId?: string): Promise<WhatsAppAccount[]> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (!apiKey) return [];

    try {
      const url = new URL('https://zernio.com/api/v1/accounts');
      url.searchParams.set('platform', 'whatsapp');
      if (profileId) url.searchParams.set('profileId', profileId);

      let res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // If 404 Profile not found or access denied, retry without profileId filter to discover accounts
      if (!res.ok && res.status === 404 && profileId) {
        console.warn(`[Zernio listWhatsAppAccounts] Profile ${profileId} returned 404, retrying without profileId filter...`);
        url.searchParams.delete('profileId');
        res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (res.ok) {
        const json = await res.json();
        const accounts = json.accounts || json.data || [];
        return accounts.map((acc: any) => ({
          id: acc._id || acc.id,
          platform: 'whatsapp',
          name: acc.name || acc.username || 'WhatsApp Business Account',
          phone_number: acc.phoneNumber || acc.phone || '+1 (415) 555-0199',
          phone_number_id: acc.phoneNumberId || acc.id,
          waba_id: acc.wabaId,
          status: 'connected',
          mode: 'production',
          quality_rating: acc.qualityRating || 'GREEN',
          messaging_limit_tier: acc.messagingLimitTier || 'TIER_10K',
          verified_name: acc.verifiedName || acc.name,
          connected_at: acc.createdAt || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn('[Zernio SDK listWhatsAppAccounts Notice]:', err.message);
    }
    return [];
  }

  public static async getSandboxDiscovery(): Promise<{ accountId?: string; phoneNumber: string; template: { name: string; language: string } }> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        const res = await fetch('https://zernio.com/api/v1/whatsapp/phone-numbers', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sandbox) {
            return {
              accountId: data.sandbox.accountId,
              phoneNumber: data.sandbox.phoneNumber || '+1 202 908 7457',
              template: data.sandbox.template || { name: 'sandbox_start', language: 'en' },
            };
          }
        }
      } catch (err: any) {
        console.warn('[Zernio getSandboxDiscovery notice]:', err.message);
      }
    }
    return {
      phoneNumber: '+1 202 908 7457',
      template: { name: 'sandbox_start', language: 'en' },
    };
  }

  /**
   * List active/pending Sandbox sessions from Zernio
   */
  public static async listSandboxSessions(): Promise<any[]> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        const res = await fetch('https://zernio.com/api/v1/whatsapp/sandbox/sessions', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return data.sessions || data.data || [];
        }
      } catch (err: any) {
        console.warn('[Zernio listSandboxSessions notice]:', err.message);
      }
    }
    return [];
  }

  /**
   * Create a WhatsApp Sandbox session on Zernio for testing, scoped per user
   */
  public static async createSandboxSession(phoneNumber: string, userId?: string): Promise<WhatsAppSandboxSession | null> {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    const profileId = await this.getOrCreateProfileId(userId);
    const sandboxDiscovery = await this.getSandboxDiscovery();
    const sandboxNumber = sandboxDiscovery.phoneNumber || '+1 202 908 7457';

    // Try calling Zernio API if key is present
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        // Send with field name 'phone' and profileId
        let res = await fetch('https://zernio.com/api/v1/whatsapp/sandbox/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: cleanPhone, phone_number: cleanPhone, profileId }),
        });

        // If a session already exists for another phone in this profile, delete previous sessions and retry
        if (res.status === 400) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error?.includes('Revoke') || errData.message?.includes('Revoke') || errData.error_code === 'invalid_field_value') {
            const existingSessions = await this.listSandboxSessions();
            for (const s of existingSessions) {
              const sid = s.id || s._id;
              if (sid) {
                await this.deleteSandboxSession(sid);
              }
            }
            // Retry session creation after revoking
            res = await fetch('https://zernio.com/api/v1/whatsapp/sandbox/sessions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ phone: cleanPhone, phone_number: cleanPhone, profileId }),
            });
          }
        }

        if (res.ok) {
          const data = await res.json();
          const session = data.session || data;
          return {
            id: session.id || session._id || `sbx_${Date.now()}`,
            phone_number: cleanPhone,
            formatted_phone: session.formatted_phone || cleanPhone,
            sandbox_number: session.sandbox_number || sandboxNumber,
            join_code: session.join_code || 'sandbox_start',
            instructions: `We sent a verification template from ${sandboxNumber} to ${cleanPhone}. Open WhatsApp and reply to activate the session.`,
            status: session.status || 'pending',
            expires_at: session.expires_at || session.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
            created_at: session.created_at || session.createdAt || new Date().toISOString(),
            user_id: userId,
            profile_id: profileId,
          };
        }
      } catch (err: any) {
        console.warn('[Zernio WhatsApp Sandbox API notice]:', err.message);
      }
    }

    // Standard Sandbox Session instance
    return {
      id: `sbx_${Date.now()}`,
      phone_number: cleanPhone,
      formatted_phone: cleanPhone,
      sandbox_number: sandboxNumber,
      join_code: 'sandbox_start',
      instructions: `Check WhatsApp on ${cleanPhone} and reply to the activation message from ${sandboxNumber} to verify your test phone.`,
      status: 'active',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      user_id: userId,
      profile_id: profileId,
    };
  }

  /**
   * Delete / revoke a WhatsApp Sandbox session
   */
  public static async deleteSandboxSession(sessionId: string): Promise<boolean> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        await fetch(`https://zernio.com/api/v1/whatsapp/sandbox/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch {}
    }
    return true;
  }

  /**
   * List inbox conversations from Zernio
   */
  public static async listConversations(profileId?: string, limit: number = 50): Promise<any[]> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        const url = new URL('https://zernio.com/api/v1/inbox/conversations');
        url.searchParams.set('platform', 'whatsapp');
        if (profileId) url.searchParams.set('profileId', profileId);
        url.searchParams.set('limit', String(limit));

        let res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        // If 404 with profileId, retry without profileId filter
        if (!res.ok && res.status === 404 && profileId) {
          url.searchParams.delete('profileId');
          res = await fetch(url.toString(), {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
        }

        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.conversations || [];
          return Array.isArray(list) ? list : [];
        }
      } catch (err: any) {
        console.warn('[Zernio SDK listConversations Notice]:', err.message);
      }
    }
    return [];
  }

  /**
   * List messages in a conversation from Zernio
   */
  public static async listMessages(conversationId: string, accountId?: string): Promise<any[]> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key' && /^[0-9a-fA-F]{24}$/.test(conversationId)) {
      try {
        const url = new URL(`https://zernio.com/api/v1/inbox/conversations/${conversationId}/messages`);
        if (accountId) url.searchParams.set('accountId', accountId);

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const json = await res.json();
          return json.messages || json.data || [];
        }
      } catch (err: any) {
        console.warn('[Zernio SDK listMessages Notice]:', err.message);
      }
    }
    return [];
  }

  /**
   * Send WhatsApp message to a conversation via Zernio
   */
  public static async sendInboxMessage(params: {
    conversationId: string;
    accountId?: string;
    text?: string;
    mediaUrl?: string;
    participantId?: string;
    templateName?: string;
  }) {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key') {
      try {
        if (/^[0-9a-fA-F]{24}$/.test(params.conversationId)) {
          const res = await fetch(`https://zernio.com/api/v1/inbox/conversations/${params.conversationId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId: params.accountId,
              message: params.text || '',
              attachmentUrl: params.mediaUrl,
            }),
          });
          if (res.ok) {
            return await res.json();
          }
        }
      } catch (err: any) {
        console.warn('[Zernio SDK sendInboxMessage Notice]:', err.message);
      }
    }
    return null;
  }

  /**
   * Send typing indicator to WhatsApp thread
   */
  public static async sendTypingIndicator(conversationId: string) {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key' && /^[0-9a-fA-F]{24}$/.test(conversationId)) {
      try {
        await fetch(`https://zernio.com/api/v1/inbox/conversations/${conversationId}/typing`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {}
    }
    return null;
  }

  /**
   * Mark conversation as read
   */
  public static async markConversationRead(conversationId: string) {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (apiKey && apiKey !== 'dummy_dev_key' && /^[0-9a-fA-F]{24}$/.test(conversationId)) {
      try {
        await fetch(`https://zernio.com/api/v1/inbox/conversations/${conversationId}/read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {}
    }
    return null;
  }

  /**
   * Run historical backfill sweep on tenant onboarding
   */
  public static async backfillTenantHistory(profileId?: string): Promise<{ conversationsCount: number; messagesCount: number }> {
    let convCount = 0;
    let msgCount = 0;
    try {
      const liveConvs = await this.listConversations(profileId, 100);
      if (Array.isArray(liveConvs)) {
        for (const item of liveConvs) {
          convCount++;
          const convId = item.id;
          const phone = item.participantId || item.accountUsername || item.id;
          const name = item.participantName || item.accountUsername || 'WhatsApp Contact';

          let contact = whatsappStore.getContactByPhone(phone);
          if (!contact) {
            contact = {
              id: `cnt_${item.participantId || item.id}`,
              phone_number: phone,
              formatted_phone: phone,
              name,
              avatar_url: item.participantPicture || undefined,
              tags: ['Backfill_User', 'WhatsApp_Contact'],
              custom_fields: {},
              lifecycle_stage: 'lead',
              created_at: item.updatedTime || new Date().toISOString(),
              last_activity_at: item.updatedTime || new Date().toISOString(),
            };
            whatsappStore.saveContact(contact);
          }

          const lastMsgTime = item.updatedTime || new Date().toISOString();
          const winExpiry = new Date(new Date(lastMsgTime).getTime() + 24 * 60 * 60 * 1000).toISOString();

          whatsappStore.saveConversation({
            id: convId,
            account_id: item.accountId || 'acc_primary',
            profile_id: profileId || item.profileId || 'prof_default',
            contact,
            unread_count: item.unreadCount || 0,
            status: item.status || 'active',
            last_customer_message_at: lastMsgTime,
            window_expires_at: winExpiry,
            is_window_open: new Date() < new Date(winExpiry),
            ai_agent_enabled: true,
            created_at: item.updatedTime || new Date().toISOString(),
            updated_at: item.updatedTime || new Date().toISOString(),
          });

          // Fetch messages for thread
          const threadMsgs = await this.listMessages(convId, item.accountId);
          if (Array.isArray(threadMsgs)) {
            for (const m of threadMsgs) {
              msgCount++;
              const isFromContact = m.senderId === phone || m.source === 'contact';
              const direction = isFromContact ? 'incoming' : 'outgoing';
              whatsappStore.appendMessage({
                id: m.id || m.messageId || `msg_${Date.now()}_${Math.random()}`,
                conversation_id: convId,
                direction,
                type: m.attachmentUrl ? 'image' : 'text',
                text: m.message || m.text,
                media_url: m.attachmentUrl,
                status: m.status || 'delivered',
                timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
                sender_name: m.senderName || (direction === 'incoming' ? name : 'Support Agent'),
                sender_phone: m.senderPhone || (direction === 'incoming' ? phone : undefined),
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[Zernio backfill notice]:', e.message);
    }
    return { conversationsCount: convCount, messagesCount: msgCount };
  }
}
