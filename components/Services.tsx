import React from 'react';
import { Bot, Share2, MessageSquare, Megaphone, BarChart3, Zap, ArrowRight, Terminal, CheckCircle2, Code2, Sparkles } from 'lucide-react';

interface ServicesProps {
  onStartOnboarding?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onStartOnboarding }) => {
  return (
    <section id="mcp-skills" className="py-28 px-4 sm:px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 font-mono text-xs text-white/80 font-bold uppercase tracking-widest mb-3">
            <span className="w-2.5 h-2.5 bg-brand inline-block"></span>
            ZERO CODE TO FULL CONTROL
          </div>

          <h2 className="font-display font-semibold text-5xl sm:text-7xl lg:text-8xl text-white uppercase tracking-tighter leading-none">
            One product, every workflow
          </h2>
        </div>

        {/* TOP CONTAINER — LIGHT/PAPER BG ("FOR AGENTS & MCP WORKFLOWS") */}
        <div className="bg-[#f0f0f2] text-[#111111] p-8 sm:p-12 border-2 border-black shadow-2xl mb-8 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-ink">
                    Rockyt
                  </h3>
                  <span className="bg-blue-600 text-white font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-xs">
                    FOR YOU
                  </span>
                </div>

                <p className="font-mono text-xs sm:text-sm text-ink/80 leading-relaxed mb-4">
                  Turn Claude Code, Cursor, or any MCP client into an agent that executes across all 16 social, messaging, and ad platforms. Go from asking questions to doing work.
                </p>

                <p className="font-mono text-xs sm:text-sm text-ink/80 leading-relaxed mb-8">
                  Every tool comes production-ready — authenticated, pre-approved, optimized, and reliable. No setup required.
                </p>
              </div>

              <div>
                <button 
                  onClick={onStartOnboarding}
                  className="bg-black text-white font-mono text-xs font-bold px-6 py-3.5 uppercase tracking-widest hover:bg-brand transition-colors inline-flex items-center gap-2 shadow-hard"
                >
                  LEARN MORE <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Interactive IDE Visual Column (7 Cols) */}
            <div className="lg:col-span-7 relative">
              <div className="bg-[#18181c] border-2 border-black rounded-md p-6 sm:p-8 shadow-2xl font-mono text-xs text-white relative min-h-[380px] flex flex-col justify-between">
                
                {/* IDE Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    <span className="text-white/60 text-[11px] ml-2">user — ✳ Claude Code — claude</span>
                  </div>
                  <span className="text-brand text-[10px] font-bold">MCP CONNECTED</span>
                </div>

                {/* Claude Logo ASCII Watermark */}
                <div className="absolute top-16 right-8 opacity-25 pointer-events-none font-mono text-3xl text-brand font-bold">
                  CLAUDE
                </div>

                {/* Floating Workflow Action Pill Badges Overlapping IDE */}
                <div className="space-y-3 relative z-10 my-4">
                  <div className="bg-zinc-900 border border-white/20 p-2.5 rounded shadow-xl flex items-center gap-3 transform -rotate-1 hover:rotate-0 transition-transform max-w-md">
                    <span className="bg-brand/20 text-brand p-1.5 rounded"><Megaphone size={14} /></span>
                    <span className="text-white/90 font-bold text-xs">Create &amp; Draft Meta &amp; Google Ads Campaigns</span>
                  </div>

                  <div className="bg-zinc-900 border border-white/20 p-2.5 rounded shadow-xl flex items-center gap-3 transform translate-x-6 rotate-1 hover:rotate-0 transition-transform max-w-md">
                    <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded"><Zap size={14} /></span>
                    <span className="text-white/90 font-bold text-xs">PostHog SDK Event Tracking &amp; Dual-Dispatch CAPI</span>
                  </div>

                  <div className="bg-zinc-900 border border-white/20 p-2.5 rounded shadow-xl flex items-center gap-3 transform -translate-x-3 -rotate-1 hover:rotate-0 transition-transform max-w-md">
                    <span className="bg-cyan-500/20 text-cyan-400 p-1.5 rounded"><BarChart3 size={14} /></span>
                    <span className="text-white/90 font-bold text-xs">Pull Ad Performance, CTR, CPC &amp; ROAS Metrics</span>
                  </div>

                  <div className="bg-zinc-900 border border-white/20 p-2.5 rounded shadow-xl flex items-center gap-3 transform translate-x-8 rotate-2 hover:rotate-0 transition-transform max-w-md">
                    <span className="bg-amber-500/20 text-amber-400 p-1.5 rounded"><Sparkles size={14} /></span>
                    <span className="text-white/90 font-bold text-xs">Link Stripe &amp; Dodo Payments for Closed-Loop Revenue Attribution</span>
                  </div>
                </div>

                {/* IDE Bottom Prompt Status */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                  <span>&gt; try "deploy marketing campaign"</span>
                  <span className="text-cyan-400 font-bold">/ide for Cursor</span>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM CONTAINER — DARK/BLACK BG ("READY-MADE MARKETING AGENTS") */}
        <div className="bg-[#09090b] text-white p-8 sm:p-12 border-2 border-white/20 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column Code & Platform Spec (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-white">
                    Rockyt
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-xs">
                    PLATFORM
                  </span>
                </div>

                <p className="font-mono text-xs sm:text-sm text-white/70 leading-relaxed mb-6">
                  Your agent has the intelligence. Now let it execute across 16 social, messaging, and ad networks in five lines of code.
                </p>

                {/* Code Block Snippet */}
                <div className="bg-black border border-white/20 p-4 rounded-sm font-mono text-[11px] text-white/80 space-y-1.5 mb-8">
                  <p className="text-white/40">// Initialize Rockyt Agent Tools</p>
                  <p><span className="text-brand">tools</span> = rockyt.<span className="text-cyan-400">get_mcp_tools</span>()</p>
                  <p><span className="text-brand">agent</span> = Agent(</p>
                  <p className="pl-4">name=<span className="text-amber-300">"MarketingAssistant"</span>,</p>
                  <p className="pl-4">tools=tools,</p>
                  <p>)</p>
                </div>
              </div>

              <div>
                <button 
                  onClick={onStartOnboarding}
                  className="bg-white text-black font-mono text-xs font-bold px-6 py-3.5 uppercase tracking-widest hover:bg-brand hover:text-white transition-colors inline-flex items-center gap-2 shadow-glow"
                >
                  LEARN MORE <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Column Grid of 6 Ready-Made Marketing Agents (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Agent 1 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">Social Dispatcher</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-white/60 mb-3 text-[10px] font-mono">
                      <span>X</span> · <span>IG</span> · <span>TikTok</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Dispatched 3,840 posts
                  </div>
                </div>

                {/* Agent 2 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">WhatsApp Lead Agent</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-cyan-400 mb-3 text-[10px] font-mono">
                      <span>WhatsApp</span> · <span>IG DM</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Qualified 1,290 leads
                  </div>
                </div>

                {/* Agent 3 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">Ad Optimizer</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-amber-400 mb-3 text-[10px] font-mono">
                      <span>Meta Ads</span> · <span>Google Ads</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Optimized 42 ad campaigns
                  </div>
                </div>

                {/* Agent 4 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">Social Analytics Agent</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-emerald-400 mb-3 text-[10px] font-mono">
                      <span>Analytics</span> · <span>Webhooks</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Generated monthly report
                  </div>
                </div>

                {/* Agent 5 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">Newsbot Thread Agent</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-blue-400 mb-3 text-[10px] font-mono">
                      <span>X Threads</span> · <span>Telegram</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Posted 180 threads
                  </div>
                </div>

                {/* Agent 6 */}
                <div className="bg-zinc-900/90 border border-white/15 p-4 rounded-sm flex flex-col justify-between min-h-[140px] hover:border-brand transition-colors group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-brand transition-colors">Community Sync Agent</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="flex gap-2 text-purple-400 mb-3 text-[10px] font-mono">
                      <span>Discord</span> · <span>Slack</span>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-2">
                    Synced 950 updates
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Services;