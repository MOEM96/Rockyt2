import React, { useState } from 'react';
import { 
  MessageSquare, Zap, Megaphone, LayoutTemplate, Radio, 
  Bot, Users, Settings, Phone, ShieldCheck, ExternalLink, 
  Plus, LogOut, ArrowLeft, Activity, Bell, Sparkles, CheckCircle2 
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
  const [wabaAccount, setWabaAccount] = useState({
    name: 'Rockyt WhatsApp Business Hub',
    phone: '+1 (415) 555-0199',
    status: 'CONNECTED',
    qualityRating: 'GREEN',
    tier: 'TIER_100K',
  });

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
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  API & CAPI Pro
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {wabaAccount.phone} • Quality: <span className="text-emerald-400 font-bold">{wabaAccount.qualityRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right User Profile & Connection Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">WABA Settings</span>
          </button>

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
        {activeTab === 'inbox' && <WhatsAppInbox />}
        {activeTab === 'automations' && <AutomationBuilder />}
        {activeTab === 'ctwa_capi' && <CTWAHub />}
        {activeTab === 'templates' && <TemplateStudio />}
        {activeTab === 'broadcasts' && <BroadcastManager />}
        {activeTab === 'mcp_gateway' && <MCPGateway />}
        {activeTab === 'contacts' && <ContactsCRM />}
      </main>

      {/* ─── WABA Embedded / Headless Connection Modal ─── */}
      <WABAConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(acc) => {
          setWabaAccount({
            name: acc.verified_name || 'Rockyt WhatsApp Business Hub',
            phone: '+1 (415) 555-0199',
            status: 'CONNECTED',
            qualityRating: 'GREEN',
            tier: 'TIER_100K',
          });
        }}
      />
    </div>
  );
};

export default WhatsAppDashboard;
