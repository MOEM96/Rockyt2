import { Zernio } from '@zernio/node';
import { WhatsAppSandboxSession, WhatsAppAccount } from './whatsappTypes';
import { whatsappStore } from './whatsappStore';
import { getBackendSupabaseClient } from './backendSupabase';
import crypto from 'crypto';

export class ZernioWhatsAppService {
  private static cachedAccountId?: string;

  public static setCachedAccountId(accountId: string) {
    if (accountId && accountId !== 'acc_primary') {
      this.cachedAccountId = accountId;
    }
  }

  public static async getDefaultAccountId(profileId?: string): Promise<string | undefined> {
    if (this.cachedAccountId && this.cachedAccountId !== 'acc_primary') {
      return this.cachedAccountId;
    }
    try {
      const accounts = await this.listWhatsAppAccounts(profileId);
      if (Array.isArray(accounts) && accounts.length > 0) {
        const valid = accounts.find(a => a.id && a.id !== 'acc_primary');
        if (valid && valid.id) {
          this.cachedAccountId = valid.id;
          return valid.id;
        }
      }
    } catch (err: any) {
      console.warn('[getDefaultAccountId warning]:', err.message);
    }
    return undefined;
  }

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

      // 3d. Strict Tenant Isolation: Never fall back to another user's or default profile!
      if (!resolvedProfileId) {
        // Re-fetch profiles in case creation succeeded or name exists
        try {
          const verifyRes = await fetch('https://zernio.com/api/v1/profiles', {
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          if (verifyRes.ok) {
            const vData = await verifyRes.json();
            const vList = vData.profiles || vData.data || [];
            const vMatch = vList.find((p: any) => 
              (cleanEmail && p.name && p.name.trim().toLowerCase() === cleanEmail) ||
              (p.name && p.name.trim().toLowerCase() === profileDisplayName.toLowerCase())
            );
            if (vMatch && (vMatch._id || vMatch.id)) {
              resolvedProfileId = String(vMatch._id || vMatch.id);
            }
          }
        } catch {}
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

      // Strict tenant isolation: If profile not found or empty, return [] — NEVER query unscoped accounts!
      if (!res.ok) {
        console.warn(`[Zernio listWhatsAppAccounts] Profile ${profileId} returned status ${res.status}. Scoped return empty.`);
        return [];
      }

      if (res.ok) {
        const json = await res.json();
        const accounts = json.accounts || json.data || [];
        return accounts.map((acc: any) => {
          const metadata = acc.metadata || {};
          const rawNameStatus = String(metadata.nameStatus || metadata.name_status || acc.name_status || '').toUpperCase();
          let nameReviewStatus: 'approved' | 'in_review' | 'declined' | 'not_reviewed' = 'not_reviewed';
          if (rawNameStatus.includes('APPROV')) nameReviewStatus = 'approved';
          else if (rawNameStatus.includes('PENDING') || rawNameStatus.includes('REVIEW')) nameReviewStatus = 'in_review';
          else if (rawNameStatus.includes('DECLIN') || rawNameStatus.includes('REJECT')) nameReviewStatus = 'declined';

          const rawBizStatus = String(metadata.businessVerificationStatus || metadata.business_verification_status || metadata.codeVerificationStatus || acc.business_verification_status || '').toUpperCase();
          let bizVerificationStatus: 'verified' | 'in_review' | 'not_verified' = 'not_verified';
          if (rawBizStatus.includes('VERIF') && !rawBizStatus.includes('NOT')) bizVerificationStatus = 'verified';
          else if (rawBizStatus.includes('PENDING') || rawBizStatus.includes('REVIEW')) bizVerificationStatus = 'in_review';

          const calling: 'On' | 'Off' = (metadata.calling === 'On' || metadata.calling === true || acc.calling === 'On') ? 'On' : 'Off';
          const type = metadata.type || metadata.connectionType || acc.type || 'Coexistence';

          const hexMatch = (acc._id || acc.id || '').match(/([a-f0-9]{6})/i);
          const shortId = hexMatch ? hexMatch[1].toLowerCase() : (acc._id || acc.id || 'eca6e8').substring(0, 6);

          return {
            id: acc._id || acc.id,
            platform: 'whatsapp',
            name: acc.name || acc.username || 'WhatsApp Business Account',
            phone_number: acc.display_phone_number || acc.phoneNumber || acc.phone || acc.username || acc.selectedPhoneNumber || '',
            phone_number_id: acc.phoneNumberId || acc.id,
            waba_id: acc.wabaId,
            status: (acc.isActive === false || acc.status === 'disconnected') ? 'disconnected' : 'connected',
            mode: 'production',
            quality_rating: acc.qualityRating || metadata.qualityRating || 'GREEN',
            messaging_limit_tier: acc.messagingLimitTier || metadata.messagingLimitTier || 'TIER_10K',
            verified_name: acc.verifiedName || metadata.verifiedName || acc.name,
            connected_at: acc.createdAt || new Date().toISOString(),
            short_account_id: shortId,
            type,
            name_review_status: nameReviewStatus,
            business_verification_status: bizVerificationStatus,
            calling,
          };
        });
      }
    } catch (err: any) {
      console.warn('[Zernio SDK listWhatsAppAccounts Notice]:', err.message);
    }
    return [];
  }

  /**
   * Disconnect and remove a connected WhatsApp account from Zernio API
   */
  public static async disconnectAccount(accountId: string, profileId?: string): Promise<{ success: boolean; message?: string }> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (!apiKey || !accountId) return { success: true };

    const cleanAccId = String(accountId).replace(/^acc_/, '').trim();
    if (!cleanAccId || cleanAccId === 'disconnect' || cleanAccId === 'acc_primary') {
      return { success: true };
    }

    try {
      const url = new URL(`https://zernio.com/api/v1/accounts/${encodeURIComponent(cleanAccId)}`);
      if (profileId) {
        url.searchParams.set('profileId', profileId);
      }

      console.log(`[ZernioWhatsAppService.disconnectAccount] Calling DELETE ${url.toString()}`);
      const res = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const resData = await res.json().catch(() => ({}));
      console.log(`[ZernioWhatsAppService.disconnectAccount] Response (${res.status}):`, resData);

      if (res.ok || res.status === 404) {
        return { success: true, message: resData.message || 'Account disconnected successfully from Zernio' };
      }

      // Try fallback without profileId query param if it failed
      if (profileId) {
        const fallbackRes = await fetch(`https://zernio.com/api/v1/accounts/${encodeURIComponent(cleanAccId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (fallbackRes.ok || fallbackRes.status === 404) {
          return { success: true };
        }
      }

      return { success: false, message: resData.error || resData.message || `Status ${res.status}` };
    } catch (err: any) {
      console.warn('[ZernioWhatsAppService.disconnectAccount] Notice:', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Real-time account health and verification status check directly from Zernio / Meta API
   */
  public static async getAccountHealth(accountId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    canStartConversations: boolean;
    issues: string[];
    recommendations: string[];
    tokenValid: boolean;
    paymentIssue: boolean;
    paymentErrorMessage?: string;
  }> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (!apiKey || !accountId || accountId === 'acc_primary') {
      return {
        status: 'warning',
        canStartConversations: false,
        issues: ['Account credentials or profile configuration pending.'],
        recommendations: ['Connect WhatsApp via Meta OAuth in dashboard.'],
        tokenValid: false,
        paymentIssue: false,
      };
    }

    try {
      const res = await fetch(`https://zernio.com/api/v1/accounts/${encodeURIComponent(accountId)}/health`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const issues: string[] = Array.isArray(data.issues) ? data.issues : [];
        const hasPayment = issues.some((i: string) => i.toLowerCase().includes('payment'));
        const paymentMsg = hasPayment 
          ? issues.find((i: string) => i.toLowerCase().includes('payment')) || 'There is an error with the payment method. This will prevent sending template messages until updated in Meta Business Suite.'
          : undefined;

        const canPost = Boolean(data.permissions?.canPost !== false && data.status !== 'error' && !hasPayment);

        return {
          status: data.status || (hasPayment ? 'error' : 'healthy'),
          canStartConversations: canPost,
          issues,
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          tokenValid: Boolean(data.tokenStatus?.valid !== false),
          paymentIssue: hasPayment,
          paymentErrorMessage: paymentMsg,
        };
      }
    } catch (err: any) {
      console.warn('[getAccountHealth warning]:', err.message);
    }

    return {
      status: 'healthy',
      canStartConversations: true,
      issues: [],
      recommendations: [],
      tokenValid: true,
      paymentIssue: false,
    };
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
    if (!apiKey || apiKey === 'dummy_dev_key') return [];

    const allConversations: any[] = [];
    const seenIds = new Set<string>();
    let nextCursor: string | undefined = undefined;
    let page = 0;
    const maxPages = 20; // Paginates through up to 1,000 conversations

    do {
      page++;
      try {
        const url = new URL('https://zernio.com/api/v1/inbox/conversations');
        if (profileId) url.searchParams.set('profileId', profileId);
        url.searchParams.set('limit', String(limit));
        if (nextCursor) {
          url.searchParams.set('cursor', nextCursor);
        }

        let res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        // Strict tenant isolation: If profile returns non-OK, stop pagination and return scoped conversations only!
        if (!res.ok) {
          console.warn(`[Zernio listConversations] Profile ${profileId} returned ${res.status}. Terminating.`);
          break;
        }

        if (!res.ok) {
          console.warn(`[Zernio listConversations] Page ${page} returned ${res.status}`);
          break;
        }

        const json = await res.json();
        const list = json.data || json.conversations || [];
        if (Array.isArray(list)) {
          for (const item of list) {
            const id = item.id || item._id;
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              const accId = item.account?.id || item.accountId || item.account_id;
              if (accId && accId !== 'acc_primary') {
                item.accountId = accId;
                ZernioWhatsAppService.setCachedAccountId(accId);
              }
              // Preserve via phone number from account or item
              item.via_phone_number = item.accountUsername || item.selectedPhoneNumber || item.account?.username || '+971 50 310 2740';
              allConversations.push(item);
            }
          }
        }

        nextCursor = json.pagination?.nextCursor || json.nextCursor || undefined;
      } catch (err: any) {
        console.warn(`[Zernio SDK listConversations error on page ${page}]:`, err.message);
        break;
      }
    } while (nextCursor && page < maxPages);

    return allConversations;
  }

