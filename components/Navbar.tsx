import React, { useState } from 'react';
import { 
  MessageSquare, ChevronDown, Sparkles, Send, Users, 
  Bot, ShoppingBag, Target, ArrowRight, ExternalLink, Globe, User, LogOut, Check
} from 'lucide-react';

interface NavbarProps {
  onNavigateHome?: () => void;
  onOpenAgentSetup?: () => void;
  onNavigateToPath?: (path: string) => void;
  userSession?: any;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onNavigateHome, 
  onOpenAgentSetup, 
  onNavigateToPath, 
  userSession 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveDropdown(null);

    if (onNavigateHome) {
      onNavigateHome();
    }

    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleRouteClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    if (onNavigateToPath) {
      onNavigateToPath(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      {/* ─── TOPBAR (Help Center, Partners, Log in, Lang) ─── */}
      <div className="bg-[#0f172a] text-gray-300 text-xs py-1.5 px-4 sm:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a 
              href="/docs" 
              onClick={(e) => handleRouteClick(e, '/docs')} 
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Help Center
            </a>
            <div className="relative group">
              <button 
                type="button" 
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                Partners <ChevronDown size={12} className="opacity-70" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-52 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-100 p-2 hidden group-hover:block z-50">
                <a href="#partners" onClick={(e) => handleNavClick(e, 'partners')} className="block px-3 py-1.5 text-xs rounded hover:bg-emerald-50 hover:text-emerald-700">Partner with Us</a>
                <a href="#partners" onClick={(e) => handleNavClick(e, 'partners')} className="block px-3 py-1.5 text-xs rounded hover:bg-emerald-50 hover:text-emerald-700">Value Added Reseller</a>
                <a href="#partners" onClick={(e) => handleNavClick(e, 'partners')} className="block px-3 py-1.5 text-xs rounded hover:bg-emerald-50 hover:text-emerald-700">Tech Partner</a>
                <a href="#partners" onClick={(e) => handleNavClick(e, 'partners')} className="block px-3 py-1.5 text-xs rounded hover:bg-emerald-50 hover:text-emerald-700">Become an Affiliate</a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {userSession ? (
              <button
                onClick={() => onNavigateToPath?.('/dashboard')}
                className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>My Dashboard ({userSession.name || 'Active'})</span>
              </button>
            ) : (
              <button 
                onClick={onOpenAgentSetup}
                className="hover:text-white transition-colors font-medium"
              >
                Log in
              </button>
            )}
            <div className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer pl-3 border-l border-gray-700">
              <Globe size={13} />
              <span>EN</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN NAVIGATION BAR ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          {/* Rockyt Chat Bubble Icon */}
          <div className="w-9 h-9 rounded-2xl bg-[#00D084] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
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

        {/* DESKTOP NAV ITEMS */}
        <nav className="hidden lg:flex items-center gap-1 font-medium text-sm text-gray-700">
          
          {/* PRODUCT DROPDOWN */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('product')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button 
              className="px-3 py-2 rounded-lg hover:text-[#00D084] hover:bg-gray-50 flex items-center gap-1 transition-colors"
            >
              Product <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'product' ? 'rotate-180 text-[#00D084]' : 'opacity-60'}`} />
            </button>

            {activeDropdown === 'product' && (
              <div className="absolute top-full left-0 w-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50 grid grid-cols-2 gap-4">
                <a 
                  href="#broadcast" 
                  onClick={(e) => handleNavClick(e, 'features')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Send size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700 text-sm">Broadcast &amp; Bulk Messaging</div>
                    <div className="text-xs text-gray-500 mt-0.5">Send targeted marketing campaigns with 98% open rates</div>
                  </div>
                </a>

                <a 
                  href="#inbox" 
                  onClick={(e) => handleNavClick(e, 'features')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700 text-sm">Shared Team Inbox</div>
                    <div className="text-xs text-gray-500 mt-0.5">Collaborative multi-agent support &amp; ticketing</div>
                  </div>
                </a>

                <a 
                  href="#astra" 
                  onClick={(e) => handleNavClick(e, 'performance__with_ai')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700 text-sm">Astra AI Agent</div>
                    <div className="text-xs text-gray-500 mt-0.5">Autonomous 24/7 sales, qualification &amp; FAQ resolution</div>
                  </div>
                </a>

                <a 
                  href="#ads" 
                  onClick={(e) => handleNavClick(e, 'features')}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Target size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700 text-sm">Click-to-WhatsApp Ads</div>
                    <div className="text-xs text-gray-500 mt-0.5">Scale Meta ads directly into WhatsApp conversations</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* SOLUTIONS DROPDOWN */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button 
              className="px-3 py-2 rounded-lg hover:text-[#00D084] hover:bg-gray-50 flex items-center gap-1 transition-colors"
            >
              Solutions <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-[#00D084]' : 'opacity-60'}`} />
            </button>

            {activeDropdown === 'solutions' && (
              <div className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 space-y-1">
                <a href="#solutions-marketing" onClick={(e) => handleNavClick(e, 'video-tabbed-section')} className="block p-3 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <div className="font-semibold text-gray-900 text-sm">For Marketing Teams</div>
                  <div className="text-xs text-gray-500">Run hyper-targeted campaigns that convert</div>
                </a>
                <a href="#solutions-sales" onClick={(e) => handleNavClick(e, 'video-tabbed-section')} className="block p-3 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <div className="font-semibold text-gray-900 text-sm">For Sales Teams</div>
                  <div className="text-xs text-gray-500">Shorten sales cycle and capture qualified leads</div>
                </a>
                <a href="#solutions-support" onClick={(e) => handleNavClick(e, 'video-tabbed-section')} className="block p-3 rounded-xl hover:bg-emerald-50/60 transition-colors">
                  <div className="font-semibold text-gray-900 text-sm">For Customer Support</div>
                  <div className="text-xs text-gray-500">Instant AI answers with effortless human escalations</div>
                </a>
              </div>
            )}
          </div>

          {/* PRICING LINK */}
          <a 
            href="#pricing" 
            onClick={(e) => handleNavClick(e, 'pricing')}
            className="px-3 py-2 rounded-lg hover:text-[#00D084] hover:bg-gray-50 transition-colors"
          >
            Pricing
          </a>

          {/* RESOURCES / DOCS */}
          <a 
            href="#reviews" 
            onClick={(e) => handleNavClick(e, 'reviews')}
            className="px-3 py-2 rounded-lg hover:text-[#00D084] hover:bg-gray-50 transition-colors"
          >
            Customers
          </a>
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          {userSession ? (
            <button
              onClick={() => onNavigateToPath?.('/dashboard')}
              className="px-5 py-2.5 rounded-full bg-[#00D084] text-[#07301f] hover:bg-[#00be77] font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAgentSetup}
                className="hidden sm:inline-flex items-center justify-center font-semibold text-sm px-5 py-2 rounded-full border border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Book a Demo
              </button>

              <button
                onClick={onOpenAgentSetup}
                className="inline-flex items-center justify-center font-bold text-sm px-6 py-2.5 rounded-full bg-[#00D084] text-[#08301f] hover:bg-[#00be77] transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
              >
                Try for Free
              </button>
            </>
          )}

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white p-5 shadow-xl space-y-4">
          <div className="space-y-2">
            <a 
              href="#features" 
              onClick={(e) => handleNavClick(e, 'features')}
              className="block font-medium py-2 px-3 text-gray-800 hover:bg-gray-50 rounded-lg"
            >
              Features &amp; WhatsApp Core
            </a>
            <a 
              href="#video-tabbed-section" 
              onClick={(e) => handleNavClick(e, 'video-tabbed-section')}
              className="block font-medium py-2 px-3 text-gray-800 hover:bg-gray-50 rounded-lg"
            >
              Solutions
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => handleNavClick(e, 'pricing')}
              className="block font-medium py-2 px-3 text-gray-800 hover:bg-gray-50 rounded-lg"
            >
              Pricing
            </a>
            <a 
              href="#reviews" 
              onClick={(e) => handleNavClick(e, 'reviews')}
              className="block font-medium py-2 px-3 text-gray-800 hover:bg-gray-50 rounded-lg"
            >
              Reviews &amp; Trust
            </a>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAgentSetup?.(); }}
              className="w-full py-2.5 rounded-full border border-gray-300 text-gray-800 font-semibold text-sm text-center"
            >
              Book a Demo
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAgentSetup?.(); }}
              className="w-full py-2.5 rounded-full bg-[#00D084] text-[#08301f] font-bold text-sm text-center shadow-md shadow-emerald-500/20"
            >
              Try for Free
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;