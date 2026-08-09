import React, { useState, useEffect, useRef } from 'react';
import { Layers, Zap, Bot, ShieldCheck, Terminal, Cpu, ArrowRight, CheckCircle2, Code2, Sparkles } from 'lucide-react';

interface ValueCard {
  id: string;
  num: string;
  tabLabel: string;
  title: string;
  description: string;
  bullets: string[];
  mcpBadge: string;
  previewType: 'api' | 'tokens' | 'automation' | 'mcp';
}

const cardsData: ValueCard[] = [
  {
    id: 'unified-access',
    num: '01',
    tabLabel: 'UNIFIED ACCESS',
    title: '16 Platforms. One API.',
    description: 'Stop managing 15+ separate developer portals, app reviews, and token refreshing logic. Rockyt unifies all social media, messaging networks, and ad platforms under one API key.',
    bullets: [
      'Replaces 15+ fragmented developer portals & individual APIs',
      'Full coverage: X, Instagram, WhatsApp, TikTok, Discord, Meta & Google Ads',
      'Zero app approval delays with pre-approved partner pipelines'
    ],
    mcpBadge: 'SINGLE API KEY',
    previewType: 'api'
  },
  {
    id: 'token-context',
    num: '02',
    tabLabel: 'TOKEN & CONTEXT',
    title: 'Token-efficient context',
    description: 'Drastically reduce LLM context window bloat and prompt costs. One standardized JSON schema across all 16 channels keeps your agent\'s context clean and unified.',
    bullets: [
      'Unified schema reduces prompt token overhead by up to 70%',
      'Consistent brand voice & media rules across every network',
      'Eliminates context thrashing from competing platform specs'
    ],
    mcpBadge: '70% TOKEN SAVINGS',
    previewType: 'tokens'
  },
  {
    id: 'cross-automation',
    num: '03',
    tabLabel: 'ADVANCED AUTOMATION',
    title: 'Cross-tool workflows',
    description: 'Connect Rockyt directly to your webhooks, databases, n8n, LangChain, or custom agent tools to build autonomous multi-step execution loops.',
    bullets: [
      'Trigger Instagram DMs automatically from webhooks or checkout',
      'Auto-pause Meta Ads when sentiment drops on X & Discord',
      'Seamless integration with n8n, Make, LangChain & CrewAI'
    ],
    mcpBadge: 'MULTI-STEP AGENTS',
    previewType: 'automation'
  },
  {
    id: 'native-mcp',
    num: '04',
    tabLabel: 'NATIVE MCP & TOOLS',
    title: 'Native MCP & custom tools',
    description: 'Connect out-of-the-box Model Context Protocol (MCP) server to Claude Desktop, Claude Code, and Cursor, or build project-specific agentic tools effortlessly.',
    bullets: [
      'Native MCP server for Claude Desktop, Claude Code, and Cursor',
      'Build custom project-specific tools on top of the Rockyt SDK',
      'Secure, isolated agent tool execution with full audit logs'
    ],
    mcpBadge: 'MCP NATIVE PROTOCOL',
    previewType: 'mcp'
  }
];

