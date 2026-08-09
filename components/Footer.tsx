import React from 'react';
import { ArrowUpRight, Bot, Terminal } from 'lucide-react';

interface FooterProps {
  onStartOnboarding?: () => void;
  onNavigateToPath?: (path: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onStartOnboarding, onNavigateToPath }) => {
  const channelLinks = [
    { label: "Twitter / X API", path: "/x" },
    { label: "Instagram API", path: "/instagram" },
    { label: "WhatsApp Business API", path: "/whatsapp" },
    { label: "TikTok API", path: "/tiktok" },
    { label: "LinkedIn API", path: "/linkedin" },
    { label: "Telegram API", path: "/telegram" },
    { label: "Discord API", path: "/discord" },
    { label: "Slack API", path: "/slack" },
    { label: "Meta Ads API", path: "/meta-ads" },
    { label: "Threads API", path: "/threads" },
    { label: "Reddit API", path: "/reddit" },
    { label: "Bluesky API", path: "/bluesky" },
    { label: "Snapchat API", path: "/snapchat" },
    { label: "Google Business API", path: "/googlebusiness" },
  ];

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
    <footer className="bg-ink text-paper py-20 px-4 sm:px-6 relative z-10 border-t-8 border-brand">
       <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
             <span className="bg-brand text-white font-mono text-[10px] px-3 py-1 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Bot size={14} /> ROCKYT API FOR AI AGENTS
             </span>
             <span className="font-mono text-xs text-white/50">// UNIFIED PLATFORM PATHS</span>
          </div>

          {/* SHIP NOW Headline */}
          <h2 
            onClick={onStartOnboarding}
            className="font-display font-bold text-7xl sm:text-9xl lg:text-[10rem] tracking-tighter text-brand mb-6 leading-[0.8] cursor-pointer hover:opacity-90 transition-opacity uppercase text-center"
          >
             SHIP <span className="text-white">NOW</span>
          </h2>

          {/* Sub-headline */}
          <div className="font-mono text-xs sm:text-sm space-y-2 text-white/80 max-w-2xl mx-auto text-center leading-relaxed mb-8">
             <p>One unified API for Social Media, WhatsApp Messaging, and Meta Ads.</p>
             <p>Built for developers, LLM frameworks, and autonomous AI agents.</p>
             <p className="text-brand font-bold pt-1">/// MCP SERVER: @rockyt/mcp-server READY</p>
          </div>

          {/* CTA Button & Attached Subheadline */}
          <div className="flex flex-col items-center gap-3">
             <button 
               onClick={onStartOnboarding}
               className="inline-flex items-center gap-2.5 border-2 border-brand bg-brand text-white font-mono text-sm font-bold px-8 py-4 hover:bg-white hover:text-ink hover:border-white transition-all tracking-widest uppercase shadow-[0_0_30px_rgba(211,93,136,0.5)]"
             >
                <Terminal size={16} /> GET API KEY &amp; MCP CONFIG
             </button>
             
             <p className="font-mono text-xs text-white/60 max-w-md mx-auto leading-relaxed mt-2">
                Free 2 accounts included. Grab your API key and connect your AI agents in under 30 seconds.
             </p>
          </div>
       </div>

       {/* Platform Paths & Local Page Links */}
       <div className="max-w-7xl mx-auto mt-16 pt-10 border-t border-white/10">
          <span className="font-mono text-xs text-brand font-bold uppercase tracking-wider block mb-6">
             LOCAL PLATFORM API PAGES &amp; DOCUMENTATION
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 font-mono text-xs text-white/60">
             {channelLinks.map((ch) => (
                <a 
                  key={ch.path}
                  href={ch.path}
                  onClick={(e) => handleLinkClick(e, ch.path)}
                  className="hover:text-brand hover:border-brand transition-colors flex items-center justify-between p-2.5 border border-white/10 bg-zinc-900/60 rounded-sm font-semibold"
                >
                   <span>{ch.label}</span>
                   <ArrowUpRight size={12} className="text-brand opacity-80" />
                </a>
             ))}
             <a 
               href="/agent-quickstart"
               onClick={(e) => handleLinkClick(e, '/agent-quickstart')}
               className="hover:text-white transition-colors flex items-center justify-between p-2.5 border border-brand bg-brand/15 text-brand font-bold rounded-sm col-span-2 sm:col-span-1"
             >
                <span>/agent-quickstart</span>
                <Bot size={12} />
             </a>
          </div>
       </div>

       {/* Footer Copyright Bar */}
       <div className="max-w-7xl mx-auto mt-16 border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[11px] uppercase text-white/40">
          <div>© 2026 ROCKYT INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
             <a href="#hero" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-brand transition-colors flex items-center gap-1">OVERVIEW <ArrowUpRight size={10} /></a>
             <a href="#channels" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-brand transition-colors flex items-center gap-1">CHANNELS <ArrowUpRight size={10} /></a>
             <a href="#sandbox" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-brand transition-colors flex items-center gap-1">SANDBOX <ArrowUpRight size={10} /></a>
             <a href="#pricing" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-brand transition-colors flex items-center gap-1">PRICING <ArrowUpRight size={10} /></a>
          </div>
       </div>
    </footer>
  );
};

export default Footer;