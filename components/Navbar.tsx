import React, { useState } from 'react';
import { Menu, X, Bot, Terminal, ChevronDown, Share2, MessageSquare, Megaphone, ShieldCheck, FileText, Zap, Cpu, Sparkles, Lock } from 'lucide-react';

interface NavbarProps {
  onNavigateHome?: () => void;
  onOpenAgentSetup?: () => void;
  onNavigateToPath?: (path: string) => void;
  userSession?: any;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigateHome, onOpenAgentSetup, onNavigateToPath, userSession }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

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
    if (onNavigateToPath) {
      onNavigateToPath(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/85 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* LOGO & BRANDING */}
        <div 
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col cursor-pointer group shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="bg-white text-ink px-2.5 py-1 font-display font-bold text-xl tracking-tighter shadow-hard group-hover:bg-brand group-hover:text-white transition-all">
              ROCKYT
            </div>
            <span className="font-mono text-[9px] text-brand border border-brand/50 bg-brand/10 px-1.5 py-0.5 rounded-sm animate-pulse hidden sm:flex items-center gap-1 font-bold">
              <Bot size={10} /> MCP // AGENT READY
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-widest mt-0.5 opacity-60 text-white/70">
            ROCKYT.IO // SOCIAL · MESSAGING · ADS
          </span>
        </div>
        
        {/* DESKTOP NAV LINKS WITH HOVER DROPDOWNS */}
        <div className="hidden md:flex items-center gap-2">
          
          {/* TAB 01: CHANNELS (WITH SEGMENTED DROPDOWN) */}
          <div className="relative group">
            <a 
              href="#channels" 
              onClick={(e) => handleNavClick(e, 'channels')}
              className="border border-white/20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white hover:border-brand transition-colors rounded-sm flex items-center gap-1.5 font-semibold"
            >
              [01] CHANNELS <ChevronDown size={12} className="opacity-70 group-hover:rotate-180 transition-transform" />
            </a>

            {/* CHANNELS HOVER DROPDOWN MENU */}
            <div className="absolute top-full left-0 mt-1.5 w-[680px] bg-zinc-950/95 border-2 border-white/20 p-6 backdrop-blur-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 rounded-sm">
              <div className="grid grid-cols-3 gap-6">
                
                {/* SOCIAL SEGMENT */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <Share2 size={12} /> SOCIAL NETWORKS
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <a href="/x" onClick={(e) => handleRouteClick(e, '/x')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">X / Twitter API</a>
                    <a href="/instagram" onClick={(e) => handleRouteClick(e, '/instagram')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">Instagram API</a>
                    <a href="/tiktok" onClick={(e) => handleRouteClick(e, '/tiktok')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">TikTok API</a>
                    <a href="/linkedin" onClick={(e) => handleRouteClick(e, '/linkedin')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">LinkedIn API</a>
                    <a href="/threads" onClick={(e) => handleRouteClick(e, '/threads')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">Threads API</a>
                    <a href="/reddit" onClick={(e) => handleRouteClick(e, '/reddit')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">Reddit API</a>
                    <a href="/bluesky" onClick={(e) => handleRouteClick(e, '/bluesky')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">Bluesky API</a>
                  </div>
                </div>

                {/* MESSAGING SEGMENT */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <MessageSquare size={12} /> MESSAGING CHANNELS
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <a href="/whatsapp" onClick={(e) => handleRouteClick(e, '/whatsapp')} className="block p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 transition-colors text-white/80">WhatsApp Business API</a>
                    <a href="/telegram" onClick={(e) => handleRouteClick(e, '/telegram')} className="block p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 transition-colors text-white/80">Telegram API</a>
                    <a href="/discord" onClick={(e) => handleRouteClick(e, '/discord')} className="block p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 transition-colors text-white/80">Discord API</a>
                    <a href="/slack" onClick={(e) => handleRouteClick(e, '/slack')} className="block p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 transition-colors text-white/80">Slack API</a>
                    <a href="/snapchat" onClick={(e) => handleRouteClick(e, '/snapchat')} className="block p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 transition-colors text-white/80">Snapchat API</a>
                  </div>
                </div>

                {/* ADS SEGMENT */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <Megaphone size={12} /> ADS &amp; ENTERPRISE
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <a href="/meta-ads" onClick={(e) => handleRouteClick(e, '/meta-ads')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Meta Ads API</a>
                    <a href="/google-ads" onClick={(e) => handleRouteClick(e, '/google-ads')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Google Ads API</a>
                    <a href="/googlebusiness" onClick={(e) => handleRouteClick(e, '/googlebusiness')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Google Business API</a>
                  </div>
                </div>

              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-right">
                <a href="#channels" onClick={(e) => handleNavClick(e, 'channels')} className="font-mono text-[10px] text-brand hover:underline font-bold uppercase">
                  VIEW ALL 16 CHANNELS &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* TAB 02: SOLUTIONS */}
          <div className="relative group">
            <a 
              href="#mcp-skills" 
              onClick={(e) => handleNavClick(e, 'mcp-skills')}
              className="border border-white/20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white hover:border-brand transition-colors rounded-sm flex items-center gap-1.5 font-semibold"
            >
              [02] SOLUTIONS <ChevronDown size={12} className="opacity-70 group-hover:rotate-180 transition-transform" />
            </a>

            {/* SOLUTIONS HOVER DROPDOWN MENU */}
            <div className="absolute top-full left-0 mt-1.5 w-[560px] bg-zinc-950/95 border-2 border-white/20 p-6 backdrop-blur-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 rounded-sm">
              <div className="grid grid-cols-2 gap-6">
                
                {/* SEGMENT 1: FOR AI AGENTS */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <Bot size={12} /> FOR AI AGENTS &amp; LLMS
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block p-2 rounded bg-white/5 hover:bg-brand hover:text-white transition-colors">
                      <div className="font-bold">Autonomous Dispatcher</div>
                      <div className="text-[10px] opacity-70">Cross-platform content generation &amp; posting</div>
                    </a>
                    <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block p-2 rounded bg-white/5 hover:bg-brand hover:text-white transition-colors">
                      <div className="font-bold">Comment-to-DM Funnel</div>
                      <div className="text-[10px] opacity-70">Instant WhatsApp lead capture &amp; response</div>
                    </a>
                    <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block p-2 rounded bg-white/5 hover:bg-brand hover:text-white transition-colors">
                      <div className="font-bold">Native MCP Tool Server</div>
                      <div className="text-[10px] opacity-70">@rockyt/mcp-server for Claude &amp; Cursor</div>
                    </a>
                  </div>
                </div>

                {/* SEGMENT 2: FOR AGENCIES & DEVELOPERS */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <Zap size={12} /> FOR AGENCIES &amp; DEVS
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <a href="#why-rockyt" onClick={(e) => handleNavClick(e, 'why-rockyt')} className="block p-2 rounded bg-white/5 hover:bg-cyan-600 hover:text-white transition-colors">
                      <div className="font-bold">n8n, Make &amp; Zapier Connectors</div>
                      <div className="text-[10px] opacity-70">Connect 16 channels to no-code workflows</div>
                    </a>
                    <a href="#why-rockyt" onClick={(e) => handleNavClick(e, 'why-rockyt')} className="block p-2 rounded bg-white/5 hover:bg-cyan-600 hover:text-white transition-colors">
                      <div className="font-bold">Agency Multi-Client Vault</div>
                      <div className="text-[10px] opacity-70">Single key for 100+ social client accounts</div>
                    </a>
                    <a href="#why-rockyt" onClick={(e) => handleNavClick(e, 'why-rockyt')} className="block p-2 rounded bg-white/5 hover:bg-cyan-600 hover:text-white transition-colors">
                      <div className="font-bold">Custom Agentic Skills</div>
                      <div className="text-[10px] opacity-70">Extend Rockyt SDK for specialized tools</div>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* TAB 03: DOCS */}
          <div className="relative group">
            <a 
              href="#sandbox" 
              onClick={(e) => handleNavClick(e, 'sandbox')}
              className="border border-white/20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white hover:border-brand transition-colors rounded-sm flex items-center gap-1.5 font-semibold"
            >
              [03] DOCS <ChevronDown size={12} className="opacity-70 group-hover:rotate-180 transition-transform" />
            </a>

            {/* DOCS HOVER DROPDOWN MENU */}
            <div className="absolute top-full left-0 mt-1.5 w-[420px] bg-zinc-950/95 border-2 border-white/20 p-5 backdrop-blur-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 rounded-sm">
              <div className="grid grid-cols-2 gap-4">
                
                {/* API DOCS */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <FileText size={12} /> API DOCS
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <a href="/docs" onClick={(e) => handleRouteClick(e, '/docs')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">REST API Reference</a>
                    <a href="/mcp" onClick={(e) => handleRouteClick(e, '/mcp')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">MCP Protocol Spec</a>
                    <a href="/agent-quickstart" onClick={(e) => handleRouteClick(e, '/agent-quickstart')} className="block p-1.5 rounded hover:bg-white/10 hover:text-brand transition-colors text-white/80">Agent Quickstart</a>
                  </div>
                </div>

                {/* SECURITY */}
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/10">
                    <ShieldCheck size={12} /> SECURITY
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <a href="#sandbox" onClick={(e) => handleNavClick(e, 'sandbox')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Hosted OAuth Vault</a>
                    <a href="#sandbox" onClick={(e) => handleNavClick(e, 'sandbox')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Data Encryption</a>
                    <a href="#sandbox" onClick={(e) => handleNavClick(e, 'sandbox')} className="block p-1.5 rounded hover:bg-white/10 hover:text-emerald-300 transition-colors text-white/80">Rate Limits &amp; SLA</a>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* TAB 04: PRICING */}
          <a 
            href="#pricing" 
            onClick={(e) => handleNavClick(e, 'pricing')}
            className="border border-white/20 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white hover:border-brand transition-colors rounded-sm font-semibold"
          >
            [04] PRICING
          </a>

          {/* TAB 05: DASHBOARD (Only visible for signed-in users) */}
          {!!userSession && (
            <a 
              href="/dashboard" 
              onClick={(e) => handleRouteClick(e, '/dashboard')}
              className="border border-brand/50 bg-brand/10 text-brand px-3.5 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white transition-colors rounded-sm font-bold flex items-center gap-1 shadow-glow"
            >
              [05] DASHBOARD
            </a>
          )}

          {/* CTA BUTTON */}
          <button
            onClick={() => {
              if (onOpenAgentSetup) onOpenAgentSetup();
            }}
            className="ml-2 border border-brand text-brand bg-brand/10 backdrop-blur-sm px-4 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-white transition-colors rounded-sm font-bold flex items-center gap-1.5 shadow-glow"
          >
            <Terminal size={12} /> GET API KEY
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white/80 hover:text-white border border-white/20 bg-black/50"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900/95 border-b border-white/20 p-4 flex flex-col gap-3 font-mono text-xs animate-in slide-in-from-top-2 duration-200">
          
          {/* MOBILE CHANNELS */}
          <div>
            <button 
              onClick={() => setMobileSubmenu(mobileSubmenu === 'channels' ? null : 'channels')}
              className="w-full p-2 border border-white/10 hover:bg-brand hover:text-white transition-colors flex justify-between items-center font-bold"
            >
              <span>[01] CHANNELS // 16 PLATFORMS</span>
              <ChevronDown size={14} className={mobileSubmenu === 'channels' ? 'rotate-180' : ''} />
            </button>
            {mobileSubmenu === 'channels' && (
              <div className="pl-4 pt-2 space-y-1 text-white/80 border-l border-brand/50 mt-1">
                <div className="text-[10px] text-brand font-bold uppercase mt-1">Social</div>
                <a href="/x" onClick={(e) => handleRouteClick(e, '/x')} className="block py-1 hover:text-brand">X / Twitter API</a>
                <a href="/instagram" onClick={(e) => handleRouteClick(e, '/instagram')} className="block py-1 hover:text-brand">Instagram API</a>
                <a href="/tiktok" onClick={(e) => handleRouteClick(e, '/tiktok')} className="block py-1 hover:text-brand">TikTok API</a>
                
                <div className="text-[10px] text-cyan-400 font-bold uppercase mt-2">Messaging</div>
                <a href="/whatsapp" onClick={(e) => handleRouteClick(e, '/whatsapp')} className="block py-1 hover:text-cyan-300">WhatsApp Business API</a>
                <a href="/telegram" onClick={(e) => handleRouteClick(e, '/telegram')} className="block py-1 hover:text-cyan-300">Telegram API</a>
                <a href="/discord" onClick={(e) => handleRouteClick(e, '/discord')} className="block py-1 hover:text-cyan-300">Discord API</a>

                <div className="text-[10px] text-emerald-400 font-bold uppercase mt-2">Ads</div>
                <a href="/meta-ads" onClick={(e) => handleRouteClick(e, '/meta-ads')} className="block py-1 hover:text-emerald-300">Meta Ads API</a>
                <a href="/google-ads" onClick={(e) => handleRouteClick(e, '/google-ads')} className="block py-1 hover:text-emerald-300">Google Ads API</a>
              </div>
            )}
          </div>

          {/* MOBILE SOLUTIONS */}
          <div>
            <button 
              onClick={() => setMobileSubmenu(mobileSubmenu === 'solutions' ? null : 'solutions')}
              className="w-full p-2 border border-white/10 hover:bg-brand hover:text-white transition-colors flex justify-between items-center font-bold"
            >
              <span>[02] SOLUTIONS // AGENTS &amp; AGENCIES</span>
              <ChevronDown size={14} className={mobileSubmenu === 'solutions' ? 'rotate-180' : ''} />
            </button>
            {mobileSubmenu === 'solutions' && (
              <div className="pl-4 pt-2 space-y-1 text-white/80 border-l border-brand/50 mt-1">
                <div className="text-[10px] text-brand font-bold uppercase">For AI Agents</div>
                <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block py-1 hover:text-brand">Autonomous Dispatcher</a>
                <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block py-1 hover:text-brand">Comment-to-DM Funnel</a>
                <a href="#mcp-skills" onClick={(e) => handleNavClick(e, 'mcp-skills')} className="block py-1 hover:text-brand">Native MCP Server</a>

                <div className="text-[10px] text-cyan-400 font-bold uppercase mt-2">For Agencies &amp; Devs</div>
                <a href="#why-rockyt" onClick={(e) => handleNavClick(e, 'why-rockyt')} className="block py-1 hover:text-cyan-300">n8n, Make &amp; Zapier Connectors</a>
                <a href="#why-rockyt" onClick={(e) => handleNavClick(e, 'why-rockyt')} className="block py-1 hover:text-cyan-300">Agency Multi-Client Vault</a>
              </div>
            )}
          </div>

          {/* MOBILE DOCS */}
          <div>
            <button 
              onClick={() => setMobileSubmenu(mobileSubmenu === 'docs' ? null : 'docs')}
              className="w-full p-2 border border-white/10 hover:bg-brand hover:text-white transition-colors flex justify-between items-center font-bold"
            >
              <span>[03] DOCS // API &amp; SECURITY</span>
              <ChevronDown size={14} className={mobileSubmenu === 'docs' ? 'rotate-180' : ''} />
            </button>
            {mobileSubmenu === 'docs' && (
              <div className="pl-4 pt-2 space-y-1 text-white/80 border-l border-brand/50 mt-1">
                <a href="/docs" onClick={(e) => handleRouteClick(e, '/docs')} className="block py-1 hover:text-brand">REST API Reference</a>
                <a href="/mcp" onClick={(e) => handleRouteClick(e, '/mcp')} className="block py-1 hover:text-brand">MCP Protocol Spec</a>
                <a href="/agent-quickstart" onClick={(e) => handleRouteClick(e, '/agent-quickstart')} className="block py-1 hover:text-brand">Agent Quickstart</a>
                <a href="#sandbox" onClick={(e) => handleNavClick(e, 'sandbox')} className="block py-1 hover:text-emerald-400">Security &amp; OAuth Vault</a>
              </div>
            )}
          </div>

          {/* MOBILE PRICING */}
          <a 
            href="#pricing" 
            onClick={(e) => handleNavClick(e, 'pricing')}
            className="p-2 border border-white/10 hover:bg-brand hover:text-white transition-colors font-bold"
          >
            [04] PRICING // DEVELOPER TIERS
          </a>

          {/* MOBILE DASHBOARD (Only visible for signed-in users) */}
          {!!userSession && (
            <a 
              href="/dashboard" 
              onClick={(e) => handleRouteClick(e, '/dashboard')}
              className="p-2 border border-brand/50 bg-brand/10 text-brand hover:bg-brand hover:text-white transition-colors font-bold"
            >
              [05] DASHBOARD
            </a>
          )}

          {/* MOBILE CTA */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenAgentSetup) onOpenAgentSetup();
            }}
            className="p-3 border border-brand bg-brand/20 text-brand font-bold hover:bg-brand hover:text-white transition-colors text-left flex items-center gap-2 mt-1"
          >
            <Terminal size={14} /> GET API KEY &amp; MCP CONFIG
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;