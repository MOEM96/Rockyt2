import React from 'react';
import { ArrowRight, ShieldCheck, Globe, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onStartOnboarding?: () => void;
  onNavigateToPath?: (path: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onStartOnboarding, onNavigateToPath }) => {
  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigateToPath) {
      onNavigateToPath(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <footer className="bg-[#0f172a] text-gray-300 relative z-10 border-t border-gray-800">
      
      {/* ─── BOTTOM HERO CTA BANNER ─── */}
      <div className="py-20 border-b border-gray-800/80 relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#0a0f1d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
          
          <div className="w-14 h-14 rounded-2xl bg-[#00D084] flex items-center justify-center text-white font-bold mb-6 shadow-xl shadow-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.12-1.33c1.43.83 3.09 1.33 4.88 1.33 5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white mb-4">
            Accelerate your business on WhatsApp today
          </h2>

          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Experience the #1 AI-powered customer engagement platform. No credit card required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={onStartOnboarding}
              className="inline-flex items-center gap-2 rounded-full bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-base px-9 py-4 transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.98]"
            >
              <span>Try for Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#00D084]" /> Official Meta Business Solution Provider
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#00D084]" /> SOC-2 &amp; GDPR Compliant
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#00D084]" /> 99.99% Uptime SLA
            </span>
          </div>

        </div>
      </div>

      {/* ─── 5-COLUMN FOOTER LINKS ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          
          {/* COL 1: BRAND */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00D084] flex items-center justify-center text-[#07301f] font-black text-sm">
                R
              </div>
              <span className="font-sans font-black text-2xl tracking-tight text-white">
                rockyt
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              AI-powered customer engagement platform turning WhatsApp, Instagram &amp; Messenger into revenue. Trusted by 16,000+ businesses worldwide.
            </p>
          </div>

          {/* COL 2: PRODUCT */}
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</p>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Broadcasts &amp; Bulk SMS</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Shared Team Inbox</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Astra AI Agent</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Click-to-WhatsApp Ads</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">WhatsApp Catalog</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">WhatsApp Cloud API</a></li>
            </ul>
          </div>

          {/* COL 3: SOLUTIONS */}
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Solutions</p>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">For Marketing Teams</a></li>
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">For Sales Teams</a></li>
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">For Customer Support</a></li>
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">E-Commerce &amp; Retail</a></li>
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">Financial Services</a></li>
              <li><a href="#video-tabbed-section" className="hover:text-white transition-colors">Education &amp; EdTech</a></li>
            </ul>
          </div>

          {/* COL 4: RESOURCES */}
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Resources</p>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Help Center &amp; Guides</a></li>
              <li><a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#reviews" className="hover:text-white transition-colors">Customer Stories</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">WhatsApp FAQs</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">Partner Directory</a></li>
              <li><a href="https://status.rockyt.io" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">System Status</a></li>
            </ul>
          </div>

          {/* COL 5: COMPANY */}
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</p>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><a href="#about" className="hover:text-white transition-colors">About Rockyt</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">Partner with Us</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security &amp; Privacy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Sales</a></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} Rockyt.io. All rights reserved. Official Meta WhatsApp Business Partner.
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-gray-300 transition-colors">Terms &amp; Conditions</a>
            <a href="#gdpr" className="hover:text-gray-300 transition-colors">GDPR Commitment</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;