const WhyRockyt: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ticking = false;

    const updateActiveTab = () => {
      let currentActive = 0;

      for (let i = 0; i < cardRefs.current.length; i++) {
        const ref = cardRefs.current[i];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const stickyThreshold = 110 + i * 15 + 40;

          if (rect.top <= stickyThreshold) {
            currentActive = i;
          }
        }
      }

      setActiveTab(currentActive);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveTab);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveTab();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    setActiveTab(index);
    const targetRef = cardRefs.current[index];
    if (targetRef) {
      const targetStickyTop = 110 + index * 15;
      const elementTop = targetRef.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementTop - targetStickyTop, behavior: 'smooth' });
    }
  };

  return (
    <section id="why-rockyt" className="py-28 px-4 sm:px-6 relative z-10 bg-black/60 border-t border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-16">
          <div className="inline-block border border-white/30 bg-zinc-900/80 px-3 py-1 font-mono text-xs text-white uppercase tracking-widest font-semibold mb-5 shadow-sm">
            - WHY ROCKYT
          </div>

          <h2 className="font-display font-semibold text-5xl sm:text-7xl lg:text-8xl text-white tracking-tighter leading-[0.95] uppercase">
            Your agents are smart.<br />
            <span className="text-white/60">Their tools should be too.</span>
          </h2>
        </div>

        {/* 2-Column Layout: Left Sticky Navigation Tabs + Right Folding Stacking Cards */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative">
          
          {/* Left Sticky Menu Bar */}
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 z-30 bg-black/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-2 lg:p-0 border border-white/10 lg:border-none rounded-sm">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {cardsData.map((card, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={card.id}
                    onClick={() => scrollToCard(idx)}
                    className={`font-mono text-xs tracking-wider uppercase font-bold text-left px-4 py-3.5 border transition-all duration-200 flex items-center gap-3 shrink-0 lg:shrink ${
                      isActive 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-zinc-950/80 border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span className={`px-2 py-0.5 text-[10px] font-bold border ${isActive ? 'bg-blue-500 text-black border-blue-400' : 'bg-white/10 text-white/60 border-white/20'}`}>
                      {card.num}
                    </span>
                    <span className="truncate">{card.tabLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Stacking Cards Area */}
          <div className="flex-1 w-full space-y-12 lg:space-y-16">
            {cardsData.map((card, idx) => (
              <div
                key={card.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                className="sticky top-28 bg-zinc-950 border-2 border-white/20 rounded-sm shadow-2xl overflow-hidden group hover:border-brand/70 transition-all duration-300"
                style={{
                  top: `${110 + idx * 15}px`,
                  zIndex: idx + 10
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                  
                  {/* Left Side Visual Preview (7 Cols) */}
                  <div className="lg:col-span-7 bg-gradient-to-tr from-cyan-950/60 via-blue-950/40 to-pink-950/30 p-6 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Visual Preview 1: Single API Dispatch */}
                    {card.previewType === 'api' && (
                      <div className="w-full max-w-md bg-zinc-900/90 border border-white/20 rounded-md p-5 shadow-2xl font-mono text-xs relative z-10">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="w-3 h-3 rounded-full bg-green-500" />
                          </div>
                          <span className="text-[10px] text-white/50">rockyt_dispatch.ts</span>
                        </div>
                        <div className="space-y-2 text-white/90">
                          <p className="text-cyan-400 font-bold">// 1 Call for 16 Networks</p>
                          <p><span className="text-pink-400">const</span> res = <span className="text-pink-400">await</span> rockyt.<span className="text-blue-400">post</span>({`{`}</p>
                          <p className="pl-4">content: <span className="text-amber-300">"Autonomous AI Launch!"</span>,</p>
                          <p className="pl-4">channels: [<span className="text-emerald-400">"x"</span>, <span className="text-emerald-400">"instagram"</span>, <span className="text-emerald-400">"whatsapp"</span>, <span className="text-emerald-400">"meta_ads"</span>]</p>
                          <p>{`}`});</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-400">
                          <span>✓ 16/16 PLATFORMS CONNECTED</span>
                          <span className="text-white/60">200 OK (38ms)</span>
                        </div>
                      </div>
                    )}

                    {/* Visual Preview 2: Token Savings */}
                    {card.previewType === 'tokens' && (
                      <div className="w-full max-w-md bg-zinc-900/90 border border-white/20 rounded-md p-5 shadow-2xl font-mono text-xs relative z-10">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                          <span className="text-xs font-bold text-white uppercase">LLM CONTEXT SAVINGS</span>
                          <span className="text-xs text-brand font-bold bg-brand/20 px-2 py-0.5 border border-brand/40">-70% TOKENS</span>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-[11px] text-white/60 mb-1">
                              <span>WITHOUT ROCKYT (15+ API SPECS)</span>
                              <span className="text-red-400 font-bold">14,200 PROMPT TOKENS</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                              <div className="bg-red-500 h-full w-full" />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-white/60 mb-1">
                              <span>WITH ROCKYT UNIFIED SCHEMA</span>
                              <span className="text-emerald-400 font-bold">4,100 PROMPT TOKENS</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full w-[30%]" />
                            </div>
                          </div>
                        </div>
                        <p className="mt-4 text-[11px] text-white/70 italic border-t border-white/10 pt-3">
                          Single brand context preserved seamlessly across all LLM inference loops.
                        </p>
                      </div>
                    )}

                    {/* Visual Preview 3: Cross Automation Graph */}
                    {card.previewType === 'automation' && (
                      <div className="w-full max-w-md bg-zinc-900/90 border border-white/20 rounded-md p-5 shadow-2xl font-mono text-xs relative z-10 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="text-xs font-bold text-cyan-400">// CROSS-TOOL WORKFLOW</span>
                          <span className="text-[10px] text-emerald-400">ACTIVE LOOP</span>
                        </div>
                        
                        <div className="p-2.5 bg-black/60 border border-white/10 rounded flex items-center justify-between">
                          <span className="text-white/80">1. IG Reel Comment Event</span>
                          <span className="text-xs text-brand font-bold">TRIGGER</span>
                        </div>
                        <div className="text-center text-white/40 text-xs">&darr;</div>
                        <div className="p-2.5 bg-black/60 border border-white/10 rounded flex items-center justify-between">
                          <span className="text-white/80">2. Auto-Send WhatsApp DM</span>
                          <span className="text-xs text-blue-400 font-bold">ROCKYT API</span>
                        </div>
                        <div className="text-center text-white/40 text-xs">&darr;</div>
                        <div className="p-2.5 bg-black/60 border border-white/10 rounded flex items-center justify-between">
                          <span className="text-white/80">3. Update Campaign Budget</span>
                          <span className="text-xs text-amber-400 font-bold">META ADS</span>
                        </div>
                      </div>
                    )}

                    {/* Visual Preview 4: MCP Protocol Code */}
                    {card.previewType === 'mcp' && (
                      <div className="w-full max-w-md bg-zinc-900/90 border border-white/20 rounded-md p-5 shadow-2xl font-mono text-xs relative z-10">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-brand" />
                            <span className="text-xs font-bold text-white">CLAUDE MCP SERVER</span>
                          </div>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 border border-blue-500/40">CONNECTED</span>
                        </div>
                        <div className="space-y-2 text-white/80">
                          <p className="text-white/50">&gt; claude --mcp rockyt</p>
                          <p className="text-emerald-400">✓ Registered 12 native agent tools:</p>
                          <ul className="pl-4 text-[11px] space-y-1 text-white/70">
                            <li>• rockyt_post_content()</li>
                            <li>• rockyt_send_whatsapp()</li>
                            <li>• rockyt_get_analytics()</li>
                            <li>• rockyt_manage_ads()</li>
                          </ul>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Side Card Content (5 Cols) */}
                  <div className="lg:col-span-5 p-8 flex flex-col justify-between">
                    <div>
                      {/* Top Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="border border-white/20 px-3 py-1 font-mono text-xs text-white/70 inline-block font-bold">
                          {card.num}
                        </div>
                        <span className="font-mono text-[10px] bg-brand/20 text-brand border border-brand/40 px-2.5 py-1 font-bold uppercase tracking-wider">
                          {card.mcpBadge}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h3 className="font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mb-4 leading-none">
                        {card.title}
                      </h3>

                      {/* Card Description */}
                      <p className="font-mono text-xs text-white/70 leading-relaxed mb-6">
                        {card.description}
                      </p>

                      {/* Bullet points with vertical bar dividers */}
                      <div className="space-y-3 font-mono text-xs border-t border-white/10 pt-5">
                        {card.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-3 text-white/90">
                            <span className="text-blue-400 font-bold font-serif text-sm">|</span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Link */}
                    <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                      <span className="text-white/40">ROCKYT ARCHITECTURE</span>
                      <a href="#mcp-skills" className="text-brand font-bold uppercase flex items-center gap-1.5 hover:underline">
                        EXPLORE SKILLS <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhyRockyt;
