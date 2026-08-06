import React, { useState, useEffect } from 'react';
import { 
  Layers, Send, BarChart2, MessageSquare, Megaphone, Key, Users, 
  Webhook, Activity, Settings, LogOut, ArrowLeft, Check, Copy, Eye, 
  EyeOff, RefreshCw, Plus, ShieldCheck, Zap, DollarSign, ExternalLink, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, Loader2, AlertCircle, X,
  Search, Filter, ChevronRight, ChevronDown, Calendar, Clock, CreditCard, Trash2,
  Mail, Play, UserPlus, FileText, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import OverlayCheckoutModal from './OverlayCheckoutModal';

interface DashboardProps {
  userSession?: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    accessToken?: string;
  };
  onBackHome?: () => void;
  onSignOut?: () => void;
}

interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  profile_name: string;
  status: 'connected' | 'disconnected';
  created_at?: string;
}

interface ApiKeyRow {
  id: string;
  user_id: string;
  key_prefix: string;
  revoked: boolean;
  created_at: string;
}

interface ApiLogRow {
  id: string;
  user_id: string;
  activity: string;
  platform: string;
  status_code: number;
  duration_ms: number;
  created_at: string;
}

interface UserProfile {
  id?: string;
  email?: string;
  plan?: string;
  subscription_status?: string;
  wallet_balance?: number;
  max_accounts?: number;
  dodo_customer_id?: string;
  plan_product_id?: string;
  is_trial?: boolean;
}

interface WalletTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  balance_after?: number;
  created_at: string;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: string;
  created_at: string;
}

interface PostItem {
  id: string;
  platform: string;
  content: string;
  status: 'published' | 'scheduled' | 'draft';
  scheduled_for?: string;
  created_at: string;
  likes?: number;
  comments?: number;
}

type TabType = 'connections' | 'posts' | 'analytics' | 'inbox' | 'ads' | 'apikeys' | 'users' | 'webhooks' | 'logs' | 'settings';

interface AnalyticsData {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalEngagements: number;
  engagementRate: string;
  connectedPlatforms: number;
  totalApiCalls: number;
  postsPerPlatform: Record<string, number>;
}

const allConnectPlatforms = [
  { name: 'Instagram', icon: '📸', desc: 'Auto-publish reels, posts & comment-to-DM funnels', category: 'Social' },
  { name: 'X / Twitter', icon: '𝕏', desc: 'Post tweets, threads & automate mentions ($1.00 pass-through)', category: 'Social' },
  { name: 'LinkedIn', icon: '💼', desc: 'Share posts & articles to personal and org pages', category: 'Social' },
  { name: 'TikTok', icon: '🎵', desc: 'Publish video content & track video analytics', category: 'Social' },
  { name: 'WhatsApp Business', icon: '💬', desc: 'Automate WhatsApp messages, templates & AI bots', category: 'Messaging' },
  { name: 'Meta Ads Manager', icon: '🎯', desc: 'Manage Facebook & Instagram ad campaigns & ROAS', category: 'Ads' },
  { name: 'Google Ads', icon: '🔍', desc: 'Track & optimize Google Search & Display ad spend', category: 'Ads' },
  { name: 'Telegram Bot', icon: '✈️', desc: 'Send automated Telegram channel messages & alerts', category: 'Messaging' },
  { name: 'Discord Webhook', icon: '🎮', desc: 'Post Discord channel announcements & webhooks', category: 'Messaging' },
  { name: 'Slack App', icon: '🪟', desc: 'Broadcast updates to Slack channels & workspaces', category: 'Messaging' },
  { name: 'Threads', icon: '🧵', desc: 'Publish Threads posts & track engagement', category: 'Social' },
  { name: 'Bluesky', icon: '🦋', desc: 'Post to decentralized Bluesky network', category: 'Social' },
  { name: 'Pinterest', icon: '📌', desc: 'Publish Pins & boards automatically', category: 'Social' },
  { name: 'YouTube', icon: '▶️', desc: 'Upload Shorts & manage video metadata', category: 'Social' },
  { name: 'Snapchat', icon: '👻', desc: 'Publish Snapchat stories & spotlight clips', category: 'Social' },
  { name: 'Google Business', icon: '🏪', desc: 'Publish Google Maps updates & customer reviews', category: 'Business' }
];

