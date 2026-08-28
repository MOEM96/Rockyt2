import React from 'react';
import { MessageSquare, Phone, Inbox, Bot, Users, Megaphone, Terminal, Zap, Check, ArrowRight } from 'lucide-react';

interface ShowcaseProps {
  onStartOnboarding?: () => void;
}

const Showcase: React.FC<ShowcaseProps> = ({ onStartOnboarding }) => {
  const featureList = [
    {
      icon: <MessageSquare className="w-5 h-5 text-brand" />,
      title: "Messaging",
      description: "Send to one person, a group chat, or a broadcast to thousands. Schedule it, track delivery per recipient, cancel before it sends."
    },
    {
      icon: <Phone className="w-5 h-5 text-emerald-400" />,
      title: "Calling",
      description: "Take and place calls on WhatsApp. Route to a phone line, SIP, or a voice agent (Vapi, Retell, ElevenLabs)."
    },
    {
      icon: <Inbox className="w-5 h-5 text-sky-400" />,
      title: "Unified inbox",
      description: "Every reply in one place. WhatsApp, Telegram, Instagram, Facebook, X, Reddit, and Bluesky."
    },
    {
      icon: <Bot className="w-5 h-5 text-amber-400" />,
      title: "WhatsApp chatbots",
      description: "Build AI agents and automation that understand context. Connect your AI, hand off to a human anytime."
    },
    {
      icon: <Users className="w-5 h-5 text-purple-400" />,
      title: "Contacts",
      description: "Send a broadcast that knows who it's going to. Tags, opt-in status, and custom fields on every contact."
    },
    {
      icon: <Megaphone className="w-5 h-5 text-rose-400" />,
      title: "Click-to-WhatsApp Ads",
      description: "Turn ad clicks into WhatsApp chats. Send conversions back to Meta for attribution."
    }
  ];

  const countries = [
    { name: "United States", price: "$3/mo" },
    { name: "United Kingdom", price: "$3/mo" },
    { name: "Germany", price: "$3/mo" },
    { name: "France", price: "$3/mo" },
    { name: "Spain", price: "$3/mo" },
    { name: "Canada", price: "$3/mo" },
    { name: "Brazil", price: "$4/mo" },
    { name: "Italy", price: "$3/mo" },
    { name: "Sweden", price: "$11/mo" }
  ];

  return (
    <div className="space-y-24 py-12 relative z-10">
      
      {/* ─── SECTION 1: NUMBER PROVISIONING (#numbers) ─── */}
      <section id="numbers" className="scroll-mt-32">
        <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 flex flex-col gap-4">
                <span className="font-mono text-xs font-bold text-brand uppercase tracking-wider">Number provisioning</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Buy a WhatsApp number in 50+ countries
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Pick a country. Rockyt provisions the number, verifies it, and connects it for messaging and calling.
                </p>
                <div className="pt-2">
                  <button
                    onClick={onStartOnboarding}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm px-6 py-3.5 transition-all shadow-lg shadow-brand/20"
                  >
                    Start for free <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-3 gap-3 bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800">
                {countries.map((c, idx) => (
                  <div key={idx} className="flex flex-col p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                    <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-brand font-bold mt-1">{c.price}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: FULL API SURFACE (#features) ─── */}
      <section id="features" className="scroll-mt-32">
        <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
          
          <div className="flex flex-col gap-3 px-6 py-10 items-center text-center">
            <span className="font-mono text-sm font-bold text-brand uppercase tracking-wider">Full API Surface</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">
              <span className="text-white">Everything you need to ship</span>
              <span className="text-zinc-500"> WhatsApp features</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((f, idx) => (
              <div 
                key={idx}
                className="flex flex-col p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl hover:border-zinc-700 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800/90 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── SECTION 3: AI AGENTS & MCP (#ai-agents) ─── */}
      <section id="ai-agents" className="scroll-mt-32 bg-zinc-950/80 border-y border-zinc-800 py-16">
        <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
          
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center max-w-2xl mx-auto">
            <span className="font-mono text-sm font-bold text-brand uppercase tracking-wider">AI Agents</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">
              <span className="text-white">Let an agent run WhatsApp </span>
              <span className="text-zinc-500">end to end</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
              The entire flow runs through Rockyt's MCP server, so an AI agent can buy a number, complete verification, and start messaging or calling without a human touching the dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* SDK CARD */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <p className="font-mono text-xs font-bold text-brand uppercase tracking-wider mb-2">REST API + 8 SDKs</p>
                <div className="flex flex-wrap gap-1.5 my-4">
                  {['Node', 'Python', 'Go', 'Ruby', 'Java', 'PHP', '.NET', 'Rust'].map((sdk, i) => (
                    <span key={i} className="rounded-full bg-zinc-800 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {sdk}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium">One bearer token, one JSON shape.</p>
            </div>

            {/* CLI CARD */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <p className="font-mono text-xs font-bold text-brand uppercase tracking-wider mb-2">CLI</p>
                <div className="bg-black/80 rounded-xl p-3 font-mono text-xs text-emerald-400 my-4 space-y-1">
                  <p>$ rockyt send --phone +1415...</p>
                  <p className="text-zinc-400">&#123; "status": "sent", "id": "msg_8f2a" &#125;</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Structured JSON output built for agents to parse and recover from errors.</p>
            </div>

            {/* MCP SERVER CARD */}
            <div className="rounded-2xl border border-brand/40 bg-zinc-900/80 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-brand" />
                  <p className="font-mono text-xs font-bold text-brand uppercase tracking-wider">MCP Server</p>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">For Claude, Cursor, and any MCP client.</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  LLM-optimized docs mean any agent can wire up the full WhatsApp surface itself.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={onStartOnboarding}
                  className="w-full rounded-xl bg-brand text-white font-bold text-xs py-2.5 hover:bg-brand-hover transition-colors shadow-md shadow-brand/20"
                >
                  Start for free
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

export default Showcase;