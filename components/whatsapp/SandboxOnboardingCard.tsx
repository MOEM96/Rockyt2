import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, MessageSquare, 
  Smartphone, ShieldCheck, RefreshCw, Send, QrCode, ExternalLink, Play, Bot, AlertCircle, Copy, Check
} from 'lucide-react';
import { WhatsAppSandboxSession } from '../../lib/whatsappTypes';

interface SandboxOnboardingCardProps {
  session: WhatsAppSandboxSession | null;
  onActivated: (session: WhatsAppSandboxSession) => void;
  onOpenInbox: () => void;
}

export const SandboxOnboardingCard: React.FC<SandboxOnboardingCardProps> = ({
  session,
  onActivated,
  onOpenInbox,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(session?.status === 'active' ? 3 : session ? 2 : 1);
  const [currentSession, setCurrentSession] = useState<WhatsAppSandboxSession | null>(session);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (session) {
      setCurrentSession(session);
      if (session.status === 'active') {
        setStep(3);
      } else {
        setStep(2);
      }
    }
  }, [session]);

  // Live polling for sandbox reply activation
  useEffect(() => {
    if (step === 2 && currentSession && currentSession.status !== 'active') {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/whatsapp/sandbox/session');
          if (res.ok) {
            const data = await res.json();
            if (data.session && data.session.status === 'active') {
              setCurrentSession(data.session);
              setStep(3);
              onActivated(data.session);
              clearInterval(pollInterval);
            }
          }
        } catch (e) {}
      }, 2500);

      return () => clearInterval(pollInterval);
    }
  }, [step, currentSession, onActivated]);

  const handleStartSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    const fullPhone = `${countryCode}${phoneNumber.replace(/[^0-9]/g, '')}`;
    setIsLoading(true);

    try {
      const res = await fetch('/api/whatsapp/sandbox/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, phone_number: fullPhone }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
        setStep(2);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to start sandbox session' }));
        alert(err.error || 'Failed to start sandbox session');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateInboundReply = async () => {
    setIsSimulating(true);
    try {
      const phone = currentSession?.phone_number || `${countryCode}${phoneNumber || '4155552671'}`;
      const res = await fetch('/api/whatsapp/sandbox/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone,
          text: 'Hi! Ready to test WhatsApp CRM automations!',
          name: 'Developer Tester',
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        if (currentSession) {
          const updated = { ...currentSession, status: 'active' as const };
          setCurrentSession(updated);
          onActivated(updated);
        }
        setStep(3);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyLink = () => {
    const waLink = 'https://wa.me/12029087457?text=sandbox_start';
    navigator.clipboard.writeText(waLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const waLink = 'https://wa.me/12029087457?text=sandbox_start';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waLink)}&bgcolor=09090b&color=10b981`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black border border-emerald-500/20 shadow-2xl p-6 sm:p-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* ─── Header & Progress Stepper ─── */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive WhatsApp Developer Sandbox</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Connect & Test in 30 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Zero Meta Business verification needed. Test live messages, AI replies, and webhooks instantly.
          </p>
        </div>

        {/* Stepper Pills */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {[
            { num: 1, label: 'Enter Phone' },
            { num: 2, label: 'Reply on WA' },
            { num: 3, label: 'Instant AHA!' },
          ].map((s) => {
            const isDone = step > s.num || (step === 3 && s.num === 3);
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                    : 'bg-zinc-950 text-zinc-600 border border-zinc-900'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isDone ? 'bg-emerald-500 text-black' : isCurrent ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isDone ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: Phone Input ─── */}
      {step === 1 && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Step 1: Enter your WhatsApp phone number
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We’ll send an activation template message from our verified test number <strong className="text-zinc-200">+1 (202) 908-7457</strong> to establish a secure 24-hour testing session.
            </p>

            <form onSubmit={handleStartSandbox} className="space-y-4 pt-2">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+20">🇪🇬 +20</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+55">🇧🇷 +55</option>
                </select>
                <input
                  type="tel"
                  placeholder="e.g. 415 555 2671"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber}
                  className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Activation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Activation Ping</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateInboundReply}
                  disabled={isSimulating}
                  className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Simulator Preview</span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Isolated Developer Sandbox Guarantee</span>
            </div>
            <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Your number is scoped to your private tenant workspace profile.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Messages and webhooks will never collide with other developers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Includes free outbound template delivery and 24h conversation windows.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Live Verification & wa.me / QR ─── */}
      {step === 2 && currentSession && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>Awaiting Your Reply on WhatsApp</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Step 2: Reply to the Activation Message
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Open WhatsApp on <strong className="text-emerald-400 font-mono">{currentSession.phone_number}</strong> and send any message (or <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">Hi</code>) to <strong className="text-white">+1 (202) 908-7457</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>1-Click Open WhatsApp Web / App</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-75" />
              </a>

              <button
                onClick={handleCopyLink}
                className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Change Phone Number
              </button>

              <button
                onClick={handleSimulateInboundReply}
                disabled={isSimulating}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                <span>Simulate Inbound Reply Now</span>
              </button>
            </div>
          </div>

          {/* QR Code & Shared Number Card */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-xl">
            <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner">
              <img
                src={qrUrl}
                alt="Scan with WhatsApp"
                className="w-36 h-36 rounded-lg object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Scan to message</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">+1 (202) 908-7457</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: AHA Celebration & Launch ─── */}
      {step === 3 && (
        <div className="relative z-10 py-4 flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-xl shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AHA Moment Activated!</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Your WhatsApp Sandbox is Live & Verified!
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Your number <strong className="text-emerald-400 font-mono">{currentSession?.phone_number || phoneNumber}</strong> is now synced in real-time. Automated AI routing, 24h compliance, and Meta CAPI are fully active.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
            <button
              onClick={onOpenInbox}
              className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Realtime CRM Inbox</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={handleSimulateInboundReply}
              disabled={isSimulating}
              className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Test AI Bot Trigger</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
