import React, { useState, useEffect } from 'react';
import { Layers, Key, CreditCard, LogOut, ArrowLeft, Check, Copy, Eye, EyeOff, RefreshCw, Plus, Bot, ShieldCheck, Zap, Terminal, Activity, FileText, CheckCircle2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';

interface DashboardProps {
  userSession?: {
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
  platform: string;
  name: string;
  handle: string;
  avatar: string;
  status: 'connected' | 'disconnected';
  connectedAt?: string;
}

const initialAccounts: ConnectedAccount[] = [
  { id: '1', platform: 'Twitter / X', name: 'Moamen Emam', handle: '@moamen_dev', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', status: 'connected', connectedAt: '2026-08-01' },
  { id: '2', platform: 'Instagram', name: 'Moamen Studio', handle: '@moamen.ai', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', status: 'connected', connectedAt: '2026-08-01' },
  { id: '3', platform: 'WhatsApp Business', name: 'Rockyt Support Bot', handle: '+1 (415) 555-0199', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', status: 'connected', connectedAt: '2026-08-02' },
  { id: '4', platform: 'LinkedIn', name: 'Moamen Emam', handle: 'in/moamen-emam', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', status: 'connected', connectedAt: '2026-08-02' },
  { id: '5', platform: 'TikTok', name: 'AI Dispatches', handle: '@rockyt_ai', avatar: '', status: 'disconnected' },
  { id: '6', platform: 'Meta Ads Manager', name: 'Primary Ad Account', handle: 'act_99182910', avatar: '', status: 'disconnected' },
  { id: '7', platform: 'Google Ads', name: 'Search & Display', handle: 'cid_4491029', avatar: '', status: 'disconnected' },
  { id: '8', platform: 'Telegram Bot', name: 'Dispatches Channel', handle: '@rockyt_bot', avatar: '', status: 'disconnected' },
  { id: '9', platform: 'Discord Webhook', name: 'Dev Server', handle: '#agent-logs', avatar: '', status: 'disconnected' },
  { id: '10', platform: 'Slack App', name: 'Workplace Ops', handle: '#general', avatar: '', status: 'disconnected' },
];

const mockLogs = [
  { id: 'log_01', timestamp: '2026-08-02 20:28:14', endpoint: 'POST /v1/posts', platform: 'x, instagram', status: 200, latency: '42ms' },
  { id: 'log_02', timestamp: '2026-08-02 20:15:02', endpoint: 'POST /v1/whatsapp/messages', platform: 'whatsapp', status: 200, latency: '38ms' },
  { id: 'log_03', timestamp: '2026-08-02 19:44:21', endpoint: 'GET /v1/accounts', platform: 'all', status: 200, latency: '18ms' },
  { id: 'log_04', timestamp: '2026-08-02 18:30:00', endpoint: 'POST /v1/workflows/trigger', platform: 'n8n', status: 200, latency: '65ms' },
];

const Dashboard: React.FC<DashboardProps> = ({ userSession, onBackHome, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'apikeys' | 'billing'>('accounts');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(initialAccounts);
  const [apiKey, setApiKey] = useState<string>('rockyt_live_99f381a94b8e21c890192847a');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Parse user email/name fallback
  const userEmail = userSession?.email || 'moamenemam966@gmail.com';
  const userName = userSession?.name || 'Moamen Emam';
  const userAvatar = userSession?.picture || 'https://lh3.googleusercontent.com/a/ACg8ocL_PcCi9QCqJ-hfTUKklDZ6Q2RWJfer2LjarrUA0X2-4jNFuQ=s96-c';

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const regenerateApiKey = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newKey = `rockyt_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      setApiKey(newKey);
      setIsRegenerating(false);
    }, 800);
  };

  const toggleAccountStatus = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const nextStatus = acc.status === 'connected' ? 'disconnected' : 'connected';
        return { ...acc, status: nextStatus };
      }
      return acc;
    }));
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

          {/* User Profile Card */}
          <div className="bg-zinc-900 border border-white/10 p-3 mb-6 flex items-center gap-3">
            <img src={userAvatar} alt="User Avatar" className="w-9 h-9 rounded-full border border-brand object-cover" />
            <div className="overflow-hidden">
              <span className="text-xs text-white font-bold block truncate">{userName}</span>
              <span className="text-[10px] text-white/60 block truncate">{userEmail}</span>
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
            {/* Top Stat Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/15 pb-6">
              <div>
                <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// SOCIAL &amp; MESSAGING PIPELINE</span>
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">CONNECTED ACCOUNTS</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 border border-white/15 px-4 py-2 text-xs">
                  <span className="text-white/60">Active Metered: </span>
                  <strong className="text-brand font-bold">{connectedCount} Channels</strong>
                </div>
              </div>
            </div>

            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div 
                  key={acc.id}
                  className={`bg-zinc-950 border p-5 transition-all flex flex-col justify-between ${
                    acc.status === 'connected' ? 'border-brand/60 shadow-glow' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{acc.platform}</span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${
                        acc.status === 'connected'
                          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                          : 'bg-zinc-800 border-white/20 text-white/50'
                      }`}>
                        {acc.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      {acc.avatar ? (
                        <img src={acc.avatar} alt={acc.name} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-xs font-bold text-brand">
                          {acc.platform.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-white truncate">{acc.name}</h4>
                        <span className="text-[11px] text-white/60 block">{acc.handle}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAccountStatus(acc.id)}
                    className={`w-full py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center justify-center gap-1.5 ${
                      acc.status === 'connected'
                        ? 'bg-zinc-900 border-white/20 text-white/80 hover:bg-red-950/50 hover:text-red-400 hover:border-red-500/40'
                        : 'bg-brand text-white border-brand hover:bg-white hover:text-ink'
                    }`}
                  >
                    {acc.status === 'connected' ? (
                      <>Disconnect Channel</>
                    ) : (
                      <><Plus size={14} /> Connect Account</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: API KEYS & LOGS */}
        {activeTab === 'apikeys' && (
          <div className="space-y-8 max-w-5xl">
            <div className="border-b border-white/15 pb-6">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// AGENT AUTHENTICATION</span>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-white uppercase">API KEYS &amp; REQUEST LOGS</h1>
            </div>

            {/* API Key Box */}
            <div className="bg-zinc-950 border-2 border-white/20 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display font-bold text-xl text-white uppercase">LIVE SECRET API KEY</h3>
                  <p className="text-xs text-white/60">Use this key in your SDKs (`ROCKYT_API_KEY`) and MCP config (`@rockyt/mcp-server`)</p>
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
                <span className="text-xs text-white/50">Last 24 Hours</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-brand uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Endpoint</th>
                      <th className="pb-3">Platforms</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white/60">{log.timestamp}</td>
                        <td className="py-3 font-bold text-white">{log.endpoint}</td>
                        <td className="py-3 text-white/80 uppercase text-[11px]">{log.platform}</td>
                        <td className="py-3">
                          <span className="bg-emerald-500/10 border border-emerald-400 text-emerald-400 text-[10px] px-2 py-0.5 font-bold">
                            {log.status} OK
                          </span>
                        </td>
                        <td className="py-3 text-white/60">{log.latency}</td>
                      </tr>
                    ))}
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

            {/* Metered Summary Card */}
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
                <span className="text-[11px] text-white/70 mt-1 block">Daily proration auto-applied</span>
              </div>
            </div>

            {/* Invoicing Policy */}
            <div className="bg-zinc-950 border border-white/15 p-6 space-y-4">
              <h3 className="font-display font-bold text-xl text-white uppercase border-b border-white/10 pb-3">
                GRADUATED TIER MATH &amp; PRORATION MECHANICS
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Rockyt measures connected accounts per day. Every calendar day an account is connected generates 1 account-day. At the end of each month, total account-days are divided by 30 and run through the graduated rate ladder:
              </p>
              <ul className="text-xs font-mono space-y-2 text-white/80 pl-4 border-l-2 border-brand">
                <li>• <strong>Tier 1 (1–10 accounts)</strong>: $6.00 / month per billable unit</li>
                <li>• <strong>Tier 2 (11–100 accounts)</strong>: $3.00 / month per billable unit (50% discount)</li>
                <li>• <strong>Tier 3 (101+ accounts)</strong>: $1.00 / month per billable unit</li>
                <li>• <strong>Monthly Credit</strong>: Flat -$12.00 grant automatically subtracted from gross total.</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
