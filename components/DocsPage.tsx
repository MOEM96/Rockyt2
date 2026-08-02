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
            { id: 'overview', label: 'OVERVIEW & QUICKSTART' },
            { id: 'mcp', label: 'MCP SERVER' },
            { id: 'workflows', label: 'WORKFLOWS' },
            { id: 'webhooks', label: 'WEBHOOKS' },
            { id: 'cli', label: 'CLI TOOL' },
            { id: 'sdks', label: 'SDKS (8 LANGUAGES)' },
            { id: 'integrations', label: 'INTEGRATIONS & MIGRATION' }
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

        {/* Tab 1: Overview & Quickstart */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// AUTHENTICATION & BASE URL</span>
                  <h3 className="font-display font-bold text-2xl text-white uppercase">ROCKYT REST API SPECIFICATION</h3>
                </div>
                <span className="text-xs bg-brand/10 border border-brand/40 text-brand px-2.5 py-1 font-bold">v1 RELEASE</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <p className="text-xs text-white/80 leading-relaxed">
                    Rockyt provides a unified REST API and MCP protocol for publishing, messaging, ad management, and automated workflows across 16 major platforms.
                  </p>
                  <div className="bg-black p-4 border border-white/15 space-y-2">
                    <span className="text-[10px] text-white/50 uppercase block">Base API Endpoint</span>
                    <code className="text-brand font-bold text-sm">https://api.rockyt.com/v1</code>
                  </div>
                  <div className="bg-black p-4 border border-white/15 space-y-2">
                    <span className="text-[10px] text-white/50 uppercase block">Authentication Header</span>
                    <code className="text-emerald-400 text-xs">Authorization: Bearer ROCKYT_API_KEY</code>
                  </div>
                </div>

                {/* cURL Example */}
                <div className="bg-black border border-white/15 p-4 relative">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <span className="text-[10px] text-white/50 uppercase font-bold">cURL Quickstart</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer $ROCKYT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": ["twitter", "linkedin"],
    "text": "Hello world from Rockyt API!"
  }'`, 'curl-quick')}
                      className="text-xs text-brand hover:text-white flex items-center gap-1"
                    >
                      {copiedId === 'curl-quick' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === 'curl-quick' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-[11px] text-zinc-300 overflow-x-auto">
                    <code>{`curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer $ROCKYT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": ["twitter", "linkedin"],
    "text": "Hello world from Rockyt API!"
  }'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MCP Server */}
        {activeTab === 'mcp' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                <div className="p-2 bg-brand text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-white uppercase">NATIVE MODEL CONTEXT PROTOCOL (MCP)</h3>
                  <p className="text-xs text-white/60">Connect AI Agents in Cursor, Claude Desktop, Windsurf, and LangChain</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-display font-bold text-lg text-brand uppercase mb-3">QUICK INSTALLATION</h4>
                  <div className="bg-black p-4 border border-white/15 mb-4 relative">
                    <button
                      onClick={() => copyToClipboard(`npx -y @rockyt/mcp-server`, 'mcp-install')}
                      className="absolute top-3 right-3 text-xs text-brand hover:text-white flex items-center gap-1"
                    >
                      {copiedId === 'mcp-install' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === 'mcp-install' ? 'Copied' : 'Copy'}
                    </button>
                    <code className="text-emerald-400 text-xs font-bold">npx -y @rockyt/mcp-server</code>
                  </div>

                  <h4 className="font-display font-bold text-lg text-white uppercase mb-3">CLAUDE DESKTOP / CURSOR CONFIG</h4>
                  <pre className="bg-black p-4 border border-white/15 text-[11px] text-zinc-300 overflow-x-auto">
                    <code>{`{
  "mcpServers": {
    "rockyt": {
      "command": "npx",
      "args": ["-y", "@rockyt/mcp-server"],
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
                      <strong className="text-brand font-bold">rockyt_publish_post:</strong> Publish text, media, reels &amp; carousels across 16 platforms.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_list_inbox:</strong> Fetch DMs, comments, and WhatsApp customer messages.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_manage_ads:</strong> Create campaigns, adjust budgets, and pause Meta &amp; Google Ads.
                    </li>
                    <li className="bg-black p-3 border border-white/10">
                      <strong className="text-brand font-bold">rockyt_trigger_workflow:</strong> Start autonomous multi-step execution graphs.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Workflows */}
        {activeTab === 'workflows' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// AUTONOMOUS WORKFLOWS</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">MULTI-STEP WORKFLOW &amp; GRAPH EXECUTION</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Build autonomous execution loops connecting incoming webhooks, sentiment triggers, LLM processing, and cross-channel actions.
            </p>

            <pre className="bg-black p-4 border border-white/15 text-[11px] text-zinc-300 overflow-x-auto">
              <code>{`// POST /v1/workflows/create
{
  "name": "Auto-Reply & Ad Adjuster",
  "trigger": { "event": "inbox.message_received", "platform": "whatsapp" },
  "actions": [
    { "step": "ai_sentiment_check" },
    { "step": "send_reply", "if": "sentiment == 'positive'" },
    { "step": "pause_ad_campaign", "if": "sentiment == 'negative'" }
  ]
}`}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// REAL-TIME EVENT STREAMING</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">WEBHOOKS &amp; SIGNATURE VERIFICATION</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Rockyt delivers real-time HTTP POST notifications for inbound DMs, comment updates, ad conversions, and broadcast status.
            </p>
            <div className="bg-black p-4 border border-white/15 space-y-2">
              <span className="text-[10px] text-white/50 uppercase block">Signature Verification Header</span>
              <code className="text-brand font-bold text-xs">X-Rockyt-Signature: t=1700000000,v1=sha256_hash</code>
            </div>
          </div>
        )}

        {/* Tab 5: CLI Tool */}
        {activeTab === 'cli' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// TERMINAL AGENT ACCESS</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">ROCKYT COMMAND LINE INTERFACE</h3>
            </div>
            <div className="bg-black p-4 border border-white/15 space-y-3">
              <span className="text-xs text-white/70 block">Install global binary:</span>
              <code className="text-emerald-400 text-xs font-bold block">npm install -g @rockyt/cli</code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-black p-4 border border-white/10 space-y-1">
                <span className="text-brand font-bold">rockyt post</span>
                <p className="text-white/60">Schedule or publish posts across platforms.</p>
              </div>
              <div className="bg-black p-4 border border-white/10 space-y-1">
                <span className="text-brand font-bold">rockyt dms</span>
                <p className="text-white/60">List and reply to DM conversations.</p>
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

        {/* Tab 7: Integrations & Migrations */}
        {activeTab === 'integrations' && (
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">// ECOSYSTEM CONNECTORS</span>
              <h3 className="font-display font-bold text-2xl text-white uppercase">NO-CODE CONNECTORS &amp; MIGRATION GUIDES</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black p-5 border border-white/15">
                <h4 className="font-display font-bold text-lg text-white uppercase mb-2">n8n / MAKE / ZAPIER</h4>
                <p className="text-xs text-white/70">Connect Rockyt nodes directly to n8n workflows, Make scenarios, and Zapier zaps.</p>
              </div>
              <div className="bg-black p-5 border border-white/15">
                <h4 className="font-display font-bold text-lg text-white uppercase mb-2">OPENCLAW INTEGRATION</h4>
                <p className="text-xs text-white/70">Native OpenClaw skill support for autonomous browser and social media agent operations.</p>
              </div>
              <div className="bg-black p-5 border border-white/15">
                <h4 className="font-display font-bold text-lg text-white uppercase mb-2">MIGRATION ASSISTANT</h4>
                <p className="text-xs text-white/70">1-click endpoint migration scripts for Ayrshare, Kapso, and Twilio users.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;
