import React, { useState } from 'react';
import { BasePageProps } from '../types/index';
import { motion } from 'motion/react';

interface FAQItem {
  question: string;
  answer: string;
}

const API_FAQS: FAQItem[] = [
  {
    question: "How fast can I integrate Rockyt compared to building custom integrations?",
    answer: "Custom integrations across 15+ social media platforms typically take 8 to 12 months of solid engineering time, Facebook/Meta business audits, and platform approvals. With Rockyt, you write one unified REST integration in under an hour."
  },
  {
    question: "Do I need to create developer apps for each platform?",
    answer: "No. Rockyt completely bypasses this headache. We handle all developer apps, sandboxes, Meta Business manager approvals, and quota limits. You use our client onboarding flows out of the box."
  },
  {
    question: "What happens when a post fails?",
    answer: "We automatically manage rate limits with smart queuing and retries. If a post permanently fails, we immediately dispatch a webhook detailing the precise failure reason. No silent drops, no infinite polling."
  },
  {
    question: "Is the Rockyt API white-label friendly?",
    answer: "Yes, 100%. Our hosted OAuth sequences and backend responses make zero reference to Rockyt. Your customers only see your branding throughout the entire workflow."
  },
  {
    question: "Will posting through Rockyt reduce my reach or risk getting banned?",
    answer: "No. Rockyt only routes requests through official, verified partner APIs on Meta, TikTok, LinkedIn, and others. Your posts are treated exactly as if they were drafted natively on those platforms."
  },
  {
    question: "Can AI agents use Rockyt directly?",
    answer: "Yes, absolutely! Rockyt ships with a native Model Context Protocol (MCP) server exposing over 280 tools. You can plug Claude, Cursor, or your own LLM agent directly into it and let it post, analyze campaigns, and trigger workflows automatically."
  },
  {
    question: "Which channels does Rockyt support?",
    answer: "We support 15 channels: X/Twitter, Instagram, TikTok, LinkedIn, Facebook Pages, YouTube, Threads, Reddit, Pinterest, Bluesky, Google Business Profile, Telegram, Snapchat, WhatsApp, and Discord. Paid-ad boosting is supported for 6 of them."
  }
];