  /**
   * List messages in a conversation from Zernio
   */
  public static async listMessages(conversationId: string, accountId?: string): Promise<any[]> {
    const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
    if (!apiKey || apiKey === 'dummy_dev_key' || !conversationId) return [];

    let effectiveAccountId = (accountId && accountId !== 'acc_primary') ? accountId : undefined;
    if (!effectiveAccountId) {
      effectiveAccountId = await this.getDefaultAccountId();
    }

    // CRITICAL: Zernio's /v1/inbox/conversations/{id}/messages endpoint strictly REQUIRES accountId query parameter!
    // If no valid accountId is available, DO NOT call Zernio API to avoid repeating 400 Bad Request error.
    if (!effectiveAccountId) {
      console.warn(`[Zernio listMessages]: accountId query parameter is required by Zernio, but none could be resolved for conversation ${conversationId}. Skipping remote API fetch.`);
      return [];
    }

    const allMessages: any[] = [];
    const seenMsgIds = new Set<string>();
    let nextCursor: string | undefined = undefined;
    let page = 0;
    const maxPages = 10; // Up to 500 messages per thread

    do {
      page++;
      try {
        const url = new URL(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`);
        url.searchParams.set('accountId', effectiveAccountId);
        url.searchParams.set('limit', '50');
        if (nextCursor) {
          url.searchParams.set('cursor', nextCursor);
        }

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.warn(`[Zernio listMessages]: ${res.status} for ${conversationId}:`, errText);
          break;
        }

        const json = await res.json();
        const list = json.messages || json.data || [];
        if (Array.isArray(list)) {
          for (const m of list) {
            const mid = m.id || m.messageId || m._id;
            if (mid && !seenMsgIds.has(mid)) {
              seenMsgIds.add(mid);
              allMessages.push(m);
            }
          }
        }

        nextCursor = json.pagination?.nextCursor || json.nextCursor || undefined;
      } catch (err: any) {
        console.warn(`[Zernio listMessages error for ${conversationId}]:`, err.message);
        break;
      }
    } while (nextCursor && page < maxPages);

    return allMessages;
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
    if (apiKey && apiKey !== 'dummy_dev_key' && params.conversationId) {
      try {
        let effectiveAccountId = (params.accountId && params.accountId !== 'acc_primary') ? params.accountId : undefined;
        if (!effectiveAccountId) {
          effectiveAccountId = await this.getDefaultAccountId();
        }

        const bodyPayload: any = {
          message: params.text || '',
          attachmentUrl: params.mediaUrl,
        };
        if (effectiveAccountId) {
          bodyPayload.accountId = effectiveAccountId;
        }

        const res = await fetch(`https://zernio.com/api/v1/inbox/conversations/${params.conversationId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });
        if (res.ok) {
          return await res.json();
        } else {
          const errText = await res.text().catch(() => '');
          console.warn(`[Zernio sendInboxMessage]: ${res.status}:`, errText);
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
    if (apiKey && apiKey !== 'dummy_dev_key' && conversationId) {
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
    if (apiKey && apiKey !== 'dummy_dev_key' && conversationId) {
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
          const name = item.participantName || (phone === '201018252128' ? 'Moamen' : (item.accountUsername || phone || 'WhatsApp Contact'));
          const viaPhone = item.via_phone_number || item.accountUsername || item.selectedPhoneNumber || item.account?.username || '+971 50 310 2740';

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
            via_phone_number: viaPhone,
            via_platform: "whatsapp",
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
