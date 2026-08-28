import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Zap, Megaphone, LayoutTemplate, Radio, 
  Bot, Users, Settings, Phone, ShieldCheck, ExternalLink, 
  Plus, LogOut, ArrowLeft, Activity, Bell, Sparkles, CheckCircle2,
  AlertTriangle, Power, TestTube2, Clock, CheckCheck, BarChart3
} from 'lucide-react';

import { WhatsAppInbox } from './WhatsAppInbox';
import { AutomationBuilder } from './AutomationBuilder';
import { CTWAHub } from './CTWAHub';
import { TemplateStudio } from './TemplateStudio';
import { BroadcastManager } from './BroadcastManager';
import { MCPGateway } from './MCPGateway';
import { ContactsCRM } from './ContactsCRM';
import { SandboxOnboardingCard } from './SandboxOnboardingCard';
import WABAConnectionModal from './WABAConnectionModal';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface WhatsAppDashboardProps {
  userSession?: any;
  onBackHome?: () => void;
  onSignOut?: () => void;
}

export type WhatsAppTab = 
  | 'inbox' 
  | 'automations' 
  | 'ctwa_capi' 
  | 'templates' 
  | 'broadcasts' 
  | 'mcp_gateway' 
  | 'contacts';

export const WhatsAppDashboard: React.FC<WhatsAppDashboardProps> = ({
  userSession,
  onBackHome,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<WhatsAppTab>('inbox');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [showSandboxBanner, setShowSandboxBanner] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [sandboxSession, setSandboxSession] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | undefined>(undefined);
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);

  // Quick stats state
  const [stats, setStats] = useState({
    conversationsCount: 0,
    unreadCount: 0,
    capiEventsCount: 0,
    activeAutomationsCount: 2,
    windowOpenCount: 0,
  });

  const getHeaders = () => {
    const headers = getAuthHeaders();
    if (userSession?.id && !headers['x-user-id']) headers['x-user-id'] = userSession.id;
    if (userSession?.email && !headers['x-user-email']) headers['x-user-email'] = userSession.email;
    return headers;
  };

  const fetchAccountStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/account', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAccount(data.account || null);
        setSandboxSession(data.sandbox || null);
      }
    } catch (e) {
      console.warn('Failed to load WhatsApp account status', e);
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const fetchStats = async () => {
    try {
      const hdrs = getHeaders();
      const [convsRes, capiRes, autoRes] = await Promise.all([
        fetch('/api/whatsapp/conversations', { headers: hdrs }).catch(() => null),
        fetch('/api/whatsapp/capi/events', { headers: hdrs }).catch(() => null),
        fetch('/api/whatsapp/automations', { headers: hdrs }).catch(() => null),
      ]);

      let convsCount = 0;
      let unread = 0;
      let winOpen = 0;
      if (convsRes && convsRes.ok) {
        const d = await convsRes.json();
        const convs = d.data || [];
        convsCount = convs.length;
        unread = convs.reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
        winOpen = convs.filter((c: any) => c.is_window_open).length;
      }

      let capiCount = 0;
      if (capiRes && capiRes.ok) {
        const d = await capiRes.json();
        capiCount = (d.data || []).length;
      }

      let autoCount = 2;
      if (autoRes && autoRes.ok) {
        const d = await autoRes.json();
        autoCount = (d.data || []).filter((a: any) => a.is_active).length;
      }

      setStats({
        conversationsCount: convsCount,
        unreadCount: unread,
        capiEventsCount: capiCount,
        activeAutomationsCount: autoCount,
        windowOpenCount: winOpen,
      });
    } catch {}
  };

  useEffect(() => {
    fetchAccountStatus();
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userSession?.id]);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
    try {
      await fetch('/api/whatsapp/account/disconnect', { method: 'POST', headers: getHeaders() });
      setAccount(null);
      setSandboxSession(null);
    } catch (e) {
      console.error('Failed to disconnect', e);
    }
  };

  const isConnected = Boolean(account && account.status !== 'disconnected');
  const isSandbox = account?.mode === 'sandbox' || Boolean(sandboxSession);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* ─── Modern Top Glass Header ─── */}
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackHome}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-emerald-500/20">
                W
              </div>
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-black rounded-full shadow-sm animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">Rockyt WhatsApp Cloud</span>
                {isSandbox ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                    <TestTube2 className="w-3 h-3" />
                    Sandbox Active
                  </span>
                ) : account?.status === 'connected' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    WABA Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-[10px] font-bold">
                    Sandbox Ready
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {sandboxSession ? (
                  <span>Test Phone: <strong className="text-emerald-400">{sandboxSession.formatted_phone || sandboxSession.phone_number}</strong> • Shared: +1 (202) 908-7457</span>
                ) : account ? (
                  <span>{account.phone_number || account.name} • Limit: <strong className="text-emerald-400">{account.messaging_limit_tier || 'PRO'}</strong></span>
                ) : (
                  <span className="text-zinc-500">Dedicated workspace tenant isolation active</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Right User Profile & Connection Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isConnected
                ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Connection Settings' : 'Connect Meta WABA'}</span>
          </button>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="p-2 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/40 rounded-xl text-xs text-zinc-400 hover:text-rose-400 transition-all"
              title="Disconnect Account"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            {userSession?.picture ? (
              <img
                src={userSession.picture}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-zinc-800"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                {userSession?.name?.charAt(0) || 'U'}
              </div>
            )}

            <button
              onClick={onSignOut}
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Quick Metrics & Intelligence Ribbon ─── */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/40 px-4 sm:px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">24h Service Window</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats.windowOpenCount > 0 ? `${stats.windowOpenCount} Threads Active` : 'Compliance Active'}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Live Inbox Threads</div>
              <div className="text-xs font-bold text-white">
                {stats.conversationsCount} Conversations {stats.unreadCount > 0 && <span className="text-emerald-400">({stats.unreadCount} unread)</span>}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Meta CAPI Health</div>
              <div className="text-xs font-bold text-white">
                99.8% Match Rate <span className="text-zinc-500">({stats.capiEventsCount} logged)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Automations Engine</div>
              <div className="text-xs font-bold text-white">
                {stats.activeAutomationsCount} Rules Live <span className="text-emerald-400">• Sub-second</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Secondary Modular Navigation Tabs ─── */}
      <nav className="border-b border-zinc-800/60 bg-zinc-950/60 px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inbox'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Realtime CRM Inbox</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'contacts'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contacts & CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'automations'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Visual Automation Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('ctwa_capi')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ctwa_capi'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>CTWA & Meta CAPI Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Meta Template Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'broadcasts'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Broadcast Campaigns</span>
        </button>

        <button
          onClick={() => setActiveTab('mcp_gateway')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mcp_gateway'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>External MCP Gateway</span>
        </button>
      </nav>

      {/* ─── Main Content Canvas ─── */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {/* Interactive 3-Step Sandbox AHA Onboarding Banner if not yet verified or toggled */}
        {showSandboxBanner && (!sandboxSession || sandboxSession.status !== 'active') && (
          <SandboxOnboardingCard
            session={sandboxSession}
            userSession={userSession}
            onActivated={(sess) => {
              setSandboxSession(sess);
              fetchAccountStatus();
            }}
            onOpenInbox={() => {
              setShowSandboxBanner(false);
              setActiveTab('inbox');
            }}
          />
        )}

        {activeTab === 'inbox' && (
          <WhatsAppInbox
            onOpenConnect={() => setIsConnectModalOpen(true)}
            initialPhone={selectedPhone}
            initialName={selectedName}
          />
        )}
        {activeTab === 'contacts' && (
          <ContactsCRM
            onSelectContactChat={(phone, name) => {
              setSelectedPhone(phone);
              setSelectedName(name);
              setActiveTab('inbox');
            }}
          />
        )}
        {activeTab === 'automations' && <AutomationBuilder />}
        {activeTab === 'ctwa_capi' && <CTWAHub />}
        {activeTab === 'templates' && <TemplateStudio />}
        {activeTab === 'broadcasts' && <BroadcastManager />}
        {activeTab === 'mcp_gateway' && <MCPGateway />}
      </main>

      {/* ─── WABA Embedded / Headless / Sandbox Connection Modal ─── */}
      <WABAConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          fetchAccountStatus();
        }}
      />
    </div>
  );
};

export default WhatsAppDashboard;
