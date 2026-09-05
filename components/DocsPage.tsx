import React, { useState } from 'react';
import { Terminal, Code2, Cpu, Zap, Copy, Check, ArrowLeft, Bot, ShieldCheck, Layers, Play, ExternalLink, Sparkles, Server, FileCode, CheckCircle2, Box } from 'lucide-react';

interface DocsPageProps {
  initialTab?: string;
  onBack?: () => void;
  onGetApiKey?: () => void;
}

const DocsPage: React.FC<DocsPageProps> = ({ initialTab = 'overview', onBack, onGetApiKey }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-28 px-4 sm:px-6 relative z-10 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-brand hover:text-white transition-colors mb-2 uppercase font-bold"
            >
              <ArrowLeft size={14} /> Back to Rockyt Home
            </button>
            <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-white flex items-center gap-3">
              ROCKYT <span className="text-brand">DEVELOPER DOCS</span>
            </h1>
            <p className="text-xs text-white/60 mt-1 max-w-xl">
              Unified API documentation, Workflows, Webhooks, CLI, SDKs, MCP server, and Platform Integrations.
            </p>
          </div>

          <button
            onClick={onGetApiKey}
            className="bg-brand text-white font-mono text-xs px-5 py-2.5 font-bold uppercase tracking-wider hover:bg-white hover:text-ink transition-all shadow-glow flex items-center gap-2 border border-brand"
          >
            <Zap size={14} /> Get Rockyt API Key
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-3">
          {[
            { id: 'overview', label: 'ADS REST API' },
            { id: 'posthog', label: 'POSTHOG EVENT TRACKER' },
            { id: 'data', label: 'DATA PIPELINES & CLI WIZARD' },
            { id: 'capi', label: 'CONVERSION API (CAPI)' },
            { id: 'attribution', label: 'REVENUE ATTRIBUTION' },
            { id: 'mcp', label: 'MCP ADS SERVER' },
            { id: 'sdks', label: 'SDKS (8 LANGUAGES)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all border ${
                activeTab === tab.id
                  ? 'bg-brand text-white border-brand shadow-glow'
                  : 'bg-zinc-900 text-white/70 border-white/10 hover:border-brand/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Ads REST API */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// UNIFIED ADS MANAGEMENT</span>
                  <h3 className="font-display font-bold text-2xl text-white uppercase">ROCKYT ADS REST API SPECIFICATION</h3>
                </div>
                <span className="text-xs bg-brand/10 border border-brand/40 text-brand px-2.5 py-1 font-bold">v1 RELEASE</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <p className="text-xs text-white/80 leading-relaxed">
                    Programmatically create ad campaigns, draft ad sets, set daily budgets, configure audience targeting, and pull unified performance analytics across Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, Pinterest Ads, and X Ads.
                  </p>
                  <div className="bg-black p-4 border border-white/15 space-y-2">
                    <span className="text-[10px] text-white/50 uppercase block">Base API Endpoint</span>
                    <code className="text-brand font-bold text-sm">https://api.rockyt.com/v1/ads</code>
                  </div>
                  <div className="bg-black p-4 border border-white/15 space-y-2">
                    <span className="text-[10px] text-white/50 uppercase block">Authentication Header</span>
                    <code className="text-emerald-400 text-xs">Authorization: Bearer ROCKYT_API_KEY</code>
                  </div>
                </div>

                {/* cURL Example */}
                <div className="bg-black border border-white/15 p-4 relative">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <span className="text-[10px] text-white/50 uppercase font-bold">Create Campaign (cURL)</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST https://api.rockyt.com/v1/ads/campaigns \\
  -H "Authorization: Bearer $ROCKYT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Retargeting High Intent Users",
    "platform": "meta-ads",
    "objective": "CONVERSIONS",
    "dailyBudget": 150.00
  }'`, 'curl-quick')}
                      className="text-xs text-brand hover:text-white flex items-center gap-1"
                    >
                      {copiedId === 'curl-quick' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === 'curl-quick' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-[11px] text-zinc-300 overflow-x-auto">
                    <code>{`curl -X POST https://api.rockyt.com/v1/ads/campaigns \\
  -H "Authorization: Bearer $ROCKYT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Retargeting High Intent Users",
    "platform": "meta-ads",
    "objective": "CONVERSIONS",
    "dailyBudget": 150.00
  }'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PostHog Event Tracker */}
        {activeTab === 'posthog' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// EVENT CAPTURE SCRIPT</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">POSTHOG SDK TRACKING PIXEL EMBED</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Add this lightweight tracking script to your website, web application, or e-commerce store. It initializes the PostHog SDK, auto-captures URL ad click identifiers (<code className="text-brand">gclid</code>, <code className="text-brand">fbclid</code>, <code className="text-brand">ttclid</code>), and dual-dispatches conversion events back to Rockyt's Conversion API.
            </p>

            <div className="bg-black p-4 border border-white/15 relative">
              <button
                onClick={() => copyToClipboard(`<script src="https://api.rockyt.com/rockyt-pixel.js?apiKey=YOUR_API_KEY" async></script>`, 'ph-script')}
                className="absolute top-3 right-3 text-xs text-brand hover:text-white flex items-center gap-1"
              >
                {copiedId === 'ph-script' ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === 'ph-script' ? 'Copied' : 'Copy'}
              </button>
              <code className="text-emerald-400 text-xs font-bold font-mono">
                &lt;script src="https://api.rockyt.com/rockyt-pixel.js?apiKey=YOUR_API_KEY" async&gt;&lt;/script&gt;
              </code>
            </div>

            <div className="bg-black p-4 border border-white/15 text-xs text-white/80 space-y-2">
              <span className="text-brand font-bold uppercase block">// MANUAL EVENT TRIGGER EXAMPLE</span>
              <pre className="text-[11px] text-zinc-300 overflow-x-auto">
                <code>{`// Track Custom Purchase Event
window.RockytPixel.trackPurchase(149.00, 'USD', 'ord_99812');

// Track Custom Lead Event
window.RockytPixel.trackLead('Enterprise Demo Request');`}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Data Pipelines & CLI Wizard */}
        {activeTab === 'data' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// CLI SETUP & DATA WAREHOUSING</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">CLI SETUP WIZARD &amp; DATA PIPELINE APIS</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Automate event tracking installation across codebase frameworks using our terminal setup wizard, and stream real-time PostHog &amp; CAPI event data directly to your data warehouses.
            </p>

            <div className="bg-black p-4 border border-white/15 relative">
              <span className="text-[10px] text-white/50 uppercase block mb-2">CLI Interactive Setup Wizard Command</span>
              <code className="text-emerald-400 text-xs font-bold font-mono">
                npx -y @rockyt/pixel-wizard@latest
              </code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-black p-4 border border-white/15 space-y-2">
                <span className="text-brand font-bold">List Connected Data Sources</span>
                <code className="text-white/80 text-[11px] block font-mono">GET /api/v1/data/sources</code>
                <p className="text-white/50 text-[10px]">Inspect BigQuery, Snowflake, Supabase, Stripe, and PostHog integrations.</p>
              </div>

              <div className="bg-black p-4 border border-white/15 space-y-2">
                <span className="text-brand font-bold">Real-Time Event Stream API</span>
                <code className="text-white/80 text-[11px] block font-mono">GET /api/v1/data/events</code>
                <p className="text-white/50 text-[10px]">Stream captured conversion events with ad click IDs and distinct user IDs.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Conversion API (CAPI) */}
        {activeTab === 'capi' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// SERVER-SIDE CONVERSION RELAY</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">DUAL-DISPATCH CONVERSION API (CAPI)</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Dispatch conversion events directly from your backend or serverless functions. Rockyt automatically formats and relays events to Meta CAPI, Google Ads CAPI, and TikTok Ads CAPI via Rockyt Edge Engine.
            </p>

            <pre className="bg-black p-4 border border-white/15 text-[11px] text-zinc-300 overflow-x-auto">
              <code>{`curl -X POST https://api.rockyt.com/v1/conversions \\
  -H "Authorization: Bearer $ROCKYT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventName": "Purchase",
    "eventData": {
      "value": 149.00,
      "currency": "USD",
      "gclid": "Cj0KCQiA..."
    },
    "posthogDistinctId": "user_981273"
  }'`}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Revenue Attribution */}
        {activeTab === 'attribution' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// CLOSED-LOOP ROAS ATTRIBUTION</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">PAYMENT PLATFORM REVENUE ATTRIBUTION</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Connect your payment gateways (Stripe or Dodo Payments) via webhooks or push payment events programmatically to attribute dollar revenue directly to your ad campaign click IDs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black p-4 border border-white/15 space-y-2">
                <span className="text-brand font-bold text-xs">Stripe / Dodo Webhook URL</span>
                <code className="text-emerald-400 text-xs block font-mono">https://api.rockyt.com/v1/webhooks/revenue/dodo</code>
              </div>
              <div className="bg-black p-4 border border-white/15 space-y-2">
                <span className="text-brand font-bold text-xs">Programmatic REST Endpoint</span>
                <code className="text-emerald-400 text-xs block font-mono">POST /api/v1/attribution/revenue</code>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: MCP Ads Server */}
        {activeTab === 'mcp' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                <div className="p-2 bg-brand text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-white uppercase">MCP ADS SERVER FOR AI AGENTS</h3>
                  <p className="text-xs text-white/60">Connect AI Agents in Cursor, Claude Code, and Windsurf to manage ad budgets and ROAS</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-display font-bold text-lg text-brand uppercase mb-3">QUICK INSTALLATION</h4>
                  <div className="bg-black p-4 border border-white/15 mb-4 relative">
                    <button
                      onClick={() => copyToClipboard(`npx -y @rockyt/mcp-ads`, 'mcp-install')}
                      className="absolute top-3 right-3 text-xs text-brand hover:text-white flex items-center gap-1"
                    >
                      {copiedId === 'mcp-install' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === 'mcp-install' ? 'Copied' : 'Copy'}
                    </button>
                    <code className="text-emerald-400 text-xs font-bold">npx -y @rockyt/mcp-ads</code>
                  </div>

                  <h4 className="font-display font-bold text-lg text-white uppercase mb-3">CLAUDE DESKTOP / CURSOR CONFIG</h4>
                  <pre className="bg-black p-4 border border-white/15 text-[11px] text-zinc-300 overflow-x-auto">
                    <code>{`{
  "mcpServers": {
    "rockyt-ads": {
      "command": "npx",
      "args": ["-y", "@rockyt/mcp-ads"],
      "env": {
        "ROCKYT_API_KEY": "your_rockyt_api_key_here"
      }
    }
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-display font-bold text-lg text-white uppercase mb-3">AVAILABLE MCP TOOLS</h4>
                  <ul className="space-y-3 text-xs text-white/80">
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_create_ad_campaign:</strong> Draft and publish ad campaigns across Meta, Google &amp; TikTok Ads.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_get_ad_analytics:</strong> Pull ROAS, spend, impressions, clicks &amp; conversion metrics.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_track_conversion:</strong> Dispatch conversion events to Meta &amp; Google CAPI.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_attribute_revenue:</strong> Link payment platform order revenue to ad click IDs.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: SDKs */}
        {activeTab === 'sdks' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// NATIVE LIBRARIES</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">OFFICIAL ROCKYT SDKS (8 LANGUAGES)</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Node.js / TS</span>
                <code className="text-white/70 text-[11px]">npm i @rockyt/sdk</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Python</span>
                <code className="text-white/70 text-[11px]">pip install rockyt</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Go</span>
                <code className="text-white/70 text-[11px]">go get github.com/rockyt/go</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Rust</span>
                <code className="text-white/70 text-[11px]">cargo add rockyt</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">PHP</span>
                <code className="text-white/70 text-[11px]">composer req rockyt/sdk</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Ruby</span>
                <code className="text-white/70 text-[11px]">gem install rockyt</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">Java</span>
                <code className="text-white/70 text-[11px]">implementation 'com.rockyt:sdk'</code>
              </div>
              <div className="bg-black p-4 border border-white/15">
                <span className="text-brand font-bold block mb-1">.NET</span>
                <code className="text-white/70 text-[11px]">dotnet add package Rockyt.Sdk</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;
