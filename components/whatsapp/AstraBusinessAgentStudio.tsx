import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bot, Sparkles, CheckCircle2, AlertCircle, ShieldCheck,
  ShieldAlert, Globe, FileText, HelpCircle, Send,
  RefreshCw, Sliders, CreditCard, Calendar, ArrowRight,
  ArrowLeft, ExternalLink, Plus, Trash2, Clock, Settings,
  Users, Check, Loader2, X, Smartphone, Play, MessageSquare,
  ChevronRight, ToggleLeft, ToggleRight, DollarSign, PackageCheck
} from 'lucide-react';
import {
  MetaBusinessAgentFullState,
  BusinessAgentStatus,
  BusinessAgentEligibility,
  BusinessInformation,
  BusinessAgentFAQ,
  BusinessAgentWebsite,
  BusinessAgentFile,
  BusinessAgentSkill,
  BusinessAgentConnector,
  BusinessAgentSettings,
  BusinessAgentAllowlistEntry,
  BusinessAgentBudget,
  BusinessAgentTestResponse
} from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

export interface AstraBusinessAgentStudioProps {
  userSession?: any;
}

export const AstraBusinessAgentStudio: React.FC<AstraBusinessAgentStudioProps> = ({ userSession }) => {
  // ── State ──
  const [state, setState] = useState<MetaBusinessAgentFullState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'skills' | 'connectors' | 'simulator' | 'rollout'>('overview');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // ── Modals State ──
  const [showEligibilityModal, setShowEligibilityModal] = useState<boolean>(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // ── Knowledge Forms State ──
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');
  const [newFaqCategory, setNewFaqCategory] = useState<string>('General');
  const [showAddFaqModal, setShowAddFaqModal] = useState<boolean>(false);

  const [newWebsiteUrl, setNewWebsiteUrl] = useState<string>('');
  const [isAddingWebsite, setIsAddingWebsite] = useState<boolean>(false);

  const [newAllowlistPhone, setNewAllowlistPhone] = useState<string>('');
  const [newAllowlistName, setNewAllowlistName] = useState<string>('');
  const [isAddingAllowlist, setIsAddingAllowlist] = useState<boolean>(false);

  // ── Sandbox Simulator State ──
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; citations?: any[]; toolActions?: any[]; handedOff?: boolean }>>([
    {
      sender: 'agent',
      text: 'Hi there! I am Astra, your Meta Business AI Assistant. Ask me anything about your products, business hours, or test booking an appointment.',
    }
  ]);
  const [isSimulatingChat, setIsSimulatingChat] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch Full State ──
  const loadAgentState = async (force = false) => {
    try {
      setIsLoading(true);
      setErrorBanner(null);
      const res = await fetch('/api/whatsapp/business-agent/status', {
        headers: getAuthHeaders(userSession),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Meta Business Agent state');
      }
      setState(data.data);
    } catch (err: any) {
      console.error('[loadAgentState error]:', err);
      setErrorBanner(err.message || 'Error loading agent state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgentState();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isSimulatingChat]);

  // ── Test Eligibility ──
  const handleTestEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const res = await fetch('/api/whatsapp/business-agent/eligibility', {
        method: 'POST',
        headers: getAuthHeaders(userSession),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, eligible: data.data.eligible, eligibility: data.data } : null);
        setShowEligibilityModal(true);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to check eligibility');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // ── Onboard Agent ──
  const handleOnboardAgent = async () => {
    try {
      setIsUpdating(true);
      setErrorBanner(null);
      const res = await fetch('/api/whatsapp/business-agent/onboard', {
        method: 'POST',
        headers: getAuthHeaders(userSession),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard agent');
      }
      setSuccessBanner('Meta Business Agent successfully provisioned! Your number is now configured on the Meta Business Platform.');
      await loadAgentState();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Onboarding error');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Rollout Toggle ──
  const handleToggleRollout = async () => {
    if (!state) return;
    const nextEnabled = !state.settings.rollout.enabled;

    if (nextEnabled && state.manual_steps.includes('business_agent_terms_not_accepted')) {
      alert('Before enabling the agent, you must accept the Meta Business Agent Terms in WhatsApp Manager. Use the link provided in the manual steps notice.');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorBanner(null);
      const res = await fetch('/api/whatsapp/business-agent/settings', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rollout: { enabled: nextEnabled },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update rollout status');
      }
      setState(prev => prev ? {
        ...prev,
        status: nextEnabled ? 'active' : 'inactive',
        settings: { ...prev.settings, rollout: { enabled: nextEnabled } }
      } : null);
      setSuccessBanner(nextEnabled ? 'Meta Business Agent is now LIVE and responding to customers!' : 'Meta Business Agent turned OFF.');
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error updating rollout');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Update Audience Mode ──
  const handleUpdateAudience = async (audience: 'EVERYONE' | 'ALLOWLISTED_ONLY') => {
    try {
      setIsUpdating(true);
      const res = await fetch('/api/whatsapp/business-agent/settings', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ai_audience: audience }),
      });
      if (res.ok) {
        setState(prev => prev ? {
          ...prev,
          settings: { ...prev.settings, ai_audience: audience }
        } : null);
        setSuccessBanner(`Rollout audience set to: ${audience === 'ALLOWLISTED_ONLY' ? 'Allowlisted numbers only (Safe Staging Mode)' : 'All WhatsApp Customers (Public Live Mode)'}`);
        setTimeout(() => setSuccessBanner(null), 3000);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error setting audience');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── FAQs ──
  const handleAddFaq = async () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    try {
      setIsUpdating(true);
      const res = await fetch('/api/whatsapp/business-agent/faqs', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newFaqQuestion.trim(),
          answer: newFaqAnswer.trim(),
          category: newFaqCategory.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, faqs: [data.data, ...prev.faqs] } : null);
        setNewFaqQuestion('');
        setNewFaqAnswer('');
        setShowAddFaqModal(false);
        setSuccessBanner('FAQ added to agent knowledge base.');
        setTimeout(() => setSuccessBanner(null), 2500);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to add FAQ');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/business-agent/faqs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(userSession),
      });
      if (res.ok) {
        setState(prev => prev ? { ...prev, faqs: prev.faqs.filter(f => f.id !== id) } : null);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to delete FAQ');
    }
  };

  // ── Website Crawler ──
  const handleAddWebsite = async () => {
    if (!newWebsiteUrl.trim()) return;
    try {
      setIsAddingWebsite(true);
      const res = await fetch('/api/whatsapp/business-agent/websites', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newWebsiteUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, websites: [data.data, ...prev.websites] } : null);
        setNewWebsiteUrl('');
        setSuccessBanner('Website URL registered and scheduled for Meta knowledge ingestion.');
        setTimeout(() => setSuccessBanner(null), 3000);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to add website');
    } finally {
      setIsAddingWebsite(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/business-agent/websites/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(userSession),
      });
      setState(prev => prev ? { ...prev, websites: prev.websites.filter(w => w.id !== id) } : null);
    } catch {}
  };

  // ── Allowlist ──
  const handleAddAllowlist = async () => {
    if (!newAllowlistPhone.trim()) return;
    try {
      setIsAddingAllowlist(true);
      const res = await fetch('/api/whatsapp/business-agent/allowlist', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumer_phone_number: newAllowlistPhone.trim(),
          name: newAllowlistName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, allowlist: [...prev.allowlist, data.data] } : null);
        setNewAllowlistPhone('');
        setNewAllowlistName('');
        setSuccessBanner('Tester phone number added to Allowlist.');
        setTimeout(() => setSuccessBanner(null), 2500);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to add phone to allowlist');
    } finally {
      setIsAddingAllowlist(false);
    }
  };

  const handleDeleteAllowlist = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/business-agent/allowlist/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(userSession),
      });
      setState(prev => prev ? { ...prev, allowlist: prev.allowlist.filter(a => a.id !== id) } : null);
    } catch {}
  };

  // ── Toggle Connector ──
  const handleToggleConnector = async (connector: BusinessAgentConnector) => {
    const updatedEnabled = !connector.enabled;
    try {
      const res = await fetch(`/api/whatsapp/business-agent/connectors/${connector.id}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...connector,
          enabled: updatedEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, connectors: data.data } : null);
      }
    } catch {}
  };

  // ── Send Test Sandbox Message ──
  const handleSendTestMessage = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim() || isSimulatingChat) return;

    const userMsg = { sender: 'user' as const, text: promptToSend.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setIsSimulatingChat(true);

    try {
      const history = chatMessages.map(m => ({ sender: m.sender, text: m.text }));
      const res = await fetch('/api/whatsapp/business-agent/test-messages', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: promptToSend.trim(),
          history,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const testResp: BusinessAgentTestResponse = data.data;
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: testResp.reply,
            citations: testResp.citations,
            toolActions: testResp.actions_taken,
            handedOff: testResp.handed_off,
          }
        ]);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'agent', text: `[Simulation Error]: ${err.message}` }
      ]);
    } finally {
      setIsSimulatingChat(false);
    }
  };

  if (isLoading && !state) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 text-sm">Loading Meta Business Agent...</h3>
        <p className="text-xs text-gray-400 mt-1">Connecting to Meta Business API and reading agent telemetry</p>
      </div>
    );
  }

  const isProvisioned = state && state.status !== 'unprovisioned';
  const isAgentActive = state?.settings.rollout.enabled;

  return (
    <div className="space-y-6">
      {/* ── Top Notification Banners ── */}
      {errorBanner && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="hover:text-red-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="hover:text-emerald-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header & Main Control Bar ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Meta Business Agent (Astra)</h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${
                isAgentActive
                  ? state?.settings.ai_audience === 'ALLOWLISTED_ONLY'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {isAgentActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {isAgentActive
                  ? (state?.settings.ai_audience === 'ALLOWLISTED_ONLY' ? 'Active (Allowlist Only)' : 'Active (Live to Everyone)')
                  : (isProvisioned ? 'Standby (Paused)' : 'Unprovisioned')}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Official Meta Cloud API
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Meta’s autonomous conversational AI for WhatsApp. Answers customers directly from your business knowledge, website, and FAQs with action connectors for bookings &amp; payments.
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTestEligibility}
            disabled={isCheckingEligibility}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-gray-700 hover:text-emerald-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Check if your phone number meets Meta's requirements"
          >
            {isCheckingEligibility ? <Loader2 size={13} className="animate-spin text-emerald-600" /> : <ShieldCheck size={14} className="text-emerald-600" />}
            <span>Check Eligibility</span>
          </button>

          <button
            onClick={() => {
              setOnboardingStep(1);
              setShowOnboardingModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles size={14} />
            <span>Onboarding Wizard</span>
          </button>

          {isProvisioned ? (
            <button
              onClick={handleToggleRollout}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isAgentActive
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-[#00D084] text-[#07301f] hover:bg-[#00be77]'
              }`}
            >
              {isUpdating ? <Loader2 size={13} className="animate-spin" /> : (isAgentActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />)}
              <span>{isAgentActive ? 'Deactivate Agent' : 'Activate Live Agent'}</span>
            </button>
          ) : (
            <button
              onClick={handleOnboardAgent}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00D084] text-[#07301f] hover:bg-[#00be77] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              <span>Provision Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Manual Steps Warning (Meta Requirement: Terms & Billing) ── */}
      {state && state.manual_steps.includes('business_agent_terms_not_accepted') && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-950 text-sm">Action Required: Accept Meta Business Agent Terms</h4>
            <p className="text-amber-800 mt-0.5">
              Meta requires the business owner to accept the Meta Business Agent Terms of Service once in WhatsApp Manager before live messages can be sent.
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <a
                href="https://business.facebook.com/latest/whatsapp_manager/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs"
              >
                <span>Accept Terms in WhatsApp Manager</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-[11px] text-amber-700 font-medium">Go to Settings &gt; Meta Business Agent tab</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Studio Navigation Tabs ── */}
      <div className="flex items-center border-b border-gray-200 overflow-x-auto gap-2 bg-white px-4 py-2 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sliders size={14} />
          <span>Overview &amp; Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'knowledge' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HelpCircle size={14} />
          <span>Knowledge Base ({state?.faqs.length || 0} FAQs, {state?.websites.length || 0} URLs)</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'skills' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={14} />
          <span>Voice &amp; Persona</span>
        </button>

        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'connectors' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Calendar size={14} />
          <span>Actions &amp; Connectors ({state?.connectors.filter(c => c.enabled).length || 0} Active)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'simulator' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Smartphone size={14} />
          <span>Interactive Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('rollout')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'rollout' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={14} />
          <span>Rollout &amp; Allowlist</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & TELEMETRY
      ========================================================================= */}
      {activeTab === 'overview' && state && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Agent Status</span>
              <div className="text-xl font-extrabold text-gray-900 mt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isAgentActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span>{state.status.toUpperCase()}</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {isAgentActive ? 'Responding automatically' : 'Standby / Manual mode'}
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Audience Rollout</span>
              <div className="text-xl font-extrabold text-gray-900 mt-2">
                {state.settings.ai_audience === 'ALLOWLISTED_ONLY' ? 'Allowlist Only' : 'Everyone'}
              </div>
              <span className="text-xs text-emerald-600 mt-1 block font-medium">
                {state.allowlist.length} tester numbers permitted
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Knowledge Sources</span>
              <div className="text-xl font-extrabold text-gray-900 mt-2">
                {state.faqs.length + state.websites.length + state.files.length} Ingested
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {state.faqs.length} FAQs, {state.websites.length} websites
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Token Budget Cap</span>
              <div className="text-xl font-extrabold text-gray-900 mt-2">
                {((state.budget.current_tokens_used / state.budget.token_cap) * 100).toFixed(1)}% Used
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {state.budget.current_tokens_used.toLocaleString()} / {state.budget.token_cap.toLocaleString()} tokens
              </span>
            </div>
          </div>

          {/* Quick Setup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <HelpCircle size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Add Business Knowledge</h3>
              <p className="text-xs text-gray-500">
                Upload your product details, return policies, or crawl your website so Astra can answer grounded inquiries.
              </p>
              <button
                onClick={() => setActiveTab('knowledge')}
                className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Knowledge Base</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Calendar size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Enable Action Connectors</h3>
              <p className="text-xs text-gray-500">
                Connect external APIs so Astra can book customer consultations, accept payments, and lookup orders.
              </p>
              <button
                onClick={() => setActiveTab('connectors')}
                className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Configure Connectors</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Smartphone size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Test in Meta Sandbox</h3>
              <p className="text-xs text-gray-500">
                Chat with the agent in real time using Meta’s testing pipeline without incurring message token charges.
              </p>
              <button
                onClick={() => setActiveTab('simulator')}
                className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Sandbox Chat</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: KNOWLEDGE BASE
      ========================================================================= */}
      {activeTab === 'knowledge' && state && (
        <div className="space-y-6">
          {/* Business Info Header Card */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Core Business Information</h3>
                <p className="text-xs text-gray-500">Essential business profile details provided to the agent</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Business Name</label>
                <input
                  type="text"
                  value={state.business_info.name}
                  onChange={e => setState({ ...state, business_info: { ...state.business_info, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Vertical / Category</label>
                <input
                  type="text"
                  value={state.business_info.vertical || 'Retail & E-commerce'}
                  onChange={e => setState({ ...state, business_info: { ...state.business_info, vertical: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-gray-700 block mb-1">Business Description</label>
                <textarea
                  rows={2}
                  value={state.business_info.description}
                  onChange={e => setState({ ...state, business_info: { ...state.business_info, description: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* FAQs Section */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Frequently Asked Questions ({state.faqs.length})</h3>
                <p className="text-xs text-gray-500">Curated questions and verified answers for grounded customer responses</p>
              </div>
              <button
                onClick={() => setShowAddFaqModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00D084] text-[#07301f] rounded-xl text-xs font-bold hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {state.faqs.map(faq => (
                <div key={faq.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                        {faq.category || 'General'}
                      </span>
                      <span className="font-bold text-gray-900">{faq.question}</span>
                    </div>
                    <p className="text-gray-600 pl-1">{faq.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Websites to Crawl */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Websites &amp; Knowledge URLs</h3>
              <p className="text-xs text-gray-500">Provide public websites for the agent to crawl and reference</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://rockyt.io/docs"
                value={newWebsiteUrl}
                onChange={e => setNewWebsiteUrl(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddWebsite}
                disabled={isAddingWebsite || !newWebsiteUrl.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isAddingWebsite ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                <span>Add Website</span>
              </button>
            </div>

            <div className="space-y-2">
              {state.websites.map(web => (
                <div key={web.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{web.url}</span>
                      <span className="text-[10px] text-gray-400 block">
                        Indexed {web.page_count || 10} pages • Last crawled {new Date(web.last_crawled_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWebsite(web.id)}
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: VOICE & PERSONA
      ========================================================================= */}
      {activeTab === 'skills' && state && (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-5 max-w-4xl">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Tone &amp; System Instructions</h3>
            <p className="text-xs text-gray-500">Configure how Astra speaks, its personality, and handoff triggers</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1.5">Brand Tone &amp; Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['friendly', 'professional', 'direct', 'empathetic'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setState({ ...state, skills: { ...state.skills, tone: t } })}
                    className={`p-3 rounded-xl border text-center font-bold capitalize cursor-pointer transition-all ${
                      state.skills.tone === t
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">System Instructions (Prompt)</label>
              <textarea
                rows={5}
                value={state.skills.system_instructions}
                onChange={e => setState({ ...state, skills: { ...state.skills, system_instructions: e.target.value } })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Human Escalation Threshold ({Math.round(state.skills.human_handoff_threshold * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={state.skills.human_handoff_threshold}
                  onChange={e => setState({ ...state, skills: { ...state.skills, human_handoff_threshold: parseFloat(e.target.value) } })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Agent automatically hands off to human when confidence drops below this score.
                </span>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Escalation WhatsApp Number</label>
                <input
                  type="text"
                  value={state.skills.escalation_contact || ''}
                  onChange={e => setState({ ...state, skills: { ...state.skills, escalation_contact: e.target.value } })}
                  placeholder="+13105551234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Human Handoff Message</label>
              <input
                type="text"
                value={state.skills.human_handoff_message}
                onChange={e => setState({ ...state, skills: { ...state.skills, human_handoff_message: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                setSuccessBanner('Agent persona & instructions updated.');
                setTimeout(() => setSuccessBanner(null), 2500);
              }}
              className="px-5 py-2.5 bg-[#00D084] text-[#07301f] rounded-xl font-bold hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
            >
              Save Voice &amp; Instructions
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CONNECTORS & ACTIONS
      ========================================================================= */}
      {activeTab === 'connectors' && state && (
        <div className="space-y-4 max-w-4xl">
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm">Action Connectors (Tools)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Allow Astra to execute real actions like scheduling appointments, creating checkout links, and looking up order tracking numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.connectors.map(conn => (
              <div
                key={conn.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  conn.enabled ? 'bg-white border-emerald-500 shadow-xs' : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      {conn.type === 'booking' && <Calendar size={16} />}
                      {conn.type === 'payment' && <CreditCard size={16} />}
                      {conn.type === 'order_lookup' && <PackageCheck size={16} />}
                      {conn.type === 'custom_webhook' && <Globe size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      conn.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {conn.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm">{conn.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{conn.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 capitalize">{conn.type.replace(/_/g, ' ')}</span>
                  <button
                    onClick={() => handleToggleConnector(conn)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg cursor-pointer transition-all ${
                      conn.enabled ? 'text-red-700 bg-red-50 hover:bg-red-100' : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200'
                    }`}
                  >
                    {conn.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: INTERACTIVE SANDBOX SIMULATOR
      ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mobile Simulator Frame */}
          <div className="lg:col-span-2 bg-gray-100 p-6 rounded-3xl border border-gray-200 flex flex-col items-center justify-center">
            <div className="w-[340px] sm:w-[380px] bg-white rounded-[36px] border-8 border-gray-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-[#075E54] font-bold text-xs">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Astra AI Customer Agent</h4>
                    <span className="text-[9px] text-emerald-200 block">Meta Sandbox Pipeline • 0 Tokens</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatMessages([
                    { sender: 'agent', text: 'Hi there! I am Astra, your Meta Business AI Assistant. Ask me anything to test the live sandbox pipeline.' }
                  ])}
                  className="p-1 hover:bg-black/10 rounded cursor-pointer"
                  title="Reset Simulator"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Chat Messages */}
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto bg-[#EFEAE2] space-y-3 text-xs">
                {chatMessages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl shadow-2xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#E1FFC7] text-gray-900 rounded-tr-none'
                          : 'bg-white text-gray-900 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] text-gray-500">
                          <span className="font-bold text-gray-700">Source: </span>
                          {msg.citations[0].title}
                        </div>
                      )}

                      {msg.toolActions && msg.toolActions.length > 0 && (
                        <div className="mt-1.5 p-1 bg-emerald-50 rounded text-[9px] font-bold text-emerald-800">
                          Tool executed: {msg.toolActions[0].tool}
                        </div>
                      )}

                      {msg.handedOff && (
                        <div className="mt-1.5 p-1 bg-amber-50 rounded text-[9px] font-bold text-amber-800">
                          Escalated to Human Agent
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isSimulatingChat && (
                  <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl text-gray-400 text-xs w-28">
                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message to test Astra..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendTestMessage()}
                  className="flex-1 text-xs px-3.5 py-2 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSendTestMessage()}
                  disabled={!chatInput.trim() || isSimulatingChat}
                  className="p-2 bg-[#00D084] text-[#07301f] rounded-full hover:bg-[#00be77] disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Preset Prompts & Instructions */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Quick Test Prompts</h3>
            <p className="text-xs text-gray-500">
              Click any sample inquiry below to test Astra’s knowledge retrieval and action connectors:
            </p>

            <div className="space-y-2">
              {[
                'What are your store hours and address?',
                'Can I book a consultation appointment?',
                'What is your return and refund policy?',
                'How do I pay with WhatsApp Pay?',
                'I want to speak with a human support agent.',
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendTestMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs text-gray-700 font-medium transition-all cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ROLLOUT & ALLOWLIST
      ========================================================================= */}
      {activeTab === 'rollout' && state && (
        <div className="space-y-6 max-w-4xl">
          {/* Audience Control Card */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Audience Targeting Policy</h3>
            <p className="text-xs text-gray-500">
              Control who receives responses from the AI agent. Meta strongly recommends starting with an Allowlist to test live on real phone numbers before opening to all customers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => handleUpdateAudience('ALLOWLISTED_ONLY')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  state.settings.ai_audience === 'ALLOWLISTED_ONLY'
                    ? 'bg-blue-50/50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Allowlist Only (Recommended)</span>
                  {state.settings.ai_audience === 'ALLOWLISTED_ONLY' && <CheckCircle2 size={16} className="text-blue-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only phone numbers explicitly added below receive AI responses. All other conversations are left for human agents.
                </p>
              </div>

              <div
                onClick={() => handleUpdateAudience('EVERYONE')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  state.settings.ai_audience === 'EVERYONE'
                    ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Everyone (Public Live)</span>
                  {state.settings.ai_audience === 'EVERYONE' && <CheckCircle2 size={16} className="text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Agent responds automatically to all inbound WhatsApp customer threads. Billed per token.
                </p>
              </div>
            </div>
          </div>

          {/* Allowlist Phone Numbers */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Permitted Test Numbers (Allowlist)</h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="+13105551234"
                value={newAllowlistPhone}
                onChange={e => setNewAllowlistPhone(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Tester Name (optional)"
                value={newAllowlistName}
                onChange={e => setNewAllowlistName(e.target.value)}
                className="w-48 text-xs px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddAllowlist}
                disabled={isAddingAllowlist || !newAllowlistPhone.trim()}
                className="px-4 py-2 bg-[#00D084] text-[#07301f] rounded-xl text-xs font-bold hover:bg-[#00be77] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Add Number</span>
              </button>
            </div>

            <div className="space-y-2">
              {state.allowlist.map(entry => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{entry.consumer_phone_number}</span>
                    {entry.name && <span className="text-gray-500">({entry.name})</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteAllowlist(entry.id)}
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ELIGIBILITY CHECKER & AUDIT
      ========================================================================= */}
      {showEligibilityModal && state?.eligibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">Meta Business Agent Eligibility</h3>
              </div>
              <button onClick={() => setShowEligibilityModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {state.eligibility.requirements.map(req => (
                <div key={req.id} className="p-3 rounded-xl border border-gray-200 flex items-start gap-3 bg-gray-50/50">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block">{req.name}</span>
                    <p className="text-gray-500 mt-0.5">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-bold">100% Qualified for Deployment</span>
              <button
                onClick={() => {
                  setShowEligibilityModal(false);
                  setOnboardingStep(1);
                  setShowOnboardingModal(true);
                }}
                className="px-4 py-2 bg-[#00D084] text-[#07301f] font-bold text-xs rounded-xl hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
              >
                Proceed to Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: 6-STEP ONBOARDING WIZARD
      ========================================================================= */}
      {showOnboardingModal && state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Astra Onboarding Journey (Step {onboardingStep} of 6)
                </h3>
              </div>
              <button onClick={() => setShowOnboardingModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="grid grid-cols-6 gap-1.5 shrink-0">
              {[1, 2, 3, 4, 5, 6].map(stepNum => (
                <div
                  key={stepNum}
                  className={`h-1.5 rounded-full transition-all ${
                    onboardingStep >= stepNum ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Step Contents */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {onboardingStep === 1 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 1: Eligibility &amp; Meta Terms</h4>
                  <p className="text-gray-600">
                    Your WhatsApp number ({state.eligibility.phone_number}) qualifies for Meta Business Agent. Before enabling the live pipeline, ensure you have reviewed the Meta Terms of Service in WhatsApp Manager.
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <span className="font-bold text-emerald-900 block">✓ Number Verified &amp; Ready</span>
                    <span className="text-emerald-700 block text-[11px]">
                      Supported Vertical, Cloud API, and Good Standing validated.
                    </span>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 2: Business Profile &amp; Operating Hours</h4>
                  <p className="text-gray-600">Enter details so Astra knows your business identity and hours:</p>
                  <div className="space-y-2.5">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Store Name</label>
                      <input
                        type="text"
                        value={state.business_info.name}
                        onChange={e => setState({ ...state, business_info: { ...state.business_info, name: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={state.business_info.description}
                        onChange={e => setState({ ...state, business_info: { ...state.business_info, description: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 3: Knowledge Base &amp; FAQs</h4>
                  <p className="text-gray-600">Astra answers questions using verified FAQs and your website content:</p>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                    <span className="font-bold text-gray-900">{state.faqs.length} FAQs and {state.websites.length} Websites configured</span>
                    <p className="text-[11px] text-gray-500">You can customize, add, or delete individual FAQs at any time in the Knowledge tab.</p>
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 4: Voice, Tone &amp; Instructions</h4>
                  <p className="text-gray-600">Choose your brand tone and instructions:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['friendly', 'professional', 'direct', 'empathetic'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setState({ ...state, skills: { ...state.skills, tone: t } })}
                        className={`p-2.5 rounded-xl border font-bold capitalize ${
                          state.skills.tone === t ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-white text-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 5 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 5: Action Connectors</h4>
                  <p className="text-gray-600">Select which tools Astra can execute on your behalf:</p>
                  <div className="space-y-2">
                    {state.connectors.map(c => (
                      <div key={c.id} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between bg-gray-50">
                        <div>
                          <span className="font-bold text-gray-900 block">{c.name}</span>
                          <span className="text-[11px] text-gray-500">{c.description}</span>
                        </div>
                        <button
                          onClick={() => handleToggleConnector(c)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            c.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {c.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 6 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Step 6: Ready to Deploy!</h4>
                  <p className="text-gray-600">
                    Astra is completely configured. Choose your rollout policy:
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div
                      onClick={() => handleUpdateAudience('ALLOWLISTED_ONLY')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer ${
                        state.settings.ai_audience === 'ALLOWLISTED_ONLY' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                      }`}
                    >
                      <span className="font-bold text-gray-900 block">Allowlist Only (Safe)</span>
                      <span className="text-[11px] text-gray-500">Test on selected numbers first.</span>
                    </div>

                    <div
                      onClick={() => handleUpdateAudience('EVERYONE')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer ${
                        state.settings.ai_audience === 'EVERYONE' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200'
                      }`}
                    >
                      <span className="font-bold text-gray-900 block">Everyone (Public Live)</span>
                      <span className="text-[11px] text-gray-500">Respond to all incoming chats.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))}
                disabled={onboardingStep === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
              >
                Back
              </button>

              {onboardingStep < 6 ? (
                <button
                  onClick={() => setOnboardingStep(Math.min(6, onboardingStep + 1))}
                  className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all cursor-pointer shadow-xs"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await handleOnboardAgent();
                    setShowOnboardingModal(false);
                  }}
                  className="px-6 py-2 bg-[#00D084] text-[#07301f] text-xs font-bold rounded-xl hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
                >
                  Complete Setup &amp; Launch
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD FAQ MODAL
      ========================================================================= */}
      {showAddFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Add New FAQ</h3>
              <button onClick={() => setShowAddFaqModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Shipping, Returns, Pricing"
                  value={newFaqCategory}
                  onChange={e => setNewFaqCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Question</label>
                <input
                  type="text"
                  placeholder="e.g. Do you ship internationally?"
                  value={newFaqQuestion}
                  onChange={e => setNewFaqQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Answer</label>
                <textarea
                  rows={3}
                  placeholder="Provide the exact answer Astra should provide..."
                  value={newFaqAnswer}
                  onChange={e => setNewFaqAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowAddFaqModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFaq}
                disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                className="px-4 py-2 bg-[#00D084] text-[#07301f] text-xs font-bold rounded-xl hover:bg-[#00be77] transition-all cursor-pointer shadow-xs disabled:opacity-40"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
