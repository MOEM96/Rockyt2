import React, { useState, useEffect } from 'react';
import { 
  Layers, Send, BarChart2, MessageSquare, Megaphone, Key, Users, 
  Webhook, Activity, Settings, LogOut, ArrowLeft, Check, Copy, Eye, 
  EyeOff, RefreshCw, Plus, ShieldCheck, Zap, DollarSign, ExternalLink, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, Loader2, AlertCircle, X,
  Search, Filter, ChevronRight, ChevronDown, Calendar, Clock, CreditCard, Trash2,
  Mail, Play, UserPlus, FileText, Globe, Database, Download
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
  full_name?: string;
  plan?: string;
  subscription_status?: string;
  wallet_balance?: number;
  max_accounts?: number;
  connected_accounts_count?: number;
  dodo_customer_id?: string;
  plan_product_id?: string;
  zernio_profile_id?: string;
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

type TabType = 'ad_accounts' | 'ad_campaigns' | 'analytics' | 'pixel_events';

interface AnalyticsData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: string;
  avgCpc: string;
  avgRoas: string;
  totalAttributedRevenue: number;
  byPlatform: Record<string, { spend: number; revenue: number; roas: number; conversions: number }>;
}

const allConnectPlatforms = [
  // --- ADS NETWORKS ---
  { id: 'meta-ads', name: 'Meta Ads', icon: '🎯', desc: 'Manage Facebook & Instagram ad campaigns, ROAS & ad sets', category: 'Ads' },
  { id: 'google-ads', name: 'Google Ads', icon: '🔍', desc: 'Track & optimize Google Search, Display & Performance Max ad spend', category: 'Ads' },
  { id: 'linkedin-ads', name: 'LinkedIn Ads', icon: '📊', desc: 'Manage LinkedIn sponsored content & B2B ad campaigns', category: 'Ads' },
  { id: 'tiktok-ads', name: 'TikTok Ads', icon: '🚀', desc: 'Manage TikTok video ads & Spark Ads campaigns', category: 'Ads' },
  { id: 'pinterest-ads', name: 'Pinterest Ads', icon: '🎨', desc: 'Manage Pinterest promoted pins & shopping ad campaigns', category: 'Ads' },
  { id: 'x-ads', name: 'X Ads', icon: '📈', desc: 'Manage X/Twitter promoted tweets & audience campaigns', category: 'Ads' },
  { id: 'openai-ads', name: 'OpenAI Ads', icon: '🤖', desc: 'Connect OpenAI ad campaigns & API integrations', category: 'Ads' }
];

