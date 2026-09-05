import React, { useState } from 'react';
import { 
  X, CheckCircle2, Sparkles, ExternalLink, Key, 
  Phone, AlertCircle, Loader2, PlayCircle, Info, ShieldCheck, Check
} from 'lucide-react';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface WABAConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (accountData: any) => void;
}

const WABAConnectionModal: React.FC<WABAConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'headless_oauth' | 'credentials' | 'sandbox'>('headless_oauth');
  const [sandboxPhone, setSandboxPhone] = useState('+14155552671');
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

  const handleHeadlessOAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/whatsapp/connect/oauth', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mode: 'headless' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url || data.authUrl) {
          setSuccessMsg('Launching official Meta WhatsApp Headless OAuth dialog...');
          setTimeout(() => {
            window.location.href = data.url || data.authUrl;
          }, 300);
          return;
        }
      }
      const err = await res.json().catch(() => ({ error: 'Failed to generate Headless OAuth URL' }));
      setErrorMsg(err.error || 'Failed to initialize Headless Meta OAuth');
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
      setErrorMsg('Please enter a valid phone number (e.g. +14155552671)');
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
        if (onConnected) {
          onConnected(data.account || {
            name: `Rockyt Sandbox (${data.session.phone_number})`,
            phone: data.session.phone_number,
            status: 'sandbox',
            mode: 'sandbox',
            quality_rating: 'GREEN',
            tier: 'SANDBOX_DEV',
          });
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-gray-900 overflow-hidden">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* MODAL HEADER */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#00D084] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Phone size={22} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">
              Connect WhatsApp Account
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by Rockyt WhatsApp Cloud API &amp; Meta Direct Cloud Gateway
            </p>
          </div>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('headless_oauth')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'headless_oauth'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Headless OAuth
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔑 BYO Credentials
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🧪 Dev Sandbox
          </button>
        </div>

        {/* FEEDBACK NOTICES */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ─── TAB 1: HEADLESS OAUTH (100% WHITE-LABEL ROCKYT) ─── */}
        {activeTab === 'headless_oauth' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs text-gray-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Headless Meta Embedded Signup (Zero 3rd-Party Branding)</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Connect your Meta WhatsApp Business Account directly in headless mode. You authorize on Meta's official dialog and get redirected straight back into your Rockyt workspace with zero third-party screens.
              </p>
              <div className="pt-1 flex flex-col gap-1 text-[11px] text-emerald-900 font-medium">
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-600" />
                  <span>Meta Official Cloud API Tier 100K limits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-600" />
                  <span>Automatic webhook and CAPI event subscription</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleHeadlessOAuth}
              disabled={isLoading}
              className="w-full py-3.5 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-xl text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Starting Headless Meta OAuth...</span>
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  <span>Connect Meta WhatsApp in Headless Mode</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── TAB 2: BYO META CREDENTIALS (HEADLESS CREDENTIALS FLOW) ─── */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsConnect} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Business Name (for Rockyt Display)
              </label>
              <input
                type="text"
                placeholder="e.g. My Verified WhatsApp Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                WhatsApp Business Account ID (WABA ID)
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number ID
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
                Permanent Meta System User Access Token
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-xl text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <Key size={16} />
                  <span>Save &amp; Bind WABA Credentials</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── TAB 3: DEV SANDBOX ─── */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1.5">
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
                    placeholder="+1 (415) 555-2671"
                    value={sandboxPhone}
                    onChange={(e) => setSandboxPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold rounded-xl text-sm shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Activate Sandbox Session</span>
                </button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Developer Sandbox Ready</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">ACTIVE</span>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs font-mono space-y-1">
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
