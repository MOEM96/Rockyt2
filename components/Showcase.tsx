import React, { useState } from 'react';
import { Terminal, Check, Copy, ArrowRight, Code } from 'lucide-react';

interface ShowcaseProps {
  onStartOnboarding?: () => void;
}

const Showcase: React.FC<ShowcaseProps> = ({ onStartOnboarding }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const endpointCapabilities = [
    {
      method: "GET",
      methodColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      path: "/connect/{platform}",
      description: "One OAuth flow for every platform. No dev apps needed."
    },
    {
      method: "POST",
      methodColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      path: "/posts",
      description: "One call, 16 platforms. Text, image, video, or carousel."
    },
    {
      method: "GET",
      methodColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      path: "/analytics",
      description: "Likes, reach, impressions, clicks, views. Unified."
    },
    {
      method: "POST",
      methodColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      path: "/ads/boost",
      description: "Boost any post to a paid ad on 7 ad networks."
    },
    {
      method: "POST",
      methodColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      path: "/webhooks/settings",
      description: "Posts published or failed? Get pinged. No polling."
    },
    {
      method: "GET",
      methodColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      path: "/inbox/conversations",
      description: "DMs, comments, reviews. One inbox. Reply via API."
    }
  ];

  const apiExamples = [
    {
      id: 1,
      badge: "POSTS API",
      title: "MULTI-CHANNEL DISPATCH",
      endpoint: "POST /v1/posts",
      description: "Publishes text, image, and video content across X, Instagram Reels, TikTok, and LinkedIn in a single atomic REST request.",
      code: `curl -X POST https://api.rockyt.io/v1/posts \\
  -H "Authorization: Bearer rockyt_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Automated post from autonomous AI agent!",
    "mediaItems": [{"type": "video", "url": "https://cdn.rockyt.io/vid.mp4"}],
    "platforms": ["x", "instagram", "tiktok", "linkedin"]
  }'`,
      response: `{\n  "status": "success",\n  "postId": "post_99281a",\n  "publishedTo": ["x", "instagram", "tiktok", "linkedin"],\n  "latencyMs": 142\n}`
    },
    {
      id: 2,
      badge: "MESSAGING API",
      title: "WHATSAPP & TELEGRAM DM",
      endpoint: "POST /v1/whatsapp/messages",
      description: "Equip your AI Agents with dedicated virtual WhatsApp numbers. Send direct messages, media, and interactive template buttons.",
      code: `curl -X POST https://api.rockyt.io/v1/whatsapp/messages \\
  -H "Authorization: Bearer rockyt_live_..." \\
  -d '{
    "fromNumberId": "phone_us_4159920",
    "to": "+14155550199",
    "type": "text",
    "body": "Agent query received. Processing your report."
  }'`,
      response: `{\n  "status": "sent",\n  "messageId": "wamid.HBgLMTE0MTU1NT...",\n  "channel": "whatsapp_business",\n  "deliveredAt": "2026-08-01T06:35:00Z"\n}`
    },
    {
      id: 3,
      badge: "MCP SERVER",
      title: "CLAUDE & CURSOR INTEGRATION",
      endpoint: "npx @rockyt/mcp-server",
      description: "Model Context Protocol native server. Gives Claude Desktop, Antigravity, or Cursor tools to manage social accounts autonomously.",
      code: `// claude_desktop_config.json
{
  "mcpServers": {
    "rockyt-agent-tools": {
      "command": "npx",
      "args": ["-y", "@rockyt/mcp-server"],
      "env": { "ROCKYT_API_KEY": "rockyt_live_..." }
    }
  }
}`,
      response: `{\n  "mcpToolsRegistered": [\n    "rockyt_post_content",\n    "rockyt_send_whatsapp",\n    "rockyt_get_analytics"\n  ]\n}`
    }
  ];

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="sandbox" className="py-28 px-4 sm:px-6 relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] z-0"></div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        <div className="mb-20">
          <div className="text-center sm:text-left mb-8">
            <span className="inline-flex items-center text-xs font-mono tracking-wider uppercase px-2.5 py-1 bg-brand/15 border border-brand/30 text-brand font-bold mb-3 rounded-xs">
              WHAT YOU CAN DO
            </span>
            <h2 className="font-display font-semibold text-4xl sm:text-6xl text-white uppercase tracking-tight">
              CLEAR &amp; SIMPLE <span className="text-brand">ENDPOINTS</span>
            </h2>
          </div>

          <div className="space-y-4">
            {endpointCapabilities.map((ep, idx) => (
              <div 
                key={idx}
                onClick={onStartOnboarding}
                className="bg-paper text-ink border-2 border-ink p-4 sm:p-5 shadow-hard hover:-translate-y-1 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 border rounded-xs ${ep.methodColor}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-ink group-hover:text-brand transition-colors">
                    {ep.path}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink/75 sm:text-right">
                  {ep.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:text-left">
            <a 
              href="https://docs.rockyt.io" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs font-bold text-brand hover:text-white transition-colors uppercase tracking-wider"
            >
              See all endpoints <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 border-b-2 border-white/20 pb-4 gap-4">
            <div>
              <span className="font-mono text-xs text-brand tracking-widest uppercase font-semibold">// INTERACTIVE REST &amp; MCP PLAYGROUND</span>
              <h3 className="font-display font-semibold text-3xl sm:text-5xl text-paper tracking-tighter uppercase">
                TEST <span className="text-brand">PAYLOADS</span>
              </h3>
            </div>
            <div className="font-mono text-xs text-brand bg-black border border-brand/40 px-3 py-1.5 rotate-2 flex items-center gap-2 font-bold">
               <span className="w-2 h-2 bg-brand rounded-full animate-ping"></span>
               HTTP 200 LIVE SIMULATOR
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {apiExamples.map((ex) => (
              <div 
                key={ex.id}
                className="bg-zinc-950 border-2 border-white/20 shadow-hard hover:border-brand transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="bg-zinc-900 border-b border-white/15 p-4 flex justify-between items-center">
                  <span className="font-mono text-[10px] bg-brand text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                    {ex.badge}
                  </span>
                  <span className="font-mono text-[11px] text-brand font-semibold">{ex.endpoint}</span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-2xl text-white uppercase tracking-tight mb-2">
                      {ex.title}
                    </h4>
                    <p className="font-mono text-xs text-white/70 leading-relaxed mb-4">
                      {ex.description}
                    </p>

                    <div className="relative bg-black border border-white/15 p-3 rounded-sm font-mono text-[10px] text-white/90 mb-4 overflow-x-auto no-scrollbar">
                      <div className="flex justify-between items-center text-white/40 mb-1 text-[9px] border-b border-white/10 pb-1">
                        <span>REQUEST PAYLOAD</span>
                        <button 
                          onClick={() => handleCopy(ex.id, ex.code)} 
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === ex.id ? <Check size={10} className="text-brand" /> : <Copy size={10} />}
                          {copiedId === ex.id ? 'COPIED' : 'COPY'}
                        </button>
                      </div>
                      <pre className="text-white/80"><code>{ex.code}</code></pre>
                    </div>

                    <div className="relative bg-zinc-900 border border-brand/30 p-3 rounded-sm font-mono text-[10px] text-brand/90 overflow-x-auto no-scrollbar">
                      <div className="text-brand/60 mb-1 text-[9px] font-bold">HTTP 200 OK (MOCK RESPONSE)</div>
                      <pre><code>{ex.response}</code></pre>
                    </div>
                  </div>

                  <button 
                    onClick={onStartOnboarding}
                    className="mt-6 w-full border border-white/30 group-hover:border-brand group-hover:bg-brand group-hover:text-white text-white font-mono text-xs py-2.5 uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal size={14} /> Test Endpoint In Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Showcase;