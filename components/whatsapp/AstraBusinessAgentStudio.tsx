import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bot, Sparkles, CheckCircle2, AlertCircle, ShieldCheck,
  ShieldAlert, Globe, FileText, HelpCircle, Send,
  RefreshCw, Sliders, CreditCard, Calendar, ArrowRight,
  ArrowLeft, ExternalLink, Plus, Trash2, Clock, Settings,
  Users, Check, Loader2, X, Smartphone, Play, MessageSquare,
  ChevronRight, ToggleLeft, ToggleRight, DollarSign, PackageCheck,
  Award, Zap, Flame, Compass, Eye, Edit3, Lock, Unlock, PhoneCall
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
  // ── Main State ──
  const [state, setState] = useState<MetaBusinessAgentFullState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // ── Mode: 'journey' (Gamified Onboarding Stepper) vs 'dashboard' (Minimal Deployed Management) ──
  const [viewMode, setViewMode] = useState<'journey' | 'dashboard'>('journey');
  const [journeyStep, setJourneyStep] = useState<number>(1);
  const [highestUnlockedStep, setHighestUnlockedStep] = useState<number>(1);

  // ── Simulator Drawer/Modal State ──
  const [showSimulatorDrawer, setShowSimulatorDrawer] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'agent';
    text: string;
    citations?: any[];
    toolActions?: any[];
    handedOff?: boolean;
  }>>([
    {
      sender: 'agent',
      text: 'Hi there! I am Astra, your Meta Business AI Assistant. Ask me anything about your products, business hours, or test booking an appointment.',
    }
  ]);
  const [isSimulatingChat, setIsSimulatingChat] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Inline Edit / Creation States ──
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');
  const [newFaqCategory, setNewFaqCategory] = useState<string>('General');
  const [showAddFaqInline, setShowAddFaqInline] = useState<boolean>(false);

  const [newWebsiteUrl, setNewWebsiteUrl] = useState<string>('');
  const [isAddingWebsite, setIsAddingWebsite] = useState<boolean>(false);

  const [newAllowlistPhone, setNewAllowlistPhone] = useState<string>('');
  const [newAllowlistName, setNewAllowlistName] = useState<string>('');
  const [isAddingAllowlist, setIsAddingAllowlist] = useState<boolean>(false);

  const [promptInstructionsDraft, setPromptInstructionsDraft] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);

  // ── Terms Acceptance Checkbox (Step 1) ──
  const [termsAcceptedLocally, setTermsAcceptedLocally] = useState<boolean>(false);

  // ── Load State ──
  const loadAgentState = async (silently = false) => {
    try {
      if (!silently) setIsLoading(true);
      setErrorBanner(null);
      const res = await fetch('/api/whatsapp/business-agent/status', {
        headers: getAuthHeaders(userSession),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Meta Business Agent state');
      }
      const fetchedState: MetaBusinessAgentFullState = data.data;
      setState(fetchedState);

      // Set prompt draft
      if (fetchedState.skills?.system_instructions) {
        setPromptInstructionsDraft(fetchedState.skills.system_instructions);
      }

      // Determine initial view mode:
      // If agent is active / deployed, default to dashboard. Otherwise show journey.
      if (fetchedState.settings.rollout.enabled && fetchedState.status !== 'unprovisioned') {
        setViewMode('dashboard');
      }

      // Determine highest unlocked step
      let unlocked = 1;
      if (fetchedState.eligible) unlocked = 2;
      if (fetchedState.status !== 'unprovisioned') unlocked = 3;
      if (fetchedState.faqs.length > 0 || fetchedState.websites.length > 0) unlocked = 4;
      if (fetchedState.skills?.system_instructions) unlocked = 5;
      if (fetchedState.settings.rollout.enabled) unlocked = 6;
      setHighestUnlockedStep(Math.max(unlocked, 1));

    } catch (err: any) {
      console.error('[loadAgentState error]:', err);
      setErrorBanner(err.message || 'Error loading agent state');
    } finally {
      if (!silently) setIsLoading(false);
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

  // ── Gamified Level & XP Calculation ──
  const { currentLevel, xpPoints, readinessScore } = useMemo(() => {
    let score = 0;
    if (state?.eligible) score += 100; // Step 1
    if (state?.status !== 'unprovisioned') score += 100; // Step 2
    if ((state?.faqs?.length || 0) > 0 || (state?.websites?.length || 0) > 0) score += 100; // Step 3
    if (state?.skills?.system_instructions) score += 100; // Step 4
    if (chatMessages.length > 1) score += 100; // Step 5
    if (state?.settings?.rollout?.enabled) score += 100; // Step 6

    let lvl = 'Novice Agent';
    if (score >= 600) lvl = 'Autonomous Master';
    else if (score >= 400) lvl = 'Skilled Specialist';
    else if (score >= 300) lvl = 'Knowledge Apprentice';
    else if (score >= 200) lvl = 'Core Activated';
    else if (score >= 100) lvl = 'Verified Candidate';

    return {
      currentLevel: lvl,
      xpPoints: score,
      readinessScore: Math.min(100, Math.round((score / 600) * 100)),
    };
  }, [state, chatMessages]);

  // ── Step 2: Provision Agent Core ──
  const handleProvisionAgent = async () => {
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
      setSuccessBanner('🎉 Astra Core provisioned on Meta Cloud! Your WhatsApp number now has dedicated AI inference runtime.');
      await loadAgentState(true);
      setHighestUnlockedStep(prev => Math.max(prev, 3));
      setTimeout(() => {
        setSuccessBanner(null);
        setJourneyStep(3);
      }, 1500);
    } catch (err: any) {
      setErrorBanner(err.message || 'Onboarding error');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Step 3: Preset Starter FAQ Packs ──
  const handleAddStarterFaqPack = async (packType: 'ecommerce' | 'services') => {
    try {
      setIsUpdating(true);
      const starterFaqs = packType === 'ecommerce' ? [
        { question: 'What are your delivery & shipping times?', answer: 'Orders are processed within 24 hours. Standard shipping takes 2–4 business days with tracking provided via WhatsApp.', category: 'Shipping' },
        { question: 'What is your return & exchange policy?', answer: 'We offer a 30-day hassle-free return and exchange guarantee for all unworn or unopened products.', category: 'Returns' },
        { question: 'What payment methods do you accept?', answer: 'We accept credit cards, debit cards, Apple Pay, and WhatsApp Pay with end-to-end encryption.', category: 'Payments' }
      ] : [
        { question: 'How can I book a consultation appointment?', answer: 'You can book an appointment directly in this chat! Just let me know your preferred day and time.', category: 'Booking' },
        { question: 'What are your operating hours?', answer: 'Our team and office hours are Monday through Friday, 9:00 AM to 6:00 PM.', category: 'Hours' },
        { question: 'Can I reschedule or cancel my booking?', answer: 'Yes, appointments can be rescheduled up to 4 hours in advance with no cancellation penalty.', category: 'Policy' }
      ];

      for (const faq of starterFaqs) {
        await fetch('/api/whatsapp/business-agent/faqs', {
          method: 'POST',
          headers: { ...getAuthHeaders(userSession), 'Content-Type': 'application/json' },
          body: JSON.stringify(faq),
        });
      }

      await loadAgentState(true);
      setSuccessBanner(`Added ${starterFaqs.length} pre-built FAQs to Astra knowledge base!`);
      setHighestUnlockedStep(prev => Math.max(prev, 4));
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to add starter FAQs');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Add FAQ ──
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
          category: newFaqCategory.trim() || 'General',
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, faqs: [data.data, ...prev.faqs] } : null);
        setNewFaqQuestion('');
        setNewFaqAnswer('');
        setShowAddFaqInline(false);
        setSuccessBanner('FAQ added to Astra brain.');
        setHighestUnlockedStep(prev => Math.max(prev, 4));
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

  // ── Website Sync ──
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
        setSuccessBanner('Website submitted for automatic indexing.');
        setHighestUnlockedStep(prev => Math.max(prev, 4));
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

  // ── Step 4: Persona & Tone ──
  const handleUpdateTone = async (tone: 'friendly' | 'professional' | 'direct' | 'empathetic') => {
    try {
      setIsUpdating(true);
      const res = await fetch('/api/whatsapp/business-agent/skills', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tone }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, skills: data.data } : null);
        setSuccessBanner(`Agent tone updated to: ${tone.toUpperCase()}`);
        setHighestUnlockedStep(prev => Math.max(prev, 5));
        setTimeout(() => setSuccessBanner(null), 2500);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update tone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch('/api/whatsapp/business-agent/skills', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(userSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ system_instructions: promptInstructionsDraft }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setState(prev => prev ? { ...prev, skills: data.data } : null);
        setIsEditingPrompt(false);
        setSuccessBanner('Astra instructions successfully saved.');
        setHighestUnlockedStep(prev => Math.max(prev, 5));
        setTimeout(() => setSuccessBanner(null), 2500);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save prompt instructions');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Connectors (Tools) ──
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
        setSuccessBanner(`${connector.name} tool ${updatedEnabled ? 'Enabled' : 'Disabled'}.`);
        setTimeout(() => setSuccessBanner(null), 2500);
      }
    } catch {}
  };

  // ── Step 5: Test Sandbox Chat ──
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
        setHighestUnlockedStep(prev => Math.max(prev, 6));
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'agent', text: `[Sandbox Simulator Notice]: ${err.message}` }
      ]);
    } finally {
      setIsSimulatingChat(false);
    }
  };

  // ── Step 6: Rollout & Audience ──
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
        setSuccessBanner(`Audience set to: ${audience === 'ALLOWLISTED_ONLY' ? 'Allowlisted Testers Only (Safe Staging)' : 'All Customers (Live Rollout)'}`);
        setTimeout(() => setSuccessBanner(null), 3000);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error setting audience');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleRollout = async (targetState?: boolean) => {
    if (!state) return;
    const nextEnabled = targetState !== undefined ? targetState : !state.settings.rollout.enabled;

    if (nextEnabled && state.manual_steps.includes('business_agent_terms_not_accepted') && !termsAcceptedLocally) {
      alert('Meta requires accepting the Meta Business Agent Terms in WhatsApp Manager before live messages can be sent. Click the link in Step 1 to review and confirm.');
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

      if (nextEnabled) {
        setSuccessBanner('🚀 Astra is LIVE on your WhatsApp number! Autonomous customer replies are now active.');
        setViewMode('dashboard');
      } else {
        setSuccessBanner('Astra Agent paused. Standby mode active.');
      }
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error updating rollout');
    } finally {
      setIsUpdating(false);
    }
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

  if (isLoading && !state) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Bot size={24} />
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-base">Waking up Astra AI...</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Synchronizing with Meta Cloud API and reading agent telemetry...
        </p>
      </div>
    );
  }

  const isProvisioned = state && state.status !== 'unprovisioned';
  const isAgentActive = Boolean(state?.settings?.rollout?.enabled);
  const termsPending = Boolean(state?.manual_steps.includes('business_agent_terms_not_accepted') && !termsAcceptedLocally);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Banners ── */}
      {errorBanner && (
        <div className="p-4 bg-red-50/90 backdrop-blur-xs border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span className="font-semibold">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="hover:text-red-900 cursor-pointer p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-4 bg-emerald-50/90 backdrop-blur-xs border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="hover:text-emerald-900 cursor-pointer p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sleek Top Navigation Bar (Mode Switcher & Master Status) ── */}
      <div className="bg-white/95 backdrop-blur-sm p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <Bot size={22} />
            </div>
            {isAgentActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Astra AI</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                Official Meta Cloud Agent
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Autonomous WhatsApp Business Assistant for customer care, catalog inquiries &amp; bookings
            </p>
          </div>
        </div>

        {/* View Mode Segmented Switch & Simulator Action */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('journey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'journey'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Compass size={13} className={viewMode === 'journey' ? 'text-emerald-600' : ''} />
              <span>Setup Journey</span>
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sliders size={13} className={viewMode === 'dashboard' ? 'text-emerald-600' : ''} />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            onClick={() => setShowSimulatorDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Open Interactive Test Sandbox"
          >
            <Smartphone size={14} className="text-emerald-600" />
            <span className="hidden md:inline">Test Sandbox</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: GAMIFIED SETUP JOURNEY (Following Official Setup Order)
      ========================================================================= */}
      {viewMode === 'journey' && (
        <div className="space-y-6">
          {/* Gamification Progress Hero */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block">
                      Astra AI Readiness Level
                    </span>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{currentLevel}</span>
                      <span className="text-xs font-normal text-gray-400">({xpPoints} / 600 IQ)</span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">{readinessScore}%</span>
                    <span className="text-[10px] text-gray-400 block">Launch Ready</span>
                  </div>
                  <div className="w-20 bg-gray-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-700">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${readinessScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 6 Step Progress Navigation Badges */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                {[
                  { step: 1, label: '1. Eligibility', icon: ShieldCheck },
                  { step: 2, label: '2. Provision', icon: Zap },
                  { step: 3, label: '3. Knowledge', icon: Globe },
                  { step: 4, label: '4. Persona', icon: Sparkles },
                  { step: 5, label: '5. Simulator', icon: Smartphone },
                  { step: 6, label: '6. Rollout', icon: Flame },
                ].map(({ step, label, icon: StepIcon }) => {
                  const isCurrent = journeyStep === step;
                  const isDone = highestUnlockedStep > step || (step === 6 && isAgentActive);
                  const isUnlocked = highestUnlockedStep >= step;

                  return (
                    <button
                      key={step}
                      disabled={!isUnlocked}
                      onClick={() => setJourneyStep(step)}
                      className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border ${
                        isCurrent
                          ? 'bg-emerald-500 text-gray-950 font-bold border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                          : isDone
                          ? 'bg-gray-800/80 hover:bg-gray-800 text-emerald-400 border-emerald-500/20'
                          : isUnlocked
                          ? 'bg-gray-800/40 hover:bg-gray-800/60 text-gray-300 border-gray-700'
                          : 'bg-gray-900/40 text-gray-600 border-gray-800/50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <StepIcon size={14} className={isCurrent ? 'text-gray-950' : isDone ? 'text-emerald-400' : 'text-gray-400'} />
                        {isDone ? (
                          <Check size={12} className={isCurrent ? 'text-gray-950' : 'text-emerald-400'} />
                        ) : !isUnlocked ? (
                          <Lock size={11} className="text-gray-600" />
                        ) : null}
                      </div>
                      <span className="text-[11px] truncate leading-tight block">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 1: ELIGIBILITY & TERMS */}
          {journeyStep === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 1 of 6</span>
                  <h3 className="text-lg font-bold text-gray-900">Check Number Eligibility &amp; Meta Terms</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Meta requires official Cloud API verification and acceptance of terms before an autonomous agent can message customers.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">WhatsApp Cloud API Active</span>
                    <span className="text-[11px] text-gray-500">Official business number registered and connected.</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Supported Business Vertical</span>
                    <span className="text-[11px] text-gray-500">Commercial retail, services, consulting &amp; e-commerce.</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">No Conflicting In-App Bot</span>
                    <span className="text-[11px] text-gray-500">Astra will operate as the primary AI responder.</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Free Sandbox Pipeline Available</span>
                    <span className="text-[11px] text-gray-500">Zero-token testing before going live to real customers.</span>
                  </div>
                </div>
              </div>

              {/* Meta Terms Notice (Zernio Requirement) */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-xs text-amber-950">Meta Requirement: Accept Business Agent Terms</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Meta requires the business owner to accept the Meta Business Agent Terms once in WhatsApp Manager. You can complete all configuration steps now, but live messages require terms acceptance.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60">
                  <a
                    href="https://business.facebook.com/latest/whatsapp_manager/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-2xs"
                  >
                    <span>Open WhatsApp Manager in Meta</span>
                    <ExternalLink size={12} />
                  </a>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={termsAcceptedLocally}
                      onChange={e => setTermsAcceptedLocally(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>I have reviewed or accepted the terms</span>
                  </label>
                </div>
              </div>

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>+100 IQ Points Unlocked</span>
                </span>
                <button
                  onClick={() => {
                    setHighestUnlockedStep(prev => Math.max(prev, 2));
                    setJourneyStep(2);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROVISION AGENT CORE */}
          {journeyStep === 2 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 2 of 6</span>
                  <h3 className="text-lg font-bold text-gray-900">Provision Astra Agent Core on Meta Cloud</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Allocates the conversational inference engine directly on Meta&apos;s WhatsApp infrastructure.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
              </div>

              {isProvisioned ? (
                <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Astra Core is Provisioned &amp; Ready</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Meta Cloud runtime is assigned to your number ({state?.eligibility?.phone_number || 'Connected Number'}).
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-full uppercase tracking-wider self-start sm:self-center">
                    Status: Ready
                  </span>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Bot size={28} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="font-bold text-gray-900 text-sm">Wake Up Astra on Meta Cloud</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Click the button below to register your number with Meta’s autonomous AI pipeline. Meta takes approximately 20–30 seconds.
                    </p>
                  </div>
                  <button
                    onClick={handleProvisionAgent}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    <span>{isUpdating ? 'Registering with Meta Cloud...' : 'Provision Astra Agent Core Now'}</span>
                  </button>
                </div>
              )}

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setJourneyStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    setHighestUnlockedStep(prev => Math.max(prev, 3));
                    setJourneyStep(3);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BUSINESS KNOWLEDGE BASE */}
          {journeyStep === 3 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 3 of 6</span>
                  <h3 className="text-lg font-bold text-gray-900">Populate Astra&apos;s Knowledge Base</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Knowledge gives Astra substance. Adding business details before launch ensures customers receive accurate, helpful answers.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
              </div>

              {/* Quick Starter Packs */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    <h4 className="font-bold text-xs text-gray-900">1-Click Starter FAQ Packs</h4>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Instant Setup
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Quickly seed Astra with standard business Q&amp;As that you can customize at any time:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleAddStarterFaqPack('ecommerce')}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <PackageCheck size={13} />
                    <span>+ Add E-Commerce Pack (Shipping, Returns, Payments)</span>
                  </button>
                  <button
                    onClick={() => handleAddStarterFaqPack('services')}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Calendar size={13} />
                    <span>+ Add Services Pack (Booking, Hours, Cancellations)</span>
                  </button>
                </div>
              </div>

              {/* Website Crawler Ingestion */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 block">Website URL Indexing</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://yourstore.com (Meta crawls &amp; extracts FAQs automatically)"
                    value={newWebsiteUrl}
                    onChange={e => setNewWebsiteUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <button
                    onClick={handleAddWebsite}
                    disabled={isAddingWebsite || !newWebsiteUrl.trim()}
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {isAddingWebsite ? <Loader2 size={14} className="animate-spin" /> : 'Index URL'}
                  </button>
                </div>
              </div>

              {/* Current Knowledge Summary */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {(state?.faqs?.length || 0) + (state?.websites?.length || 0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {state?.faqs?.length || 0} FAQs &bull; {state?.websites?.length || 0} Websites Indexed
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {(state?.faqs?.length || 0) > 0 ? 'Astra has sufficient substance to answer customer inquiries.' : 'Add at least 1 FAQ or website URL.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFaqInline(!showAddFaqInline)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {showAddFaqInline ? 'Close Form' : '+ Add Custom FAQ'}
                </button>
              </div>

              {/* Inline Custom FAQ Form */}
              {showAddFaqInline && (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3 animate-in fade-in">
                  <h5 className="font-bold text-xs text-gray-900">Add Custom Question &amp; Answer</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Category (e.g. Pricing, Shipping)"
                      value={newFaqCategory}
                      onChange={e => setNewFaqCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Question (e.g. Do you deliver on weekends?)"
                      value={newFaqQuestion}
                      onChange={e => setNewFaqQuestion(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Exact answer Astra will deliver..."
                    value={newFaqAnswer}
                    onChange={e => setNewFaqAnswer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleAddFaq}
                      disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                      className="px-4 py-1.5 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-40 shadow-2xs"
                    >
                      Save FAQ
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setJourneyStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    setHighestUnlockedStep(prev => Math.max(prev, 4));
                    setJourneyStep(4);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Step 4</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PERSONA & VOICE */}
          {journeyStep === 4 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 4 of 6</span>
                  <h3 className="text-lg font-bold text-gray-900">Define Brand Tone &amp; Instructions</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Calibrate Astra&apos;s personality so responses match your brand identity and voice.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
              </div>

              {/* 4 Tone Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'friendly', name: 'Friendly & Warm', emoji: '🌟', desc: 'Welcoming, positive, uses emojis, enthusiastic.' },
                  { id: 'professional', name: 'Professional', emoji: '💼', desc: 'Crisp, polite, authoritative, formal B2B tone.' },
                  { id: 'direct', name: 'Direct & Swift', emoji: '⚡', desc: 'Clear, succinct, minimal fluff, straight to the point.' },
                  { id: 'empathetic', name: 'Empathetic', emoji: '🤝', desc: 'Caring, attentive, patient, reassuring.' },
                ].map(item => {
                  const isSelected = state?.skills?.tone === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleUpdateTone(item.id as any)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <span className="text-2xl mb-2 block">{item.emoji}</span>
                        <h4 className="font-bold text-xs text-gray-900">{item.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-3 self-start">
                          Active Tone
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Prompt Instructions Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900">Custom Behavior Instructions</label>
                  <span className="text-[11px] text-gray-400">Meta System Prompt</span>
                </div>
                <textarea
                  rows={3}
                  value={promptInstructionsDraft}
                  onChange={e => {
                    setPromptInstructionsDraft(e.target.value);
                    setIsEditingPrompt(true);
                  }}
                  placeholder="e.g. Always address customers politely, recommend our bestsellers, offer booking link if interested, and hand off refund disputes to support."
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white"
                />
                {isEditingPrompt && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePrompt}
                      disabled={isUpdating}
                      className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      Save Instructions
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setJourneyStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    setHighestUnlockedStep(prev => Math.max(prev, 5));
                    setJourneyStep(5);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Step 5</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: INTERACTIVE SANDBOX TESTING */}
          {journeyStep === 5 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 5 of 6</span>
                  <h3 className="text-lg font-bold text-gray-900">Test in the Interactive Sandbox</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Meta provides a dedicated zero-token test pipeline. Test Astra in real-time before answering real customers.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500">Quick Test Prompts:</span>
                {[
                  'What are your store hours?',
                  'Can I book an appointment?',
                  'What is your return policy?',
                  'Do you accept card payments?'
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => handleSendTestMessage(q)}
                    disabled={isSimulatingChat}
                    className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200 text-gray-700 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* WhatsApp Simulated Phone Box */}
              <div className="max-w-md mx-auto rounded-3xl border-4 border-gray-900 shadow-xl overflow-hidden bg-[#efeae2] flex flex-col h-96">
                {/* Simulated Header */}
                <div className="bg-[#075e54] text-white p-3 flex items-center gap-2.5 shrink-0 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/30 flex items-center justify-center text-white font-bold text-xs">
                    <Bot size={16} />
                  </div>
                  <div className="flex-1 leading-tight">
                    <span className="font-bold text-xs block">Astra (Meta Business AI)</span>
                    <span className="text-[10px] text-emerald-200 block">online &bull; sandbox mode</span>
                  </div>
                  <span className="text-[9px] bg-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Free Sandbox
                  </span>
                </div>

                {/* Simulated Chat Feed */}
                <div ref={chatScrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                          msg.sender === 'user'
                            ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs'
                            : 'bg-white text-gray-900 rounded-tl-xs space-y-1.5'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-1.5 border-t border-gray-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            <span>Verified from: {msg.citations[0].title}</span>
                          </div>
                        )}
                        {msg.toolActions && msg.toolActions.length > 0 && (
                          <div className="pt-1 text-[10px] text-blue-700 font-bold flex items-center gap-1">
                            <Zap size={10} className="text-blue-500" />
                            <span>Triggered: {msg.toolActions[0].tool}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSimulatingChat && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-500 rounded-2xl p-2.5 shadow-2xs text-xs flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-emerald-600" />
                        <span className="text-[11px]">Astra is typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Input */}
                <div className="p-2 bg-white/95 border-t border-gray-200 flex items-center gap-1.5 shrink-0">
                  <input
                    type="text"
                    placeholder="Type a test message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendTestMessage();
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleSendTestMessage()}
                    disabled={isSimulatingChat || !chatInput.trim()}
                    className="p-2 bg-[#00D084] text-[#07301f] rounded-xl hover:bg-[#00be77] disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setJourneyStep(4)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    setHighestUnlockedStep(prev => Math.max(prev, 6));
                    setJourneyStep(6);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Final Step</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: STAGING & ROLLOUT LAUNCH */}
          {journeyStep === 6 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Step 6 of 6 &bull; Final Step</span>
                  <h3 className="text-lg font-bold text-gray-900">Choose Rollout Strategy &amp; Deploy</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select your audience policy. You can safely launch on Allowlisted numbers first before public release.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Flame size={20} />
                </div>
              </div>

              {/* Audience Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => handleUpdateAudience('ALLOWLISTED_ONLY')}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                    state?.settings.ai_audience === 'ALLOWLISTED_ONLY'
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🛡️</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      Recommended First
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">Allowlisted Testers Only</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Astra only responds to numbers in your tester list. Public customers are untouched.
                  </p>
                </div>

                <div
                  onClick={() => handleUpdateAudience('EVERYONE')}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                    state?.settings.ai_audience === 'EVERYONE'
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🚀</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      Full Public Live
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">Everyone (All WhatsApp Customers)</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Astra autonomously answers all incoming WhatsApp conversations 24/7.
                  </p>
                </div>
              </div>

              {/* Tester Phone Input if in Allowlist Mode */}
              {state?.settings.ai_audience === 'ALLOWLISTED_ONLY' && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-gray-900 block">Add Internal Tester Phone Number</span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="+1234567890 (Your or your team's number)"
                      value={newAllowlistPhone}
                      onChange={e => setNewAllowlistPhone(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleAddAllowlist}
                      disabled={isAddingAllowlist || !newAllowlistPhone.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isAddingAllowlist ? <Loader2 size={13} className="animate-spin" /> : 'Add Tester'}
                    </button>
                  </div>
                  {state.allowlist.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {state.allowlist.map(entry => (
                        <span key={entry.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-[11px] rounded-lg">
                          <span>{entry.consumer_phone_number}</span>
                          <button onClick={() => handleDeleteAllowlist(entry.id)} className="text-gray-400 hover:text-red-600 cursor-pointer">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Launch Call To Action */}
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-white/20 mx-auto flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <h4 className="text-base font-bold">Ready to Deploy Astra on WhatsApp!</h4>
                <p className="text-xs text-emerald-100 max-w-md mx-auto leading-relaxed">
                  Click the button below to turn on autonomous conversational intelligence for your connected number.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleToggleRollout(true)}
                    disabled={isUpdating}
                    className="px-8 py-3 bg-white text-gray-950 hover:bg-gray-100 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md inline-flex items-center gap-2 transform active:scale-98"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <Play size={16} className="text-emerald-600 fill-emerald-600" />}
                    <span>Deploy Meta Business Agent</span>
                  </button>
                </div>
              </div>

              {/* Bottom Stepper Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setJourneyStep(5)}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <span>Skip to Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: MINIMAL DEPLOYED DASHBOARD (All Info with Inline Edit)
      ========================================================================= */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Executive Agent Hero Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                  <Bot size={28} />
                </div>
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isAgentActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                }`} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">Astra Business Agent</h2>
                  <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                    isAgentActive
                      ? state?.settings.ai_audience === 'ALLOWLISTED_ONLY'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {isAgentActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {isAgentActive
                      ? (state?.settings.ai_audience === 'ALLOWLISTED_ONLY' ? 'Active &bull; Staging (Allowlist)' : 'Active &bull; Live to Everyone')
                      : 'Standby (Paused)'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Connected Number: <strong className="text-gray-700 font-semibold">{state?.eligibility?.phone_number || 'Cloud API Active'}</strong> &bull; Level: <strong className="text-emerald-700 font-semibold">{currentLevel}</strong> ({xpPoints}/600 IQ)
                </p>
              </div>
            </div>

            {/* Master Control Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setViewMode('journey')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Review or adjust guided setup steps"
              >
                <Compass size={13} className="text-gray-500" />
                <span>Review Setup Steps</span>
              </button>

              <button
                onClick={() => handleToggleRollout()}
                disabled={isUpdating}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isAgentActive
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'bg-[#00D084] text-[#07301f] hover:bg-[#00be77]'
                }`}
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : isAgentActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                <span>{isAgentActive ? 'Pause Agent' : 'Activate Live'}</span>
              </button>
            </div>
          </div>

          {/* Manual Steps Banner (if Terms still pending) */}
          {termsPending && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">Action Notice: Accept Meta Terms</h4>
                  <p className="text-amber-800 mt-0.5">
                    Remember to accept Meta Business Agent terms in WhatsApp Manager before live public customer chats.
                  </p>
                </div>
              </div>
              <a
                href="https://business.facebook.com/latest/whatsapp_manager/"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 inline-flex items-center gap-1"
              >
                <span>WhatsApp Manager</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Telemetry Summary Cards (Minimal) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-gray-400 block">Knowledge Base</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {(state?.faqs?.length || 0) + (state?.websites?.length || 0)} Items
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">{state?.faqs?.length || 0} FAQs &bull; {state?.websites?.length || 0} URLs</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-gray-400 block">Brand Persona</span>
              <span className="text-lg font-bold text-gray-900 mt-1 capitalize block">
                {state?.skills?.tone || 'Friendly'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Handoff: {Math.round((state?.skills?.human_handoff_threshold || 0.8) * 100)}%</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-gray-400 block">Superpowers</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {state?.connectors?.filter(c => c.enabled).length || 0} Active
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Bookings &amp; Payments</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-gray-400 block">Audience Policy</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {state?.settings.ai_audience === 'ALLOWLISTED_ONLY' ? 'Staging' : 'Everyone'}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">{state?.allowlist?.length || 0} Allowed Numbers</span>
            </div>
          </div>

          {/* 4 Bento Management Cards (With Inline Edit) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. BRAIN & KNOWLEDGE BASE */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Knowledge &amp; Content</h3>
                    <p className="text-[11px] text-gray-500">FAQs and websites Astra quotes from</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFaqInline(!showAddFaqInline)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {showAddFaqInline ? 'Close' : '+ Add FAQ'}
                </button>
              </div>

              {/* Inline FAQ Form */}
              {showAddFaqInline && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Question (e.g. Do you ship overseas?)"
                    value={newFaqQuestion}
                    onChange={e => setNewFaqQuestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Answer Astra will provide..."
                    value={newFaqAnswer}
                    onChange={e => setNewFaqAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleAddFaq}
                      disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                      className="px-4 py-1.5 bg-[#00D084] text-[#07301f] rounded-xl font-bold cursor-pointer disabled:opacity-40"
                    >
                      Save FAQ
                    </button>
                  </div>
                </div>
              )}

              {/* FAQs List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state?.faqs && state.faqs.length > 0 ? (
                  state.faqs.map(faq => (
                    <div key={faq.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5 flex-1">
                        <span className="font-bold text-gray-900 block">{faq.question}</span>
                        <p className="text-gray-500 text-[11px] line-clamp-2 leading-relaxed">{faq.answer}</p>
                      </div>
                      <button onClick={() => handleDeleteFaq(faq.id)} className="text-gray-400 hover:text-red-600 p-1 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">No FAQs added yet.</p>
                )}
              </div>

              {/* Website URL Quick Ingest */}
              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <input
                  type="url"
                  placeholder="https://yourstore.com"
                  value={newWebsiteUrl}
                  onChange={e => setNewWebsiteUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleAddWebsite}
                  disabled={isAddingWebsite || !newWebsiteUrl.trim()}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer disabled:opacity-40"
                >
                  Index URL
                </button>
              </div>
            </div>

            {/* 2. PERSONA & INSTRUCTIONS */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Voice &amp; Behavior</h3>
                    <p className="text-[11px] text-gray-500">Tone and response instructions</p>
                  </div>
                </div>
              </div>

              {/* Tone Quick Selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['friendly', 'professional', 'direct', 'empathetic'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleUpdateTone(t)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold capitalize transition-all border cursor-pointer ${
                      state?.skills?.tone === t
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Instructions Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">System Prompt</label>
                <textarea
                  rows={4}
                  value={promptInstructionsDraft}
                  onChange={e => {
                    setPromptInstructionsDraft(e.target.value);
                    setIsEditingPrompt(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
                {isEditingPrompt && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePrompt}
                      disabled={isUpdating}
                      className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ACTION CONNECTORS (SUPERPOWERS) */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Action Connectors</h3>
                  <p className="text-[11px] text-gray-500">Autonomous tool actions Astra can trigger</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {state?.connectors.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-900 block">{c.name}</span>
                      <span className="text-gray-500 text-[11px]">{c.description}</span>
                    </div>
                    <button
                      onClick={() => handleToggleConnector(c)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        c.enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {c.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ROLLOUT & ACCESS CONTROL */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Audience &amp; Testers</h3>
                  <p className="text-[11px] text-gray-500">Staging controls and tester allowlist</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleUpdateAudience('ALLOWLISTED_ONLY')}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    state?.settings.ai_audience === 'ALLOWLISTED_ONLY'
                      ? 'border-blue-500 bg-blue-50/60 text-blue-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-xs">🛡️ Allowlist Only</span>
                  <span className="text-[10px] text-gray-500 font-normal">Internal team only</span>
                </button>

                <button
                  onClick={() => handleUpdateAudience('EVERYONE')}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    state?.settings.ai_audience === 'EVERYONE'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-xs">🌐 Everyone (Live)</span>
                  <span className="text-[10px] text-gray-500 font-normal">All WhatsApp chats</span>
                </button>
              </div>

              {/* Allowlist Numbers */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Add tester phone (+1234567890)"
                    value={newAllowlistPhone}
                    onChange={e => setNewAllowlistPhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  />
                  <button
                    onClick={handleAddAllowlist}
                    disabled={isAddingAllowlist || !newAllowlistPhone.trim()}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                {state?.allowlist && state.allowlist.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {state.allowlist.map(a => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] rounded-lg">
                        <span>{a.consumer_phone_number}</span>
                        <button onClick={() => handleDeleteAllowlist(a.id)} className="text-gray-400 hover:text-red-600 cursor-pointer">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OUT / MODAL: INTERACTIVE TEST SANDBOX SIMULATOR
      ========================================================================= */}
      {showSimulatorDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#075e54] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Astra WhatsApp Simulator</h3>
                  <span className="text-[11px] text-emerald-200 block">Zero-Token Meta Sandbox Pipeline</span>
                </div>
              </div>
              <button onClick={() => setShowSimulatorDrawer(false)} className="text-white/80 hover:text-white cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs'
                        : 'bg-white text-gray-900 rounded-tl-xs space-y-1.5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-1.5 border-t border-gray-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>Source: {msg.citations[0].title}</span>
                      </div>
                    )}
                    {msg.toolActions && msg.toolActions.length > 0 && (
                      <div className="pt-1 text-[10px] text-blue-700 font-bold flex items-center gap-1">
                        <Zap size={10} className="text-blue-500" />
                        <span>Executed: {msg.toolActions[0].tool}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSimulatingChat && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 rounded-2xl p-2.5 shadow-2xs text-xs flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                    <span className="text-[11px]">Astra is responding...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Suggestions */}
            <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-2 overflow-x-auto shrink-0">
              {['What are your store hours?', 'Can I book an appointment?', 'What is your return policy?'].map(q => (
                <button
                  key={q}
                  onClick={() => handleSendTestMessage(q)}
                  disabled={isSimulatingChat}
                  className="text-[11px] px-2.5 py-1 bg-white hover:bg-emerald-50 border border-gray-200 rounded-lg text-gray-700 whitespace-nowrap cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask Astra a question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendTestMessage();
                }}
                className="flex-1 px-3.5 py-2.5 text-xs bg-gray-100 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSendTestMessage()}
                disabled={isSimulatingChat || !chatInput.trim()}
                className="p-2.5 bg-[#00D084] text-[#07301f] rounded-xl hover:bg-[#00be77] cursor-pointer disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
