import React, { useState, useEffect } from 'react';
import { Bot, Terminal, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

const GlitchText: React.FC = () => {
  const [text, setText] = useState<'API' | 'MCP'>('API');
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      
      // Mid-glitch text swap
      setTimeout(() => {
        setText(prev => (prev === 'API' ? 'MCP' : 'API'));
      }, 150);

      // End glitch effect
      setTimeout(() => {
        setIsGlitching(false);
      }, 350);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span 
      className={`inline-block text-brand transition-all ${isGlitching ? 'glitch-active' : ''}`}
      data-text={text}
    >
      {text}
    </span>
  );
};

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'mcp'>('node');

  const agentInstructions = "Sign up and get an API key with rockyt.io/auth.md, then follow rockyt.io/agent-quickstart.md to integrate Rockyt into the codebase.";

  const copyAgentPrompt = () => {
    navigator.clipboard.writeText(agentInstructions);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const codeSnippets = {
    node: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

// 1. Create & Draft Ad Campaign (Meta Ads / Google Ads / TikTok Ads)
const { campaign } = await rockyt.ads.createCampaign({
  name: "Q3 High-ROAS Conversion Campaign",
  platform: "meta-ads",
  objective: "CONVERSIONS",
  dailyBudget: 150.00
});

// 2. Dual-dispatch Conversion API (CAPI) Event
await rockyt.conversions.track({
  eventName: "Purchase",
  eventData: { value: 149.00, currency: "USD", gclid: "Cj0KCQiA..." },
  posthogDistinctId: "user_8921a"
});

// 3. Closed-Loop Revenue Attribution
await rockyt.attribution.linkRevenue({
  orderId: "ord_99812",
  amount: 149.00,
  clickId: "gclid_Cj0KCQiA..."
});`,
    python: `from rockyt import Rockyt
import os

client = Rockyt(api_key=os.getenv("ROCKYT_API_KEY"))

# Create & Draft Ad Campaign across Meta & Google Ads
campaign = client.ads.create_campaign(
    name="High ROAS Retargeting",
    platform="google-ads",
    objective="SEARCH_LEADS",
    daily_budget=200.00
)

# Dispatch Conversion Event to CAPI
client.conversions.track(
    event_name="Lead",
    event_data={"lead_type": "enterprise_demo", "fbclid": "IwAR3..."}
)

print(f"Campaign Created: {campaign['id']}")`,
    mcp: `{
  "mcpServers": {
    "rockyt-ads": {
      "command": "npx",
      "args": ["-y", "@rockyt/mcp-ads"],
      "env": {
        "ROCKYT_API_KEY": "rockyt_live_99f381a94b8e21c"
      }
    }
  }
}`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="hero" className="relative min-h-[90vh] pt-32 pb-20 px-4 sm:px-6 flex flex-col justify-center items-center z-10">
      <div className="max-w-6xl mx-auto w-full text-center">
        
        {/* TOP BADGE */}
        <div className="inline-flex items-center gap-2 border border-white/20 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-sm font-mono text-xs text-white/90 mb-8 shadow-glow">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          <span className="font-bold text-brand uppercase tracking-wider">UNIFIED ADS API &amp; CAPI ENGINE</span>
          <span className="opacity-50">|</span>
          <span className="opacity-80">META · GOOGLE · TIKTOK · LINKEDIN ADS</span>
        </div>

        {/* MAIN HEADLINE WITH GLITCH */}
        <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-9xl uppercase tracking-tighter text-white leading-[0.9] mb-8">
          UNIFIED <GlitchText /><br />
          FOR ADS &amp; CAPI
        </h1>

        {/* SUBTITLE */}
        <p className="font-mono text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
          Draft ad campaigns, pull ad analytics, capture conversion events, and attribute revenue back to ad spend. Powered by PostHog SDK &amp; Zernio Conversion API.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto bg-brand text-white border-2 border-brand font-mono text-sm font-bold px-8 py-4 uppercase tracking-widest hover:bg-white hover:text-ink hover:border-white transition-all shadow-glow flex items-center justify-center gap-2"
          >
            <Terminal size={16} /> GET ROCKYT API KEY
          </button>
          
          <button 
            onClick={copyAgentPrompt}
            className={`w-full sm:w-auto font-mono text-sm font-bold px-8 py-4 uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
              copiedPrompt 
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-glow' 
                : 'bg-black/80 text-white border-white/30 hover:border-brand hover:text-brand'
            }`}
          >
            {copiedPrompt ? <Check size={16} className="text-white" /> : <Sparkles size={16} className="text-brand" />}
            {copiedPrompt ? 'COPIED AGENT PROMPT!' : '⚡ COPY AGENT PROMPT'}
          </button>
        </div>

        {/* HERO CODE TERMINAL SNIPPET */}
        <div className="max-w-3xl mx-auto bg-zinc-950/90 border-2 border-white/20 rounded-sm shadow-2xl overflow-hidden font-mono text-left text-xs">
          <div className="bg-zinc-900 border-b border-white/15 p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('node')} 
                className={`px-3 py-1 font-bold rounded-xs transition-colors ${activeTab === 'node' ? 'bg-brand text-white' : 'text-white/60 hover:text-white'}`}
              >
                Node.js SDK
              </button>
              <button 
                onClick={() => setActiveTab('python')} 
                className={`px-3 py-1 font-bold rounded-xs transition-colors ${activeTab === 'python' ? 'bg-brand text-white' : 'text-white/60 hover:text-white'}`}
              >
                Python SDK
              </button>
              <button 
                onClick={() => setActiveTab('mcp')} 
                className={`px-3 py-1 font-bold rounded-xs transition-colors ${activeTab === 'mcp' ? 'bg-brand text-white' : 'text-white/60 hover:text-white'}`}
              >
                Claude MCP Config
              </button>
            </div>

            <button 
              onClick={copyCode}
              className="text-white/60 hover:text-white flex items-center gap-1 text-[11px] font-bold"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>

          <div className="p-5 overflow-x-auto text-white/90 leading-relaxed bg-black/80">
            <pre><code>{codeSnippets[activeTab]}</code></pre>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;