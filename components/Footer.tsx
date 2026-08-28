import React from 'react';
import { ArrowRight, Bot, ShieldCheck } from 'lucide-react';

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
    <footer className="bg-zinc-950 text-zinc-300 relative z-10 border-t border-zinc-800">
      
      {/* ─── BOTTOM CTA SECTION ─── */}
      <div className="py-20 border-b border-zinc-800 relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8 text-center flex flex-col items-center">
          
          <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/40 flex items-center justify-center text-brand font-black text-2xl mb-6 shadow-glow">
            R
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Ship WhatsApp today
          </h2>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-8 font-medium">
            No credit card, no sales call. Test in the sandbox before you connect a number.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={onStartOnboarding}
              className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-base px-8 py-4 transition-all shadow-xl shadow-brand/25"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* BADGES */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['SOC 2', 'GDPR compliant', '99.97% uptime', 'Under 50ms response'].map((badge, idx) => (
              <span 
                key={idx} 
                className="whitespace-nowrap rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 font-mono text-xs font-semibold text-brand"
              >
                {badge}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* ─── 5-COLUMN LINK DIRECTORY ─── */}
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 text-xs">
          
          {/* PRODUCT */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">Product</p>
            <div className="flex flex-col space-y-2.5 text-zinc-400 font-medium">
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Documentation</a>
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">MCP Server</a>
              <a href="/dashboard" onClick={(e) => handleLinkClick(e, '/dashboard')} className="hover:text-white transition-colors">Dashboard</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="/dashboard" onClick={(e) => handleLinkClick(e, '/dashboard')} className="hover:text-white transition-colors">Chat SDK Adapter</a>
            </div>
          </div>

          {/* INTEGRATIONS */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">Integrations</p>
            <div className="flex flex-col space-y-2.5 text-zinc-400 font-medium">
              <a href="/whatsapp" onClick={(e) => handleLinkClick(e, '/whatsapp')} className="hover:text-white transition-colors">WhatsApp</a>
              <a href="/instagram" onClick={(e) => handleLinkClick(e, '/instagram')} className="hover:text-white transition-colors">Instagram</a>
              <a href="/facebook" onClick={(e) => handleLinkClick(e, '/facebook')} className="hover:text-white transition-colors">Facebook</a>
              <a href="/tiktok" onClick={(e) => handleLinkClick(e, '/tiktok')} className="hover:text-white transition-colors">TikTok</a>
              <a href="/x" onClick={(e) => handleLinkClick(e, '/x')} className="hover:text-white transition-colors">Twitter / X</a>
              <a href="/linkedin" onClick={(e) => handleLinkClick(e, '/linkedin')} className="hover:text-white transition-colors">LinkedIn</a>
              <a href="/meta-ads" onClick={(e) => handleLinkClick(e, '/meta-ads')} className="hover:text-white transition-colors">Meta Ads</a>
            </div>
          </div>

          {/* FOR AGENTS */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">For Agents</p>
            <div className="flex flex-col space-y-2.5 text-zinc-400 font-medium">
              <a href="#ai-agents" className="hover:text-white transition-colors">AI Agents</a>
              <a href="#ai-agents" className="hover:text-white transition-colors">Claude Code</a>
              <a href="#ai-agents" className="hover:text-white transition-colors">Cursor MCP</a>
              <a href="#ai-agents" className="hover:text-white transition-colors">Codex</a>
              <a href="#ai-agents" className="hover:text-white transition-colors">OpenClaw</a>
            </div>
          </div>

          {/* COMPANY */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">Company</p>
            <div className="flex flex-col space-y-2.5 text-zinc-400 font-medium">
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Security &amp; Trust</a>
              <a href="/docs" onClick={(e) => handleLinkClick(e, '/docs')} className="hover:text-white transition-colors">Status</a>
            </div>
          </div>

          {/* COMMUNITY */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">Community</p>
            <div className="flex flex-col space-y-2.5 text-zinc-400 font-medium">
              <a href="https://github.com/MOEM96/Rockyt2" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter / X</a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} Rockyt. Official Meta Business Partner.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span>SOC 2 Type II Certified</span>
            <span>·</span>
            <span>GDPR Compliant</span>
          </div>
        </div>

      </div>

    </footer>
  );
};

export default Footer;