import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Zap, Megaphone, LayoutTemplate, Radio, 
  Bot, Users, Settings, Phone, ShieldCheck, ExternalLink, 
  Plus, LogOut, ArrowLeft, Activity, Bell, Sparkles, CheckCircle2,
  AlertTriangle, Power, TestTube2
} from 'lucide-react';

import { WhatsAppInbox } from './WhatsAppInbox';
import { AutomationBuilder } from './AutomationBuilder';
import { CTWAHub } from './CTWAHub';
import { TemplateStudio } from './TemplateStudio';
import { BroadcastManager } from './BroadcastManager';
import { MCPGateway } from './MCPGateway';
import { ContactsCRM } from './ContactsCRM';
import WABAConnectionModal from './WABAConnectionModal';

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
  const [account, setAccount] = useState<any>(null);
  const [sandboxSession, setSandboxSession] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | undefined>(undefined);
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);

  const fetchAccountStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/account');
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

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
    try {
      await fetch('/api/whatsapp/account/disconnect', { method: 'POST' });
      setAccount(null);
      setSandboxSession(null);
    } catch (e) {
      console.error('Failed to disconnect', e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* ─── Top Main Navigation Bar ─── */}
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-emerald-500/20">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">Rockyt WhatsApp Cloud</span>
                {account?.mode === 'sandbox' ? (
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
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold">
                    Disconnected
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {account ? (
                  <span>{account.phone_number || account.name} • Tier: <strong className="text-emerald-400">{account.messaging_limit_tier || 'PRO'}</strong></span>
                ) : (
                  <span className="text-zinc-500">No WhatsApp account connected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Right User Profile & Connection Actions */}
        <div className="flex items-center gap-3">
          {account ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Account Settings</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="p-1.5 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/40 rounded-xl text-xs text-zinc-400 hover:text-rose-400 transition-all"
                title="Disconnect Account"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect WhatsApp</span>
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

      {/* Disconnected Notice Banner if no account */}
      {!isLoadingAccount && !account && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-amber-950/30 border-b border-emerald-500/20 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-zinc-200">No WhatsApp account connected yet. </span>
              <span className="text-zinc-400">Connect your Meta WhatsApp Business Account or activate developer sandbox for instant live testing.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              Connect WhatsApp / Sandbox
            </button>
          </div>
        </div>
      )}

      {/* ─── Secondary Modular Navigation Tabs ─── */}
      <nav className="border-b border-zinc-800/60 bg-zinc-950/60 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
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
          <span>External MCP & Agent Gateway</span>
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
      </nav>

      {/* ─── Main Content Canvas ─── */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'inbox' && (
          <WhatsAppInbox
            onOpenConnect={() => setIsConnectModalOpen(true)}
            initialPhone={selectedPhone}
            initialName={selectedName}
          />
        )}
        {activeTab === 'automations' && <AutomationBuilder />}
        {activeTab === 'ctwa_capi' && <CTWAHub />}
        {activeTab === 'templates' && <TemplateStudio />}
        {activeTab === 'broadcasts' && <BroadcastManager />}
        {activeTab === 'mcp_gateway' && <MCPGateway />}
        {activeTab === 'contacts' && (
          <ContactsCRM
            onSelectContactChat={(phone, name) => {
              setSelectedPhone(phone);
              setSelectedName(name);
              setActiveTab('inbox');
            }}
          />
        )}
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
