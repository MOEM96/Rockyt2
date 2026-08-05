import React, { useState, useEffect, lazy, Suspense } from 'react';
import TunnelBackground from './components/TunnelBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PartnerLogos from './components/PartnerLogos';
import TrustedBy from './components/TrustedBy';
import PortfolioGallery from './components/PortfolioGallery';
import Marquee from './components/Marquee';
import WhyRockyt from './components/WhyRockyt';
import Services from './components/Services';
import Showcase from './components/Showcase';
import Reviews from './components/Reviews';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

import { supabase } from './lib/supabaseClient';

const Onboarding = lazy(() => import('./components/Onboarding'));
const PlatformPage = lazy(() => import('./components/PlatformPage'));
const DocsPage = lazy(() => import('./components/DocsPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));

const validPlatformPaths = [
  '/x', '/instagram', '/whatsapp', '/tiktok', '/linkedin', 
  '/telegram', '/discord', '/slack', '/meta-ads', '/google-ads', 
  '/threads', '/bluesky', '/reddit', '/pinterest', '/snapchat', 
  '/googlebusiness', '/youtube', '/linkedin-ads', '/tiktok-ads', 
  '/pinterest-ads', '/x-ads'
];

const docsPaths: Record<string, string> = {
  '/docs': 'overview',
  '/mcp': 'mcp',
  '/workflows': 'workflows',
  '/webhooks': 'webhooks',
  '/cli': 'cli',
  '/sdks': 'sdks',
  '/integrations': 'integrations',
  '/agent-quickstart': 'mcp',
  '/agent-quickstart.md': 'mcp',
  '/auth': 'overview',
  '/auth.md': 'overview'
};

function parseJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  const handleSignOut = async () => {
    setUserSession(null);
    localStorage.removeItem('rockyt_session_user');
    sessionStorage.clear();
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}

    setIsOnboarding(false);
    window.history.replaceState({}, document.title, '/');
    setCurrentPath('/');
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    const initUserSession = async () => {
      // Parse Google OAuth hash return (#access_token=...)
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          const payload = parseJwtPayload(accessToken);
          const userObj = {
            id: payload?.sub || payload?.id || payload?.user_id || '',
            email: payload?.email || payload?.user_metadata?.email || '',
            name: payload?.user_metadata?.full_name || payload?.name || payload?.email || 'User',
            picture: payload?.user_metadata?.picture || payload?.user_metadata?.avatar_url || '',
            accessToken: accessToken
          };
          setUserSession(userObj);
          localStorage.setItem('rockyt_session_user', JSON.stringify(userObj));

          // Clean address bar and navigate to internal dashboard
          window.history.replaceState({}, document.title, '/dashboard');
          setCurrentPath('/dashboard');
          return;
        }
      }

      // Check stored session in localStorage
      const stored = localStorage.getItem('rockyt_session_user');
      if (stored) {
        try {
          setUserSession(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('rockyt_session_user');
        }
      } else if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const userObj = {
              id: data.session.user.id,
              email: data.session.user.email,
              name: data.session.user.user_metadata?.full_name || data.session.user.email,
              picture: data.session.user.user_metadata?.avatar_url || ''
            };
            setUserSession(userObj);
            localStorage.setItem('rockyt_session_user', JSON.stringify(userObj));
          }
        } catch (e) {}
      }

      if (window.location.pathname === '/signin' || window.location.pathname === '/signup') {
        const hasSession = localStorage.getItem('rockyt_session_user');
        if (hasSession) {
          window.history.replaceState({}, document.title, '/dashboard');
          setCurrentPath('/dashboard');
        } else {
          setIsOnboarding(true);
        }
      }
    };

    initUserSession();

    let authSubscription: any = null;
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userObj = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
            picture: session.user.user_metadata?.avatar_url || ''
          };
          setUserSession(userObj);
          localStorage.setItem('rockyt_session_user', JSON.stringify(userObj));
        }
      });
      authSubscription = listener?.subscription;
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setIsOnboarding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
  };

  const cancelOnboarding = () => {
    setIsOnboarding(false);
  };

  const isPlatformRoute = validPlatformPaths.includes(currentPath);
  const isDashboardRoute = currentPath === '/dashboard' && !!userSession;
  const docsTab = docsPaths[currentPath];

  return (
    <>
      {/* GLOBAL NOISE OVERLAY */}
      <div className="noise-overlay"></div>

      {/* WEBGL BACKGROUND (Interactive 3D Tunnel) */}
      <TunnelBackground />

      {/* NAVIGATION BAR */}
      {!isDashboardRoute && (
        <Navbar 
          onNavigateHome={() => navigateTo('/')} 
          onOpenAgentSetup={startOnboarding} 
          onNavigateToPath={navigateTo}
          userSession={userSession}
        />
      )}

      {/* MAIN VIEW / ONBOARDING / PLATFORM ROUTE / DOCS ROUTE / DASHBOARD ROUTE */}
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-mono text-brand text-xs font-bold relative z-30">LOADING ROCKYT INFRASTRUCTURE...</div>}>
        {isDashboardRoute ? (
          <Dashboard 
            userSession={userSession} 
            onBackHome={() => navigateTo('/')} 
            onSignOut={handleSignOut}
          />
        ) : (currentPath === '/dashboard' && !userSession) ? (
          <Onboarding onCancel={() => navigateTo('/')} initialMode="signin" />
        ) : isOnboarding ? (
          <Onboarding onCancel={cancelOnboarding} initialMode="signup" />
        ) : docsTab ? (
          <>
            <main className="relative z-10 w-full transition-opacity duration-500">
              <DocsPage 
                initialTab={docsTab} 
                onBack={() => navigateTo('/')} 
                onGetApiKey={startOnboarding} 
              />
            </main>
            <Footer onStartOnboarding={startOnboarding} onNavigateToPath={navigateTo} />
          </>
        ) : isPlatformRoute ? (
          <>
            <main className="relative z-10 w-full transition-opacity duration-500">
              <PlatformPage 
                slug={currentPath} 
                onBack={() => navigateTo('/')} 
                onGetApiKey={startOnboarding} 
                onNavigateToPath={navigateTo}
              />
            </main>
            <Footer onStartOnboarding={startOnboarding} onNavigateToPath={navigateTo} />
          </>
        ) : (
          <main className="relative z-10 w-full transition-opacity duration-1000">
            <Hero onStart={startOnboarding} />
            <PartnerLogos />
            <WhyRockyt />
            <TrustedBy />
            <PortfolioGallery onNavigateToPath={navigateTo} />
            <Marquee />
            <Services />
            <Showcase onStartOnboarding={startOnboarding} />
            <Reviews />
            <Pricing onStartOnboarding={startOnboarding} />
            <Footer onStartOnboarding={startOnboarding} onNavigateToPath={navigateTo} />
          </main>
        )}
      </Suspense>
    </>
  );
};

export default App;