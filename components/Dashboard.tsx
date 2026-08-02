import React, { useState, useEffect } from 'react';
import { 
  Layers, Key, CreditCard, LogOut, ArrowLeft, Check, Copy, Eye, EyeOff, 
  RefreshCw, Plus, Radio, ShieldCheck, Zap, DollarSign, ExternalLink, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, Loader2 
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

interface CheckoutSessionRow {
  id: string;
  user_id: string;
  dodo_session_id: string;
  product_id: string;
  plan: string;
  status: string;
  checkout_url: string;
  created_at: string;
  completed_at?: string;
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

const defaultPlatforms = [
  'Twitter / X', 'Instagram', 'WhatsApp Business', 'LinkedIn', 'TikTok',
  'Meta Ads Manager', 'Google Ads', 'Telegram Bot', 'Discord Webhook', 'Slack App'
];

const Dashboard: React.FC<DashboardProps> = ({ userSession, onBackHome, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'apikeys' | 'billing'>('accounts');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<ApiLogRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkoutSessions, setCheckoutSessions] = useState<CheckoutSessionRow[]>([]);
  const [walletTxns, setWalletTxns] = useState<WalletTransactionRow[]>([]);

  const [apiKey, setApiKey] = useState<string>('rockyt_live_99f381a94b8e21c890192847a');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment Checkout state
  const [depositAmount, setDepositAmount] = useState<number>(25);
  const [customDeposit, setCustomDeposit] = useState<string>('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState<string | null>(null);
  const [overlayCheckoutUrl, setOverlayCheckoutUrl] = useState<string | null>(null);

  // User Profile metadata
  const userEmail = userSession?.email || profile?.email || 'moamenemam966@gmail.com';
  const userName = userSession?.name || 'Moamen Emam';
  const userAvatar = userSession?.picture || 'https://lh3.googleusercontent.com/a/ACg8ocL_PcCi9QCqJ-hfTUKklDZ6Q2RWJfer2LjarrUA0X2-4jNFuQ=s96-c';
  const userId = userSession?.id;

  // 1. Fetch Real Live Data from Supabase
  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      // A. Fetch Connected Accounts
      const { data: dbAccounts, error: accErr } = await supabase
        .from('connected_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!accErr && dbAccounts) {
        setAccounts(dbAccounts as ConnectedAccount[]);
      }

      // B. Fetch User API Keys
      const { data: dbKeys, error: keyErr } = await supabase
        .from('user_api_keys')
        .select('id, user_id, key_prefix, revoked, created_at')
        .eq('revoked', false)
        .order('created_at', { ascending: false });

      if (!keyErr && dbKeys && dbKeys.length > 0) {
        setApiKeys(dbKeys as ApiKeyRow[]);
        setApiKey(`${dbKeys[0].key_prefix}••••••••••••••••••••`);
      }

      // C. Fetch API Logs
      const { data: dbLogs } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbLogs) {
        setLogs(dbLogs as ApiLogRow[]);
      }

      // D. Fetch User Profile
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .maybeSingle();

      if (dbProfile) {
        setProfile(dbProfile as UserProfile);
      }

      // E. Fetch Checkout Sessions
      const { data: dbSessions } = await supabase
        .from('checkout_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbSessions) {
        setCheckoutSessions(dbSessions as CheckoutSessionRow[]);
      }

      // F. Fetch Wallet Ledger Transactions
      const { data: dbTxns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbTxns) {
        setWalletTxns(dbTxns as WalletTransactionRow[]);
      }

    } catch (err) {
      console.warn('[Dashboard] Supabase live fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Setup Realtime Channel Listener & URL param check
  useEffect(() => {
    fetchLiveData();

    // Check URL search parameters for Dodo checkout completion redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success') {
      setCheckoutSuccessMsg('Checkout completed successfully! Your plan or deposit has been processed.');
      setActiveTab('billing');
      // Clean query params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // Subscribe to real-time database updates from Supabase
    const realtimeChannel = supabase
      .channel('public:dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connected_accounts' }, () => fetchLiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_api_keys' }, () => fetchLiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchLiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkout_sessions' }, () => fetchLiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => fetchLiveData())
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [userId]);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const regenerateApiKey = async () => {
    setIsRegenerating(true);
    const newPrefix = `rkt_live_${Math.random().toString(36).substring(2, 10)}`;
    const fullKey = `${newPrefix}${Math.random().toString(36).substring(2, 22)}`;
    
    try {
      if (userId) {
        await supabase
          .from('user_api_keys')
          .insert({
            user_id: userId,
            key_prefix: newPrefix,
            key_hash: 'hash_' + Math.random().toString(36).substring(2),
            revoked: false
          });
      }
      setApiKey(fullKey);
      fetchLiveData();
    } catch (e) {
      setApiKey(fullKey);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleAccountStatus = async (platformName: string, existingAccount?: ConnectedAccount) => {
    try {
      if (existingAccount) {
        const nextStatus = existingAccount.status === 'connected' ? 'disconnected' : 'connected';
        await supabase
          .from('connected_accounts')
          .update({ status: nextStatus })
          .eq('id', existingAccount.id);

        setAccounts(prev => prev.map(a => a.id === existingAccount.id ? { ...a, status: nextStatus } : a));
      } else {
        const newAcc = {
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          platform: platformName,
          username: `@${platformName.toLowerCase().replace(/[^a-z0-9]/g, '')}_user`,
          profile_name: `${platformName} Profile`,
          status: 'connected' as const
        };

        const { data: inserted } = await supabase
          .from('connected_accounts')
          .insert([newAcc])
          .select()
          .single();

        if (inserted) {
          setAccounts(prev => [inserted as ConnectedAccount, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error toggling account:', err);
    }
  };

  // Dodo Payments Checkout Initiator
  const handleInitiateCheckout = async (productId?: string, amountVal?: number) => {
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutSuccessMsg(null);

    try {
      // Fetch session token
      const sessionRes = await supabase.auth.getSession();
      const authToken = userSession?.accessToken || sessionRes.data.session?.access_token || apiKey || userEmail;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-User-Email': userEmail
      };

      const res = await fetch('/api/v1/checkouts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: productId || 'pdt_0NWDjeAeatQKryEvRe4eb',
          amount: amountVal || 0
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create checkout session');
      }

      if (responseData.checkout_url) {
        // Open Dodo Payments Overlay Checkout modal directly on the website
        setOverlayCheckoutUrl(responseData.checkout_url);
      } else {
        throw new Error('No checkout URL received from Dodo Payments backend');
      }
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      setCheckoutError(err.message || 'Payment checkout initialization failed.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const connectedCount = accounts.filter(a => a.status === 'connected').length;
  const currentWalletBal = profile?.wallet_balance ? Number(profile.wallet_balance) : 0.00;
  const currentPlan = profile?.plan || 'Growth';
  const subStatus = profile?.subscription_status || 'active';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-mono relative z-20">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-zinc-950 border-r border-white/15 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
            <div 
              onClick={onBackHome}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="bg-white text-ink px-2.5 py-1 font-display font-bold text-xl tracking-tighter group-hover:bg-brand group-hover:text-white transition-all">
                ROCKYT
              </div>
              <span className="text-[10px] text-brand border border-brand/50 bg-brand/10 px-1.5 py-0.5 font-bold uppercase">
                DASHBOARD
              </span>
            </div>
          </div>

          {/* Live Supabase Connection Badge */}
          <div className="bg-zinc-900 border border-white/10 p-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={userAvatar} alt="User Avatar" className="w-9 h-9 rounded-full border border-brand object-cover" />
              <div className="overflow-hidden">
                <span className="text-xs text-white font-bold block truncate">{userName}</span>
                <span className="text-[10px] text-white/60 block truncate">{userEmail}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0" title="Supabase Realtime Channel Active">
              <Radio size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-bold uppercase">LIVE DB</span>
            </div>
          </div>

          {/* Sidebar Tabs */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full p-3 text-xs font-bold uppercase tracking-wider text-left transition-all border flex items-center justify-between ${
                activeTab === 'accounts'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/50 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers size={16} /> Connected Accounts
              </span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 border border-white/20">
                {connectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('apikeys')}
              className={`w-full p-3 text-xs font-bold uppercase tracking-wider text-left transition-all border flex items-center justify-between ${
                activeTab === 'apikeys'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/50 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Key size={16} /> API Key &amp; Logs
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-1.5 py-0.5">
                LIVE
              </span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full p-3 text-xs font-bold uppercase tracking-wider text-left transition-all border flex items-center justify-between ${
                activeTab === 'billing'
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900/50 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <CreditCard size={16} /> Account &amp; Billing
              </span>
              <span className="text-[10px] bg-brand/20 text-brand border border-brand/40 px-1.5 py-0.5">
                DODO PAY
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <button
            onClick={onBackHome}
            className="w-full bg-zinc-900 border border-white/15 text-xs text-white/80 hover:text-white hover:border-brand p-2.5 flex items-center justify-center gap-2 font-bold uppercase transition-colors"
          >
            <ArrowLeft size={14} /> Main Website
          </button>
          <button
            onClick={onSignOut}
            className="w-full bg-red-950/40 border border-red-500/30 text-xs text-red-400 hover:bg-red-900 hover:text-white p-2.5 flex items-center justify-center gap-2 font-bold uppercase transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* TAB 1: CONNECTED ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-8 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/15 pb-6">
              <div>
                <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// SUPABASE REALTIME DB INTEGRATION</span>
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">CONNECTED ACCOUNTS</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 border border-white/15 px-4 py-2 text-xs">
                  <span className="text-white/60">Live Database Connected: </span>
                  <strong className="text-emerald-400 font-bold">{connectedCount} Active</strong>
                </div>
              </div>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultPlatforms.map((platformName) => {
                const matched = accounts.find(a => a.platform.toLowerCase().includes(platformName.toLowerCase()) || platformName.toLowerCase().includes(a.platform.toLowerCase()));
                const isConn = matched?.status === 'connected';

                return (
                  <div 
                    key={platformName}
                    className={`bg-zinc-950 border p-5 transition-all flex flex-col justify-between ${
                      isConn ? 'border-brand/60 shadow-glow' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{platformName}</span>
                        <span className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${
                          isConn
                            ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                            : 'bg-zinc-800 border-white/20 text-white/50'
                        }`}>
                          {isConn ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-xs font-bold text-brand">
                          {platformName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white truncate">{matched?.profile_name || `${platformName} Profile`}</h4>
                          <span className="text-[11px] text-white/60 block">{matched?.username || `@${platformName.toLowerCase().replace(/[^a-z0-9]/g, '')}`}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAccountStatus(platformName, matched)}
                      className={`w-full py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center justify-center gap-1.5 ${
                        isConn
                          ? 'bg-zinc-900 border-white/20 text-white/80 hover:bg-red-950/50 hover:text-red-400 hover:border-red-500/40'
                          : 'bg-brand text-white border-brand hover:bg-white hover:text-ink'
                      }`}
                    >
                      {isConn ? (
                        <>Disconnect Channel</>
                      ) : (
                        <><Plus size={14} /> Connect Account</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: API KEYS & LOGS */}
        {activeTab === 'apikeys' && (
          <div className="space-y-8 max-w-5xl">
            <div className="border-b border-white/15 pb-6">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// SUPABASE AGENT AUTHENTICATION</span>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">API KEYS &amp; REQUEST LOGS</h1>
            </div>

            {/* API Key Box */}
            <div className="bg-zinc-950 border-2 border-white/20 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display font-bold text-xl text-white uppercase">LIVE SECRET API KEY</h3>
                  <p className="text-xs text-white/60">Persisted in Supabase database (`public.user_api_keys`)</p>
                </div>
                <span className="bg-emerald-500/10 border border-emerald-400 text-emerald-400 text-[10px] px-2.5 py-1 font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-black border border-white/20 p-3 font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code className="truncate">{showKey ? apiKey : `${apiKey.substring(0, 12)}••••••••••••••••••••`}</code>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-white/60 hover:text-white ml-2"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <button
                  onClick={copyApiKey}
                  className="bg-brand text-white font-mono text-xs px-5 py-3 font-bold uppercase tracking-wider hover:bg-white hover:text-ink transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey ? 'COPIED' : 'COPY KEY'}
                </button>

                <button
                  onClick={regenerateApiKey}
                  disabled={isRegenerating}
                  className="bg-zinc-900 border border-white/20 text-white/80 hover:text-white font-mono text-xs px-4 py-3 font-bold uppercase hover:border-brand transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                  Regenerate
                </button>
              </div>
            </div>

            {/* API Request Logs Table */}
            <div className="bg-zinc-950 border border-white/15 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="font-display font-bold text-xl text-white uppercase">REAL-TIME API DISPATCH LOGS</h3>
                <span className="text-xs text-emerald-400 font-bold uppercase">Connected to Supabase `public.api_logs`</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-brand uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Activity</th>
                      <th className="pb-3">Platform</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-white/60">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="py-3 font-bold text-white">{log.activity || 'POST /v1/dispatches'}</td>
                          <td className="py-3 text-white/80 uppercase">{log.platform || 'social'}</td>
                          <td className="py-3">
                            <span className="bg-emerald-500/10 border border-emerald-400 text-emerald-400 text-[10px] px-2 py-0.5 font-bold">
                              {log.status_code || 200} OK
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-white/40 italic">
                          No dispatch logs recorded yet in Supabase. Incoming agent requests will stream live here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT & BILLING (DODO PAYMENTS & SUPABASE) */}
        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-6xl">
            <div className="border-b border-white/15 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// DODO PAYMENTS &amp; SUPABASE BILLING ENGINE</span>
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">ACCOUNT &amp; BILLING MATH</h1>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-zinc-900 border border-white/15 px-3 py-1 text-white/80">
                  Plan: <strong className="text-brand uppercase">{currentPlan}</strong>
                </span>
                <span className={`text-xs px-3 py-1 border font-bold uppercase ${
                  subStatus === 'active' 
                    ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' 
                    : 'bg-yellow-500/10 border-yellow-400 text-yellow-400'
                }`}>
                  Status: {subStatus}
                </span>
              </div>
            </div>

            {/* Notification Banners */}
            {checkoutSuccessMsg && (
              <div className="bg-emerald-950/60 border-2 border-emerald-400 p-4 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>{checkoutSuccessMsg}</span>
                </div>
                <button onClick={() => setCheckoutSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs font-bold uppercase">
                  Dismiss
                </button>
              </div>
            )}

            {checkoutError && (
              <div className="bg-red-950/60 border-2 border-red-500 p-4 text-red-300 text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-400 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
                <button onClick={() => setCheckoutError(null)} className="text-red-400 hover:text-white text-xs font-bold uppercase">
                  Dismiss
                </button>
              </div>
            )}

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950 border border-white/20 p-5 relative">
                <span className="text-[10px] text-white/50 uppercase font-bold">Active Connected Accounts</span>
                <div className="font-display font-bold text-4xl text-white mt-2">{connectedCount} Accounts</div>
                <span className="text-[11px] text-brand font-bold mt-1 block">Tier 1 Rate ($6.00 / mo)</span>
              </div>

              <div className="bg-zinc-950 border border-white/20 p-5 relative">
                <span className="text-[10px] text-white/50 uppercase font-bold">Current Wallet Balance</span>
                <div className="font-display font-bold text-4xl text-emerald-400 mt-2">
                  ${currentWalletBal.toFixed(2)}
                </div>
                <span className="text-[11px] text-emerald-400/80 font-bold mt-1 block">Pay-As-You-Go API Credit</span>
              </div>

              <div className="bg-zinc-950 border border-brand p-5 shadow-glow relative">
                <span className="text-[10px] text-brand uppercase font-bold">Estimated Next Invoice</span>
                <div className="font-display font-bold text-4xl text-white mt-2">
                  ${Math.max(0, connectedCount * 6 - 12).toFixed(2)}
                </div>
                <span className="text-[11px] text-white/70 mt-1 block">Includes $12.00 Free Credit</span>
              </div>
            </div>

            {/* SECTION: PLAN SELECTION & CHECKOUT */}
            <div className="bg-zinc-950 border-2 border-white/20 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white uppercase flex items-center gap-2">
                    <Sparkles size={18} className="text-brand" /> SELECT &amp; UPGRADE SUBSCRIPTION PLAN
                  </h3>
                  <p className="text-xs text-white/60">Powered by Dodo Payments secure hosted checkout</p>
                </div>
                <span className="text-[10px] bg-brand/20 text-brand border border-brand/40 px-2 py-1 font-bold uppercase">
                  DODO CHECKOUT API
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Growth Plan Card */}
                <div className={`bg-zinc-900 border p-6 flex flex-col justify-between ${
                  currentPlan.toLowerCase() === 'growth' ? 'border-brand shadow-glow' : 'border-white/15'
                }`}>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">GROWTH PLAN</span>
                      {currentPlan.toLowerCase() === 'growth' && (
                        <span className="text-[9px] bg-brand text-white px-2 py-0.5 font-bold uppercase">CURRENT PLAN</span>
                      )}
                    </div>
                    <div className="font-display font-bold text-3xl text-white mb-2">$49.00 <span className="text-xs font-mono text-white/60">/ month</span></div>
                    <ul className="text-xs text-white/80 space-y-2 mb-6 font-mono border-t border-white/10 pt-4">
                      <li className="flex items-center gap-2"><Check size={14} className="text-brand" /> 1 Active Connected Account</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-brand" /> 16 Platforms REST API &amp; MCP</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-brand" /> Unlimited Webhook Dispatches</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleInitiateCheckout('pdt_0NWDjeAeatQKryEvRe4eb')}
                    disabled={isCheckoutLoading}
                    className="w-full bg-brand text-white font-mono text-xs py-3 uppercase tracking-wider font-bold hover:bg-white hover:text-ink transition-colors flex items-center justify-center gap-2 border border-brand disabled:opacity-50"
                  >
                    {isCheckoutLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>Subscribe Growth Plan ($49/mo) <ArrowUpRight size={14} /></>
                    )}
                  </button>
                </div>

                {/* Scale Plan Card */}
                <div className={`bg-zinc-900 border p-6 flex flex-col justify-between ${
                  currentPlan.toLowerCase() === 'scale' ? 'border-brand shadow-glow' : 'border-white/15'
                }`}>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">SCALE PLAN</span>
                      {currentPlan.toLowerCase() === 'scale' && (
                        <span className="text-[9px] bg-emerald-500 text-black px-2 py-0.5 font-bold uppercase">CURRENT PLAN</span>
                      )}
                    </div>
                    <div className="font-display font-bold text-3xl text-white mb-2">$99.00 <span className="text-xs font-mono text-white/60">/ month</span></div>
                    <ul className="text-xs text-white/80 space-y-2 mb-6 font-mono border-t border-white/10 pt-4">
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Up to 10 Connected Accounts</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Priority Multi-Agent Workspaces</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Dedicated MCP Infrastructure &amp; SLA</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleInitiateCheckout('pdt_0NWDjzl0TS6LNFrVdFZYQ')}
                    disabled={isCheckoutLoading}
                    className="w-full bg-emerald-500 text-black font-mono text-xs py-3 uppercase tracking-wider font-bold hover:bg-white hover:text-ink transition-colors flex items-center justify-center gap-2 border border-emerald-500 disabled:opacity-50"
                  >
                    {isCheckoutLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>Upgrade to Scale ($99/mo) <ArrowUpRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION: WALLET TOP-UP / DEPOSIT */}
            <div className="bg-zinc-950 border-2 border-white/20 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white uppercase flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-400" /> WALLET DEPOSIT &amp; METERED TOP-UP
                  </h3>
                  <p className="text-xs text-white/60">Instantly credit your account wallet balance via Dodo Payments</p>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 px-2 py-1 font-bold uppercase">
                  PAY-AS-YOU-GO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Deposit Amount Selector */}
                <div className="md:col-span-8 space-y-4">
                  <span className="text-xs text-white/70 uppercase font-bold block">Select Deposit Amount:</span>
                  <div className="grid grid-cols-4 gap-3">
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setDepositAmount(amt); setCustomDeposit(''); }}
                        className={`py-3 text-xs font-bold font-mono border transition-all ${
                          depositAmount === amt && !customDeposit
                            ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-glow'
                            : 'bg-zinc-900 text-white border-white/15 hover:border-white/40'
                        }`}
                      >
                        ${amt}.00
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60 font-mono">Custom Amount ($):</span>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      placeholder="Enter custom deposit"
                      value={customDeposit}
                      onChange={(e) => {
                        setCustomDeposit(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setDepositAmount(val);
                      }}
                      className="bg-black border border-white/20 px-4 py-2 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-400 w-48"
                    />
                  </div>
                </div>

                {/* Submit Deposit Action */}
                <div className="md:col-span-4 bg-zinc-900 border border-white/15 p-5 text-center space-y-3">
                  <span className="text-[10px] text-white/60 uppercase block">Selected Deposit Total</span>
                  <div className="font-display font-bold text-3xl text-emerald-400">${depositAmount.toFixed(2)}</div>
                  <button
                    onClick={() => handleInitiateCheckout('pdt_0Nk1w4r59DXb7GepY1sqA', depositAmount)}
                    disabled={isCheckoutLoading || depositAmount <= 0}
                    className="w-full bg-emerald-500 text-black font-mono text-xs py-3 uppercase tracking-wider font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 border border-emerald-500 disabled:opacity-50"
                  >
                    {isCheckoutLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>Deposit Funds <ArrowUpRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION: REALTIME SUPABASE CHECKOUT SESSIONS LOG */}
            <div className="bg-zinc-950 border border-white/15 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="font-display font-bold text-xl text-white uppercase">DODO CHECKOUT SESSIONS (`public.checkout_sessions`)</h3>
                <span className="text-xs text-emerald-400 font-bold uppercase">Realtime Supabase Sync</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-brand uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Created</th>
                      <th className="pb-3">Plan / Item</th>
                      <th className="pb-3">Session ID</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {checkoutSessions.length > 0 ? (
                      checkoutSessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-white/60">{new Date(sess.created_at).toLocaleString()}</td>
                          <td className="py-3 font-bold text-white">{sess.plan}</td>
                          <td className="py-3 font-mono text-[11px] text-white/70">{sess.dodo_session_id.substring(0, 16)}...</td>
                          <td className="py-3">
                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase border ${
                              sess.status === 'completed' 
                                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' 
                                : sess.status === 'pending'
                                ? 'bg-yellow-500/10 border-yellow-400 text-yellow-400'
                                : 'bg-red-500/10 border-red-400 text-red-400'
                            }`}>
                              {sess.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {sess.checkout_url && sess.status === 'pending' ? (
                              <button
                                onClick={() => setOverlayCheckoutUrl(sess.checkout_url)}
                                className="text-brand hover:underline flex items-center gap-1 font-bold text-[11px]"
                              >
                                Resume <ExternalLink size={12} />
                              </button>
                            ) : (
                              <span className="text-white/40 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-white/40 italic">
                          No checkout sessions logged in Supabase yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION: REALTIME SUPABASE WALLET LEDGER LOG */}
            <div className="bg-zinc-950 border border-white/15 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="font-display font-bold text-xl text-white uppercase">WALLET LEDGER TRANSACTIONS (`public.wallet_transactions`)</h3>
                <span className="text-xs text-emerald-400 font-bold uppercase">Realtime Audit Ledger</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-emerald-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {walletTxns.length > 0 ? (
                      walletTxns.map((txn) => (
                        <tr key={txn.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-white/60">{new Date(txn.created_at).toLocaleString()}</td>
                          <td className="py-3 font-bold text-white">{txn.description}</td>
                          <td className="py-3 uppercase text-white/80">{txn.type}</td>
                          <td className="py-3 text-emerald-400 font-bold">+${Number(txn.amount).toFixed(2)}</td>
                          <td className="py-3 text-white/90">${txn.balance_after ? Number(txn.balance_after).toFixed(2) : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-white/40 italic">
                          No wallet transactions recorded yet in Supabase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>

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
