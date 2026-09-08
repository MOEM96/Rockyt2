import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, GitBranch, Layout, Copy, Search,
  MessageSquare, Zap, Megaphone, LayoutTemplate, Radio, 
  Bot, Users, Settings, Phone, ShieldCheck, ExternalLink, 
  Plus, LogOut, ArrowLeft, Bell, Sparkles, CheckCircle2,
  AlertTriangle, Power, Clock, CheckCheck, BarChart3, ChevronDown,
  ChevronRight, Calendar, List, RefreshCw, Eye, CornerDownLeft,
  Send, XCircle, Loader2, Layers, HelpCircle, UserCheck, Play,
  Share2, ShoppingBag, Target, ArrowRight, Check, Info
} from 'lucide-react';

import { WhatsAppInbox } from './WhatsAppInbox';
// AutomationBuilder removed in favor of WhatsApp expandable tab
import { CTWAHub } from './CTWAHub';
import { TemplateStudio } from './TemplateStudio';
import { BroadcastManager } from './BroadcastManager';
import { MCPGateway } from './MCPGateway';
import { ContactsCRM } from './ContactsCRM';
import WABAConnectionModal from './WABAConnectionModal';
import { getAuthHeaders } from '../../lib/frontendAuth';

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.02L7.55 18.84L4.44 19.66L5.27 16.62L5.07 16.31C4.26 15.01 3.81 13.48 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.83 7.42 8.48 7.5 8.19 7.82C7.9 8.13 7.07 8.91 7.07 10.49C7.07 12.07 8.22 13.59 8.38 13.8C8.54 14.01 10.6 17.18 13.77 18.55C14.53 18.88 15.11 19.07 15.57 19.22C16.33 19.46 17.03 19.43 17.58 19.34C18.19 19.25 19.47 18.57 19.73 17.83C20 17.08 20 16.45 19.92 16.31C19.84 16.17 19.63 16.1 19.32 15.94C19.01 15.78 17.47 15.02 17.19 14.92C16.9 14.81 16.69 14.76 16.48 15.08C16.27 15.39 15.68 16.1 15.5 16.31C15.32 16.52 15.14 16.54 14.83 16.39C14.52 16.23 13.52 15.9 12.33 14.84C11.41 14.02 10.79 13.01 10.61 12.7C10.43 12.39 10.59 12.22 10.75 12.07C10.89 11.93 11.06 11.7 11.22 11.52C11.38 11.34 11.43 11.21 11.53 11C11.63 10.79 11.58 10.61 11.5 10.45C11.42 10.29 10.8 8.77 10.55 8.16C10.3 7.56 10.05 7.64 9.87 7.63C9.7 7.62 9.5 7.62 9.29 7.62" />
  </svg>
);

interface WhatsAppDashboardProps {
  userSession?: any;
  onBackHome?: () => void;
  onSignOut?: () => void;
}

