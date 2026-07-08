import React, { useRef } from 'react';
import { RockytLogo } from './Logo';
import { NavigationProps, DemoBookingProps, PageType } from '../types/index';
import { useScrollLock, useFocusTrap, useKeyPress } from '../hooks/index';
import { scrollToTop } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps extends NavigationProps, DemoBookingProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  onGetStarted: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, isMobileMenuOpen, setIsMobileMenuOpen, onGetStarted }) => {
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, signInWithGoogle } = useAuth();

  useScrollLock(isMobileMenuOpen);
  useFocusTrap(mobileMenuRef, isMobileMenuOpen);

  useKeyPress('Escape', () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  });

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMobileNavigate = (page: PageType) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
    scrollToTop();
  };

  const handleDesktopNavigate = (e: React.MouseEvent, page: PageType) => {
    e.preventDefault();
    onNavigate(page);
    scrollToTop();
  };

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onGetStarted();
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      onNavigate('dashboard');
    } else {
      signInWithGoogle();
    }
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 md:h-28 flex items-center pointer-events-none" role="navigation" aria-label="Main navigation">
        <div className="max-w-[1200px] w-full mx-auto px-4 md:px-6 flex justify-between items-center h-full gap-2">

          {/* Logo Island */}
          <div className="pointer-events-auto">
            <a
              href="#"
              onClick={(e) => handleDesktopNavigate(e, 'home')}
              className="flex items-center gap-2 bg-[#161616]/80 backdrop-blur-xl border border-white/10 pl-3 pr-3 md:pl-4 md:pr-6 py-1.5 md:py-3 rounded-full shadow-2xl hover:-translate-y-1 transition-transform duration-300 group"
              aria-label="Go to homepage"
            >
              <div className="w-8 h-8 flex items-center justify-center text-brand-blue group-hover:text-white transition-colors relative">
                <div className="absolute inset-0 bg-brand-blue/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <RockytLogo className="w-full h-full relative z-10" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white hidden md:block">Rockyt</span>
            </a>
          </div>

          {/* Desktop Menu Island */}
          <div className="hidden lg:flex pointer-events-auto">
            <div className="flex items-center p-1.5 gap-1 bg-[#161616]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
              <a
                href="#"
                onClick={(e) => handleDesktopNavigate(e, 'apis')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                APIs
              </a>
              <a
                href="#"
                onClick={(e) => handleDesktopNavigate(e, 'performance')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 capitalize"
              >
                Performance
              </a>
              <a
                href="#"
                onClick={(e) => handleDesktopNavigate(e, 'cases')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 capitalize"
              >
                Cases
              </a>
              <a
                href="#"
                onClick={(e) => handleDesktopNavigate(e, 'pricing')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 capitalize"
              >
                Pricing
              </a>
              <a
                href="https://aiads.tawk.help/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 capitalize"
              >
                Help Center
              </a>
            </div>
          </div>

          {/* NEW: Mobile 3D Floating CTA (Between Logo and Burger) */}
          <div className="lg:hidden pointer-events-auto flex-grow flex justify-center">
            <a
              href="#"
              onClick={handleGetStartedClick}
              className="
                    relative bg-[#FFE241] text-black font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-full 
                    shadow-[0_4px_0_rgb(180,160,30)] active:shadow-none active:translate-y-[4px] 
                    transition-all duration-150 flex items-center gap-1.5 border border-[#e0c529]
                    hover:brightness-110
                "
            >
              <span>start for $0</span>
              <iconify-icon icon="solar:bolt-bold" class="text-xs"></iconify-icon>
            </a>
          </div>

          {/* Desktop Actions Island */}
          <div className="hidden lg:flex items-center gap-3 p-2 bg-[#161616]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto">
            {/* Login */}
            <a
              href="#"
              onClick={handleLoginClick}
              className="px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white transition-colors uppercase tracking-wide flex items-center gap-2"
            >
              {user ? (
                <>
                  <iconify-icon icon="solar:widget-bold" class="text-brand-yellow"></iconify-icon>
                  Dashboard
                </>
              ) : (
                'Login'
              )}
            </a>

            {/* Get Started - High Visibility & Clear */}
            <a
              href="#"
              onClick={handleGetStartedClick}
              className="relative px-6 py-3 rounded-full bg-[#FFE241] text-black text-sm font-black uppercase tracking-wide hover:bg-[#ffeb7a] transition-all shadow-[0_0_20px_rgba(255,226,65,0.4)] hover:shadow-[0_0_30px_rgba(255,226,65,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center gap-2 group overflow-hidden"
            >
              <span className="relative z-10">start for $0</span>
              <iconify-icon icon="solar:arrow-right-bold" class="relative z-10 text-lg group-hover:translate-x-1 transition-transform"></iconify-icon>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </a>
          </div>

          {/* Mobile Menu Toggle Island */}
          <div className="lg:hidden pointer-events-auto">
            <button
              onClick={toggleMobileMenu}
              className="w-9 h-9 md:w-12 md:h-12 flex flex-col justify-center items-center gap-1.5 bg-[#161616]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-brand-yellow relative overflow-hidden group"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <iconify-icon icon="solar:close-circle-bold" width="24" class="text-white relative z-10"></iconify-icon>
              ) : (
                <div className="flex flex-col gap-1.5 relative z-10 scale-90">
                  <span className="block w-5 h-0.5 bg-white rounded-full group-hover:w-6 transition-all"></span>
                  <span className="block w-5 h-0.5 bg-white rounded-full"></span>
                  <span className="block w-5 h-0.5 bg-white rounded-full group-hover:w-3 transition-all self-end"></span>
                </div>
              )}
              {/* Toggle glow */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-2xl z-40 flex flex-col items-center justify-center transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Background gradient blob */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-blue/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-brand-yellow/5 blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col items-center w-full px-8 max-w-xs relative z-10">

          {/* Navigation Links - Compact & Minimal */}
          <div className="flex flex-col items-center gap-5 w-full">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleMobileNavigate('apis'); }}
              className="text-lg font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2 border-b border-white/5"
            >
              APIs
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleMobileNavigate('performance'); }}
              className="text-lg font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2 border-b border-white/5"
            >
              Performance
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleMobileNavigate('cases'); }}
              className="text-lg font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2 border-b border-white/5"
            >
              Cases
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleMobileNavigate('pricing'); }}
              className="text-lg font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2 border-b border-white/5"
            >
              Pricing
            </a>
            <a
              href="https://aiads.tawk.help/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2 border-b border-white/5"
            >
              Help Center
            </a>
          </div>

          {/* Spacer */}
          <div className="h-10"></div>

          {/* CTAs */}
          <div className="flex flex-col w-full gap-3">
            {/* Login - Now triggers Google Auth or Dashboard */}
            <a
              href="#"
              onClick={handleLoginClick}
              className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white transition-all text-center font-bold text-base tracking-wide flex items-center justify-center gap-2 group"
            >
              <iconify-icon icon="solar:user-circle-bold" class="text-lg text-brand-yellow"></iconify-icon>
              <span>{user ? 'Dashboard' : 'Login'}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;