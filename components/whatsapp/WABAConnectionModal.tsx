import React, { useState } from 'react';
import { 
  X, CheckCircle2, Sparkles, ExternalLink, Key, 
  Phone, AlertCircle, Loader2, PlayCircle, Info, ShieldCheck, Check,
  Users, PhoneCall, Smartphone, Cloud, ArrowRight, AlertTriangle
} from 'lucide-react';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface WABAConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (accountData: any) => void;
  onSuccess?: () => void;
}

type ConnectionTab = 'cloud_api' | 'coexistence' | 'credentials' | 'sandbox';

const WABAConnectionModal: React.FC<WABAConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<ConnectionTab>('cloud_api');
  const [sandboxPhone, setSandboxPhone] = useState('+971503102740');
  const [sandboxSession, setSandboxSession] = useState<any>(null);
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessName, setBusinessName] = useState('Rockyt Business Account');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getHeaders = () => {
    return getAuthHeaders();
  };

  const handleOAuth = async (onboarding: 'api' | 'businessapp') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/whatsapp/connect/oauth', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ onboarding, mode: 'headless' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url || data.authUrl) {
          setSuccessMsg(
            onboarding === 'api'
              ? 'Opening Meta Cloud API Signup (Groups & Calling enabled)...'
              : 'Opening Meta WhatsApp Coexistence Signup (Phone app linked)...'
          );
          setTimeout(() => {
            window.location.href = data.url || data.authUrl;
          }, 350);
          return;
        }
      }
      const err = await res.json().catch(() => ({ error: 'Failed to generate Meta OAuth URL' }));
      setErrorMsg(err.error || 'Failed to initialize Meta OAuth');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Meta OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wabaId || !phoneNumberId || !accessToken) {
      setErrorMsg('Please provide Meta WABA ID, Phone Number ID, and System User Access Token.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/whatsapp/connect/credentials', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          waba_id: wabaId.trim(),
          phone_number_id: phoneNumberId.trim(),
          access_token: accessToken.trim(),
          name: businessName.trim() || 'Rockyt Connected WABA',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg('WhatsApp Business Account registered in Headless Mode successfully!');
        if (onConnected) onConnected(data.account);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({ error: 'Failed to validate Meta WABA credentials' }));
        setErrorMsg(data.error || 'Failed to validate Meta WABA credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxPhone) {
      setErrorMsg('Please enter a valid phone number (e.g. +971503102740)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/whatsapp/sandbox/session', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone_number: sandboxPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxSession(data.session);
        setSuccessMsg('Rockyt WhatsApp Sandbox session activated! You can now test messaging and automations.');
        const acc = data.account || {
          name: `Rockyt Sandbox (${data.session.phone_number})`,
          phone: data.session.phone_number,
          status: 'sandbox',
          mode: 'sandbox',
          quality_rating: 'GREEN',
          tier: 'SANDBOX_DEV',
        };
        if (onConnected) onConnected(acc);
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to create sandbox session' }));
        setErrorMsg(err.error || 'Failed to initialize sandbox session');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateInbound = async () => {
    setIsSimulating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/whatsapp/sandbox/simulate-message', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          phone_number: sandboxPhone,
          text: 'Hello Rockyt! Testing WhatsApp CRM sandbox and AI automation.',
          name: 'Sandbox Test User',
        }),
      });
      if (res.ok) {
        setSuccessMsg('Simulated test WhatsApp message delivered to your Team Inbox!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Failed to dispatch simulated message.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error simulating message');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      
      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-2xl text-gray-900 overflow-hidden my-auto">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* MODAL HEADER */}
        <div className="flex items-start sm:items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#00D084] flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Phone size={22} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">
              Connect WhatsApp Business Account
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose your connection architecture based on whether you need Groups API, Calling, or Phone App coexistence.
            </p>
          </div>
        </div>

        {/* ARCHITECTURE COMPARISON PILL */}
        <div className="grid grid-cols-2 gap-2 p-2.5 mb-5 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs">
          <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-100 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users size={15} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-[11px] leading-tight flex items-center gap-1">
                Groups &amp; Calling API
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white rounded font-bold">Cloud API</span>
              </div>
              <p className="text-[10px] text-gray-500">Requires dedicated Cloud API number (Option 1 or 3)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-100 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Smartphone size={15} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-[11px] leading-tight flex items-center gap-1">
                Keep Mobile App
                <span className="px-1.5 py-0.2 text-[9px] bg-amber-600 text-white rounded font-bold">Coexistence</span>
              </div>
              <p className="text-[10px] text-amber-600 font-medium">Meta disables Groups &amp; Calling APIs</p>
            </div>
          </div>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-gray-100 p-1 rounded-2xl mb-5 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('cloud_api')}
            className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'cloud_api'
                ? 'bg-white text-emerald-800 shadow-xs font-bold border border-emerald-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cloud size={14} className="shrink-0 text-emerald-600" />
            <span>1. Cloud API</span>
          </button>
          <button
            onClick={() => setActiveTab('coexistence')}
            className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'coexistence'
                ? 'bg-white text-amber-900 shadow-xs font-bold border border-amber-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone size={14} className="shrink-0 text-amber-600" />
            <span>2. Coexistence</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key size={14} className="shrink-0 text-indigo-600" />
            <span>3. Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} className="shrink-0 text-purple-600" />
            <span>4. Sandbox</span>
          </button>
        </div>

        {/* FEEDBACK NOTICES */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ─── TAB 1: CLOUD API (RECOMMENDED FOR GROUPS & CALLING) ─── */}
        {activeTab === 'cloud_api' && (
          <div className="space-y-4">
            {/* META SELECTION WARNING - AS NOTED IN ZERNIO/META DOCUMENTATION */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-[13px]">
                <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
                <span>Option 1: Meta Cloud API (Official WABA)</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-emerald-200 text-emerald-900 rounded-full font-bold uppercase">
                  Recommended for Groups &amp; Calling
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Connects directly to Meta's official WhatsApp Cloud API (<code className="font-mono bg-emerald-100/70 px-1 py-0.5 rounded text-emerald-900">onboarding=api</code>). This is the only OAuth flow that supports WhatsApp Groups management and WhatsApp VoIP Calling endpoints.
              </p>

              {/* CRITICAL META DIALOG INSTRUCTION */}
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>Crucial: What to choose in Meta's popup window</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  In Meta's embedded window, <strong>do NOT choose &quot;Connect existing WhatsApp Business app account&quot;</strong> if you plan to use the <strong>Groups API</strong> or <strong>Calling API</strong>. That option activates <em>coexistence</em>, which disables both. Instead, <strong>create a new WABA or pick a phone number that is not active in the WhatsApp Business mobile app</strong>.
                </p>
              </div>

              {/* FEATURES INCLUDED */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-gray-700">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span><strong>WhatsApp Groups API</strong> (Create, invite, message)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span><strong>WhatsApp Calling API</strong> (Inbound &amp; Outbound VoIP)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span>Tier 100K+ daily messaging throughput</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span>Team Inbox, CRM, AI Bots &amp; Meta Flows</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOAuth('api')}
              disabled={isLoading}
              className="w-full py-3.5 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Launching Meta Cloud API Onboarding...</span>
                </>
              ) : (
                <>
                  <Cloud size={16} />
                  <span>Connect with WhatsApp Cloud API (Full Features)</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── TAB 2: COEXISTENCE (WHATSAPP BUSINESS APP) ─── */}
        {activeTab === 'coexistence' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-[13px]">
                <Smartphone size={17} className="text-amber-600 shrink-0" />
                <span>Option 2: WhatsApp Business App Coexistence</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-amber-200 text-amber-950 rounded-full font-bold uppercase">
                  Mobile App Active
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Links your existing WhatsApp Business mobile app on your smartphone with Rockyt (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">onboarding=businessapp</code>). You can keep chatting manually on your phone while Rockyt syncs messages to the Team Inbox, runs broadcast campaigns, and triggers automated AI replies.
              </p>

              {/* COEXISTENCE RESTRICTIONS WARNING */}
              <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-xl text-rose-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  <span>Important Meta Limitations on Coexistence:</span>
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed text-rose-900">
                  <p>• <strong>Groups API is DISABLED by Meta:</strong> You cannot create, query, or manage WhatsApp groups via API when coexistence is active.</p>
                  <p>• <strong>Calling API is DISABLED by Meta:</strong> VoIP calling endpoints are not supported on coexistence numbers.</p>
                  <p>• Read and unread receipts are primarily managed on your mobile device.</p>
                </div>
              </div>

              {/* FEATURES INCLUDED */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-gray-700">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span>Keep physical WhatsApp Business app on phone</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </div>
                  <span>Team Inbox &amp; CRM conversation sync</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <X size={11} />
                  </div>
                  <span className="text-gray-400 line-through">Groups API (Disabled by Meta)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <X size={11} />
                  </div>
                  <span className="text-gray-400 line-through">Calling API (Disabled by Meta)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOAuth('businessapp')}
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm shadow-md shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Launching Coexistence Onboarding...</span>
                </>
              ) : (
                <>
                  <Smartphone size={16} />
                  <span>Connect with WhatsApp Business App (Coexistence)</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── TAB 3: BYO META CREDENTIALS (HEADLESS CREDENTIALS FLOW) ─── */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsConnect} className="space-y-3.5">
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-[12px]">
                <Key size={15} className="text-indigo-600" />
                <span>Option 3: Enterprise BYO Meta Credentials</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-indigo-200 text-indigo-900 rounded-full font-bold uppercase">
                  Full API Control
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Directly connect your own Meta App with System User token. Unlocks Cloud API with Groups &amp; Calling support according to the permissions granted on your Meta App.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Business / Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Verified Store"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp Business Account ID (WABA ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 109283746501928"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100928347109283"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Permanent Meta System User Token *
                </label>
                <input
                  type="password"
                  required
                  placeholder="EAAB..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <Key size={16} />
                  <span>Save &amp; Bind Meta Credentials</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── TAB 4: DEV SANDBOX ─── */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Info size={14} />
                <span>Zero-Verification Instant Testing</span>
              </div>
              <p>
                Test your team inbox, broadcasts, AI auto-replies, and templates immediately without waiting for Meta business verification.
              </p>
            </div>

            {!sandboxSession ? (
              <form onSubmit={handleCreateSandbox} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Test Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    placeholder="+971 50 310 2740"
                    value={sandboxPhone}
                    onChange={(e) => setSandboxPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Activate Sandbox Session</span>
                </button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Developer Sandbox Ready</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">ACTIVE</span>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono space-y-1">
                  <div><strong>Phone:</strong> {sandboxSession.phone_number}</div>
                  <div><strong>Shared Number:</strong> <span className="text-emerald-700 font-bold">{sandboxSession.sandbox_number || '+1 202 908 7457'}</span></div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSimulateInbound}
                    disabled={isSimulating}
                    className="flex-1 py-2.5 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                    <span>Simulate Inbound WhatsApp</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WABAConnectionModal;