const Dashboard: React.FC<DashboardProps> = ({ userSession, onBackHome, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ad_accounts');
  
  // Data States
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<ApiLogRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletTxns, setWalletTxns] = useState<WalletTransactionRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // UI Modals & Filters
  const [showNewConnectionModal, setShowNewConnectionModal] = useState<boolean>(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState<boolean>(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false);

  // Dynamic Ad Reporting & Data Hub States
  const [reportRange, setReportRange] = useState<'today' | '7d' | '30d' | 'ytd' | 'custom'>('30d');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('ALL');
  const [cliFramework, setCliFramework] = useState<'next' | 'react' | 'html' | 'shopify'>('next');
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostPlatform, setNewPostPlatform] = useState<string>('Instagram');
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [newWebhookName, setNewWebhookName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');

  // Paid Ads Command Center & Pixel States
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState<boolean>(false);
  const [newCampName, setNewCampName] = useState<string>('');
  const [newCampPlatform, setNewCampPlatform] = useState<string>('Meta Ads');
  const [newCampObjective, setNewCampObjective] = useState<string>('CONVERSIONS');
  const [newCampBudget, setNewCampBudget] = useState<string>('150.00');
  const [selectedAdsPlatform, setSelectedAdsPlatform] = useState<string>('ALL');
  const [testEventStatus, setTestEventStatus] = useState<string | null>(null);

  const handleToggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setAdCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: nextStatus } : c));
    try {
      await fetch(`/api/v1/ads/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (e) {
      console.warn('Failed to update campaign status:', e);
    }
  };

  const handleEditCampaignBudget = async (campaignId: string, currentBudget: any) => {
    const input = prompt('Enter new daily budget ($):', String(currentBudget || 100));
    if (!input) return;
    const numBudget = Number(input);
    if (isNaN(numBudget) || numBudget <= 0) return;

    setAdCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, daily_budget: numBudget } : c));
    try {
      await fetch(`/api/v1/ads/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyBudget: numBudget })
      });
    } catch (e) {}
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName) return;
    try {
      const res = await fetch('/api/v1/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampName,
          platform: newCampPlatform,
          dailyBudget: Number(newCampBudget || 100),
          objective: newCampObjective,
          status: 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setAdCampaigns(prev => [data.campaign, ...prev]);
        setShowCreateCampaignModal(false);
        setNewCampName('');
      }
    } catch (e: any) {
      alert('Error creating campaign: ' + e.message);
    }
  };

  const handleSendTestFBConversion = async () => {
    setTestEventStatus('Firing test Facebook Pixel conversion event...');
    try {
      const res = await fetch('/api/v1/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'Purchase',
          eventData: { value: 199.00, currency: 'USD', click_id: 'fbclid_test_9981a', orderId: `ord_${Date.now()}` },
          posthogDistinctId: 'demo_user_123'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestEventStatus(`✅ Event Dispatched! ${data.message}`);
        fetchLiveData();
      } else {
        setTestEventStatus(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setTestEventStatus(`❌ Error: ${e.message}`);
    }
  };

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
  const [secondarySelectionData, setSecondarySelectionData] = useState<{
    platform: string;
    step: string;
    pendingDataToken: string;
    tempToken?: string;
    userProfile?: any;
    profileId?: string;
    options: Array<{ id: string; name: string }>;
    loading: boolean;
    selectedId?: string;
    selectedName?: string;
  } | null>(null);
  const [isSavingSelection, setIsSavingSelection] = useState<boolean>(false);
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
          const status = String(a.status || 'connected').toLowerCase();
          const id = String(a.id || '');
          // Only filter out accounts that are explicitly disconnected or have no ID
          if (!id || id === 'undefined' || id === 'null') return false;
          if (status === 'disconnected' || status === 'revoked') return false;
          return true;
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

  // Dedicated connections fetch — called as a redundant fallback when consolidated endpoint returns 0 accounts
  const fetchConnectionsData = async () => {
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

      // Try the dedicated accounts endpoint which fetches directly from Zernio API
      const res = await fetch(`/api/v1/accounts${qs}`, { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          const validAccounts = data.accounts.filter((a: any) => {
            const id = String(a.id || '');
            const status = String(a.status || 'connected').toLowerCase();
            return id && id !== 'undefined' && status !== 'disconnected';
          });
          if (validAccounts.length > 0) {
            setAccounts(validAccounts);
            console.log(`[Dashboard] fetchConnectionsData: loaded ${validAccounts.length} accounts from /api/v1/accounts`);
          }
        }
      }

      // Also try the /api/user/connected-accounts DB-backed endpoint
      if (accounts.length === 0) {
        const dbRes = await fetch(`/api/user/connected-accounts${qs}`, { headers });
        if (dbRes.ok) {
          const dbData = await safeFetchJson(dbRes);
          if (Array.isArray(dbData.accounts) && dbData.accounts.length > 0) {
            const validDbAccounts = dbData.accounts.filter((a: any) => {
              const status = String(a.status || 'connected').toLowerCase();
              return status === 'connected';
            });
            if (validDbAccounts.length > 0) {
              setAccounts(validDbAccounts);
              console.log(`[Dashboard] fetchConnectionsData: loaded ${validDbAccounts.length} accounts from DB fallback`);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Dashboard] fetchConnectionsData fallback error:', err);
    }
  };

  const fetchPostsData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/user/posts', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.posts)) setPosts(data.posts);
      }
    } catch (e) {}
  };

  const fetchAnalyticsData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/analytics', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (data.analytics) setAnalyticsData(data.analytics);
      }
    } catch (e) {}
  };

  const fetchInboxData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/inbox/conversations', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.conversations)) setConversations(data.conversations);
      }
    } catch (e) {}
  };

  const fetchAdsData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/ads', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.campaigns)) setAdCampaigns(data.campaigns);
      }
    } catch (e) {}
  };

  const fetchApiKeysData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/keys', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.apiKeys)) setApiKeys(data.apiKeys);
      }
    } catch (e) {}
  };

  const fetchUsersData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/users', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.users)) setTeamMembers(data.users);
      }
    } catch (e) {}
  };

  const fetchWebhooksData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/webhooks', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.webhooks)) setWebhooks(data.webhooks);
      }
    } catch (e) {}
  };

  const fetchLogsData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/logs', { headers });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.logs)) setLogs(data.logs);
      }
    } catch (e) {}
  };

  // Per-Tab Trigger: Automatically fetch live data when switching tabs
  useEffect(() => {
    switch (activeTab) {
      case 'connections':
        fetchConnectionsData();
        break;
      case 'posts':
        fetchPostsData();
        break;
      case 'analytics':
        fetchAnalyticsData();
        break;
      case 'inbox':
        fetchInboxData();
        break;
      case 'ads':
        fetchAdsData();
        break;
      case 'apikeys':
        fetchApiKeysData();
        break;
      case 'users':
        fetchUsersData();
        break;
      case 'webhooks':
        fetchWebhooksData();
        break;
      case 'logs':
        fetchLogsData();
        break;
      case 'settings':
        fetchLiveData();
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLiveData();

    // Query params check for OAuth callback completion or secondary selection step
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    const pendingToken = urlParams.get('pendingDataToken');
    const tempToken = urlParams.get('tempToken');
    const profileId = urlParams.get('profileId');
    const userProfileStr = urlParams.get('userProfile');
    const platform = urlParams.get('platform') || 'Social Channel';

    let parsedUserProfile: any = null;
    if (userProfileStr) {
      try {
        parsedUserProfile = JSON.parse(decodeURIComponent(userProfileStr));
      } catch {
        parsedUserProfile = userProfileStr;
      }
    }

    if (step && (pendingToken || tempToken)) {
      setSecondarySelectionData({
        platform,
        step,
        pendingDataToken: pendingToken || '',
        tempToken: tempToken || undefined,
        userProfile: parsedUserProfile,
        profileId: profileId || undefined,
        options: [],
        loading: true
      });

      getAuthHeaders().then(authHeaders => {
        const queryParams = new URLSearchParams();
        if (pendingToken) queryParams.set('pendingDataToken', pendingToken);
        if (tempToken) queryParams.set('tempToken', tempToken);
        if (profileId) queryParams.set('profileId', profileId);

        fetch(`/api/v1/connect/${platform.toLowerCase()}/selection-options?${queryParams.toString()}`, {
          headers: authHeaders
        })
          .then(res => res.json())
          .then(data => {
            const rawOpts = data.options || data.pages || data.boards || data.locations || [];
            const opts = (Array.isArray(rawOpts) ? rawOpts : []).map((o: any) => ({
              id: o.id || o.pageId || o.boardId || o._id,
              name: o.name || o.title || o.username || 'Selected Profile'
            }));
            setSecondarySelectionData(prev => prev ? { ...prev, options: opts, loading: false } : null);
          })
          .catch(err => {
            console.warn('[Selection Options Fetch Error]:', err);
            setSecondarySelectionData(prev => prev ? { ...prev, loading: false } : null);
          });
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('account_connected') === 'true' || urlParams.get('connected') === '1') {
      setCheckoutSuccessMsg(`Successfully authenticated and connected your ${platform} account to Rockyt!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchLiveData();
    }
  }, [userSession?.email, userSession?.id, userSession?.accessToken, activeTab]);

  // Dedicated effect: when on connections tab and accounts are empty after initial load, try dedicated fetch
  useEffect(() => {
    if (activeTab === 'connections' && !isLoading && accounts.length === 0) {
      fetchConnectionsData();
    }
  }, [activeTab, isLoading, accounts.length]);

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

        const cleanPlat = platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
        let targetAuthUrl = data.connectUrl || `${window.location.origin}/connect/${encodeURIComponent(cleanPlat)}`;

        if (targetAuthUrl) {
          // Open Rockyt Branded Connection Gateway Screen in a NEW TAB
          window.open(targetAuthUrl, '_blank');
          setShowNewConnectionModal(false);
          setConnectingPlatform(null);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to initiate ${platformName} connection (${res.status})`);
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

  // Confirm Headless Secondary Selection
  const handleConfirmSecondarySelection = async () => {
    if (!secondarySelectionData?.selectedId) return;
    setIsSavingSelection(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/connect/${secondarySelectionData.platform.toLowerCase()}/select-option`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pendingDataToken: secondarySelectionData.pendingDataToken,
          tempToken: secondarySelectionData.tempToken,
          userProfile: secondarySelectionData.userProfile,
          profileId: secondarySelectionData.profileId,
          selectedId: secondarySelectionData.selectedId,
          selectedName: secondarySelectionData.selectedName
        })
      });
      if (res.ok) {
        setCheckoutSuccessMsg(`Successfully connected ${secondarySelectionData.selectedName || secondarySelectionData.platform} to Rockyt!`);
        setSecondarySelectionData(null);
        fetchLiveData();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save selection.');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Secondary selection failed.');
    } finally {
      setIsSavingSelection(false);
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

      let res = await fetch('/api/v1/checkouts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: productId || 'pdt_0NWDjzl0TS6LNFrVdFZYQ',
          amount: finalAmount,
          currency: 'USD',
          planName: 'Wallet Top-Up'
        })
      });

      if (!res.ok) {
        res = await fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId: productId || 'pdt_0NWDjzl0TS6LNFrVdFZYQ',
            amount: finalAmount,
            currency: 'USD',
            planName: 'Wallet Top-Up'
          })
        });
      }

      const data = await safeFetchJson(res);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session with Dodo Payments.');
      }

      const checkoutUrl = data.checkout_url || data.checkoutUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
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

          {/* MAIN SIDEBAR NAVIGATION LIST (4 CORE TABS) */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('ad_accounts')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'ad_accounts'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers size={15} /> Ad Accounts
              </span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 border border-white/20 rounded font-mono">
                {connectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ad_campaigns')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'ad_campaigns'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Megaphone size={15} /> Ad Campaigns
              </span>
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
                <BarChart2 size={15} /> Ad Analytics &amp; ROAS
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pixel_events')}
              className={`w-full p-2.5 text-xs font-bold uppercase tracking-wider text-left transition-all border rounded flex items-center justify-between ${
                activeTab === 'pixel_events'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/40 text-white/70 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Zap size={15} /> FB Pixel &amp; Event Logs
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded font-mono">
                CAPI
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

        {/* ─── TAB 1: AD ACCOUNTS ─── */}
        {activeTab === 'ad_accounts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <Layers className="text-brand" size={24} /> Connected Ad Accounts
                </h1>
                <p className="text-xs text-white/50 mt-1">
                  Manage advertising accounts across Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, Pinterest Ads, X Ads &amp; OpenAI Ads
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewConnectionModal(true)}
                  className="bg-brand hover:bg-brand-light text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={16} /> Connect Ad Account
                </button>
              </div>
            </div>

            {/* Connected Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.length > 0 ? (
                accounts.map(acc => (
                  <div key={acc.id} className="bg-zinc-950 border border-white/15 rounded-lg p-5 space-y-4 hover:border-brand/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {acc.platform.toLowerCase().includes('meta') || acc.platform.toLowerCase().includes('facebook') ? '🎯' : 
                           acc.platform.toLowerCase().includes('google') ? '🔍' :
                           acc.platform.toLowerCase().includes('linkedin') ? '💼' :
                           acc.platform.toLowerCase().includes('tiktok') ? '🚀' :
                           acc.platform.toLowerCase().includes('pinterest') ? '🎨' :
                           acc.platform.toLowerCase().includes('twitter') || acc.platform.toLowerCase().includes('x') ? '📈' : '🤖'}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{acc.platform}</h4>
                          <span className="inline-block text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-1.5 py-0.2 rounded uppercase font-bold">
                            {acc.status || 'connected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white/90">{acc.username || acc.name || 'Ad Account'}</p>
                      <p className="text-[10px] text-white/50">ID: {acc.id}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                      <span className="text-white/40 text-[10px]">Real API Connection</span>
                      <button
                        onClick={() => toggleAccountStatus(acc.platform, acc.id)}
                        className="bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900 hover:text-white px-3 py-1.5 rounded font-bold transition-colors cursor-pointer"
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
                    <h3 className="font-bold text-base text-white">No Ad Accounts Connected Yet</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      Click below to connect your Meta, Google, TikTok, LinkedIn, Pinterest, X, or OpenAI ad accounts.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewConnectionModal(true)}
                    className="bg-brand text-white text-xs font-bold px-5 py-2.5 rounded shadow-glow uppercase cursor-pointer"
                  >
                    + Connect Ad Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: AD CAMPAIGNS ─── */}
        {activeTab === 'ad_campaigns' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <Megaphone className="text-brand" size={24} /> Ad Campaigns Command Center
                </h1>
                <p className="text-xs text-white/50 mt-1">
                  Manage ad campaigns, daily budgets, and toggle Pause/Launch status across ad platforms
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="bg-brand hover:bg-brand-light text-white text-xs font-bold px-4 py-2.5 rounded shadow-glow flex items-center gap-2 uppercase tracking-wider cursor-pointer transition-all"
                >
                  <Plus size={16} /> Launch New Campaign
                </button>
              </div>
            </div>

            {/* Filter Controls Bar: Platform & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/5 text-xs font-mono">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-white/40 text-[10px] uppercase font-bold mr-1">Network:</span>
                {['ALL', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Pinterest Ads', 'X Ads', 'OpenAI Ads'].map(plat => (
                  <button
                    key={plat}
                    onClick={() => setSelectedAdsPlatform(plat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      selectedAdsPlatform === plat
                        ? 'bg-brand text-white shadow-glow border border-brand/40'
                        : 'bg-zinc-900 text-white/60 hover:text-white hover:bg-zinc-800 border border-white/10'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/40 text-[10px] uppercase font-bold">Status:</span>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/15 text-white font-bold px-3 py-1 rounded outline-none focus:border-brand cursor-pointer text-xs"
                >
                  <option value="ALL">All Statuses (Historical)</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="PAUSED">Paused Only</option>
                  <option value="COMPLETED">Completed Only</option>
                  <option value="ARCHIVED">Archived Only</option>
                  <option value="DRAFT">Draft Only</option>
                </select>
              </div>
            </div>

            {/* Historical Campaign Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adCampaigns
                .filter(ad => selectedAdsPlatform === 'ALL' || (typeof ad.platform === 'string' && ad.platform.toLowerCase().includes(selectedAdsPlatform.toLowerCase().replace(' ads', ''))))
                .filter(ad => reportStatusFilter === 'ALL' || String(ad.status || 'ACTIVE').toUpperCase() === reportStatusFilter.toUpperCase()).length > 0 ? (
                adCampaigns
                  .filter(ad => selectedAdsPlatform === 'ALL' || (typeof ad.platform === 'string' && ad.platform.toLowerCase().includes(selectedAdsPlatform.toLowerCase().replace(' ads', ''))))
                  .filter(ad => reportStatusFilter === 'ALL' || String(ad.status || 'ACTIVE').toUpperCase() === reportStatusFilter.toUpperCase())
                  .map(ad => (
                    <div key={ad.id} className="bg-zinc-950 border border-white/15 rounded-xl p-5 space-y-4 shadow-xl hover:border-brand/50 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between text-xs gap-2">
                          <div>
                            <span className="font-bold text-white text-sm block leading-snug">{typeof ad.name === 'string' ? ad.name : 'Ad Campaign'}</span>
                            <span className="text-[10px] text-white/40 font-mono">ID: {ad.id}</span>
                          </div>
                          <span className="bg-brand/20 text-brand px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-brand/30 shrink-0 font-mono">
                            {typeof ad.platform === 'string' ? ad.platform : 'Meta Ads'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-black/60 p-3 rounded-lg text-[11px] border border-white/5">
                          <div>
                            <span className="text-white/40 text-[9px] uppercase block font-mono">Objective</span>
                            <span className="text-white font-semibold">{typeof ad.objective === 'string' ? ad.objective : 'CONVERSIONS'}</span>
                          </div>
                          <div>
                            <span className="text-white/40 text-[9px] uppercase block font-mono">Daily Budget</span>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400 font-bold">
                                ${typeof ad.daily_budget === 'number' || typeof ad.daily_budget === 'string'
                                  ? ad.daily_budget
                                  : typeof ad.budget === 'number' || typeof ad.budget === 'string'
                                    ? ad.budget
                                    : 100}
                              </span>
                              <button
                                onClick={() => handleEditCampaignBudget(ad.id, ad.daily_budget || ad.budget || 100)}
                                className="text-[9px] text-white/40 hover:text-brand underline cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-white/40 text-[9px] uppercase block font-mono">Total Spend</span>
                            <span className="text-white font-semibold">${typeof ad.spend === 'number' || typeof ad.spend === 'string' ? Number(ad.spend).toFixed(2) : '0.00'}</span>
                          </div>
                          <div>
                            <span className="text-white/40 text-[9px] uppercase block font-mono">ROAS</span>
                            <span className="text-brand font-bold">{ad.roas ? `${ad.roas}x` : '0.00x'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ad.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ad.status === 'PAUSED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : ad.status === 'COMPLETED'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-zinc-800 text-white/50 border border-white/10'
                          }`}>
                            {typeof ad.status === 'string' ? ad.status : 'ACTIVE'}
                          </span>
                        </div>

                        {/* Interactive Pause / Launch Toggle Button */}
                        <button
                          onClick={() => handleToggleCampaignStatus(ad.id, ad.status || 'ACTIVE')}
                          className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            ad.status === 'ACTIVE'
                              ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 shadow-glow'
                          }`}
                        >
                          {ad.status === 'ACTIVE' ? (
                            <><span>Pause</span></>
                          ) : (
                            <><Play size={12} fill="currentColor" /> <span>Launch / Resume</span></>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-full bg-zinc-950 border border-white/10 rounded-lg p-10 text-center space-y-4">
                  <Megaphone size={36} className="mx-auto text-white/20" />
                  <div>
                    <h3 className="font-bold text-base text-white">No Historical Campaigns Found</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      No campaigns match the selected network or status filter. Launch a new campaign to populate real API data.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateCampaignModal(true)}
                    className="bg-brand text-white text-xs font-bold px-5 py-2.5 rounded shadow-glow uppercase cursor-pointer"
                  >
                    + Launch New Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: AD ANALYTICS & ROAS ─── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <BarChart2 className="text-brand" size={24} /> Ad Analytics &amp; ROAS
                </h1>
                <p className="text-xs text-white/50 mt-1">
                  Real-time performance analytics calculated directly from Zernio Ads API &amp; connected ad accounts
                </p>
              </div>

              {/* DYNAMIC REPORT CONTROLS BAR */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value as any)}
                  className="bg-zinc-900 border border-white/15 text-white font-bold px-3 py-2 rounded outline-none focus:border-brand cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="ytd">Year to Date (YTD)</option>
                </select>

                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/15 text-white font-bold px-3 py-2 rounded outline-none focus:border-brand cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="PAUSED">Paused Only</option>
                  <option value="COMPLETED">Completed Only</option>
                </select>

                <button
                  onClick={() => {
                    window.open(`/api/v1/ads/analytics?range=${reportRange}&status=${reportStatusFilter}&format=csv`, '_blank');
                  }}
                  className="bg-brand text-white font-bold px-3 py-2 rounded flex items-center gap-1.5 uppercase hover:bg-brand/90 cursor-pointer"
                >
                  <Download size={14} /> EXPORT CSV
                </button>
              </div>
            </div>

            {/* KPI Cards — Pure Real-Time API Data */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Total Ad Spend</span>
                <span className="text-xl font-bold text-white font-mono">
                  ${(analyticsData?.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Total Conversions</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {(analyticsData?.totalConversions || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Average ROAS</span>
                <span className="text-xl font-bold text-brand font-mono">
                  {analyticsData?.avgRoas || '0.00x'}
                </span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Attributed Revenue</span>
                <span className="text-xl font-bold text-white font-mono">
                  ${(analyticsData?.totalAttributedRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-zinc-950 border border-white/10 rounded p-4">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Average CTR</span>
                <span className="text-xl font-bold text-cyan-300 font-mono">
                  {analyticsData?.avgCtr || '0.00%'}
                </span>
              </div>
            </div>

            {/* Campaign-by-Campaign Analytics Table */}
            <div className="bg-zinc-950 border border-white/15 rounded-lg p-5 space-y-4">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center justify-between">
                <span>Campaign-by-Campaign Historical Analytics Breakdown</span>
                <span className="text-[10px] text-white/40 font-mono">Fetched via Connected Ad Accounts API</span>
              </h4>

              {(analyticsData?.campaignBreakdown && analyticsData.campaignBreakdown.length > 0) || adCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase">
                        <th className="pb-2">Campaign Name</th>
                        <th className="pb-2">Network</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Spend ($)</th>
                        <th className="pb-2">Impressions / Clicks</th>
                        <th className="pb-2">CTR / CPC</th>
                        <th className="pb-2">Conversions</th>
                        <th className="pb-2">ROAS (x)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {((analyticsData?.campaignBreakdown && analyticsData.campaignBreakdown.length > 0)
                        ? analyticsData.campaignBreakdown
                        : adCampaigns.map(c => ({
                            id: c.id,
                            name: c.name,
                            platform: c.platform,
                            status: c.status,
                            spend: c.spend || 0,
                            impressions: c.impressions || 0,
                            clicks: c.clicks || 0,
                            conversions: c.conversions || 0,
                            ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + '%' : '0.00%',
                            cpc: c.clicks > 0 ? '$' + (c.spend / c.clicks).toFixed(2) : '$0.00',
                            roas: c.roas ? `${c.roas}x` : '0.00x'
                          }))
                      ).map(item => (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="py-2.5 font-bold text-white">{item.name}</td>
                          <td className="py-2.5 text-brand">{item.platform}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : item.status === 'PAUSED'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-zinc-800 text-white/40'
                            }`}>
                              {item.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-white">${Number(item.spend || 0).toFixed(2)}</td>
                          <td className="py-2.5 text-white/60">{item.impressions?.toLocaleString() || 0} / {item.clicks?.toLocaleString() || 0}</td>
                          <td className="py-2.5 text-cyan-300">{item.ctr || '0.00%'} / {item.cpc || '$0.00'}</td>
                          <td className="py-2.5 text-emerald-400 font-bold">{item.conversions || 0}</td>
                          <td className="py-2.5 text-brand font-bold">{item.roas || '0.00x'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-xs font-mono border border-white/5 rounded">
                  No campaign analytics returned from connected ad accounts yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: FB PIXEL & EVENT LOGS ─── */}
        {activeTab === 'pixel_events' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <Zap className="text-brand" size={24} /> FB Pixel Embed &amp; Event Logs
                </h1>
                <p className="text-xs text-white/50 mt-1">
                  Embed script tag, auto-intercept Facebook Pixel events (window.fbq), and view live database event logs
                </p>
              </div>

              <button
                onClick={handleSendTestFBConversion}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/40 text-xs font-bold px-4 py-2 rounded uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-glow transition-all"
              >
                <Sparkles size={15} /> Send Test Conversion Event
              </button>
            </div>

            {testEventStatus && (
              <div className="p-3 bg-zinc-900 border border-brand/40 rounded text-xs text-white font-mono flex items-center justify-between">
                <span>{testEventStatus}</span>
                <button onClick={() => setTestEventStatus(null)} className="text-white/40 hover:text-white">✕</button>
              </div>
            )}

            {/* PIXEL EMBED SCRIPT BOX */}
            <div className="bg-zinc-950 border border-white/15 p-6 rounded-xl space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-2">
                  <Zap size={16} /> Dynamic FB Pixel Script Embed Tag
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  READY TO INSTALL
                </span>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Paste this script tag into the <code className="text-brand font-bold">&lt;head&gt;</code> of your website or store. It automatically catches all <code className="text-emerald-400 font-bold">window.fbq('track', ...)</code> calls (Purchase, AddToCart, Lead, PageView) and relays them to your database and Zernio Conversion API.
              </p>

              <div className="bg-black p-4 border border-white/20 rounded-lg font-mono text-xs text-emerald-400 relative">
                <code>
                  {`<script src="https://api.rockyt.com/rockyt-pixel.js?apiKey=${apiKeys[0]?.key || userSession?.id || 'rkt_live_key'}" async></script>`}
                </code>
                <button
                  onClick={() => copyToClipboard(`<script src="https://api.rockyt.com/rockyt-pixel.js?apiKey=${apiKeys[0]?.key || userSession?.id || 'rkt_live_key'}" async></script>`)}
                  className="absolute top-3 right-3 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded uppercase hover:bg-brand/90 cursor-pointer shadow-sm"
                >
                  {copiedKey ? 'COPIED!' : 'COPY EMBED TAG'}
                </button>
              </div>
            </div>

            {/* REAL-TIME LIVE EVENT INSPECTOR STREAM */}
            <div className="bg-zinc-950 border border-white/15 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400 animate-pulse" /> Database Conversion Event Stream Log
                </h3>
                <span className="text-[10px] text-white/40 font-mono">Showing live records from Supabase conversion_events table</span>
              </div>

              {liveEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase">
                        <th className="pb-2">Event Name</th>
                        <th className="pb-2">Ad Click ID</th>
                        <th className="pb-2">User / User ID</th>
                        <th className="pb-2">Payload Data</th>
                        <th className="pb-2">Timestamp</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {liveEvents.map(evt => (
                        <tr key={evt.id} className="hover:bg-white/5">
                          <td className="py-2.5 font-bold text-brand">{evt.event_name}</td>
                          <td className="py-2.5 text-emerald-400">{evt.click_id || 'Direct'}</td>
                          <td className="py-2.5 text-white/60">{evt.user_id || evt.posthog_distinct_id || 'anon'}</td>
                          <td className="py-2.5 text-white/50 max-w-[200px] truncate">{JSON.stringify(evt.event_data)}</td>
                          <td className="py-2.5 text-white/40">{new Date(evt.created_at).toLocaleTimeString()}</td>
                          <td className="py-2.5">
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                              {evt.status || 'RELAYED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-xs font-mono border border-white/5 rounded">
                  No conversion events logged in the database yet. Click "Send Test Conversion Event" above to fire a live event!
                </div>
              )}
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

      {/* ─── MODAL: HEADLESS SECONDARY SELECTION ─── */}
      {secondarySelectionData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-brand/50 shadow-glow rounded-xl max-w-lg w-full p-6 relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded">
                  Rockyt Connect
                </span>
                <h3 className="font-bold text-lg text-white mt-1">Select {secondarySelectionData.platform} Account</h3>
                <p className="text-xs text-white/50">Choose which page or profile you want to link to your Rockyt dashboard</p>
              </div>
              <button onClick={() => setSecondarySelectionData(null)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {secondarySelectionData.loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-white/60">
                <Loader2 className="animate-spin text-brand" size={28} />
                <p className="text-xs">Fetching available {secondarySelectionData.platform} options...</p>
              </div>
            ) : secondarySelectionData.options.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-white/60">No additional profiles were found for this connection, or default profile was automatically assigned.</p>
                <button
                  onClick={() => {
                    setCheckoutSuccessMsg(`Connected ${secondarySelectionData.platform} account to Rockyt!`);
                    setSecondarySelectionData(null);
                    fetchLiveData();
                  }}
                  className="w-full py-2.5 bg-brand text-black font-bold text-xs rounded-lg hover:brightness-110"
                >
                  Continue to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {secondarySelectionData.options.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setSecondarySelectionData(prev => prev ? { ...prev, selectedId: opt.id, selectedName: opt.name } : null)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        secondarySelectionData.selectedId === opt.id
                          ? 'bg-brand/15 border-brand text-white'
                          : 'bg-zinc-900/80 border-white/10 hover:border-white/30 text-white/80'
                      }`}
                    >
                      <div className="font-medium text-xs truncate max-w-[80%]">{opt.name}</div>
                      {secondarySelectionData.selectedId === opt.id && (
                        <CheckCircle2 size={16} className="text-brand flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setSecondarySelectionData(null)}
                    className="w-1/3 py-2.5 border border-white/20 text-white/80 hover:text-white rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!secondarySelectionData.selectedId || isSavingSelection}
                    onClick={handleConfirmSecondarySelection}
                    className="w-2/3 py-2.5 bg-brand text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingSelection ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={14} />}
                    Connect Selected Profile
                  </button>
                </div>
              </div>
            )}
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

      {/* Create New Campaign Modal */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-brand/40 shadow-glow rounded-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Megaphone size={18} className="text-brand" /> Launch New Ad Campaign
              </h3>
              <button onClick={() => setShowCreateCampaignModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-white/60 mb-1 uppercase text-[10px]">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={e => setNewCampName(e.target.value)}
                  placeholder="e.g. Q4 Black Friday Conversion Boost"
                  className="w-full bg-zinc-900 border border-white/15 text-white p-3 rounded outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1 uppercase text-[10px]">Target Network</label>
                  <select
                    value={newCampPlatform}
                    onChange={e => setNewCampPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 text-white p-3 rounded outline-none focus:border-brand"
                  >
                    <option value="Meta Ads">Meta Ads (FB/IG)</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="TikTok Ads">TikTok Ads</option>
                    <option value="LinkedIn Ads">LinkedIn Ads</option>
                    <option value="Pinterest Ads">Pinterest Ads</option>
                    <option value="X Ads">X Ads</option>
                    <option value="OpenAI Ads">OpenAI Ads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 mb-1 uppercase text-[10px]">Objective</label>
                  <select
                    value={newCampObjective}
                    onChange={e => setNewCampObjective(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 text-white p-3 rounded outline-none focus:border-brand"
                  >
                    <option value="CONVERSIONS">Conversions (Sales/Leads)</option>
                    <option value="TRAFFIC">Traffic (Clicks)</option>
                    <option value="AWARENESS">Brand Awareness</option>
                    <option value="VIDEO_VIEWS">Video Views</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 uppercase text-[10px]">Daily Budget ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newCampBudget}
                  onChange={e => setNewCampBudget(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 text-white p-3 rounded outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2.5 rounded bg-zinc-900 text-white/70 hover:text-white uppercase font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-brand hover:bg-brand-light text-white font-bold uppercase text-xs shadow-glow cursor-pointer"
                >
                  Launch Campaign Now
                </button>
              </div>
            </form>
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