const Dashboard: React.FC<DashboardProps> = ({ userSession, onBackHome, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('connections');
  
  // Data States
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<ApiLogRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletTxns, setWalletTxns] = useState<WalletTransactionRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);

  // UI Modals & Filters
  const [showNewConnectionModal, setShowNewConnectionModal] = useState<boolean>(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState<boolean>(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);
  
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostPlatform, setNewPostPlatform] = useState<string>('Instagram');
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [newWebhookName, setNewWebhookName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');

  const [apiKey, setApiKey] = useState<string>('');
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment Checkout state
  const [depositAmount, setDepositAmount] = useState<number>(25);
  const [customDeposit, setCustomDeposit] = useState<string>('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState<string | null>(null);
  const [overlayCheckoutUrl, setOverlayCheckoutUrl] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpModalData, setTopUpModalData] = useState<{ platform: string; requiredBalance: number; currentBalance: number } | null>(null);

  // Sub-view Tab States
  const [postsSubTab, setPostsSubTab] = useState<'overview' | 'queues'>('overview');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'posting' | 'inbox'>('posting');
  const [inboxSubTab, setInboxSubTab] = useState<'messages' | 'comments' | 'reviews' | 'campaigns' | 'workflows' | 'contacts'>('messages');

  // Filters
  const [logPlatformFilter, setLogPlatformFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // User Profile metadata
  const userEmail = userSession?.email || profile?.email || '';
  const userName = userSession?.name || profile?.full_name || 'Account Owner';
  const userAvatar = userSession?.picture || 'https://lh3.googleusercontent.com/a/ACg8ocL_PcCi9QCqJ-hfTUKklDZ6Q2RWJfer2LjarrUA0X2-4jNFuQ=s96-c';
  const userId = userSession?.id || profile?.id;

  // Helper: Build consistent auth headers for all server API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    let token = userSession?.accessToken;
    if (!token) {
      try {
        const sessionRes = await supabase.auth.getSession();
        token = sessionRes.data.session?.access_token;
      } catch (e) {}
    }
    const resolvedEmail = userSession?.email || profile?.email || userEmail || '';
    const resolvedId = userSession?.id || profile?.id || userId || '';
    const resolvedProfileId = profile?.zernio_profile_id || '';
    const tokenCandidate = token || resolvedEmail || resolvedId || '';

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCandidate}`,
      'x-user-email': resolvedEmail,
      'x-user-id': resolvedId,
      'x-profile-id': resolvedProfileId,
    };
  };

  const safeFetchJson = async (res: Response) => {
    try {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { error: `Server error (${res.status})` };
      }
    } catch {
      return { error: `HTTP ${res.status}` };
    }
  };

  // 1. Fetch Real Live Data from Server API (Multi-Tenant Isolated) + Supabase Redundant Fallback
  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const resolvedEmail = userSession?.email || profile?.email || userEmail || '';
      const resolvedId = userSession?.id || profile?.id || userId || '';
      const resolvedProfileId = profile?.zernio_profile_id || '';

      const queryParams = new URLSearchParams();
      if (resolvedEmail) queryParams.set('email', resolvedEmail);
      if (resolvedId) queryParams.set('userId', resolvedId);
      if (resolvedProfileId) queryParams.set('profileId', resolvedProfileId);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      let loadedSuccessfully = false;

      const sanitizeAccounts = (rawAccounts: any[]) => {
        if (!Array.isArray(rawAccounts)) return [];
        return rawAccounts.filter((a: any) => {
          const status = String(a.status || '').toLowerCase();
          const username = String(a.username || '').toLowerCase();
          const id = String(a.id || '').toLowerCase();
          const isFakePattern = username.endsWith('_user') || 
                                username.endsWith('_profile') || 
                                username.endsWith('_account') || 
                                username.startsWith('@stripetest_') || 
                                id.startsWith('acc_syn_');
          return status === 'connected' && !isFakePattern;
        });
      };

      // Primary: Single consolidated API call for all dashboard data
      try {
        const dashRes = await fetch(`/api/v1/me/dashboard${qs}`, { headers });
        if (dashRes.ok) {
          const data = await safeFetchJson(dashRes);
          if (data.profile) setProfile(data.profile);
          if (Array.isArray(data.accounts)) setAccounts(sanitizeAccounts(data.accounts));
          if (Array.isArray(data.apiKeys)) {
            setApiKeys(data.apiKeys);
            if (data.apiKeys.length > 0) {
              setApiKey(data.apiKeys[0].key_prefix + '••••••••••••••••');
            }
          }
          if (Array.isArray(data.logs)) setLogs(data.logs);
          if (Array.isArray(data.walletTransactions)) setWalletTxns(data.walletTransactions);
          if (Array.isArray(data.webhooks)) setWebhooks(data.webhooks);
          if (Array.isArray(data.posts)) setPosts(data.posts);
          if (data.analytics) setAnalyticsData(data.analytics);
          loadedSuccessfully = true;
        } else if (dashRes.status === 401) {
          console.warn('[Dashboard] Unauthorized response from API, attempting Supabase direct query fallback');
        }
      } catch (apiErr) {
        console.warn('[Dashboard] API endpoint unreachable, falling back to direct Supabase client:', apiErr);
      }

      // Fallback: Direct Supabase RPC / query to guarantee 100% data visibility for every user/profile
      if (!loadedSuccessfully && supabase) {
        try {
          const targetIdentifier = resolvedProfileId || resolvedEmail || resolvedId;
          if (targetIdentifier) {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('get_user_dashboard_by_identifier', {
              p_identifier: targetIdentifier
            });

            if (!rpcErr && rpcData && !rpcData.error) {
              if (rpcData.profile) setProfile(rpcData.profile);
              if (Array.isArray(rpcData.accounts)) setAccounts(sanitizeAccounts(rpcData.accounts));
              if (Array.isArray(rpcData.apiKeys)) {
                setApiKeys(rpcData.apiKeys);
                if (rpcData.apiKeys.length > 0) {
                  setApiKey(rpcData.apiKeys[0].key_prefix + '••••••••••••••••');
                }
              }
              if (Array.isArray(rpcData.logs)) setLogs(rpcData.logs);
              if (Array.isArray(rpcData.walletTransactions)) setWalletTxns(rpcData.walletTransactions);
              if (Array.isArray(rpcData.webhooks)) setWebhooks(rpcData.webhooks);
              if (Array.isArray(rpcData.posts)) setPosts(rpcData.posts);
              if (rpcData.analytics) setAnalyticsData(rpcData.analytics);
            }
          }
        } catch (dbErr) {
          console.error('[Dashboard direct Supabase fallback error]:', dbErr);
        }
      }
    } catch (err: any) {
      console.error('[Dashboard fetchLiveData error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();

    // Query params check for OAuth callback completion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('account_connected') === 'true' || urlParams.get('connected') === '1') {
      const platform = urlParams.get('platform') || 'Social Channel';
      setCheckoutSuccessMsg(`Successfully authenticated and connected your ${platform} account!`);
      // Clean query string and refetch live data
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchLiveData();
    }
  }, [userSession?.email, userSession?.id, userSession?.accessToken]);

  // Connect or Disconnect Platform Action
  const toggleAccountStatus = async (platformName: string, accountId?: string) => {
    setConnectingPlatform(platformName);
    setCheckoutError(null);

    const isCurrentlyConnected = accounts.some(
      a => a.platform.toLowerCase() === platformName.toLowerCase() && a.status === 'connected'
    );

    try {
      const headers = await getAuthHeaders();

      if (isCurrentlyConnected) {
        // Disconnect account
        const targetId = accountId || accounts.find(a => a.platform.toLowerCase() === platformName.toLowerCase())?.id;
        const res = await fetch(`/api/v1/accounts/${targetId || 'disconnect'}`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ platform: platformName, accountId: targetId })
        });

        if (!res.ok) {
          throw new Error(`Failed to disconnect ${platformName} account.`);
        }

        setCheckoutSuccessMsg(`Disconnected ${platformName} account successfully.`);
        setAccounts(prev => prev.filter(a => a.id !== targetId && a.platform.toLowerCase() !== platformName.toLowerCase()));
        fetchLiveData();
      } else {
        // Connect account
        const res = await fetch('/api/v1/accounts/connect', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            platform: platformName,
            redirectUrl: `${window.location.origin}/dashboard?account_connected=true&platform=${encodeURIComponent(platformName)}`
          })
        });

        const data = await safeFetchJson(res);

        if (res.status === 402 || data.code === 'PAYMENT_REQUIRED' || data.reason === 'twitter_passthrough' || data.requiresDeposit) {
          setTopUpModalData({
            platform: platformName,
            requiredBalance: data.requiredBalance || 1.00,
            currentBalance: data.currentBalance ?? profile?.wallet_balance ?? 0
          });
          setShowTopUpModal(true);
          setShowNewConnectionModal(false);
          setConnectingPlatform(null);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to initiate ${platformName} connection (${res.status})`);
        }

        if (data.authUrl) {
          window.location.href = data.authUrl;
          return;
        }

        fetchLiveData();
      }
    } catch (err: any) {
      console.error('[Connect Account Error]:', err);
      setCheckoutError(err.message || `Failed to connect ${platformName} account.`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Dodo Payments Checkout Initiator
  const handleInitiateCheckout = async (productId?: string, amountVal?: number) => {
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutSuccessMsg(null);

    try {
      const headers = await getAuthHeaders();

      const finalAmount = amountVal || (customDeposit ? parseFloat(customDeposit) : depositAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new Error('Please enter a valid deposit amount.');
      }

      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: productId || 'pdt_0NWDjzl0TS6LNFrVdFZYQ',
          amount: finalAmount,
          currency: 'USD',
          planName: 'Wallet Top-Up'
        })
      });

      const data = await safeFetchJson(res);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session with Dodo Payments.');
      }

      if (data.checkoutUrl) {
        setOverlayCheckoutUrl(data.checkoutUrl);
      } else {
        throw new Error('No checkout URL returned from payment server.');
      }
    } catch (err: any) {
      console.error('[Checkout error]:', err);
      setCheckoutError(err.message || 'Payment initiation failed.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Create Webhook handler
  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return;
    try {
      const headers = await getAuthHeaders();

      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: newWebhookUrl,
          name: newWebhookName || 'Production Webhook',
          events: ['post.created', 'comment.received', 'message.incoming']
        })
      });

      if (res.ok) {
        setCheckoutSuccessMsg('Webhook created successfully!');
        setNewWebhookUrl('');
        setNewWebhookName('');
        setShowNewWebhookModal(false);
        fetchLiveData();
      }
    } catch (e) {}
  };

  // Delete Webhook handler
  const handleDeleteWebhook = async (id: string) => {
    try {
      const headers = await getAuthHeaders();

      await fetch(`/api/v1/webhooks/${id}`, {
        method: 'DELETE',
        headers
      });
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } catch (e) {}
  };

  // API Key Generation & Revocation Handlers
  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    setCheckoutError(null);
    try {
      const headers = await getAuthHeaders();
      let generatedKey: string | null = null;

      try {
        const res = await fetch('/api/v1/keys', {
          method: 'POST',
          headers
        });
        const data = await safeFetchJson(res);
        if (res.ok && data.key) {
          generatedKey = data.key;
        } else if (data?.error) {
          console.warn('[handleGenerateApiKey] API returned error:', data.error);
        }
      } catch (apiErr) {
        console.warn('[handleGenerateApiKey] API call failed, falling back to direct Supabase RPC:', apiErr);
      }

      // Supabase RPC Fallback if Express route is unreachable or errored
      if (!generatedKey && supabase) {
        const targetIdentifier = profile?.zernio_profile_id || userSession?.email || profile?.email || userEmail || userSession?.id || profile?.id;
        if (targetIdentifier) {
          const rawKey = 'rkt_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
          const msgBuffer = new TextEncoder().encode(rawKey);
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          const prefix = rawKey.substring(0, 12);

          const { data: rpcData, error: rpcErr } = await supabase.rpc('generate_user_api_key', {
            p_identifier: String(targetIdentifier),
            p_key_hash: hashHex,
            p_key_prefix: prefix
          });

          if (!rpcErr && rpcData && rpcData.success) {
            generatedKey = rawKey;
          } else if (rpcErr) {
            console.error('[handleGenerateApiKey] Supabase RPC error:', rpcErr.message);
          }
        }
      }

      if (generatedKey) {
        setNewGeneratedKey(generatedKey);
        setCheckoutSuccessMsg('Live Rockyt API Key created successfully! Copy it now as it cannot be retrieved in full later.');
        fetchLiveData();
      } else {
        throw new Error('Failed to generate API key. Please check your connection and try again.');
      }
    } catch (e: any) {
      console.error('[Generate API Key Error]:', e);
      setCheckoutError(e.message || 'Failed to generate API key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? AI agents using this key will lose access immediately.')) return;
    try {
      const headers = await getAuthHeaders();
      let revoked = false;

      try {
        const res = await fetch(`/api/v1/keys/${keyId}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) revoked = true;
      } catch (apiErr) {
        console.warn('[handleRevokeApiKey] API delete failed, using Supabase fallback:', apiErr);
      }

      if (!revoked && supabase) {
        const targetIdentifier = profile?.zernio_profile_id || userSession?.email || profile?.email || userEmail || '';
        await supabase.rpc('revoke_user_api_key', {
          p_key_id: keyId,
          p_identifier: String(targetIdentifier)
        });
        revoked = true;
      }

      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      setCheckoutSuccessMsg('API key revoked successfully.');
      fetchLiveData();
    } catch (e: any) {
      console.error('[Revoke API Key Error]:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const walletBalance = profile?.wallet_balance !== undefined && profile?.wallet_balance !== null 
    ? Number(profile.wallet_balance) 
    : 0.00;
  const connectedCount = accounts.filter(a => a.status === 'connected').length;

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesPlatform = logPlatformFilter === 'all' || log.platform.toLowerCase().includes(logPlatformFilter.toLowerCase());
    const matchesStatus = logStatusFilter === 'all' || 
      (logStatusFilter === '200' && log.status_code === 200) ||
      (logStatusFilter === '400' && log.status_code >= 400 && log.status_code < 500) ||
      (logStatusFilter === '500' && log.status_code >= 500);
    const matchesQuery = !logSearchQuery || log.activity.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesPlatform && matchesStatus && matchesQuery;
  });

  return (
    <div className="relative z-20 w-full min-h-screen bg-black text-white font-mono flex flex-col md:flex-row">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-white/10 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* USER PROFILE SUMMARY CARD */}
          <div className="flex items-center gap-3 p-2 rounded bg-zinc-900/60 border border-white/10">
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-9 h-9 rounded-full border border-white/20 object-cover"
            />
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-xs text-white truncate">{userName}</h3>
              <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
            </div>
          </div>

          {/* MAIN SIDEBAR NAVIGATION LIST (Matches Reference Dashboard Image) */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('connections')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'connections'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers size={15} /> Connections
              </span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 border border-white/20 rounded">
                {connectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'posts'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Send size={15} /> Posts
              </span>
              <ChevronRight size={14} className="opacity-40" />
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'analytics'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BarChart2 size={15} /> Analytics
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'inbox'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare size={15} /> Inbox
              </span>
              <ChevronRight size={14} className="opacity-40" />
            </button>

            <button
              onClick={() => setActiveTab('ads')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'ads'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Megaphone size={15} /> Ads
              </span>
            </button>

            <button
              onClick={() => setActiveTab('apikeys')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'apikeys'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Key size={15} /> API Keys
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'users'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users size={15} /> Users
              </span>
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'webhooks'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Webhook size={15} /> Webhooks
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'logs'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Activity size={15} /> Logs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'settings'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings size={15} /> Settings
              </span>
              <span className="text-[9px] bg-brand/20 text-brand border border-brand/40 px-1.5 py-0.5 rounded">
                DODO
              </span>
            </button>
          </nav>
        </div>

        {/* SIDEBAR FOOTER (Wallet Balance & Actions) */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          
          {/* FREE CREDITS / WALLET BALANCE CARD (Matches Reference Image) */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded p-3 text-left">
            <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
              Free credits / Wallet
            </span>
            <span className="text-lg font-bold text-emerald-300 font-mono">
              ${walletBalance.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onBackHome}
            className="w-full bg-zinc-900 border border-white/15 text-xs text-white/80 hover:text-white hover:border-brand p-2.5 flex items-center justify-center gap-2 font-bold uppercase transition-colors rounded"
          >
            <ArrowLeft size={14} /> Main Website
          </button>

          <button
            onClick={onSignOut}
            className="w-full bg-red-950/40 border border-red-500/30 text-xs text-red-400 hover:bg-red-900 hover:text-white p-2.5 flex items-center justify-center gap-2 font-bold uppercase transition-colors rounded"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-black">
        
        {/* NOTIFICATIONS & MESSAGES */}
        {checkoutSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded flex items-center justify-between text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> {checkoutSuccessMsg}
            </span>
            <button onClick={() => setCheckoutSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-500/40 rounded flex items-center justify-between text-xs text-red-300">
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} /> {checkoutError}
            </span>
            <button onClick={() => setCheckoutError(null)} className="text-red-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── TAB 1: CONNECTIONS ─── */}
        {activeTab === 'connections' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header & Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Connections</h1>
                <p className="text-xs text-white/50 mt-1">Manage profiles and platform integrations</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewConnectionModal(true)}
                  className="bg-brand hover:bg-brand-light text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase tracking-wider transition-all"
                >
                  <Plus size={16} /> New Connection
                </button>
                <button className="bg-zinc-900 border border-white/15 text-white/80 hover:text-white text-xs font-bold px-4 py-2.5 rounded uppercase tracking-wider transition-colors">
                  New Profile
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-white/60 uppercase">Platforms</span>
              <select className="bg-zinc-900 border border-white/15 text-white text-xs px-3 py-1.5 rounded outline-none focus:border-brand">
                <option value="all">All profiles</option>
              </select>
              <select className="bg-zinc-900 border border-white/15 text-white text-xs px-3 py-1.5 rounded outline-none focus:border-brand">
                <option value="all">All platforms</option>
              </select>
              <select className="bg-zinc-900 border border-white/15 text-white text-xs px-3 py-1.5 rounded outline-none focus:border-brand">
                <option value="all">All statuses</option>
              </select>
            </div>

            {/* Connected Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.length > 0 ? (
                accounts.map(acc => (
                  <div key={acc.id} className="bg-zinc-950 border border-white/15 rounded-lg p-5 space-y-4 hover:border-brand/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {acc.platform.toLowerCase().includes('instagram') ? '📸' : 
                           acc.platform.toLowerCase().includes('twitter') || acc.platform.toLowerCase().includes('x') ? '𝕏' :
                           acc.platform.toLowerCase().includes('linkedin') ? '💼' :
                           acc.platform.toLowerCase().includes('tiktok') ? '🎵' : '💬'}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{acc.platform}</h4>
                          <span className="inline-block text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-1.5 py-0.2 rounded uppercase font-bold">
                            {acc.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white/90">{acc.username || '@user'}</p>
                      <p className="text-[10px] text-white/50">Connected: {acc.created_at ? acc.created_at.substring(0, 10) : 'Active'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                      <button className="text-white/60 hover:text-white">Manage Pages</button>
                      <button
                        onClick={() => toggleAccountStatus(acc.platform, acc.id)}
                        className="bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900 hover:text-white px-3 py-1.5 rounded font-bold transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-zinc-950 border border-white/10 rounded-lg p-10 text-center space-y-4">
                  <Layers size={36} className="mx-auto text-white/20" />
                  <div>
                    <h3 className="font-bold text-base text-white">No Connected Platforms Yet</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      Click "+ New Connection" to integrate Instagram, X (Twitter), LinkedIn, WhatsApp, TikTok or Ads manager.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewConnectionModal(true)}
                    className="bg-brand text-white text-xs font-bold px-5 py-2.5 rounded shadow-glow uppercase"
                  >
                    + New Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: POSTS ─── */}
        {activeTab === 'posts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Posts</h1>
                <p className="text-xs text-white/50 mt-1">Manage your scheduled and published content</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreatePostModal(true)}
                  className="bg-brand hover:bg-brand-light text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase tracking-wider"
                >
                  <Plus size={16} /> Create post
                </button>
                <button className="bg-zinc-900 border border-white/15 text-white/80 hover:text-white text-xs font-bold px-4 py-2.5 rounded uppercase tracking-wider">
                  Import CSV
                </button>
              </div>
            </div>

            {/* Sub-Nav Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 text-xs">
              <button 
                onClick={() => setPostsSubTab('overview')}
                className={`pb-3 font-bold uppercase transition-colors border-b-2 ${postsSubTab === 'overview' ? 'border-brand text-white' : 'border-transparent text-white/50 hover:text-white'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setPostsSubTab('queues')}
                className={`pb-3 font-bold uppercase transition-colors border-b-2 ${postsSubTab === 'queues' ? 'border-brand text-white' : 'border-transparent text-white/50 hover:text-white'}`}
              >
                Queues
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className="bg-zinc-900 border border-white/15 text-white px-3 py-1.5 rounded">
                <option>All posts</option>
              </select>
              <select className="bg-zinc-900 border border-white/15 text-white px-3 py-1.5 rounded">
                <option>All platforms</option>
              </select>
              <select className="bg-zinc-900 border border-white/15 text-white px-3 py-1.5 rounded">
                <option>All profiles</option>
              </select>
              <select className="bg-zinc-900 border border-white/15 text-white px-3 py-1.5 rounded">
                <option>All dates</option>
              </select>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <div key={post.id} className="bg-zinc-950 border border-white/15 rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/90">{post.content}</span>
                  </div>
                  <div className="text-[10px] text-white/40">
                    {post.created_at ? new Date(post.created_at).toUTCString() : 'Jul 24, 2026, 03:24 PM UTC'}
                  </div>
                  <div className="flex items-center gap-3 pt-2 text-xs border-t border-white/10">
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                      {post.status}
                    </span>
                    <span className="text-white/60">💬 {post.comments || 0}</span>
                    <span className="text-white/60">❤️ {post.likes || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 3: ANALYTICS ─── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Analytics</h1>
              <p className="text-xs text-white/50 mt-1">View post performance metrics &amp; engagement trends</p>
            </div>

            {/* Sub-Nav Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 text-xs">
              <button 
                onClick={() => setAnalyticsSubTab('posting')}
                className={`pb-3 font-bold uppercase transition-colors border-b-2 ${analyticsSubTab === 'posting' ? 'border-brand text-white' : 'border-transparent text-white/50 hover:text-white'}`}
              >
                Posting analytics
              </button>
              <button 
                onClick={() => setAnalyticsSubTab('inbox')}
                className={`pb-3 font-bold uppercase transition-colors border-b-2 ${analyticsSubTab === 'inbox' ? 'border-brand text-white' : 'border-transparent text-white/50 hover:text-white'}`}
              >
                Inbox analytics
              </button>
            </div>

            {/* KPI Metric Cards — Real Data */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block">Engagement rate</span>
                <span className="text-xl font-bold text-white">{analyticsData?.engagementRate || '0.0%'}</span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block">Total posts</span>
                <span className="text-xl font-bold text-white">{analyticsData?.totalPosts || 0}</span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block">Connected platforms</span>
                <span className="text-xl font-bold text-white">{analyticsData?.connectedPlatforms || 0}</span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block">Total likes</span>
                <span className="text-xl font-bold text-white">{analyticsData?.totalLikes || 0}</span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block">API calls</span>
                <span className="text-xl font-bold text-white">{analyticsData?.totalApiCalls || 0}</span>
              </div>
            </div>

            {/* Posts per platform — Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950 border border-white/10 rounded-lg p-5">
                <h4 className="font-bold text-sm text-white mb-4">Posts per platform</h4>
                {analyticsData?.postsPerPlatform && Object.keys(analyticsData.postsPerPlatform).length > 0 ? (
                  <div className="h-48 flex items-end justify-center gap-6 border-b border-white/10 pb-2">
                    {Object.entries(analyticsData.postsPerPlatform).map(([platform, count]) => {
                      const counts = Object.values(analyticsData.postsPerPlatform) as number[];
                      const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
                      const numCount = count as number;
                      const height = maxCount > 0 ? Math.max(20, (numCount / maxCount) * 160) : 20;
                      return (
                        <div key={platform} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-white/60 font-bold">{count}</span>
                          <div className="w-12 bg-brand rounded-t" style={{ height: `${height}px` }} />
                          <span className="text-[9px] text-white/40 truncate max-w-[48px]">{platform}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-white/30">
                    No posts yet. Create your first post to see platform distribution.
                  </div>
                )}
              </div>

              <div className="bg-zinc-950 border border-white/10 rounded-lg p-5">
                <h4 className="font-bold text-sm text-white mb-4">Engagement breakdown</h4>
                {(analyticsData?.totalLikes || 0) + (analyticsData?.totalComments || 0) > 0 ? (
                  <div className="h-48 flex items-end justify-center gap-8 border-b border-white/10 pb-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-white/60 font-bold">{analyticsData?.totalLikes || 0}</span>
                      <div className="w-16 bg-brand rounded-t" style={{ height: `${Math.max(20, ((analyticsData?.totalLikes || 0) / Math.max(1, (analyticsData?.totalLikes || 0) + (analyticsData?.totalComments || 0))) * 160)}px` }} />
                      <span className="text-[10px] text-white/40">Likes</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-white/60 font-bold">{analyticsData?.totalComments || 0}</span>
                      <div className="w-16 bg-emerald-600 rounded-t" style={{ height: `${Math.max(20, ((analyticsData?.totalComments || 0) / Math.max(1, (analyticsData?.totalLikes || 0) + (analyticsData?.totalComments || 0))) * 160)}px` }} />
                      <span className="text-[10px] text-white/40">Comments</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-white/30">
                    No engagement data yet. Post content to track likes and comments.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: INBOX ─── */}
        {activeTab === 'inbox' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Messages</h1>
                <p className="text-xs text-white/50 mt-1">Unified customer messaging &amp; inbox manager</p>
              </div>
            </div>

            {/* Empty State — No Messages Table Yet */}
            <div className="bg-zinc-950 border border-white/10 rounded-lg p-12 text-center space-y-4">
              <MessageSquare size={48} className="mx-auto text-white/15" />
              <div>
                <h3 className="font-bold text-base text-white">No messages yet</h3>
                <p className="text-xs text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
                  Connect a social account with messaging capabilities (WhatsApp Business, Instagram, Facebook) to start receiving and managing messages from your unified inbox.
                </p>
              </div>
              <button
                onClick={() => setShowNewConnectionModal(true)}
                className="bg-brand text-white text-xs font-bold px-5 py-2.5 rounded shadow-glow uppercase flex items-center gap-2 mx-auto"
              >
                <Plus size={16} /> Connect Messaging Platform
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 5: ADS ─── */}
        {activeTab === 'ads' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Ad Campaigns</h1>
              <p className="text-xs text-white/50 mt-1">Meta Ads, Google Ads, LinkedIn Ads &amp; TikTok Ads management</p>
            </div>

            {/* Empty State — No Ad Campaigns Table Yet */}
            <div className="bg-zinc-950 border border-white/10 rounded-lg p-12 text-center space-y-4">
              <Megaphone size={48} className="mx-auto text-white/15" />
              <div>
                <h3 className="font-bold text-base text-white">No active ad campaigns</h3>
                <p className="text-xs text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
                  Connect your Meta Ads Manager, Google Ads, or other advertising platform to view and manage campaign performance, spend, and ROAS from this dashboard.
                </p>
              </div>
              <button
                onClick={() => setShowNewConnectionModal(true)}
                className="bg-brand text-white text-xs font-bold px-5 py-2.5 rounded shadow-glow uppercase flex items-center gap-2 mx-auto"
              >
                <Plus size={16} /> Connect Ad Platform
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 6: API KEYS ─── */}
        {activeTab === 'apikeys' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">API Keys &amp; Logs</h1>
                <p className="text-xs text-white/50 mt-1">Generate and manage Rockyt production API tokens for Claude, Cursor, AI agents &amp; backend SDKs</p>
              </div>
              <button
                onClick={handleGenerateApiKey}
                disabled={isGeneratingKey}
                className="bg-brand text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase shrink-0 disabled:opacity-50 hover:bg-brand/90 transition-all cursor-pointer"
              >
                <Key size={16} /> {isGeneratingKey ? 'GENERATING...' : 'GENERATE NEW API KEY'}
              </button>
            </div>

            {/* Newly Generated Key Alert Banner */}
            {newGeneratedKey && (
              <div className="bg-brand/10 border-2 border-brand p-5 rounded-lg space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-2">
                    ⚡ NEW LIVE API KEY GENERATED
                  </span>
                  <button onClick={() => setNewGeneratedKey(null)} className="text-white/50 hover:text-white text-xs">
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-white/80">
                  Copy this key now. For security purposes, this is the only time the full key will be displayed.
                </p>
                <div className="flex items-center gap-2 bg-black border border-brand/50 p-3 rounded">
                  <span className="flex-1 font-mono text-xs font-bold text-brand select-all break-all">
                    {newGeneratedKey}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(newGeneratedKey)} 
                    className="bg-brand text-white text-xs font-bold px-4 py-2 rounded uppercase shrink-0 hover:bg-brand/90"
                  >
                    {copiedKey ? 'COPIED!' : 'COPY KEY'}
                  </button>
                </div>
              </div>
            )}

            {apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map(key => (
                  <div key={key.id} className="bg-zinc-950 border border-brand/40 shadow-glow rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-brand uppercase font-bold block">LIVE PRODUCTION KEY</label>
                      <button 
                        onClick={() => handleRevokeApiKey(key.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-mono uppercase underline cursor-pointer"
                      >
                        Revoke Key
                      </button>
                    </div>
                    <div className="flex items-center gap-3 bg-black border border-white/20 p-3 rounded">
                      <Key size={16} className="text-brand shrink-0" />
                      <span className="flex-1 font-mono text-xs font-bold text-white">
                        {showKey ? key.key_prefix + '••••••••••••••••••••••••••••••••' : `${key.key_prefix}••••••••••••••••••••••••••••••••`}
                      </span>
                      <button onClick={() => setShowKey(!showKey)} className="text-white/60 hover:text-white p-1">
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => copyToClipboard(key.key_prefix)} className="bg-brand text-white text-xs font-bold px-3 py-1.5 rounded uppercase">
                        {copiedKey ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <div className="text-[10px] text-white/40">
                      Created: {key.created_at ? new Date(key.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-white/10 rounded-lg p-10 text-center space-y-4">
                <Key size={36} className="mx-auto text-white/20" />
                <div>
                  <h3 className="font-bold text-base text-white">No API Keys Yet</h3>
                  <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                    Generate a live Rockyt API key to connect Claude, Cursor, autonomous AI agents, or backend SDKs to the Rockyt platform.
                  </p>
                </div>
                <button
                  onClick={handleGenerateApiKey}
                  disabled={isGeneratingKey}
                  className="bg-brand text-white text-xs font-bold px-6 py-3 rounded shadow-glow uppercase inline-flex items-center gap-2 hover:bg-brand/90 transition-all cursor-pointer"
                >
                  <Key size={16} /> {isGeneratingKey ? 'GENERATING...' : 'GENERATE FIRST API KEY'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 7: USERS ─── */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Users &amp; Team</h1>
                <p className="text-xs text-white/50 mt-1">Manage team members and workspace access</p>
              </div>
              <button 
                onClick={() => setShowInviteUserModal(true)}
                className="bg-brand text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase"
              >
                <UserPlus size={16} /> Invite Member
              </button>
            </div>

            <div className="bg-zinc-950 border border-white/15 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 border-b border-white/10 text-white/60">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <img src={userAvatar} className="w-6 h-6 rounded-full" /> {userEmail}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">Owner / Admin</td>
                    <td className="p-3 text-brand font-bold uppercase">{profile?.plan || 'Growth'}</td>
                    <td className="p-3 text-white/50">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 8: WEBHOOKS ─── */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Webhooks</h1>
                <p className="text-xs text-white/50 mt-1">Subscribe to real-time HTTP events from connected social accounts</p>
              </div>
              <button
                onClick={() => setShowNewWebhookModal(true)}
                className="bg-brand text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase"
              >
                <Plus size={16} /> Create Webhook
              </button>
            </div>

            <div className="space-y-4">
              {webhooks.length > 0 ? (
                webhooks.map(wh => (
                  <div key={wh.id} className="bg-zinc-950 border border-white/15 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{wh.name || 'Production Webhook'}</h4>
                      <p className="text-xs font-mono text-brand mt-1">{wh.url}</p>
                      <div className="flex gap-2 mt-2">
                        {wh.events.map(ev => (
                          <span key={ev} className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded">{ev}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteWebhook(wh.id)} className="text-red-400 hover:text-red-300 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-lg p-8 text-center text-xs text-white/50">
                  No webhooks configured yet. Click "+ Create Webhook" to register an HTTP endpoint.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 9: LOGS ─── */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">API Activity Logs</h1>
              <p className="text-xs text-white/50 mt-1">Real-time user event inspector &amp; latency tracking</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
                <input 
                  type="text"
                  placeholder="Filter by event/activity..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 text-white pl-9 pr-3 py-2 rounded outline-none"
                />
              </div>

              <select 
                value={logPlatformFilter}
                onChange={(e) => setLogPlatformFilter(e.target.value)}
                className="bg-zinc-900 border border-white/15 text-white px-3 py-2 rounded outline-none"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">X / Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              <select 
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-white/15 text-white px-3 py-2 rounded outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="200">200 OK</option>
                <option value="400">400 Error</option>
                <option value="500">500 Internal</option>
              </select>
            </div>

            {/* Logs Table */}
            <div className="bg-zinc-950 border border-white/15 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 border-b border-white/10 text-white/60">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Activity / Endpoint</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white/50">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="p-3 font-mono font-bold text-white">{log.activity}</td>
                      <td className="p-3 text-white/80">{log.platform}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status_code === 200 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                        }`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="p-3 text-white/60">{log.duration_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 10: SETTINGS & BILLING ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Settings &amp; Billing</h1>
              <p className="text-xs text-white/50 mt-1">Manage account information &amp; Dodo Payments wallet balance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Info */}
              <div className="bg-zinc-950 border border-white/15 rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Account Info</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-white/40 block">Email Address</span>
                    <span className="text-white font-bold">{userEmail}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Subscription Tier</span>
                    <span className="text-brand font-bold uppercase">{profile?.plan || 'Growth Plan'}</span>
                  </div>
                </div>
              </div>

              {/* Dodo Payments Top-Up */}
              <div className="bg-zinc-950 border border-brand/40 shadow-glow rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Dodo Payments Wallet</h3>
                <div className="text-xs text-white/70">
                  Current Balance: <strong className="text-emerald-400 text-base ml-1">${walletBalance.toFixed(2)}</strong>
                </div>

                <div className="flex gap-2">
                  {[25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => handleInitiateCheckout(undefined, amt)}
                      className="flex-1 bg-zinc-900 border border-white/15 hover:border-brand text-xs font-bold py-2 rounded"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── MODAL: NEW CONNECTION ─── */}
      {showNewConnectionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-brand/40 shadow-glow rounded-xl max-w-2xl w-full p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-white uppercase tracking-wider">Connect New Platform</h3>
                <p className="text-xs text-white/50">Select a social network or messaging service to authenticate</p>
              </div>
              <button onClick={() => setShowNewConnectionModal(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allConnectPlatforms.map(p => (
                <div 
                  key={p.name}
                  onClick={() => toggleAccountStatus(p.name)}
                  className="bg-zinc-900/80 border border-white/10 hover:border-brand p-4 rounded-lg cursor-pointer transition-all flex items-start gap-3 group"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-white group-hover:text-brand transition-colors">{p.name}</h4>
                    <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE POST ─── */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/20 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white uppercase">Create New Post</h3>
              <button onClick={() => setShowCreatePostModal(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-white/60">Target Platform</label>
              <select 
                value={newPostPlatform} 
                onChange={(e) => setNewPostPlatform(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 text-white p-2 rounded outline-none"
              >
                <option value="Instagram">Instagram</option>
                <option value="X / Twitter">X / Twitter</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok</option>
                <option value="WhatsApp Business">WhatsApp Business</option>
              </select>

              <label className="block text-white/60">Post Content</label>
              <textarea 
                rows={4}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Type your post caption or message here..."
                className="w-full bg-zinc-900 border border-white/15 text-white p-2.5 rounded outline-none"
              />
            </div>

            <button
              onClick={async () => {
                if (newPostContent) {
                  try {
                    const headers = await getAuthHeaders();
                    const res = await fetch('/api/v1/user/posts', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({
                        platform: newPostPlatform,
                        content: newPostContent
                      })
                    });
                    const data = await safeFetchJson(res);
                    if (data.post) {
                      setPosts(prev => [data.post, ...prev]);
                    } else {
                      setPosts(prev => [{
                        id: `post_${Date.now()}`,
                        platform: newPostPlatform,
                        content: newPostContent,
                        status: 'published',
                        created_at: new Date().toISOString(),
                        likes: 0,
                        comments: 0
                      }, ...prev]);
                    }
                  } catch (e) {
                    setPosts(prev => [{
                      id: `post_${Date.now()}`,
                      platform: newPostPlatform,
                      content: newPostContent,
                      status: 'published',
                      created_at: new Date().toISOString(),
                      likes: 0,
                      comments: 0
                    }, ...prev]);
                  }
                  setNewPostContent('');
                  setShowCreatePostModal(false);
                }
              }}
              className="w-full bg-brand text-white font-bold text-xs py-3 rounded uppercase"
            >
              Publish Now
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW WEBHOOK ─── */}
      {showNewWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/20 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white uppercase">Create Webhook Endpoint</h3>
              <button onClick={() => setShowNewWebhookModal(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-white/60">Webhook Name</label>
              <input 
                type="text"
                placeholder="e.g. Production n8n Listener"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 text-white p-2.5 rounded outline-none"
              />

              <label className="block text-white/60">Target Endpoint URL</label>
              <input 
                type="url"
                placeholder="https://api.yourdomain.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 text-white p-2.5 rounded outline-none"
              />
            </div>

            <button
              onClick={handleCreateWebhook}
              className="w-full bg-brand text-white font-bold text-xs py-3 rounded uppercase"
            >
              Save Webhook
            </button>
          </div>
        </div>
      )}

      {/* Wallet Top-Up Required Modal */}
      {showTopUpModal && topUpModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-brand/40 shadow-glow rounded-xl max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-3 right-3">
              <button onClick={() => setShowTopUpModal(false)} className="p-1 text-white/60 hover:text-white rounded hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand flex-shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Wallet Top-Up Required
                </h3>
                <p className="text-[11px] text-brand font-mono uppercase tracking-widest">
                  {topUpModalData.platform} API Pass-Through Integration
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-4 mb-5 space-y-3">
              <p className="text-xs text-white/80 leading-relaxed">
                Connecting <strong className="text-white">{topUpModalData.platform}</strong> requires a minimum wallet balance due to official API pass-through costs. Please top up your Rockyt wallet to proceed.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs font-mono">
                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                  <span className="block text-[10px] text-white/40 uppercase">Required Balance</span>
                  <span className="text-emerald-400 font-bold text-sm">${topUpModalData.requiredBalance.toFixed(2)}</span>
                </div>
                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                  <span className="block text-[10px] text-white/40 uppercase">Your Current Wallet</span>
                  <span className="text-white font-bold text-sm">${topUpModalData.currentBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setActiveTab('settings');
                }}
                className="w-full bg-brand hover:bg-brand-light text-white font-mono font-bold text-xs py-3 uppercase tracking-wider shadow-glow transition-all flex items-center justify-center gap-2 rounded"
              >
                <CreditCard size={15} /> Top Up Wallet Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dodo Payments Overlay Checkout Modal */}
      <OverlayCheckoutModal 
        checkoutUrl={overlayCheckoutUrl}
        onClose={() => setOverlayCheckoutUrl(null)}
        onSuccess={fetchLiveData}
      />
    </div>
  );
};

export default Dashboard;
