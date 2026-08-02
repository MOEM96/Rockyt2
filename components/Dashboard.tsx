import React, { useState, useEffect } from 'react';
import { Layers, Key, CreditCard, LogOut, ArrowLeft, Check, Copy, Eye, EyeOff, RefreshCw, Plus, Radio, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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

const defaultPlatforms = [
  'Twitter / X', 'Instagram', 'WhatsApp Business', 'LinkedIn', 'TikTok',
  'Meta Ads Manager', 'Google Ads', 'Telegram Bot', 'Discord Webhook', 'Slack App'
];

const Dashboard: React.FC<DashboardProps> = ({ userSession, onBackHome, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'apikeys' | 'billing'>('accounts');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<ApiLogRow[]>([]);
  const [apiKey, setApiKey] = useState<string>('rockyt_live_99f381a94b8e21c890192847a');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // User Profile
  const userEmail = userSession?.email || 'moamenemam966@gmail.com';
  const userName = userSession?.name || 'Moamen Emam';
  const userAvatar = userSession?.picture || 'https://lh3.googleusercontent.com/a/ACg8ocL_PcCi9QCqJ-hfTUKklDZ6Q2RWJfer2LjarrUA0X2-4jNFuQ=s96-c';
  const userId = userSession?.id;

  // 1. Fetch Real Live Data from Supabase
  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      // A. Fetch Real Connected Accounts from Supabase
      const { data: dbAccounts, error: accErr } = await supabase
        .from('connected_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!accErr && dbAccounts) {
        setAccounts(dbAccounts as ConnectedAccount[]);
      }

      // B. Fetch Real User API Keys from Supabase
      const { data: dbKeys, error: keyErr } = await supabase
        .from('user_api_keys')
        .select('id, user_id, key_prefix, revoked, created_at')
        .eq('revoked', false)
        .order('created_at', { ascending: false });

      if (!keyErr && dbKeys && dbKeys.length > 0) {
        setApiKeys(dbKeys as ApiKeyRow[]);
        setApiKey(`${dbKeys[0].key_prefix}••••••••••••••••••••`);
      }

      // C. Fetch Real API Logs from Supabase
      const { data: dbLogs } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbLogs) {
        setLogs(dbLogs as ApiLogRow[]);
      }
    } catch (err) {
      console.warn('[Dashboard] Supabase live fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Setup Realtime Channel Listener
  useEffect(() => {
    fetchLiveData();

    // Subscribe to real-time database updates from Supabase for connected_accounts table
    const realtimeChannel = supabase
      .channel('public:connected_accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connected_accounts' }, () => {
        fetchLiveData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_api_keys' }, () => {
        fetchLiveData();
      })
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

  const connectedCount = accounts.filter(a => a.status === 'connected').length;

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
                PRORATED
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

        {/* TAB 3: ACCOUNT & BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-5xl">
            <div className="border-b border-white/15 pb-6">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// DAILY METERED INVOICING</span>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">ACCOUNT &amp; BILLING MATH</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950 border border-white/20 p-5">
                <span className="text-[10px] text-white/50 uppercase font-bold">Active Connected Accounts</span>
                <div className="font-display font-bold text-4xl text-white mt-2">{connectedCount} Accounts</div>
                <span className="text-[11px] text-brand font-bold mt-1 block">Tier 1 Rate ($6.00 / mo)</span>
              </div>

              <div className="bg-zinc-950 border border-white/20 p-5">
                <span className="text-[10px] text-white/50 uppercase font-bold">Monthly Free Credit</span>
                <div className="font-display font-bold text-4xl text-emerald-400 mt-2">-$12.00</div>
                <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Covers 2 Accounts Free</span>
              </div>

              <div className="bg-zinc-950 border border-brand p-5 shadow-glow">
                <span className="text-[10px] text-brand uppercase font-bold">Estimated Next Invoice</span>
                <div className="font-display font-bold text-4xl text-white mt-2">
                  ${Math.max(0, connectedCount * 6 - 12).toFixed(2)}
                </div>
                <span className="text-[11px] text-white/70 mt-1 block">Live Supabase Database Metered</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
