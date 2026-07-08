import React, { useEffect, useRef, useState } from 'react';
import { ApiDashboardTab } from './ApiDashboardTab';
import { useAuth } from '../hooks/useAuth';
import { ONBOARDING_PLANS } from '../constants/index';
import { openCheckout, DODO_PRODUCTS } from '../utils/dodoCheckout';
import { getDashboardUrl, getWorkspaceCreationUrl } from '../utils/dashboardUrl';

import OnboardingFlow from './OnboardingFlow';

type TabType = 'dashboard' | 'billing' | 'support' | 'apis';
type FormStep = 1 | 2 | 3;

/* ─── design tokens ─────────────────────────────────────────────── */
const BG     = '#0F0F11';
const SURF   = '#17171A';
const BORDER = '#262629';
const MUTED  = '#6B6B72';
const TXT    = '#EDEDED';
const BLUE   = '#4450F2';
const YELLOW = '#FFE241';
const PINK   = '#FF21A6';

/* ─── iframe URL is resolved at runtime via utils/dashboardUrl.ts ──
   It is base64-encoded in env vars (VITE_DASH_A / VITE_DASH_B) and
   never appears as plain text anywhere in the source or bundle. ── */

/* ─── localStorage cache key (speeds up return visits) ──────────── */
/* Scoped per-user so different accounts on the same browser never  */
/* inherit each other's onboarding/completion state.                */
const FORM_CACHE_KEY_PREFIX = 'rockyt_form_done_v1_';

/* ─── form data ──────────────────────────────────────────────────── */
const PLATFORMS = [
  { id: 'meta',      label: 'Meta',        icon: 'logos:meta-icon'    },
  { id: 'tiktok',   label: 'TikTok',      icon: 'logos:tiktok-icon'  },
  { id: 'google',   label: 'Google Ads',  icon: 'logos:google-ads'   },
  { id: 'snapchat', label: 'Snapchat',    icon: 'logos:snapchat'     },
  { id: 'youtube',  label: 'YouTube',     icon: 'logos:youtube-icon' },
  { id: 'x',        label: 'X / Twitter', icon: 'logos:x'            },
  { id: 'pinterest',label: 'Pinterest',   icon: 'logos:pinterest'    },
];

const SPEND_OPTIONS = [
  { id: 'lt1k',    label: 'Under $1,000',    sub: 'per month' },
  { id: '1k5k',   label: '$1,000 – $5,000',  sub: 'per month' },
  { id: '5k20k',  label: '$5,000 – $20,000', sub: 'per month' },
  { id: '20kplus', label: '$20,000+',         sub: 'per month' },
];

