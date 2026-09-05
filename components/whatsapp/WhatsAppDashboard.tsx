import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Zap, Megaphone, LayoutTemplate, Radio, 
  Bot, Users, Settings, Phone, ShieldCheck, ExternalLink, 
  Plus, LogOut, ArrowLeft, Bell, Sparkles, CheckCircle2,
  AlertTriangle, Power, Clock, CheckCheck, BarChart3, ChevronDown,
  ChevronRight, Calendar, List, RefreshCw, Eye, CornerDownLeft,
  Send, XCircle, Loader2, Layers, HelpCircle, UserCheck, Play,
  Share2, ShoppingBag, Target, ArrowRight, Check, Info
} from 'lucide-react';

import { WhatsAppInbox } from './WhatsAppInbox';
import { AutomationBuilder } from './AutomationBuilder';
import { CTWAHub } from './CTWAHub';
import { TemplateStudio } from './TemplateStudio';
import { BroadcastManager } from './BroadcastManager';
import { MCPGateway } from './MCPGateway';
import { ContactsCRM } from './ContactsCRM';
import WABAConnectionModal from './WABAConnectionModal';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface WhatsAppDashboardProps {
  userSession?: any;
  onBackHome?: () => void;
  onSignOut?: () => void;
}

export type DashboardView = 
  | 'setup'
  | 'campaigns'
  | 'inbox'
  | 'contacts'
  | 'astra'
  | 'automations'
  | 'commerce'
  | 'ads'
  | 'analytics'
  | 'connectors'
  | 'settings';