export const ApisPage: React.FC<BasePageProps> = ({ onGetStarted }) => {
  const [activePlatformFilter, setActivePlatformFilter] = useState<'all' | 'social' | 'messaging' | 'ads'>('all');
  
  // WhatsApp simulation state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'user', text: "Is my order shipped?" },
    { sender: 'bot', text: "Out for delivery, ETA 14:20." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // FAQ state
  const [openFaqIndex, setOpenIndex] = useState<number | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "Out for delivery, ETA 14:20.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('api') || lower.includes('key')) {
        reply = "Your API key is active! 🚀 Reconnecting now via OAuth is instant.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        reply = "Hello! Rockyt API automated assistant active. How can I help you route workflows?";
      } else if (lower.includes('work') || lower.includes('workflow')) {
        reply = "You can easily build custom trigger triggers, Webhook endpoints, or feed actions.";
      } else {
        reply = `Automated API Reply received: We successfully registered your input "${userText}"! ⚡`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1200);
  };

  const platforms = [
    { name: 'Twitter/X', icon: 'simple-icons:x', category: 'social' },
    { name: 'Instagram', icon: 'simple-icons:instagram', category: 'social' },
    { name: 'TikTok', icon: 'simple-icons:tiktok', category: 'social' },
    { name: 'LinkedIn', icon: 'simple-icons:linkedin', category: 'social' },
    { name: 'Facebook', icon: 'simple-icons:facebook', category: 'social' },
    { name: 'YouTube', icon: 'simple-icons:youtube', category: 'social' },
    { name: 'Threads', icon: 'simple-icons:threads', category: 'social' },
    { name: 'Reddit', icon: 'simple-icons:reddit', category: 'social' },
    { name: 'Pinterest', icon: 'logos:pinterest', category: 'social' },
    { name: 'Bluesky', icon: 'simple-icons:bluesky', category: 'social' },
    { name: 'Google Business', icon: 'simple-icons:google', category: 'social' },
    { name: 'WhatsApp', icon: 'simple-icons:whatsapp', category: 'messaging' },
    { name: 'Telegram', icon: 'simple-icons:telegram', category: 'messaging' },
    { name: 'Discord', icon: 'simple-icons:discord', category: 'messaging' },
    { name: 'Snapchat', icon: 'simple-icons:snapchat', category: 'messaging' },
    { name: 'Meta Ads', icon: 'simple-icons:facebook', category: 'ads' },
    { name: 'Google Ads', icon: 'simple-icons:googleads', category: 'ads' },
    { name: 'TikTok Ads', icon: 'simple-icons:tiktok', category: 'ads' },
    { name: 'LinkedIn Ads', icon: 'simple-icons:linkedin', category: 'ads' },
    { name: 'Pinterest Ads', icon: 'logos:pinterest', category: 'ads' },
    { name: 'X Ads', icon: 'simple-icons:x', category: 'ads' },
  ];

  const filteredPlatforms = activePlatformFilter === 'all' 
    ? platforms 
    : platforms.filter(p => p.category === activePlatformFilter);

  return (
    <div className="w-full bg-[#161616] text-white py-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        
        {/* HERO SECTION */}
        <div className="relative text-center pt-8 pb-16 flex flex-col items-center">
          {/* Ambient Glows */}
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-brand-blue/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

          {/* Badge */}
          <div className="mb-6 flex justify-center items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-[#FFE241]/20 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#FFE241] animate-pulse"></div>
              <span className="font-mono text-xs tracking-wider uppercase text-gray-300">
                WHAT'S NEW • ROCKYT UNIFIED SOCIAL API IS NOW LIVE
              </span>
            </div>
          </div>

          {/* 3D Animated Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ 
              scale: 1.02, 
              rotateX: 4, 
              rotateY: -4,
              textShadow: "0px 10px 20px rgba(255, 226, 65, 0.3)" 
            }}
            style={{ 
              transformStyle: "preserve-3d", 
              perspective: 1000 
            }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white max-w-4xl mb-6 leading-none cursor-pointer transition-all select-none"
          >
            The social media & messaging API for <span className="text-[#FFE241] inline-block hover:scale-105 transition-transform duration-300" style={{ transform: "translateZ(30px)" }}>developers</span> & <span className="text-[#FFE241] inline-block hover:scale-105 transition-transform duration-300" style={{ transform: "translateZ(30px)" }}>AI agents</span>.
          </motion.h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-8 leading-relaxed">
            Ship custom integrations, workflows, and dashboards in minutes instead of months. One API to post, message, boost, and analyze across 15 channels.
          </p>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGetStarted()}
            className="px-8 py-4 bg-[#FFE241] text-black font-extrabold text-sm md:text-base rounded-full uppercase tracking-wider hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,226,65,0.4)] transition-all duration-300 flex items-center gap-2 mb-8 shadow-lg cursor-pointer"
          >
            <span>Get API Keys & Start Building</span>
            <iconify-icon icon="solar:arrow-right-bold" class="text-lg"></iconify-icon>
          </motion.button>
        </div>

        {/* TRUSTED BY ROW & META/TIKTOK PARTNERS */}
        <div className="mb-24 text-center">
          <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-6">
            TRUSTED BY BUILDERS AND ENTERPRISES GLOBALLY
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale contrast-200">
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">ClickUp</span>
            <span className="font-sans text-xl font-bold tracking-tight text-white flex items-center gap-1">
              <iconify-icon icon="solar:stars-bold" class="text-sm"></iconify-icon> HeyMark
            </span>
            <span className="font-sans text-xl font-black text-white">RE/MAX</span>
            <span className="font-sans text-xl font-bold italic tracking-wide text-white">Vibiz</span>
            <span className="font-serif text-lg tracking-tight font-medium text-white">Warner Music Group</span>
            <span className="font-mono text-lg font-bold tracking-wider text-white">HOLO</span>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 pt-6 border-t border-white/5 opacity-60">
            <div className="flex items-center gap-2 text-xs font-mono">
              <iconify-icon icon="logos:meta-icon" class="text-lg"></iconify-icon>
              <span>Meta Business Partner</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <iconify-icon icon="logos:tiktok-icon" class="text-sm"></iconify-icon>
              <span>TikTok Marketing Partner</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <iconify-icon icon="logos:linkedin-icon" class="text-base"></iconify-icon>
              <span>LinkedIn Marketing Partner</span>
            </div>
          </div>
        </div>

        {/* LIVE VOLUMES / SPARKLINE STATS */}
        <div className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#121212] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-blue/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <iconify-icon icon="solar:upload-bold" width="24"></iconify-icon>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-2xl font-black font-mono">412,901</span>
                </div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-0.5">posts published this week</p>
              </div>
            </div>
            <div className="w-32 h-10 flex items-center">
              {/* Mini Sparkline */}
              <svg viewBox="0 0 100 30" className="w-full h-full text-green-400 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 5,25 L 20,20 L 35,22 L 50,15 L 65,18 L 80,5 L 95,8" />
              </svg>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#121212] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-purple-400/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <iconify-icon icon="solar:users-group-rounded-bold" width="24"></iconify-icon>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                  <span className="text-2xl font-black font-mono">14,271</span>
                </div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-0.5">profiles connected this week</p>
              </div>
            </div>
            <div className="w-32 h-10 flex items-center">
              {/* Mini Sparkline */}
              <svg viewBox="0 0 100 30" className="w-full h-full text-purple-400 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 5,20 L 20,24 L 35,12 L 50,18 L 65,10 L 80,14 L 95,4" />
              </svg>
            </div>
          </div>
        </div>

        {/* PLATFORMS GRID */}
        <div className="mb-24">
          <div className="text-center mb-10 flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-[#FFE241]/10 border border-[#FFE241]/20 text-[#FFE241] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              Supported Platforms
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">One Integration. 15+ Platforms.</h2>
            <p className="text-gray-400 max-w-2xl text-base">
              Say goodbye to maintaining Facebook Graph API, Twitter v2, TikTok API, and custom WhatsApp setups. Reconnect once, publish everywhere.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center mb-8 gap-2 bg-[#1A1A1A] p-1.5 rounded-full border border-white/10 max-w-md mx-auto">
            {(['all', 'social', 'messaging', 'ads'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActivePlatformFilter(filter)}
                className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition-all ${
                  activePlatformFilter === filter 
                    ? 'bg-[#FFE241] text-[#161616] shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Grid list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredPlatforms.map((platform, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl bg-[#1a1a1a]/60 border border-white/5 hover:border-[#FFE241]/20 hover:bg-[#1a1a1a] transition-all group flex flex-col items-center justify-center gap-3 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center group-hover:scale-110 group-hover:text-[#FFE241] transition-all duration-300">
                  <iconify-icon icon={platform.icon} width="24" class="text-gray-400 group-hover:text-[#FFE241] transition-colors"></iconify-icon>
                </div>
                <span className="text-xs font-semibold text-gray-300 font-mono group-hover:text-white transition-colors">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CORE CAPABILITIES & ENDPOINTS GRID */}
        <div className="mb-24">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-[#FFE241]/10 border border-[#FFE241]/20 text-[#FFE241] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              What you can do
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Raw Power in Simple Endpoints</h2>
            <p className="text-gray-400 max-w-2xl text-base">
              A standard JSON shape regardless of platform. We normalize content formats, crop ratios, video rules, and caption tags behind the scenes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">GET</span>
                  <span className="text-sm font-mono text-gray-300">/connect/&#123;platform&#125;</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Hosted Platform Authentication</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Deploy a white-labeled onboarding screen. Your client authenticates programmatically without ever seeing Rockyt's logo or system metrics.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FFE241] flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-mono font-bold">POST</span>
                  <span className="text-sm font-mono text-gray-300">/posts</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Unified Cross-Posting</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Send one JSON payload. Include text, photos, videos, or full image carousels, and publish to all 15 social networks instantly.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FFE241] flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">GET</span>
                  <span className="text-sm font-mono text-gray-300">/analytics</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Aggregated Performance Stats</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Query engagement, reach, impressions, link clicks, and video views formatted in a single, unified analytical payload across platforms.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FFE241] flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-mono font-bold">POST</span>
                  <span className="text-sm font-mono text-gray-300">/ads/boost</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Programmatic Ad Boosting</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Instantly convert high-performing organic updates into paid promotional assets on Meta Ads, Google Ads, and TikTok with one REST call.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FFE241] flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-mono font-bold">POST</span>
                  <span className="text-sm font-mono text-gray-300">/webhooks/settings</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Real-Time Webhook Signals</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Get notified instantly when posts are published, scheduled, or fail. Complete with cryptographic signing keys and exponential backoff retry.
                </p>
              </div>
              <span className="text-xs font-mono text-brand-yellow flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFE241]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">GET</span>
                  <span className="text-sm font-mono text-gray-300">/inbox/conversations</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Unified Messaging Inbox</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Fetch DMs, comments, and reviews from WhatsApp, Instagram, Telegram, and 4 other channels in one unified thread interface.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FFE241] flex items-center gap-1 hover:underline cursor-pointer">
                <span>View specification</span>
                <iconify-icon icon="solar:arrow-right-linear" class="mt-[1px]"></iconify-icon>
              </span>
            </div>

          </div>
        </div>

        {/* MESSAGING & WHATSAPP DEMO WRAPPER */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#FFE241]/10 border border-[#FFE241]/20 text-[#FFE241] text-xs font-mono font-bold tracking-widest uppercase mb-4 inline-block">
              Conversational Engine
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
              Give your codebase or AI Agent its own phone number.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Establish conversational loops in 54 countries instantly. We manage the heavy-lifting KYC paperwork, local carrier compliance, and Meta verification requirements.
            </p>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Route direct messages and reviews through webhooks straight to OpenAI, Claude, or custom code and publish conversational replies automatically.
            </p>

            <div className="p-5 bg-[#1a1a1a] rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 text-xs font-mono font-bold">POST</span>
                <span className="text-xs font-mono text-gray-400">/whatsapp/phone-numbers/purchase</span>
              </div>
              <p className="text-xs text-gray-500 font-mono">Verify and launch a production-grade number in minutes.</p>
            </div>
          </div>

          {/* SIMULATED PHONE */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-[32px] border-8 border-[#2E2E2E] bg-[#121212] overflow-hidden shadow-2xl flex flex-col min-h-[460px] relative">
              
              {/* WhatsApp Header */}
              <div className="bg-[#1f2c24] px-4 py-3 flex items-center gap-3 border-b border-[#2e3b33]">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-base">
                  <iconify-icon icon="simple-icons:whatsapp"></iconify-icon>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-white font-mono">+1 (415) 555-0142</div>
                  <div className="flex items-center gap-1 text-[11px] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span>active bot</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-grow p-4 space-y-3 bg-[#0d140f] overflow-y-auto flex flex-col justify-end min-h-[300px]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-3 max-w-[80%] text-sm rounded-2xl leading-normal font-mono ${msg.sender === 'user' ? 'bg-[#1b2520] text-gray-200 rounded-tl-none border border-white/5' : 'bg-green-600 text-black font-semibold rounded-tr-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-end">
                    <div className="p-3 bg-green-600 rounded-2xl rounded-tr-none flex items-center gap-1 py-4 px-5">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="bg-[#1f2c24] p-3 flex gap-2 border-t border-[#2e3b33] items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the simulated bot..."
                  className="flex-grow bg-black/40 text-sm py-2 px-4 rounded-full border border-white/10 text-white focus:outline-none focus:border-brand-yellow font-mono placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="w-9 h-9 rounded-full bg-[#FFE241] hover:bg-[#ffeb7a] flex items-center justify-center text-[#161616] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <iconify-icon icon="solar:send-square-bold" class="text-lg"></iconify-icon>
                </button>
              </form>

            </div>
          </div>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="mb-24">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-[#FFE241]/10 border border-[#FFE241]/20 text-[#FFE241] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Go Live in Under 5 Minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 relative">
              <div className="w-8 h-8 rounded-full bg-[#FFE241] text-[#161616] font-black flex items-center justify-center font-mono mb-4 text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Get your API key</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sign up with Google or Email. Create your access tokens instantly. No enterprise approval delays.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 relative">
              <div className="w-8 h-8 rounded-full bg-[#FFE241] text-[#161616] font-black flex items-center justify-center font-mono mb-4 text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connect Channels</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Send users through our pre-verified hosted OAuth onboarding to authorize page writes, numbers, or accounts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 relative">
              <div className="w-8 h-8 rounded-full bg-[#FFE241] text-[#161616] font-black flex items-center justify-center font-mono mb-4 text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Launch</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                That's it. Your code (or custom AI agent via MCP server tools) is empowered to publish, read threads, and run ads!
              </p>
            </div>
          </div>
        </div>

        {/* ACCORDION FAQ SECTION */}
        <div className="mb-24">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-[#FFE241]/10 border border-[#FFE241]/20 text-[#FFE241] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-lg">Everything you need to know about our APIs.</p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {API_FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-white/10 rounded-2xl bg-[#1A1A1A] overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <button
                  onClick={() => setOpenIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:bg-white/5"
                >
                  <span className="font-bold text-white text-sm md:text-base pr-4 leading-snug">
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 text-gray-400 transition-transform duration-300 flex items-center justify-center ${openFaqIndex === idx ? 'rotate-180 text-brand-yellow' : 'rotate-0'}`}>
                    <iconify-icon icon="solar:alt-arrow-down-bold" width="20"></iconify-icon>
                  </div>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${openFaqIndex === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="p-5 pt-0 text-sm text-gray-400 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CALL-TO-ACTION */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 md:p-12 text-center bg-gradient-to-b from-[#1a1a1a] to-[#121212] flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-blue/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 z-10 leading-tight">
            Stop maintaining 21 separate APIs.
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mb-8 z-10">
            Unify social media, messaging, and ad boosting today. Give your AI Agent access and let it do the work.
          </p>

          <button
            onClick={() => onGetStarted()}
            className="px-10 py-4 rounded-full bg-[#FFE241] text-[#161616] font-black uppercase tracking-wider text-sm hover:bg-[#ffeb7a] transition-all shadow-[0_6px_0_0_#b39c1b] active:translate-y-1 active:shadow-none z-10"
          >
            Start For Free Now
          </button>

          <div className="mt-12 flex items-center gap-6 z-10 opacity-60">
            <div className="flex items-center gap-2 text-xs font-mono">
              <iconify-icon icon="solar:shield-check-bold" class="text-green-400 text-lg"></iconify-icon>
              <span>SOC2 Certified</span>
            </div>
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <iconify-icon icon="solar:lock-check-bold" class="text-green-400 text-lg"></iconify-icon>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApisPage;
