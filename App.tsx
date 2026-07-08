import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import PerformancePage from './components/PerformancePage';
import CasesPage from './components/CasesPage';
import PricingPage from './components/PricingPage';
import Footer from './components/Footer';
import SocialProofWidget from './components/SocialProofWidget';
import GetStartedModal from './components/GetStartedModal';
import Dashboard from './components/Dashboard';
import { PageType } from './types/index';
import { initDodoPayments } from './utils/dodoCheckout';
import { useAuth } from './hooks/useAuth';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq?: (type: string, eventName: string, params?: any, options?: any) => void;
    cbq?: (type: string, eventName: string, params?: any, options?: any) => void;
    datafast?: (eventName: string, params?: any) => void;
  }
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ productId?: string; isYearly?: boolean }>({});
  
  const { user, loading } = useAuth();

  // Ref to prevent double-firing pixel events (debounce)
  const lastBookingTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!loading && user) {
      setCurrentPage('dashboard');
    } else if (!loading && !user && currentPage === 'dashboard') {
      setCurrentPage('home');
    }
  }, [user, loading]);

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // No-op function since Cal.com handles the modal via data attributes
  const handleBookDemo = () => { };

  // Open the Get Started Modal
  const handleGetStarted = (config?: { productId?: string; isYearly?: boolean }) => {
    if (config) {
      setModalConfig(config);
    } else {
      setModalConfig({});
    }
    setIsGetStartedOpen(true);
  };

  const handleCloseGetStarted = () => {
    setIsGetStartedOpen(false);
    setModalConfig({});
  };

  const trackBookingSuccess = () => {
    const now = Date.now();
    // Debounce: prevent firing if tracked in the last 5 seconds
    if (now - lastBookingTimeRef.current < 5000) {
      return;
    }

    lastBookingTimeRef.current = now;

    // Generate deduplication ID for this booking
    const scheduleEventId = 'sch_' + Math.random().toString(36).substr(2, 9) + '_' + now;

    if (window.fbq) {
      console.log('Rockyt: Tracking Schedule event');
      window.fbq('track', 'Schedule', {}, { eventID: scheduleEventId });
    }

    if (window.cbq) {
      console.log('Rockyt: Tracking Signals Gateway Schedule event');
      window.cbq('track', 'Schedule', {}, { eventID: scheduleEventId });
    }

    // DataFast: Schedule Goal
    if (window.datafast) {
      console.log('Rockyt: Tracking DataFast Schedule event');
      window.datafast('schedule');
    }

  };

  // Handle Cal.com booking success events
  useEffect(() => {
    // Handler 1: Listen for direct PostMessages from iframe (Works for Get Started Modal & Popups)
    const handleCalPostMessage = (e: MessageEvent) => {
      if (!e.data) return;

      let eventData = e.data;

      // Handle stringified data (Cal.com sometimes sends this)
      if (typeof eventData === 'string') {
        try {
          eventData = JSON.parse(eventData);
        } catch (err) {
          // Not a JSON string, ignore
          return;
        }
      }

      // Check for multiple event type signatures
      const type = eventData.type || eventData.action || eventData.event;

      if (
        type === 'cal:bookingSuccessful' ||
        type === 'bookingSuccessful'
      ) {
        trackBookingSuccess();
      }
    };

    // Handler 2: Listen for Custom Event dispatched from index.html (Works for Global Popups like Book Demo / Offer)
    const handleCalCustomEvent = () => {
      trackBookingSuccess();
    };

    window.addEventListener('message', handleCalPostMessage);
    window.addEventListener('rockyt:bookingSuccessful', handleCalCustomEvent);

    return () => {
      window.removeEventListener('message', handleCalPostMessage);
      window.removeEventListener('rockyt:bookingSuccessful', handleCalCustomEvent);
    };
  }, []);

  // Initialize Dodo Payments
  useEffect(() => {
    initDodoPayments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161616] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161616] flex flex-col">
      {currentPage !== 'dashboard' && (
        <Navbar
          onBookDemo={handleBookDemo}
          onNavigate={handleNavigate}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onGetStarted={handleGetStarted}
        />
      )}

      <main className={currentPage === 'dashboard' ? 'flex-grow' : 'pt-20 md:pt-32 pb-20 px-4 md:px-6 flex-grow'}>
        {currentPage === 'home' && <HomePage onBookDemo={handleBookDemo} onGetStarted={handleGetStarted} />}
        {currentPage === 'performance' && <PerformancePage onBookDemo={handleBookDemo} onGetStarted={handleGetStarted} />}
        {currentPage === 'cases' && <CasesPage onBookDemo={handleBookDemo} onGetStarted={handleGetStarted} />}
        {currentPage === 'pricing' && <PricingPage onBookDemo={handleBookDemo} onGetStarted={handleGetStarted} />}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>

      {currentPage !== 'dashboard' && <Footer onNavigate={handleNavigate} />}

      {currentPage !== 'dashboard' && <SocialProofWidget />}

      {/* Get Started / Onboarding Modal */}
      <GetStartedModal
        isOpen={isGetStartedOpen}
        onClose={handleCloseGetStarted}
        initialProductId={modalConfig.productId}
        initialIsYearly={modalConfig.isYearly}
      />
    </div>
  );
};

export default App;