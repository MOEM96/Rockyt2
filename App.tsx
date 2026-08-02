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

const Onboarding = lazy(() => import('./components/Onboarding'));
const PlatformPage = lazy(() => import('./components/PlatformPage'));
const DocsPage = lazy(() => import('./components/DocsPage'));

const validPlatformPaths = [
  '/x', '/instagram', '/whatsapp', '/tiktok', '/linkedin', 
  '/telegram', '/discord', '/slack', '/meta-ads', '/google-ads', 
  '/threads', '/bluesky', '/reddit', '/pinterest', '/snapchat', 
  '/googlebusiness'
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

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
  const docsTab = docsPaths[currentPath];

  return (
    <>
      {/* GLOBAL NOISE OVERLAY */}
      <div className="noise-overlay"></div>

      {/* WEBGL BACKGROUND (Interactive 3D Tunnel) */}
      <TunnelBackground />

      {/* NAVIGATION BAR */}
      <Navbar 
        onNavigateHome={() => navigateTo('/')} 
        onOpenAgentSetup={startOnboarding} 
        onNavigateToPath={navigateTo}
      />

      {/* MAIN VIEW / ONBOARDING / PLATFORM ROUTE / DOCS ROUTE */}
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-mono text-brand text-xs font-bold">LOADING ROCKYT INFRASTRUCTURE...</div>}>
        {isOnboarding ? (
          <Onboarding onCancel={cancelOnboarding} />
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