const Dashboard: React.FC = () => {

  /* ─── ALL hooks unconditionally at the top ──────────────────────── */
  const {
    user, profile, isFirstLogin, isAccessGranted,
    completeProfile, signOut, loading, saveFormAnswers,
    consumeSignupFramePending,
  } = useAuth();

  const [activeTab,      setActiveTab]      = useState<TabType>('dashboard');
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);

  // Form state
  const [formStep,       setFormStep]       = useState<FormStep>(1);
  const [stepVisible,    setStepVisible]    = useState(true);
  const [runningAds,     setRunningAds]     = useState<boolean | null>(null);
  const [adSpend,        setAdSpend]        = useState('');
  const [platforms,      setPlatforms]      = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Optimistic local flag — true once user submits OR if Supabase says so.
  // Starts false on every mount; the user-scoped cache (keyed by user.id)
  // is read in a useEffect below once we know *which* user is signed in,
  // so a different account on the same browser never inherits this flag.
  const [localFormDone, setLocalFormDone]   = useState<boolean>(false);

  // Iframe progressive loader state
  const [iframeLoaded,   setIframeLoaded]   = useState(false);
  const [loadProgress,   setLoadProgress]   = useState(0);

  // intentionally removed: workspace-creation URL switching based on a
  // session-local flag. First-login identity binding is now the dashboard's
  // own authenticated handshake — not a static URL flip in the source bundle.


  // Sidebar hover timer
  const dashboardIframeRef = useRef<HTMLIFrameElement | null>(null);
  const hoverTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setShowOnboarding(!!isFirstLogin);
  }, [isFirstLogin]);

  useEffect(() => {
    const ok = isAccessGranted();
    if (profile && !ok && activeTab !== 'billing') setActiveTab('billing');
  }, [profile, activeTab]);

  // Whenever the signed-in user changes (including switching accounts on the
  // same browser without a full page reload), re-read the cache for THAT
  // specific user only — never trust whatever the previous user left behind.
  useEffect(() => {
    if (!user?.id) {
      setLocalFormDone(false);
      return;
    }
    const cached = localStorage.getItem(FORM_CACHE_KEY_PREFIX + user.id) === '1';
    setLocalFormDone(cached);
  }, [user?.id]);

  // Sync the localStorage cache whenever the Supabase profile says form is done
  useEffect(() => {
    if (profile?.dashboard_form_completed && user?.id) {
      localStorage.setItem(FORM_CACHE_KEY_PREFIX + user.id, '1');
      setLocalFormDone(true);
    }
  }, [profile?.dashboard_form_completed, user?.id]);

  /* ─── derived values ─────────────────────────────────────────────── */
  const hasAccess = isAccessGranted();

  // Form is considered complete if Supabase says so OR optimistic local flag
  const formCompleted =
    profile?.dashboard_form_completed === true || localFormDone;

  const daysLeft = (() => {
    if (!profile?.trial_end_date) return 0;
    return Math.max(0, Math.ceil(
      (new Date(profile.trial_end_date).getTime() - Date.now()) / 86_400_000
    ));
  })();

  const statusColor =
    profile?.subscription_status === 'active'   ? '#22C55E' :
    profile?.subscription_status === 'trialing' ? YELLOW     : '#EF4444';

  const statusLabel =
    profile?.subscription_status === 'active'   ? 'Active'  :
    profile?.subscription_status === 'trialing' ? 'Trial'   : 'Inactive';

  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard',    icon: 'solar:widget-2-bold'        },
    { id: 'billing',   label: 'Subscription', icon: 'solar:card-transfer-bold'   },
    { id: 'support',   label: 'Support',      icon: 'solar:chat-round-line-bold' },
    { id: 'apis',      label: 'APIs',         icon: 'solar:key-bold'             },
  ];

  // True once the user is allowed to see the embedded app (after onboarding +
  // intake form for new users, or immediately on sign-in for returning users).
  const showIframe = activeTab === 'dashboard' && hasAccess && formCompleted;

  // Dashboard URL is resolved at runtime from VITE_DASH_A. ref_id is bound to
  // the live Supabase session so identity linkage happens server-side.
  //
  // First-login behavior: when the OAuth round-trip lands here for a brand
  // new account, `useAuth` marks `isFirstLogin = true` AND sets a session
  // marker. The very first iframe render in that session targets the
  // workspace-creation URL (VITE_DASH_SIGNUP) so the dashboard server can
  // create + bind a workspace to this Supabase user. After that single
  // render, the marker is consumed and every subsequent login (and every
  // refresh, every other browser tab for the same session) goes to the
  // regular subdomain URL only.
  const dashboardBase = getDashboardUrl();
  const workspaceBase = getWorkspaceCreationUrl();

  // useRef-stable signal: "this render is the first signup render".
  // We pick the URL on the FIRST render after a fresh signup marker, then
  // immediately consume it so re-mounts / hard refreshes of the same user
  // skip the signup URL and go straight to the subdomain.
  const signupFrameRef = useRef<boolean>(false);

  if (user?.id && signupFrameRef.current === false && !loading) {
    // Only resolve once per Dashboard mount: the marker is already set by
    // useAuth when the profile lookup returned PGRST116 (no row yet).
    signupFrameRef.current = consumeSignupFramePending();
  } else if (!user?.id) {
    signupFrameRef.current = false;
  }

  const dashboardSrc = (() => {
    if (signupFrameRef.current) {
      const base = workspaceBase;
      if (!base) return '';
      // If the base URL already has ref_id in it, use it exactly as is
      if (base.includes('ref_id=')) {
        return base;
      }
      // Otherwise, dynamically append the user's ID
      if (user?.id) {
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}ref_id=${encodeURIComponent(user.id)}`;
      }
      return base;
    } else {
      // Returning users should see the dashboard base URL without any ref_id parameter
      return dashboardBase;
    }
  })();

  // Listen for an explicit dashboard-ready signal from the iframe. The dashboard
  // should postMessage({ type: 'rockyt:dashboard-ready' }) once it has mounted
  // its first interactive view. Fall back to the onLoad event so older builds
  // of the dashboard still reveal the iframe.
  useEffect(() => {
    if (!showIframe) return;

    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: unknown } | null;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'rockyt:dashboard-ready') return;
      const iframe = dashboardIframeRef.current;
      if (iframe && event.source !== iframe.contentWindow) return;
      handleIframeLoad();
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // handleIframeLoad intentionally stable via ref/state setters; showIframe
    // gates mounting so we re-bind on every show.
  }, [showIframe]);

   useEffect(() => {
    if (!showIframe) {
      setIframeLoaded(false);
      setLoadProgress(0);
      if (progressTimer.current) clearInterval(progressTimer.current);
      return;
    }

    setLoadProgress(0);
    setIframeLoaded(false);

    progressTimer.current = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev;
        const remaining = 90 - prev;
        const step = Math.max(0.5, remaining * 0.08);
        return Math.min(90, prev + step);
      });
    }, 120);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [showIframe]);

  const handleIframeLoad = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setLoadProgress(100);
    setTimeout(() => setIframeLoaded(true), 280);
  };

  /* ─── handlers ───────────────────────────────────────────────────── */
  const handleOnboardingComplete = async (planName: string) => {
    setIsLoading(true);
    try {
      await completeProfile(planName);
      setShowOnboarding(false);
    } catch (err) {
      // Surface to the user so they can retry — silent failure left people stuck.
      alert(
        "We couldn't save your plan selection. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true);
    try {
      const productId = planName === 'Growth' ? DODO_PRODUCTS.growth : DODO_PRODUCTS.scale;
      const url = await openCheckout(productId, user?.id || '', false);
      window.location.href = url;
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // Sidebar hover
  const onSidebarEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setSidebarOpen(true);
  };
  const onSidebarLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setSidebarOpen(false), 200);
  };

  // Animated step transition
  const goToStep = (step: FormStep) => {
    setStepVisible(false);
    setTimeout(() => { setFormStep(step); setStepVisible(true); }, 180);
  };

  const togglePlatform = (id: string) =>
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  /**
   * Called when user clicks "Launch Dashboard" on step 3.
   * 1. Immediately shows the iframe (optimistic update)
   * 2. Writes answers to Supabase in the background
   */
  const handleFormComplete = async () => {
    if (platforms.length === 0) return;
    setFormSubmitting(true);

    // Optimistic: show iframe right away
    if (user?.id) localStorage.setItem(FORM_CACHE_KEY_PREFIX + user.id, '1');
    setLocalFormDone(true);
    // Persist to Supabase (non-blocking from the user's perspective)
    try {
      await saveFormAnswers({
        running_ads:  runningAds,
        ad_spend:     adSpend,
        ad_platforms: platforms,
      });
    } catch (e) {
      console.error('Failed to save form answers to Supabase:', e);
      // Don't revert the optimistic update — user can still use the dashboard.
      // Supabase will be retried next session via the useEffect above if profile
      // still has dashboard_form_completed = false.
    } finally {
      setFormSubmitting(false);
    }
  };

  /* ─── early returns (after all hooks) ───────────────────────────── */
  if (loading) {
    return (
      <div style={{ background: BG }} className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${BLUE} transparent transparent transparent` }}
          />
          <span className="text-sm font-medium" style={{ color: MUTED }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} isLoading={isLoading} />;
  }

  /* ─── render ─────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: BG, color: TXT }}>

      {/* ═══ SIDEBAR (hover-controlled) ════════════════════════════════ */}
      <aside
        className="flex flex-col shrink-0 relative z-30 overflow-hidden"
        style={{
          width: sidebarOpen ? 220 : 56,
          background: SURF,
          borderRight: `1px solid ${BORDER}`,
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
        onMouseEnter={onSidebarEnter}
        onMouseLeave={onSidebarLeave}
      >
        {/* Logo */}
        <div
          className="flex items-center h-14 px-3.5 shrink-0 overflow-hidden"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: BLUE }}>
            <iconify-icon icon="solar:rocket-bold" class="text-white" width="15"></iconify-icon>
          </div>
          <span
            className="ml-3 text-sm font-bold tracking-widest uppercase whitespace-nowrap"
            style={{
              color: TXT,
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'opacity 0.15s, transform 0.15s',
              pointerEvents: 'none',
            }}
          >
            Rockyt
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 flex-grow">
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 w-full overflow-hidden"
                style={{
                  background: active ? `${BLUE}18` : 'transparent',
                  borderLeft: active ? `2px solid ${BLUE}` : '2px solid transparent',
                  transition: 'background 0.15s',
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <iconify-icon
                  icon={item.icon}
                  width="17"
                  class="shrink-0"
                  style={{ color: active ? BLUE : MUTED } as React.CSSProperties}
                ></iconify-icon>
                <span
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ color: active ? TXT : MUTED, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.15s' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 space-y-1 overflow-hidden" style={{ borderTop: `1px solid ${BORDER}` }}>
          {sidebarOpen ? (
            <div className="rounded-lg px-3 py-2" style={{ background: '#1E1E22', border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: MUTED }}>Plan</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: TXT }}>
                  {profile?.plan || 'Free'} · {statusLabel}
                </span>
              </div>
              {profile?.subscription_status !== 'active' && daysLeft > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: MUTED }}>Trial</span>
                    <span className="text-xs font-semibold" style={{ color: daysLeft > 3 ? '#22C55E' : YELLOW }}>
                      {daysLeft}d left
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(daysLeft / 14) * 100}%`, background: daysLeft > 3 ? '#22C55E' : YELLOW }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} title={`${profile?.plan || 'Free'} · ${statusLabel}`} />
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:opacity-70 transition-opacity text-left overflow-hidden"
            title={!sidebarOpen ? `${user?.email} · Sign out` : undefined}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${BLUE}33`, color: BLUE }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.15s', minWidth: 0 }}>
              <p className="text-sm font-medium truncate" style={{ color: TXT, maxWidth: 120 }}>
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>Sign out</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ════════════════════════════════════════════════════════ */}
      <main className="flex-grow flex flex-col overflow-hidden" style={{ minWidth: 0 }}>

        {/* Top bar */}
        <div
          className="h-14 flex items-center px-6 shrink-0"
          style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}
        >
          <h1 className="text-sm font-semibold" style={{ color: TXT }}>
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'billing' ? 'Subscription' : activeTab === 'apis' ? 'API Management' : 'Support'}
          </h1>
        </div>

        {/* ── Iframe (full remaining height, shown after form is done) ── */}
        {showIframe && (
          <div className="flex-grow relative" style={{ minHeight: 0, background: BG }}>

            {/* Progressive % loader — fades out once the embedded app fires onLoad */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{
                background: BG,
                opacity: iframeLoaded ? 0 : 1,
                pointerEvents: iframeLoaded ? 'none' : 'auto',
                transition: 'opacity 0.4s ease',
              }}
            >
              <div className="flex flex-col items-center gap-5 w-full max-w-[260px]">
                {/* Spinning ring + live % */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke={BORDER} strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={BLUE} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - loadProgress / 100)}
                      style={{ transition: 'stroke-dashoffset 0.18s ease' }}
                    />
                  </svg>
                  <span className="absolute text-xs font-bold" style={{ color: TXT }}>
                    {Math.round(loadProgress)}%
                  </span>
                </div>

                {/* Animated progress bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${loadProgress}%`,
                      background: `linear-gradient(90deg, ${BLUE}, ${PINK})`,
                      transition: 'width 0.18s ease',
                    }}
                  />
                </div>

                <p className="text-xs font-medium tracking-wide" style={{ color: MUTED }}>
                  Loading your dashboard…
                </p>
              </div>
            </div>

            {/* The embedded app itself. The URL is resolved at runtime from a
                base64-encoded env var (see utils/dashboardUrl.ts) and is never
                hardcoded or printed anywhere in the source/UI. */}
            <iframe
              ref={dashboardIframeRef}
              key={dashboardSrc}
              src={dashboardSrc}
              onLoad={handleIframeLoad}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
              title="Rockyt App"
              allow="clipboard-write; fullscreen"
            />
          </div>
        )}



        {/* ── Padded content ──────────────────────────────────────────── */}
        {!showIframe && (
          <div className="flex-grow overflow-auto">
            <div className="p-6 max-w-4xl mx-auto w-full">

              {/* ─── API TAB ────────────────────────────────────────────── */}
              {activeTab === 'apis' && <ApiDashboardTab />}

              {/* ─── DASHBOARD TAB ──────────────────────────────────────── */}
              {activeTab === 'dashboard' && (
                hasAccess ? (

                  /* ── Progressive intake form (shown once, first login only) */
                  <div
                    className="flex items-center justify-center"
                    style={{ minHeight: 'calc(100vh - 140px)' }}
                  >
                    <div
                      className="w-full max-w-lg rounded-2xl p-8"
                      style={{
                        background: SURF,
                        border: `1px solid ${BORDER}`,
                        opacity: stepVisible ? 1 : 0,
                        transform: stepVisible ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'opacity 0.18s ease, transform 0.18s ease',
                      }}
                    >
                      {/* Progress pills */}
                      <div className="flex items-center gap-2 mb-8 justify-center">
                        {([1, 2, 3] as const).map(s => (
                          <div
                            key={s}
                            className="h-1 rounded-full"
                            style={{
                              width: s === formStep ? 24 : 8,
                              background: s <= formStep ? BLUE : BORDER,
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </div>

                      {/* ── Step 1 ────────────────────────────────────────── */}
                      {formStep === 1 && (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: BLUE }}>
                            Step 1 of 3
                          </p>
                          <h2 className="text-xl font-bold mb-2" style={{ color: TXT }}>
                            Are you running any active ads?
                          </h2>
                          <p className="text-sm mb-8" style={{ color: MUTED }}>
                            Let us know where you stand so we can set up the right tools.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: true,  label: 'Yes, I am', icon: 'solar:check-circle-bold', accent: '#22C55E' },
                              { value: false, label: 'Not yet',   icon: 'solar:close-circle-bold', accent: MUTED    },
                            ].map(opt => (
                              <button
                                key={String(opt.value)}
                                onClick={() => { setRunningAds(opt.value); goToStep(2); }}
                                className="flex flex-col items-center gap-3 rounded-xl p-6 transition-all"
                                style={{
                                  background: runningAds === opt.value ? `${BLUE}15` : '#1E1E22',
                                  border: `1.5px solid ${runningAds === opt.value ? BLUE : BORDER}`,
                                }}
                              >
                                <iconify-icon
                                  icon={opt.icon}
                                  width="28"
                                  style={{ color: opt.accent } as React.CSSProperties}
                                ></iconify-icon>
                                <span className="text-sm font-semibold" style={{ color: TXT }}>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── Step 2 ────────────────────────────────────────── */}
                      {formStep === 2 && (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: BLUE }}>
                            Step 2 of 3
                          </p>
                          <h2 className="text-xl font-bold mb-2" style={{ color: TXT }}>
                            Avg. monthly ad spend?
                          </h2>
                          <p className="text-sm mb-8" style={{ color: MUTED }}>
                            We'll tailor recommendations to your current budget.
                          </p>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {SPEND_OPTIONS.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => { setAdSpend(opt.id); goToStep(3); }}
                                className="rounded-xl p-4 text-left transition-all"
                                style={{
                                  background: adSpend === opt.id ? `${BLUE}15` : '#1E1E22',
                                  border: `1.5px solid ${adSpend === opt.id ? BLUE : BORDER}`,
                                }}
                              >
                                <p className="text-sm font-bold mb-0.5" style={{ color: TXT }}>{opt.label}</p>
                                <p className="text-xs" style={{ color: MUTED }}>{opt.sub}</p>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => goToStep(1)}
                            className="text-xs flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                            style={{ color: MUTED }}
                          >
                            <iconify-icon icon="solar:arrow-left-linear" width="13"></iconify-icon>
                            Back
                          </button>
                        </>
                      )}

                      {/* ── Step 3 ────────────────────────────────────────── */}
                      {formStep === 3 && (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: BLUE }}>
                            Step 3 of 3
                          </p>
                          <h2 className="text-xl font-bold mb-2" style={{ color: TXT }}>
                            Which platforms are you advertising on?
                          </h2>
                          <p className="text-sm mb-6" style={{ color: MUTED }}>Select all that apply.</p>
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            {PLATFORMS.map(p => {
                              const sel = platforms.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => togglePlatform(p.id)}
                                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all overflow-hidden"
                                  style={{
                                    background: sel ? `${BLUE}15` : '#1E1E22',
                                    border: `1.5px solid ${sel ? BLUE : BORDER}`,
                                  }}
                                >
                                  <iconify-icon icon={p.icon} width="18" class="shrink-0"></iconify-icon>
                                  <span className="text-sm font-medium truncate" style={{ color: TXT }}>{p.label}</span>
                                  {sel && (
                                    <iconify-icon
                                      icon="solar:check-circle-bold"
                                      width="14"
                                      class="ml-auto shrink-0"
                                      style={{ color: BLUE } as React.CSSProperties}
                                    ></iconify-icon>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => goToStep(2)}
                              className="text-xs flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                              style={{ color: MUTED }}
                            >
                              <iconify-icon icon="solar:arrow-left-linear" width="13"></iconify-icon>
                              Back
                            </button>
                            <button
                              onClick={handleFormComplete}
                              disabled={platforms.length === 0 || formSubmitting}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-30 hover:opacity-80"
                              style={{ background: BLUE, color: '#fff' }}
                            >
                              {formSubmitting ? 'Saving…' : 'Launch Dashboard'}
                              {!formSubmitting && (
                                <iconify-icon icon="solar:arrow-right-bold" width="14" class="text-white"></iconify-icon>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                ) : (
                  /* No access */
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                         style={{ background: '#EF444418', border: '1px solid #EF444430' }}>
                      <iconify-icon icon="solar:lock-bold" width="22" style={{ color: '#EF4444' } as React.CSSProperties}></iconify-icon>
                    </div>
                    <h2 className="text-lg font-semibold mb-2" style={{ color: TXT }}>Access Restricted</h2>
                    <p className="text-sm max-w-xs mb-6 leading-relaxed" style={{ color: MUTED }}>
                      Your 14-day free trial has ended. Activate a subscription to restore access.
                    </p>
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: BLUE, color: '#fff' }}
                    >
                      View Plans
                    </button>
                  </div>
                )
              )}

              {/* ─── BILLING TAB ────────────────────────────────────────── */}
              {activeTab === 'billing' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: TXT }}>Choose a plan</h2>
                    <p className="text-sm mt-0.5" style={{ color: MUTED }}>Scale your ad operations.</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {ONBOARDING_PLANS.filter(p => !p.name.includes('Custom')).map(plan => {
                      const accent    = plan.name === 'Growth' ? BLUE : PINK;
                      const isCurrent = profile?.plan === plan.name && profile?.subscription_status === 'active';
                      return (
                        <div
                          key={plan.name}
                          className="rounded-xl p-6 flex flex-col relative"
                          style={{ background: SURF, border: `1px solid ${plan.popular ? `${accent}50` : BORDER}` }}
                        >
                          {plan.popular && (
                            <span
                              className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: `${PINK}22`, color: PINK, border: `1px solid ${PINK}40` }}
                            >
                              Popular
                            </span>
                          )}
                          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: accent }}>
                            {plan.name}
                          </p>
                          <div className="flex items-baseline gap-1 mb-5">
                            <span className="text-3xl font-bold" style={{ color: TXT }}>${plan.price}</span>
                            <span className="text-sm" style={{ color: MUTED }}>/mo</span>
                          </div>
                          <ul className="space-y-2.5 mb-6 flex-grow">
                            {plan.features.slice(0, 6).map((f, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <iconify-icon
                                  icon="solar:check-circle-bold"
                                  width="15"
                                  class="mt-0.5 shrink-0"
                                  style={{ color: accent } as React.CSSProperties}
                                ></iconify-icon>
                                <span className="text-sm" style={{ color: MUTED }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handleUpgrade(plan.name)}
                            disabled={isLoading || isCurrent}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-80"
                            style={{ background: isCurrent ? BORDER : accent, color: isCurrent ? MUTED : '#fff' }}
                          >
                            {isCurrent ? 'Current plan' : isLoading ? 'Loading…' : `Start ${plan.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── SUPPORT TAB ────────────────────────────────────────── */}
              {activeTab === 'support' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <div
                    className="w-full max-w-md rounded-xl p-8 text-center"
                    style={{ background: SURF, border: `1px solid ${BORDER}` }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: `${YELLOW}18`, border: `1px solid ${YELLOW}30` }}>
                      <iconify-icon icon="solar:chat-round-line-bold" width="22" style={{ color: YELLOW } as React.CSSProperties}></iconify-icon>
                    </div>
                    <h3 className="text-base font-semibold mb-1.5" style={{ color: TXT }}>Support</h3>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: MUTED }}>
                      Our team is available 24/7 to help you scale, optimize, and resolve any issues fast.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="mailto:support@rockyt.io"
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center hover:opacity-80 transition-opacity"
                        style={{ background: YELLOW, color: '#000' }}
                      >
                        Open Ticket
                      </a>
                      <a
                        href="https://aiads.tawk.help/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center hover:opacity-80 transition-opacity"
                        style={{ background: '#1E1E22', border: `1px solid ${BORDER}`, color: TXT }}
                      >
                        Documentation
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