export type DashboardView = 
  | 'setup'
  | 'whatsapp-overview'
  | 'whatsapp-templates'
  | 'whatsapp-flows'
  | 'whatsapp-groups'
  | 'whatsapp-conversions'
  | 'campaigns'
  | 'inbox'
  | 'contacts'
  | 'astra'
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
  
  // WhatsApp Expandable Sidebar state & Overview sender management
  const [whatsappMenuExpanded, setWhatsappMenuExpanded] = useState(true);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [fetchChatsNotice, setFetchChatsNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState(false);
  const [manageSenderDropdownOpen, setManageSenderDropdownOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const manageDropdownRef = useRef<HTMLDivElement>(null);
  const [senderSearchTerm, setSenderSearchTerm] = useState('');
  const [senderTypeFilter, setSenderTypeFilter] = useState('all');
  const [senderStatusFilter, setSenderStatusFilter] = useState('all');

  // Close Manage dropdown cleanly when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (manageDropdownRef.current && !manageDropdownRef.current.contains(e.target as Node)) {
        setManageSenderDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setManageSenderDropdownOpen(false);
    };

    if (manageSenderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [manageSenderDropdownOpen]);
  
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

  const fetchAccountStatus = async (force = false) => {
    try {
      const url = force ? '/api/whatsapp/account?force=true' : '/api/whatsapp/account';
      const res = await fetch(url, { 
        headers: getHeaders(),
        cache: 'no-store' 
      });
      if (res.ok) {
        const data = await res.json();
        const validAcc = (data.account && data.account.status === 'connected' && data.account.phone_number) ? data.account : null;
        setAccount(validAcc);
        if (validAcc) {
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
        fetch('/api/whatsapp/campaigns/overview', { headers: getHeaders(), cache: 'no-store' }),
        fetch('/api/whatsapp/campaigns/scheduled', { headers: getHeaders(), cache: 'no-store' }),
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

    // Visibility-aware periodic refresh (every 30 seconds, paused when tab is inactive)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // Pause background polling when tab is not active
      }
      fetchAccountStatus();
      fetchCampaignMetrics();
    }, 30000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAccountStatus();
        fetchCampaignMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detect return from Meta / Zernio Headless OAuth
    const searchParams = new URLSearchParams(window.location.search);
    const isOAuthReturn = searchParams.get('waba') === 'connected' || 
                          searchParams.get('connected') === 'whatsapp' || 
                          searchParams.get('connected') === 'true' || 
                          searchParams.get('account_connected') === 'true';

    if (isOAuthReturn) {
      setOauthBanner('🎉 WhatsApp Business Account successfully authenticated and connected to your Rockyt Workspace!');
      const accountId = searchParams.get('accountId');
      const profileId = searchParams.get('profileId');
      const username = searchParams.get('username') || searchParams.get('phone_number');

      // Immediate sync to ensure DB and cache are updated
      fetch('/api/whatsapp/account/sync', {
        method: 'POST',
        headers: getHeaders(),
        cache: 'no-store',
        body: JSON.stringify({ accountId, profileId, username, platform: 'whatsapp' }),
      }).then(() => {
        fetchAccountStatus(true);
        fetchCampaignMetrics();
      }).catch(() => {
        fetchAccountStatus(true);
      });

      setCompletedSteps(prev => ({ ...prev, 1: true }));
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setOauthBanner(null), 8000);
    } else if (searchParams.get('tempToken')) {
      setIsConnectModalOpen(true);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userSession?.id]);

  const handleFetchChatsAndContacts = async () => {
    setIsFetchingChats(true);
    setFetchChatsNotice(null);
    try {
      const res = await fetch('/api/whatsapp/backfill', {
        method: 'POST',
        headers: getHeaders(),
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFetchChatsNotice({
          success: true,
          message: `Successfully synced ${data.count || 0} conversations and ${data.contactsCount || 0} contacts from WhatsApp!`
        });
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          try {
            const uid = userSession?.id || localStorage.getItem('rockyt_user_id') || 'default_user';
            localStorage.setItem(`rockyt_wa_convs_${uid}`, JSON.stringify(data.data));
          } catch {}
        }
        fetchAccountStatus(true);
      } else {
        setFetchChatsNotice({
          success: false,
          message: data.message || 'Failed to fetch conversations. Please ensure WhatsApp is connected.'
        });
      }
    } catch (err: any) {
      setFetchChatsNotice({
        success: false,
        message: err.message || 'Error connecting to WhatsApp sync service.'
      });
    } finally {
      setIsFetchingChats(false);
      setTimeout(() => setFetchChatsNotice(null), 8000);
    }
  };

  const handleDisconnect = async (targetAccountId?: string, targetPhone?: string) => {
    const accId = targetAccountId || account?.id;
    const phoneNum = targetPhone || account?.phone_number;
    if (!confirm(`Are you sure you want to disconnect this WhatsApp number${phoneNum ? ` (${phoneNum})` : ''}? All associated conversations, messages, and configurations will be permanently deleted.`)) return;

    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/account/disconnect', {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accId,
          phone: phoneNum,
          phoneNumberId: (account as any)?.phone_number_id,
          platform: 'whatsapp',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAccount(null);
        setCompletedSteps(prev => ({ ...prev, 1: false }));
        setManageSenderDropdownOpen(false);
        setAccountHealthModalOpen(false);
        setAddChannelModalOpen(false);
        setOauthBanner(null);

        // Permanently purge all WhatsApp data from localStorage
        const uid = userSession?.id || localStorage.getItem('rockyt_user_id') || 'default_user';
        localStorage.removeItem(`rockyt_wa_convs_${uid}`);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('rockyt_wa_') || key.startsWith(`rockyt_wa_msgs_${uid}`))) {
            localStorage.removeItem(key);
          }
        }

        setFetchChatsNotice({
          success: true,
          message: 'WhatsApp number and all associated data permanently deleted.',
        });
        await fetchAccountStatus(true);
        await fetchCampaignMetrics();
      } else {
        alert(`Failed to disconnect: ${data.message || data.error || 'Please try again.'}`);
      }
    } catch (err: any) {
      console.warn('Disconnect error:', err);
      alert(`Error disconnecting account: ${err.message}`);
    } finally {
      setIsDisconnecting(false);
      setTimeout(() => setFetchChatsNotice(null), 6000);
    }
  };

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
          
          {/* WhatsApp Connection Status Header Badge */}
          {account && account.status === 'connected' && account.phone_number ? (
            <button
              onClick={() => setCurrentView('whatsapp-overview')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse"></div>
              <span>WhatsApp Connected</span>
              <span className="font-mono text-gray-500 text-[11px]">{account.phone_number || '+971 50 310 2740'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ea3829] text-white hover:bg-[#d82b1d] transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>Connect WhatsApp</span>
            </button>
          )}

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

            {/* Inbox */}
            <button
              onClick={() => setCurrentView('inbox')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'inbox'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={18} className={currentView === 'inbox' ? 'text-emerald-600' : 'text-gray-400'} />
              {!isSidebarCollapsed && <span>Inbox</span>}
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

            {/* ── WhatsApp (Expandable Sidebar Section - Screenshot 2) ── */}
            <div>
              <button
                onClick={() => setWhatsappMenuExpanded(!whatsappMenuExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView.startsWith('whatsapp-') || currentView === 'setup'
                    ? 'bg-gray-100 text-gray-900 font-bold'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  {!isSidebarCollapsed && <span>WhatsApp</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown 
                    size={14} 
                    className={`text-gray-500 transition-transform duration-200 ${whatsappMenuExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </button>

              {whatsappMenuExpanded && !isSidebarCollapsed && (
                <div className="pl-4 pr-1 py-1 space-y-0.5">
                  {/* Overview */}
                  <button
                    onClick={() => setCurrentView('whatsapp-overview')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentView === 'whatsapp-overview' || currentView === 'setup'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutGrid size={15} className={currentView === 'whatsapp-overview' || currentView === 'setup' ? 'text-gray-900' : 'text-gray-500'} />
                    <span>Overview</span>
                  </button>

                  {/* Templates */}
                  <button
                    onClick={() => setCurrentView('whatsapp-templates')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentView === 'whatsapp-templates'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Layout size={15} className={currentView === 'whatsapp-templates' ? 'text-gray-900' : 'text-gray-500'} />
                    <span>Templates</span>
                  </button>

                  {/* Flows */}
                  <button
                    onClick={() => setCurrentView('whatsapp-flows')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentView === 'whatsapp-flows'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <GitBranch size={15} className={currentView === 'whatsapp-flows' ? 'text-gray-900' : 'text-gray-500'} />
                    <span>Flows</span>
                  </button>

                  {/* Groups */}
                  <button
                    onClick={() => setCurrentView('whatsapp-groups')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentView === 'whatsapp-groups'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Users size={15} className={currentView === 'whatsapp-groups' ? 'text-gray-900' : 'text-gray-500'} />
                    <span>Groups</span>
                  </button>

                  {/* Conversions */}
                  <button
                    onClick={() => setCurrentView('whatsapp-conversions')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentView === 'whatsapp-conversions'
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Target size={15} className={currentView === 'whatsapp-conversions' ? 'text-gray-900' : 'text-gray-500'} />
                    <span>Conversions</span>
                  </button>
                </div>
              )}
            </div>

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
        <main className={`flex-1 ${currentView === 'inbox' ? 'overflow-hidden h-full flex flex-col' : 'overflow-y-auto'} bg-[#f8fafc]`}>
          
          {/* =========================================================================
              WHATSAPP SENDERS OVERVIEW DASHBOARD (Exact Match to Screenshot 1)
          ========================================================================= */}
          {(currentView === 'setup' || currentView === 'whatsapp-overview') && (() => {
            const isConnected = Boolean(account && account.status === 'connected' && (account.phone_number || account.id));
            const senderName = account?.name || 'WhatsApp Business';
            const senderPhone = account?.phone_number || '';
            const rawId = account?.id || '';
            const hexMatch = (account?.short_account_id || rawId) ? (account?.short_account_id || rawId).match(/([a-f0-9]{6})/i) : null;
            const shortId = hexMatch ? hexMatch[1].toLowerCase() : (rawId ? rawId.substring(0, 6) : 'eca6e8');
            const senderType = (account as any)?.type || 'Coexistence';

            // Dynamic Meta Name Review Status
            const rawNameStatus = String((account as any)?.name_review_status || '').toLowerCase();
            const nameReview = rawNameStatus === 'approved' ? 'Approved' : (rawNameStatus === 'in_review' ? 'In review' : (rawNameStatus === 'declined' ? 'Declined' : 'Not reviewed'));

            // Dynamic Meta Business Verification Status
            const rawBizStatus = String((account as any)?.business_verification_status || '').toLowerCase();
            const businessVerification = rawBizStatus === 'verified' ? 'Verified' : (rawBizStatus === 'in_review' ? 'In review' : 'Not verified');

            // Dynamic Meta Calling Status
            const calling = (account as any)?.calling || 'Off';

            // Real-time Account Health & Payment Status
            const hasPaymentIssue = Boolean((account as any)?.payment_issue);
            const canStartConversations = (account as any)?.can_start_conversations ?? !hasPaymentIssue;
            const paymentErrorMessage = (account as any)?.payment_error_message || (hasPaymentIssue ? 'There is an error with the payment method. This will prevent sending template messages until updated in Meta Business Suite.' : '');
            const healthStatus = (account as any)?.health_status || (hasPaymentIssue ? 'error' : (isConnected ? 'healthy' : 'disconnected'));
            const issues: string[] = (account as any)?.issues || [];

            // Strict per-user isolation: Only list sender if this user actually has a connected account!
            const sendersList = isConnected && senderPhone ? [
              {
                id: rawId,
                shortId,
                rawId,
                name: senderName,
                phone: senderPhone,
                type: senderType,
                nameReview,
                businessVerification,
                calling,
                hasPaymentIssue,
                canStartConversations,
                paymentErrorMessage,
                healthStatus,
                issues,
              }
            ] : [];

            const filtered = sendersList.filter(s => {
              if (senderSearchTerm.trim()) {
                const term = senderSearchTerm.toLowerCase();
                const match = s.name.toLowerCase().includes(term) || s.phone.includes(term) || s.shortId.toLowerCase().includes(term);
                if (!match) return false;
              }
              if (senderTypeFilter !== 'all' && s.type.toLowerCase() !== senderTypeFilter.toLowerCase()) return false;
              if (senderStatusFilter === 'active' && s.hasPaymentIssue) return false;
              if (senderStatusFilter === 'cant_start' && !s.hasPaymentIssue) return false;
              return true;
            });

            return (
              <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
                
                {/* Header Row (Screenshot 1) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">WhatsApp</h1>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {filtered.length} live sender
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Fetch Chats & Contacts Trigger Button */}
                    <button
                      onClick={handleFetchChatsAndContacts}
                      disabled={isFetchingChats}
                      className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                      title="Sync live WhatsApp conversations and contacts"
                    >
                      <RefreshCw size={13} className={`text-emerald-600 ${isFetchingChats ? 'animate-spin' : ''}`} />
                      <span>{isFetchingChats ? 'Fetching...' : 'Fetch Chats & Contacts'}</span>
                    </button>

                    {/* Red Connect WhatsApp Button */}
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-[#ea3829] hover:bg-[#d82b1d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Connect WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Fetch Chats Notification Banner */}
                {fetchChatsNotice && (
                  <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs ${
                    fetchChatsNotice.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {fetchChatsNotice.success ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-600 shrink-0" />
                      )}
                      <span className="font-semibold">{fetchChatsNotice.message}</span>
                    </div>
                    <button onClick={() => setFetchChatsNotice(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>
                )}

                {/* Payment Issue Guidance Alert Banner */}
                {hasPaymentIssue && (
                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ea3829] mt-1 shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-red-950">Payment Issue Requires Attention in Meta Business Suite</p>
                        <p className="text-[11px] text-red-700 mt-0.5">
                          There is an error with the payment method. This will prevent sending template messages until updated in Meta Business Suite.
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://business.facebook.com/wa/manage/payments/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#ea3829] hover:bg-[#d42c1e] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Fix in Meta Business Suite</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {/* Search & Filter Bar (Screenshot 1) */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px] max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search senders..."
                      value={senderSearchTerm}
                      onChange={(e) => setSenderSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="relative">
                    <select
                      value={senderTypeFilter}
                      onChange={(e) => setSenderTypeFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 hover:border-gray-300 px-3.5 py-2 pr-8 rounded-lg text-xs font-medium text-gray-700 focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="all">All types</option>
                      <option value="coexistence">Coexistence</option>
                      <option value="cloud_api">Cloud API</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={senderStatusFilter}
                      onChange={(e) => setSenderStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 hover:border-gray-300 px-3.5 py-2 pr-8 rounded-lg text-xs font-medium text-gray-700 focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="all">Any status</option>
                      <option value="cant_start">Can't start conversations</option>
                      <option value="active">Active</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Senders Table (Exact Match to Screenshot 1) */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs relative">
                  <div className="overflow-x-auto min-h-[300px] pb-32">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 bg-white">
                          <th className="py-3.5 px-5">Sender</th>
                          <th className="py-3.5 px-4">Number</th>
                          <th className="py-3.5 px-4">Type</th>
                          <th className="py-3.5 px-4">Name review</th>
                          <th className="py-3.5 px-4">Business verification</th>
                          <th className="py-3.5 px-4">Calling</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 px-6 text-center">
                              <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <Phone size={22} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">No WhatsApp Account Connected</h3>
                                <p className="text-xs text-gray-500 text-center">
                                  Connect your WhatsApp Business number via Meta OAuth to enable real-time messaging, view account health, and manage customer threads.
                                </p>
                                <button
                                  onClick={() => setIsConnectModalOpen(true)}
                                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                                >
                                  <Sparkles size={14} />
                                  <span>Connect WhatsApp</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((s, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            {/* Sender */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                                  <img
                                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Rockyt"
                                    alt={s.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-xs">{s.name}</div>
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono mt-0.5 border border-gray-200/70">
                                    <span>Account ID</span>
                                    <span className="text-gray-400">--</span>
                                    <span>{s.shortId}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(s.rawId);
                                        setCopiedAccountId(true);
                                        setTimeout(() => setCopiedAccountId(false), 2000);
                                      }}
                                      title="Copy Account ID"
                                      className="text-gray-400 hover:text-gray-700 ml-0.5 cursor-pointer"
                                    >
                                      {copiedAccountId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Number */}
                            <td className="py-4 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                              {s.phone}
                            </td>

                            {/* Type */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200/80">
                                <Phone size={11} className="text-gray-500" />
                                <span>{s.type}</span>
                              </span>
                            </td>

                            {/* Dynamic Name review */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ' + (
                                s.nameReview === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                                s.nameReview === 'In review' ? 'bg-blue-50 text-blue-700 border border-blue-200/80' :
                                s.nameReview === 'Declined' ? 'bg-red-50 text-red-700 border border-red-200/80' :
                                'bg-[#fef3c7] text-[#b45309]'
                              )}>
                                {s.nameReview}
                              </span>
                            </td>

                            {/* Dynamic Business verification */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ' + (
                                s.businessVerification === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                                s.businessVerification === 'In review' ? 'bg-blue-50 text-blue-700 border border-blue-200/80' :
                                'bg-[#fef3c7] text-[#b45309]'
                              )}>
                                {s.businessVerification}
                              </span>
                            </td>

                            {/* Dynamic Calling */}
                            <td className="py-4 px-4 font-medium whitespace-nowrap">
                              <span className={s.calling === 'On' ? 'text-emerald-600 font-semibold' : 'text-gray-600'}>
                                {s.calling}
                              </span>
                            </td>

                            {/* Real-time Dynamic Status */}
                            <td className="py-4 px-4 max-w-xs">
                              <div className="space-y-0.5">
                                {s.hasPaymentIssue ? (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                      <span className="w-2 h-2 rounded-full bg-[#ea3829] shrink-0"></span>
                                      <span>Can't start conversations</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                      {s.paymentErrorMessage || 'There is an error with the payment method. This will prevent sending template messages until updated in Meta Business Suite.'}
                                    </p>
                                  </>
                                ) : s.healthStatus === 'healthy' && s.canStartConversations ? (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                      <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
                                      <span>Active &amp; Ready</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                      Account is healthy and ready to initiate and receive customer conversations.
                                    </p>
                                  </>
                                ) : s.healthStatus === 'warning' ? (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                      <span className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0"></span>
                                      <span>Action required</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                      {s.issues?.[0] || 'Meta has flagged warnings on this phone number.'}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                      <span className="w-2 h-2 rounded-full bg-[#ea3829] shrink-0"></span>
                                      <span>Disconnected</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-tight">
                                      WhatsApp session disconnected. Please reconnect your account.
                                    </p>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-5 text-right relative">
                              <button
                                onClick={() => setManageSenderDropdownOpen(!manageSenderDropdownOpen)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none"
                              >
                                <span>Manage</span>
                                <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${manageSenderDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                              </button>

                              {manageSenderDropdownOpen && (
                                <div
                                  ref={manageDropdownRef}
                                  className="absolute right-5 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/90 py-2 z-50 text-left divide-y divide-gray-100 animate-in fade-in-50 zoom-in-95 duration-150"
                                >
                                  {/* Header section */}
                                  <div className="px-3.5 py-1.5 pb-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connected Sender</div>
                                    <div className="text-xs font-bold text-gray-900 truncate mt-0.5">{s.phone}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{s.name} • {s.type}</div>
                                  </div>

                                  {/* Main Options */}
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setManageSenderDropdownOpen(false);
                                        fetchAccountStatus(true);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50/70 hover:text-blue-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer group"
                                    >
                                      <RefreshCw size={14} className="text-blue-600 shrink-0 group-hover:rotate-180 transition-transform duration-300" />
                                      <div>
                                        <div className="font-semibold text-gray-800 group-hover:text-blue-700">Check Real-time Health</div>
                                        <div className="text-[10px] text-gray-400 font-normal">Verify Cloud API token &amp; limits</div>
                                      </div>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setManageSenderDropdownOpen(false);
                                        handleFetchChatsAndContacts();
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-emerald-50/70 hover:text-emerald-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer group"
                                    >
                                      <RefreshCw size={14} className="text-emerald-600 shrink-0 group-hover:rotate-180 transition-transform duration-300" />
                                      <div>
                                        <div className="font-semibold text-gray-800 group-hover:text-emerald-700">Fetch Chats &amp; Contacts</div>
                                        <div className="text-[10px] text-gray-400 font-normal">Backfill customer message threads</div>
                                      </div>
                                    </button>

                                    <a
                                      href="https://business.facebook.com/wa/manage/payments/"
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() => setManageSenderDropdownOpen(false)}
                                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-purple-50/70 hover:text-purple-700 flex items-center gap-2.5 font-medium transition-colors group"
                                    >
                                      <ExternalLink size={14} className="text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
                                      <div>
                                        <div className="font-semibold text-gray-800 group-hover:text-purple-700">Fix Payment in Meta</div>
                                        <div className="text-[10px] text-gray-400 font-normal">Open Meta Business Manager</div>
                                      </div>
                                    </a>

                                    <button
                                      onClick={() => {
                                        setManageSenderDropdownOpen(false);
                                        setIsConnectModalOpen(true);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 font-medium transition-colors cursor-pointer group"
                                    >
                                      <Settings size={14} className="text-gray-500 shrink-0 group-hover:rotate-45 transition-transform duration-200" />
                                      <div>
                                        <div className="font-semibold text-gray-800">Reconnect / Settings</div>
                                        <div className="text-[10px] text-gray-400 font-normal">Re-authenticate or change WABA</div>
                                      </div>
                                    </button>
                                  </div>

                                  {/* Danger Zone: Disconnect */}
                                  <div className="pt-1">
                                    <button
                                      onClick={() => {
                                        setManageSenderDropdownOpen(false);
                                        handleDisconnect(s.rawId || s.id, s.phone);
                                      }}
                                      disabled={isDisconnecting}
                                      className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer disabled:opacity-50 group"
                                    >
                                      {isDisconnecting ? (
                                        <RefreshCw size={14} className="text-red-600 animate-spin shrink-0" />
                                      ) : (
                                        <LogOut size={14} className="text-red-600 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                                      )}
                                      <div>
                                        <div className="font-bold text-red-600">{isDisconnecting ? 'Disconnecting...' : 'Disconnect Phone Number'}</div>
                                        <div className="text-[10px] text-red-400 font-normal">Unlink sender from this workspace</div>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* =========================================================================
              WHATSAPP SUB-VIEWS (Templates, Flows, Groups, Conversions)
          ========================================================================= */}
          {currentView === 'whatsapp-templates' && (
            <div className="p-6 max-w-7xl mx-auto">
              <TemplateStudio />
            </div>
          )}

          {currentView === 'whatsapp-flows' && (
            <div className="p-6">
              <BroadcastManager />
            </div>
          )}

          {currentView === 'whatsapp-groups' && (
            <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">WhatsApp Groups &amp; Communities</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage community announcements, group engagement, and multi-user qualification.</p>
                </div>
                <button
                  onClick={() => alert('WhatsApp Group Creation: Available for verified Business accounts in Meta Business Suite.')}
                  className="px-4 py-2 rounded-xl bg-[#00D084] text-[#07301f] font-bold text-xs shadow-sm hover:bg-[#00be77] cursor-pointer"
                >
                  + Create Group
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs text-center py-12">
                <Users size={40} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="font-bold text-gray-900 text-base">Community &amp; Group Management</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                  Sync groups, organize VIP customers, send broadcast updates, and trigger automated responses across your WhatsApp groups.
                </p>
                <button
                  onClick={handleFetchChatsAndContacts}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} className="text-emerald-600" />
                  <span>Fetch Chats &amp; Groups</span>
                </button>
              </div>
            </div>
          )}

          {currentView === 'whatsapp-conversions' && (
            <div className="p-6">
              <CTWAHub />
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
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCampaignSubView('overview')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutGrid size={14} />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setCampaignSubView('templates')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutTemplate size={14} />
                    <span>Message Templates</span>
                  </button>
                  <button
                    onClick={() => setCampaignSubView('scheduled')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Megaphone size={14} />
                    <span>Scheduled Broadcasts</span>
                  </button>
                </div>
              </div>
              <TemplateStudio />
            </div>
          )}

          {currentView === 'campaigns' && campaignSubView === 'scheduled' && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCampaignSubView('overview')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutGrid size={14} />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setCampaignSubView('templates')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutTemplate size={14} />
                    <span>Message Templates</span>
                  </button>
                  <button
                    onClick={() => setCampaignSubView('scheduled')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Megaphone size={14} />
                    <span>Scheduled Broadcasts</span>
                  </button>
                </div>
              </div>
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

{/* VIEW 6: AUTOMATIONS removed in favor of WhatsApp expandable tab & flows */}

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
                    <div className="text-xs text-gray-500">{account?.phone_number || 'No phone number connected'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account && account.status === 'connected' && (
                      <button
                        onClick={() => handleDisconnect(account.id, account.phone_number)}
                        disabled={isDisconnecting}
                        className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {isDisconnecting && <RefreshCw size={12} className="animate-spin text-red-600" />}
                        <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-4 py-1.5 rounded-xl border border-gray-300 hover:border-gray-400 text-xs font-bold cursor-pointer"
                    >
                      Manage WABA
                    </button>
                  </div>
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