export const WhatsAppDashboard: React.FC<WhatsAppDashboardProps> = ({
  userSession,
  onBackHome,
  onSignOut,
}) => {
  // Navigation views
  const [currentView, setCurrentView] = useState<DashboardView>('setup');
  const [campaignSubView, setCampaignSubView] = useState<'overview' | 'templates' | 'scheduled'>('overview');
  const [campaignChannel, setCampaignChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [selectedChannelPill, setSelectedChannelPill] = useState<'whatsapp' | 'instagram' | 'messenger' | 'tiktok'>('whatsapp');
  
  // UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [connectorsExpanded, setConnectorsExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [plannerView, setPlannerView] = useState<'calendar' | 'list'>('calendar');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    { sender: 'bot', text: 'Hi Moamen! I am your Astra AI WhatsApp Assistant. How can I help you set up your store today?', time: 'Just now' }
  ]);
  const [inputChatText, setInputChatText] = useState('');

  // Account and Live Real-Time API states
  const [account, setAccount] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [campaignOverview, setCampaignOverview] = useState<any>(null);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<any[]>([]);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);
  const [oauthBanner, setOauthBanner] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({
    1: false,
    2: true, // Astra pre-configured
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
  });

  const userName = userSession?.name || 'Moamen';

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
        if (data.account && data.account.status !== 'disconnected') {
          setCompletedSteps(prev => ({ ...prev, 1: true }));
        } else {
          setCompletedSteps(prev => ({ ...prev, 1: false }));
        }
      }
    } catch (e) {
      console.warn('Failed to load WhatsApp account status', e);
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const fetchCampaignMetrics = async () => {
    try {
      setIsRefreshingMetrics(true);
      const [ovRes, schedRes] = await Promise.all([
        fetch('/api/whatsapp/campaigns/overview', { headers: getHeaders() }),
        fetch('/api/whatsapp/campaigns/scheduled', { headers: getHeaders() }),
      ]);
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setCampaignOverview(ovData.overview || null);
      }
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setScheduledCampaigns(schedData.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch campaign metrics:', err);
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
    fetchCampaignMetrics();

    // Live Real-Time refresh interval (every 4 seconds)
    const interval = setInterval(() => {
      fetchAccountStatus();
      fetchCampaignMetrics();
    }, 4000);

    // Detect return from Meta Headless OAuth
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('waba') === 'connected' || searchParams.get('connected') === 'true') {
      setOauthBanner('🎉 WhatsApp Business Account successfully authenticated via Meta Headless OAuth (Zero 3rd-party branding)!');
      fetchAccountStatus();
      fetchCampaignMetrics();
      setCompletedSteps(prev => ({ ...prev, 1: true }));
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setOauthBanner(null), 8000);
    } else if (searchParams.get('tempToken')) {
      setIsConnectModalOpen(true);
    }

    return () => clearInterval(interval);
  }, [userSession?.id]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChatText.trim()) return;
    const userMsg = inputChatText;
    setInputChatText('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: 'Just now' }]);

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: `Got it! I am simulating your WhatsApp Cloud response for: "${userMsg}". Your Meta WhatsApp Business API webhook is live!`, 
          time: 'Just now' 
        }
      ]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col font-sans selection:bg-[#00D084] selection:text-white">
      
      {/* ─────────────────────────────────────────────────────────────
          OAUTH RETURN SUCCESS BANNER
      ───────────────────────────────────────────────────────────── */}
      {oauthBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} />
          <span>{oauthBanner}</span>
          <button 
            onClick={() => setOauthBanner(null)} 
            className="ml-3 text-emerald-100 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP TRIAL NOTIFICATION BANNER (Exact Match to Images)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#111827] text-white px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium z-50">
        <div className="flex items-center gap-2">
          <span>
            You have <strong className="text-white font-bold">6 days</strong> to explore this{' '}
            <strong className="text-white font-bold">Trial account</strong>. Connect your preferred channel to unlock all features.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-xs shadow-sm transition-all"
          >
            Connect Channel
          </button>
          <button
            onClick={() => alert('Trial is active. 6 days remaining.')}
            className="px-4 py-1.5 rounded-full bg-[#1f2937] hover:bg-[#374151] border border-gray-600 text-white font-semibold text-xs transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP HEADER APPLICATION BAR (Exact Match to Images)
      ───────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCurrentView('setup')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#00D084] flex items-center justify-center text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.12-1.33c1.43.83 3.09 1.33 4.88 1.33 5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
              </svg>
            </div>
            <div className="flex items-baseline">
              <span className="font-sans font-black text-2xl tracking-tight text-gray-900">
                rockyt
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] ml-0.5"></span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          
          {/* Account Setup Progress Pill */}
          <button
            onClick={() => setCurrentView('setup')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'setup'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'text-gray-700 hover:text-emerald-700 hover:bg-gray-50'
            }`}
          >
            <span>Account Setup</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              {Object.values(completedSteps).filter(Boolean).length}/7
            </span>
          </button>

          {/* Book a Demo Button */}
          <button
            onClick={() => alert('Booking demo with a Rockyt Solutions Specialist...')}
            className="px-4 py-1.5 rounded-full border border-[#00D084] text-[#00945e] hover:bg-emerald-50 text-xs font-bold transition-all"
          >
            Book a demo
          </button>

          {/* Notification Bell */}
          <button 
            onClick={() => alert('You have no unread notifications.')}
            className="relative p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 pl-2 border-l border-gray-200 focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300 shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 text-xs">
                <div className="p-3 border-b border-gray-100">
                  <div className="font-bold text-gray-900">{userName}</div>
                  <div className="text-[11px] text-gray-500 truncate">{userSession?.email || 'moamen@company.com'}</div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Trial Account • 6 Days
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setProfileDropdownOpen(false); setCurrentView('setup'); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Setup Guide
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); setCurrentView('settings'); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); onBackHome?.(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Return to Website
                  </button>
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <button
                    onClick={() => { setProfileDropdownOpen(false); onSignOut?.(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-1.5"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN LAYOUT: SIDEBAR + CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── PRIMARY SIDEBAR (Exact Match to Images) ─── */}
        <aside className={`${isSidebarCollapsed ? 'w-18' : 'w-56'} bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-200 z-30 shrink-0 select-none`}>
          
          <div className="py-4 px-3 space-y-1 overflow-y-auto">
            
            {/* Campaigns */}
            <button
              onClick={() => setCurrentView('campaigns')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'campaigns'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Megaphone size={18} className={currentView === 'campaigns' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Campaigns</span>}
            </button>

            {/* Team Inbox */}
            <button
              onClick={() => setCurrentView('inbox')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'inbox'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={18} className={currentView === 'inbox' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Team Inbox</span>}
            </button>

            {/* Contacts */}
            <button
              onClick={() => setCurrentView('contacts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'contacts'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users size={18} className={currentView === 'contacts' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Contacts</span>}
            </button>

            {/* Astra (AI) */}
            <button
              onClick={() => setCurrentView('astra')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'astra'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Sparkles size={18} className={currentView === 'astra' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Astra</span>}
            </button>

            {/* Automations */}
            <button
              onClick={() => setCurrentView('automations')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'automations'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Zap size={18} className={currentView === 'automations' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Automations</span>}
            </button>

            {/* Commerce */}
            <button
              onClick={() => setCurrentView('commerce')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'commerce'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag size={18} className={currentView === 'commerce' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Commerce</span>}
            </button>

            {/* Ads */}
            <button
              onClick={() => setCurrentView('ads')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'ads'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Target size={18} className={currentView === 'ads' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Ads</span>}
            </button>

            {/* Analytics */}
            <button
              onClick={() => setCurrentView('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'analytics'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={18} className={currentView === 'analytics' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Analytics</span>}
            </button>

            {/* Connectors (Expandable) */}
            <div>
              <button
                onClick={() => setConnectorsExpanded(!connectorsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Share2 size={18} className="text-gray-400" />
                  {!isSidebarCollapsed && <span>Connectors</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${connectorsExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {connectorsExpanded && !isSidebarCollapsed && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button 
                    onClick={() => setCurrentView('connectors')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    API
                  </button>
                  <button 
                    onClick={() => setCurrentView('connectors')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Integrations
                  </button>
                  <button 
                    onClick={() => setCurrentView('connectors')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Webhooks
                  </button>
                </div>
              )}
            </div>

            {/* Settings (Expandable) */}
            <div>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-gray-400" />
                  {!isSidebarCollapsed && <span>Settings</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {settingsExpanded && !isSidebarCollapsed && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button 
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    User Management
                  </button>
                  <button 
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Account Details
                  </button>
                  <button 
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Channels
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Bottom: Collapse Button */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center">
                <ArrowLeft size={12} className={`transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </div>
              {!isSidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

        </aside>

        {/* ─── SECONDARY SUB-SIDEBAR (When in Campaigns View - Exact Match to Image 2) ─── */}
        {currentView === 'campaigns' && (
          <aside className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col justify-between shrink-0 select-none">
            <div className="space-y-4">
              <div className="font-bold text-gray-900 text-sm">
                Campaigns
              </div>

              {/* + Create New Campaign Button */}
              <button
                onClick={() => setCampaignSubView('templates')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Create New Campaign</span>
              </button>

              {/* Sub-menu items */}
              <div className="space-y-1 pt-2">
                <button
                  onClick={() => setCampaignSubView('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    campaignSubView === 'overview'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 size={15} className={campaignSubView === 'overview' ? 'text-emerald-600' : 'text-gray-400'} />
                  <span>Campaign Overview</span>
                </button>

                <button
                  onClick={() => setCampaignSubView('templates')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    campaignSubView === 'templates'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutTemplate size={15} className="text-gray-400" />
                    <span>Template Messages</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <button
                  onClick={() => setCampaignSubView('scheduled')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    campaignSubView === 'scheduled'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock size={15} className={campaignSubView === 'scheduled' ? 'text-emerald-600' : 'text-gray-400'} />
                  <span>Scheduled Campaigns</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ─── MAIN WORKSPACE CONTENT ─── */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          
          {/* =========================================================================
              VIEW 1: ONBOARDING & SETUP GUIDE (Exact Match to Image 1)
          ========================================================================= */}
          {currentView === 'setup' && (
            <div className="max-w-4xl mx-auto px-6 py-10">
              
              {/* Main Greeting Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Hello, <span className="text-[#00D084]">{userName}!</span>
                    <br />
                    Let's get you set up
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">
                    Personalised for Sales on WhatsApp
                    <br />
                    Just follow these steps and Rockyt handles the rest
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Join 16,000+ businesses</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span>★</span>
                    <span className="font-bold text-gray-800">4.6/5</span>
                    <span className="text-gray-400">rating</span>
                  </div>
                </div>
              </div>

              {/* Channel Selector Bar */}
              <div className="mb-6">
                <div className="text-xs text-gray-500 font-medium mb-2.5">
                  Choose a channel you'd like to connect
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setSelectedChannelPill('whatsapp')}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      selectedChannelPill === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-800 border-2 border-[#00D084]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00D084]"></span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedChannelPill('instagram')}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      selectedChannelPill === 'instagram'
                        ? 'bg-emerald-50 text-emerald-800 border-2 border-[#00D084]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Instagram</span>
                  </button>

                  <button
                    onClick={() => setSelectedChannelPill('messenger')}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      selectedChannelPill === 'messenger'
                        ? 'bg-emerald-50 text-emerald-800 border-2 border-[#00D084]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Messenger</span>
                  </button>

                  <button
                    onClick={() => setSelectedChannelPill('tiktok')}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      selectedChannelPill === 'tiktok'
                        ? 'bg-emerald-50 text-emerald-800 border-2 border-[#00D084]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>TikTok</span>
                  </button>
                </div>
              </div>

              {/* 7-Step Setup Checklist Container (Exact Card Layout) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                
                {/* Step 1: Connect WhatsApp */}
                {account ? (
                  <div className="p-5 sm:p-6 bg-emerald-50/40 border-l-4 border-l-[#00D084] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#00D084] text-[#07301f] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                        <Check size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">WhatsApp Connected (Headless Mode)</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">LIVE</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 font-mono">
                          {account.name || 'Connected WABA'} • {account.phone_number || account.phone || '+1 (415) 555-0199'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          Meta Official Cloud API Tier 100K/day • Quality: {account.quality_rating || 'GREEN'} • Direct Webhooks Active
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      Manage Connection
                    </button>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full border-2 border-[#00D084] text-[#00D084] font-bold text-sm flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Connect WhatsApp</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Start receiving and resolving customer issues on WhatsApp in Headless Mode</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      Connect WhatsApp
                    </button>
                  </div>
                )}

                {/* Step 2: Preview and deploy your AI agent */}
                <div 
                  onClick={() => setCurrentView('astra')}
                  className="p-5 sm:p-6 bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-l-[#00D084] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-emerald-300 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0 bg-white">
                      2
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Preview and deploy your AI agent</span>
                  </div>
                  <ChevronRight size={16} className="text-emerald-600" />
                </div>

                {/* Step 3: Manage all incoming leads */}
                <div 
                  onClick={() => setCurrentView('inbox')}
                  className="p-5 sm:p-6 hover:bg-gray-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 font-medium text-sm flex items-center justify-center shrink-0">
                      3
                    </div>
                    <span className="text-sm text-gray-800">Manage all incoming leads in your AI powered inbox</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                {/* Step 4: Invite sales team */}
                <div 
                  onClick={() => setCurrentView('settings')}
                  className="p-5 sm:p-6 hover:bg-gray-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 font-medium text-sm flex items-center justify-center shrink-0">
                      4
                    </div>
                    <span className="text-sm text-gray-800">Invite your sales team</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                {/* Divider Label */}
                <div className="bg-gray-50/80 px-6 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  After set up, explore more of Rockyt
                </div>

                {/* Step 5: Sync your CRM */}
                <div 
                  onClick={() => setCurrentView('connectors')}
                  className="p-5 sm:p-6 hover:bg-gray-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 font-medium text-sm flex items-center justify-center shrink-0">
                      5
                    </div>
                    <span className="text-sm text-gray-800">Sync your CRM to close deals faster</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                {/* Step 6: Bring in more leads */}
                <div 
                  onClick={() => setCurrentView('ads')}
                  className="p-5 sm:p-6 hover:bg-gray-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 font-medium text-sm flex items-center justify-center shrink-0">
                      6
                    </div>
                    <span className="text-sm text-gray-800">Bring in more leads by creating ads</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                {/* Step 7: Automate repetitive actions */}
                <div 
                  onClick={() => setCurrentView('automations')}
                  className="p-5 sm:p-6 hover:bg-gray-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 font-medium text-sm flex items-center justify-center shrink-0">
                      7
                    </div>
                    <span className="text-sm text-gray-800">Automate repetitive actions</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              VIEW 2: CAMPAIGNS OVERVIEW DASHBOARD (Exact Match to Image 2)
          ========================================================================= */}
          {currentView === 'campaigns' && campaignSubView === 'overview' && (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
              
              {/* Top Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    Campaigns Overview
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Get an overview of all your campaign related analytics and insights
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Default Channel Selector */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#00D084]"></span>
                    <span>Default</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>

                  {/* Watch Tutorial */}
                  <button 
                    onClick={() => alert('Launching video tutorial: "How to run your first WhatsApp broadcast in Rockyt"')}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Watch Tutorial</span>
                  </button>

                  {/* New Campaign Button */}
                  <button
                    onClick={() => setCampaignSubView('templates')}
                    className="px-4 py-2 rounded-xl border border-[#00D084] text-[#00945e] hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs"
                  >
                    New Campaign
                  </button>

                  {/* Guided Campaign Setup Button */}
                  <button
                    onClick={() => setCampaignSubView('templates')}
                    className="px-4 py-2 rounded-xl bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-xs shadow-sm transition-all"
                  >
                    Guided Campaign Setup
                  </button>
                </div>
              </div>

              {/* Channel Tabs: WhatsApp / SMS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCampaignChannel('whatsapp')}
                  className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    campaignChannel === 'whatsapp'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setCampaignChannel('sms')}
                  className={`px-5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    campaignChannel === 'sms'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  SMS
                </button>
              </div>

              {/* Overview Filter Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-gray-900 text-sm">Overview</span>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 shadow-xs">
                    <span>Last 7 days</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 shadow-xs">
                    <Calendar size={13} className="text-gray-400" />
                    <span>29 August 2026</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 shadow-xs">
                    <Calendar size={13} className="text-gray-400" />
                    <span>05 September 2026</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>

                  <button 
                    onClick={fetchCampaignMetrics}
                    disabled={isRefreshingMetrics}
                    className="p-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    title="Refresh live metrics"
                  >
                    <RefreshCw size={14} className={isRefreshingMetrics ? 'animate-spin text-emerald-600' : ''} />
                  </button>
                </div>

                {/* Right: Live Real-Time Telemetry Badge */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse"></span>
                  <span className="text-xs text-gray-600 font-semibold">Live Real-Time Telemetry</span>
                </div>
              </div>

              {/* 3 Top Intelligence Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Card 1: Meta messaging limit */}
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <span className="text-base">👑</span>
                        <span>Your daily Meta messaging limit</span>
                        <HelpCircle size={13} className="text-gray-400" />
                      </div>
                    </div>

                    <div className="text-sm font-bold text-gray-900 mt-2">
                      {account ? `${campaignOverview?.daily_limit?.used || 0}/${campaignOverview?.daily_limit?.total || (account.messaging_limit_tier === 'TIER_100K_DAILY' ? 100000 : 250)} unique contacts` : '0/0 unique contacts'}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#00D084] transition-all duration-500"
                        style={{
                          width: account && campaignOverview?.daily_limit?.total 
                            ? `${Math.min(100, Math.round(((campaignOverview.daily_limit.used || 0) / campaignOverview.daily_limit.total) * 100))}%`
                            : '0%'
                        }}
                      ></div>
                    </div>

                    <div className="mt-2 text-right">
                      <a href="#limits" className="text-xs text-blue-600 hover:underline font-medium">
                        {account ? (account.messaging_limit_tier || 'TIER_100K_DAILY') : 'Connect WhatsApp to unlock limits'}
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    {account ? 'Meta Official Cloud API Tier' : 'No account connected'}
                  </div>
                </div>

                {/* Card 2: Consecutive days of messaging */}
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mb-2">
                      <Zap size={15} />
                      <span className="text-gray-700">Consecutive days of messaging</span>
                      <HelpCircle size={13} className="text-gray-400" />
                    </div>

                    {/* 7 Day Status Circles */}
                    <div className="flex items-center gap-2.5 my-4">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const activeDays = campaignOverview?.consecutive_days || 0;
                        return (
                          <div
                            key={day}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              day <= activeDays
                                ? 'border-amber-500 bg-amber-100'
                                : 'border-gray-200 bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    {campaignOverview?.consecutive_days ? `${campaignOverview.consecutive_days} consecutive days active` : '0 consecutive active days'}
                  </div>
                </div>

                {/* Card 3: Messaging Quality */}
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2">
                      <ShieldCheck size={15} />
                      <span className="text-gray-700">Messaging Quality</span>
                      <HelpCircle size={13} className="text-gray-400" />
                    </div>

                    <div className="flex items-center gap-2 my-3">
                      <div className="flex items-end gap-1 h-5">
                        <div className={`w-1.5 h-2 rounded-xs ${account ? 'bg-[#00D084]' : 'bg-gray-300'}`}></div>
                        <div className={`w-1.5 h-3.5 rounded-xs ${account ? 'bg-[#00D084]' : 'bg-gray-300'}`}></div>
                        <div className={`w-1.5 h-5 rounded-xs ${account ? 'bg-[#00D084]' : 'bg-gray-300'}`}></div>
                      </div>
                      <span className={`text-sm font-bold ${account ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {account ? (account.quality_rating || 'High (GREEN)') : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    {account ? 'Meta WABA Quality Rating' : 'Connect account to check quality'}
                  </div>
                </div>

              </div>

              {/* 8 Analytics Metrics Grid (Live Real-Time Data) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
                
                {/* 1. Sent */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.sent ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Sent</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                </div>

                {/* 2. Delivered */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.delivered ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Delivered</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCheck size={14} />
                  </div>
                </div>

                {/* 3. Read */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.read ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Read</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Eye size={14} />
                  </div>
                </div>

                {/* 4. Replied */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.replied ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Replied</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CornerDownLeft size={14} />
                  </div>
                </div>

                {/* 5. Sending */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      0
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Sending</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
                    <Send size={14} />
                  </div>
                </div>

                {/* 6. Failed */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.failed ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Failed</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <XCircle size={14} />
                  </div>
                </div>

                {/* 7. Read Rate */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.read_rate ? `${campaignOverview.read_rate}%` : '0%'}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Read Rate</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Eye size={14} />
                  </div>
                </div>

                {/* 8. Reply Rate */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900 font-display">
                      {campaignOverview?.reply_rate ? `${campaignOverview.reply_rate}%` : '0%'}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>Reply Rate</span>
                      <HelpCircle size={11} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CornerDownLeft size={14} />
                  </div>
                </div>

              </div>

              {/* Campaign Planner Section (Live Real-Time) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Campaign Planner</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Organize and schedule your upcoming broadcast distributions</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => setPlannerView('calendar')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          plannerView === 'calendar'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <Calendar size={13} />
                        <span>Calendar</span>
                      </button>

                      <button
                        onClick={() => setPlannerView('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          plannerView === 'list'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <List size={13} />
                        <span>List</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setCampaignSubView('templates')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#00D084] hover:bg-[#00be77] text-[#07301f] text-xs font-bold transition-all"
                    >
                      + Schedule Campaign
                    </button>
                  </div>
                </div>

                {/* If user has no scheduled campaigns, display clean empty state */}
                {scheduledCampaigns.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                      <Megaphone size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">No scheduled campaigns</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      You haven't scheduled any WhatsApp broadcasts yet. Create a campaign to start messaging in real-time.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setCampaignSubView('templates')}
                        className="px-4 py-2 rounded-xl border border-[#00D084] text-[#00945e] hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Create New Broadcast
                      </button>
                    </div>
                  </div>
                ) : (
                  plannerView === 'calendar' ? (
                    <div className="border border-gray-200 rounded-xl p-4 overflow-x-auto">
                      <div className="grid grid-cols-7 gap-2 min-w-[600px] text-center text-xs">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="font-bold text-gray-500 py-1.5">{d}</div>
                        ))}
                        {[...Array(7)].map((_, i) => {
                          const item = scheduledCampaigns[i];
                          return (
                            <div key={i} className={`p-3 rounded-xl border min-h-[90px] text-left transition-all ${
                              item ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 bg-gray-50/50'
                            }`}>
                              <div className="font-bold text-xs text-gray-700">Day {i + 1}</div>
                              {item && (
                                <div className="mt-2 p-1.5 bg-white rounded-lg border border-emerald-200 text-[10px] text-emerald-900 shadow-xs">
                                  <div className="font-bold truncate">{item.name || item.title}</div>
                                  <div className="text-gray-400">{item.total_recipients || 0} recipients</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                      {scheduledCampaigns.map((sc, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="font-bold text-gray-900">{sc.name || sc.title}</div>
                            <div className="text-gray-500">Template: {sc.template_name} • {sc.total_recipients || 0} recipients</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {sc.status || 'scheduled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

            </div>
          )}

          {/* Sub-views for Campaigns (Templates & Broadcasts) */}
          {currentView === 'campaigns' && campaignSubView === 'templates' && (
            <div className="p-6">
              <TemplateStudio />
            </div>
          )}

          {currentView === 'campaigns' && campaignSubView === 'scheduled' && (
            <div className="p-6">
              <BroadcastManager />
            </div>
          )}

          {/* =========================================================================
              VIEW 3: TEAM INBOX
          ========================================================================= */}
          {currentView === 'inbox' && (
            <div className="h-full">
              <WhatsAppInbox userSession={userSession} />
            </div>
          )}

          {/* =========================================================================
              VIEW 4: CONTACTS CRM
          ========================================================================= */}
          {currentView === 'contacts' && (
            <div className="p-6">
              <ContactsCRM />
            </div>
          )}

          {/* =========================================================================
              VIEW 5: ASTRA AI AGENT
          ========================================================================= */}
          {currentView === 'astra' && (
            <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles size={20} className="text-emerald-600" />
                    <span>Astra AI Customer Agent</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Zero-code autonomous conversational AI trained on your website and support documents
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Status: Active
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Agent Persona &amp; Knowledge Base</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Agent Name</label>
                  <input
                    type="text"
                    defaultValue="Astra"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Instructions</label>
                  <textarea
                    rows={4}
                    defaultValue="You are the friendly, helpful customer engagement assistant for Rockyt. Answer user queries concisely, provide product catalog links when requested, and escalate to human agent if the user asks for refund or human support."
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => alert('Astra AI agent settings updated successfully!')}
                  className="px-5 py-2.5 rounded-xl bg-[#00D084] text-[#07301f] font-bold text-xs shadow-sm hover:bg-[#00be77]"
                >
                  Save AI Persona
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: AUTOMATIONS
          ========================================================================= */}
          {currentView === 'automations' && (
            <div className="p-6">
              <AutomationBuilder />
            </div>
          )}

          {/* =========================================================================
              VIEW 7: COMMERCE & CATALOG
          ========================================================================= */}
          {currentView === 'commerce' && (
            <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">WhatsApp Commerce &amp; Catalog</h2>
                <p className="text-xs text-gray-500 mt-1">Connect your Facebook Catalog or Shopify store for direct checkout in WhatsApp</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs text-center py-12">
                <ShoppingBag size={40} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="font-bold text-gray-900 text-base">Meta Commerce Manager Ready</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                  Sync product catalogs, display multi-item carousels, and collect orders directly inside WhatsApp chat threads.
                </p>
                <button
                  onClick={() => alert('Syncing catalog with Meta Commerce API...')}
                  className="px-6 py-2.5 rounded-xl bg-[#00D084] text-[#07301f] font-bold text-xs shadow-sm"
                >
                  Connect Product Catalog
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 8: ADS (CTWA HUB)
          ========================================================================= */}
          {currentView === 'ads' && (
            <div className="p-6">
              <CTWAHub />
            </div>
          )}

          {/* =========================================================================
              VIEW 9: ANALYTICS
          ========================================================================= */}
          {currentView === 'analytics' && (
            <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Analytics &amp; Intelligence</h2>
                <p className="text-xs text-gray-500 mt-1">Comprehensive delivery rates, agent response times, and revenue attribution</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-bold uppercase">Average Response Time</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-2">1m 42s</div>
                  <div className="text-[11px] text-gray-400 mt-1">↓ 68% vs industry average</div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-bold uppercase">Customer CSAT Score</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-2">4.9 / 5.0</div>
                  <div className="text-[11px] text-gray-400 mt-1">Based on 1,420 post-chat ratings</div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
                  <div className="text-xs text-gray-500 font-bold uppercase">AI Auto-Resolution</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-2">72.4%</div>
                  <div className="text-[11px] text-gray-400 mt-1">Resolved without human escalation</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 10: CONNECTORS / API
          ========================================================================= */}
          {currentView === 'connectors' && (
            <div className="p-6">
              <MCPGateway userSession={userSession} />
            </div>
          )}

          {/* =========================================================================
              VIEW 11: SETTINGS
          ========================================================================= */}
          {currentView === 'settings' && (
            <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Workspace Settings</h2>
                <p className="text-xs text-gray-500 mt-1">Manage users, channels, billing, and API tokens</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-gray-900">User Profile</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      defaultValue={userName}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={userSession?.email || 'moamen@company.com'}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Connected Phone Number</div>
                    <div className="text-xs text-gray-500">{account?.phone_number || '+1 (202) 908-7457 (Demo Virtual)'}</div>
                  </div>
                  <button
                    onClick={() => setIsConnectModalOpen(true)}
                    className="px-4 py-1.5 rounded-xl border border-gray-300 hover:border-gray-400 text-xs font-bold"
                  >
                    Manage WABA
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FLOATING GREEN CHAT WIDGET BUBBLE (Exact Match to Image 1)
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatWidgetOpen ? (
          <div className="w-84 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="bg-[#00D084] text-[#07301f] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-emerald-700 font-bold flex items-center justify-center text-xs">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs">Astra AI Support</div>
                  <div className="text-[10px] text-emerald-900">Online • Typically replies instantly</div>
                </div>
              </div>
              <button 
                onClick={() => setChatWidgetOpen(false)}
                className="text-emerald-900 hover:text-black p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 h-72 overflow-y-auto space-y-3 bg-[#f0f2f5] text-xs">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 rounded-2xl max-w-[80%] shadow-xs ${
                    msg.sender === 'user' 
                      ? 'bg-[#00D084] text-[#07301f] rounded-tr-none font-medium' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                  }`}>
                    {msg.text}
                    <div className="text-[9px] text-gray-400 mt-1 text-right">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={inputChatText}
                onChange={(e) => setInputChatText(e.target.value)}
                placeholder="Type a WhatsApp message..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2 bg-[#00D084] text-[#07301f] hover:bg-[#00be77] rounded-xl transition-colors cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatWidgetOpen(true)}
            className="w-14 h-14 rounded-full bg-[#00D084] hover:bg-[#00be77] text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open WhatsApp chat support"
          >
            <MessageSquare size={26} />
          </button>
        )}
      </div>

      {/* Meta WABA Connection Modal */}
      {isConnectModalOpen && (
        <WABAConnectionModal
          isOpen={isConnectModalOpen}
          onClose={() => {
            setIsConnectModalOpen(false);
            fetchAccountStatus();
          }}
          onSuccess={() => {
            setIsConnectModalOpen(false);
            fetchAccountStatus();
          }}
        />
      )}

    </div>
  );
};

export default WhatsAppDashboard;
