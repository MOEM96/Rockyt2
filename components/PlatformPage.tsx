import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, Terminal, Bot, ShieldCheck, Zap, Layers, RefreshCw, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface PlatformPageProps {
  slug: string;
  onBack: () => void;
  onGetApiKey: () => void;
}

const platformDataMap: Record<string, {
  name: string;
  tagline: string;
  badge: string;
  category: string;
  endpoint: string;
  description: string;
  transformation: { before: string; after: string }[];
  useCases: { title: string; desc: string; icon: string }[];
  features: string[];
  curlCode: string;
  nodeCode: string;
  pyCode: string;
  mcpCode: string;
  jsonResponse: string;
  faq: { q: string; a: string }[];
}> = {
  '/x': {
    name: 'Twitter / X API',
    tagline: 'Programmatic Tweets, Threads, Media & Analytics API for AI Agents',
    badge: 'OFFICIAL PARTNER',
    category: 'SOCIAL PUBLISHING',
    endpoint: 'POST /v1/posts',
    description: 'Post text tweets, long threads, images, and video clips to X without managing Twitter Developer App reviews or OAuth 2.0 PKCE state manually.',
    transformation: [
      { before: 'Paying $100/mo per basic Twitter API tier with strict rate limit blocks', after: 'Included in Rockyt unified subscription with automatic rate-limit smoothing' },
      { before: 'Manually chunking long text into Twitter thread arrays and handling index IDs', after: 'One API parameter thread: [...] automatically converted into threaded posts' },
      { before: 'Complex media upload initialization, append, and finalize calls', after: 'Pass any public image or MP4 URL; Rockyt processes upload and attachment' }
    ],
    useCases: [
      { title: 'Autonomous AI Newsbot', desc: 'Agent monitors RSS feeds or news APIs, summarizes key points, and tweets multi-post threads every hour.', icon: '📰' },
      { title: 'Social Customer Support Agent', desc: 'Monitor brand mentions on X via webhooks and reply automatically via LLM agent.', icon: '🤖' },
      { title: 'Cross-Posting Engine', desc: 'Publish product launch announcements simultaneously on X, LinkedIn, and Discord.', icon: '🚀' }
    ],
    features: ['Single Tweets & Threads', 'MP4 Video & GIF Support', 'Mention & Keyword Webhooks', 'Impressions & Engagement Analytics', 'Hosted OAuth 2.0 PKCE'],
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": [{"platform": "x", "accountId": "acc_x_8819"}],
    "content": "Autonomous AI Agent campaign online!",
    "mediaItems": [{"type": "image", "url": "https://cdn.rockyt.com/img.png"}]
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.posts.create({
  platforms: [{ platform: "x", accountId: "acc_x_8819" }],
  content: "Autonomous AI Agent campaign online!",
  mediaItems: [{ type: "image", url: "https://cdn.rockyt.com/img.png" }]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.posts.create(
    platforms=["x"],
    content="Autonomous AI Agent campaign online!",
    media_url="https://cdn.rockyt.com/img.png"
)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "x",
    "content": "Autonomous AI Agent campaign online!"
  }
}`,
    jsonResponse: `{\n  "status": "success",\n  "postId": "x_tweet_18829104829104",\n  "platform": "x",\n  "tweetUrl": "https://x.com/agent/status/18829104829104",\n  "publishedAt": "2026-08-01T07:15:00Z"\n}`,
    faq: [
      { q: "Do I need my own Twitter Developer Portal app?", a: "No! Rockyt provides hosted OAuth. Users authorize through Rockyt's verified Meta and X partner apps." },
      { q: "Can my AI Agent post multi-tweet threads?", a: "Yes, pass an array of strings in the thread parameter and Rockyt automatically chains the replies." }
    ]
  },
  '/instagram': {
    name: 'Instagram API',
    tagline: 'Direct Reels, Feed Posts, Carousels & DM Auto-Responders',
    badge: 'META BUSINESS PARTNER',
    category: 'SOCIAL & MESSAGING',
    endpoint: 'POST /v1/posts',
    description: 'Publish Instagram Reels, single photos, and carousels directly to Instagram Business & Creator accounts without mobile notification push workarounds.',
    transformation: [
      { before: 'Getting blocked by Meta app review or spending weeks building Graph API auth', after: 'Pre-approved Meta Partner pipeline; instant access via Rockyt token' },
      { before: 'Complex 2-step container creation and media publish polling', after: 'One API request handles container upload, processing, and instant publishing' },
      { before: 'No programmatic DM auto-responders for comments', after: 'Set up instant webhook triggers to auto-DM users when they comment on Reels' }
    ],
    useCases: [
      { title: 'AI Reel Producer', desc: 'AI agent renders short video, generates captions with hashtags, and publishes to Reels.', icon: '🎬' },
      { title: 'Comment to DM Lead Funnel', desc: 'Automatically send product download links to anyone who comments "DEMO" on Instagram.', icon: '📥' },
      { title: 'E-Commerce Showcase', desc: 'Schedule daily product carousel posts with tagged prices and links.', icon: '🛍️' }
    ],
    features: ['Direct Reels Publishing', 'Photo & Video Carousels', 'Comment & DM Automation', 'Account Analytics & Insights', 'Hosted Meta OAuth'],
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{
    "platforms": [{"platform": "instagram", "accountId": "acc_ig_3910"}],
    "content": "Check out our latest AI demo reel! #AI #Tech",
    "mediaItems": [{"type": "video", "url": "https://cdn.rockyt.com/reel.mp4"}]
  }'`,
    nodeCode: `await rockyt.posts.create({
  platforms: [{ platform: "instagram", accountId: "acc_ig_3910" }],
  content: "Check out our latest AI demo reel! #AI #Tech",
  mediaItems: [{ type: "video", url: "https://cdn.rockyt.com/reel.mp4" }]
});`,
    pyCode: `client.posts.create(
    platforms=["instagram"],
    content="Check out our latest AI demo reel! #AI #Tech",
    media_url="https://cdn.rockyt.com/reel.mp4"
)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "instagram",
    "content": "Check out our latest AI demo reel!"
  }
}`,
    jsonResponse: `{\n  "status": "success",\n  "postId": "ig_container_179201948",\n  "platform": "instagram",\n  "mediaType": "REELS",\n  "permalink": "https://instagram.com/p/C9102831"\n}`,
    faq: [
      { q: "Does this support Instagram Creator accounts?", a: "Yes, both Instagram Business and Instagram Creator profiles are fully supported." },
      { q: "Can I publish video Reels?", a: "Yes, pass an MP4 URL and Rockyt automatically publishes it as an Instagram Reel." }
    ]
  },
  '/whatsapp': {
    name: 'WhatsApp Business API',
    tagline: 'Message Templates, WhatsApp Flows, Broadcasts & Interactive DMs',
    badge: 'WHATSAPP BUSINESS',
    category: 'DIRECT MESSAGING',
    endpoint: 'POST /v1/whatsapp/messages',
    description: 'Send WhatsApp business notifications, trigger WhatsApp Flows, manage broadcasts, and receive incoming customer webhooks in real time.',
    transformation: [
      { before: 'Complex BSP registration, Meta credit card setup, and template approval delays', after: 'Pre-approved Meta Cloud API pipeline; instant access via Rockyt token' },
      { before: 'Manually managing WhatsApp session tokens and webhooks', after: 'Fully managed WhatsApp Cloud API pipeline with automatic token rotation' },
      { before: 'No unified inbox for customer support agents', after: 'All WhatsApp DMs unified alongside Instagram & Telegram in one endpoint' }
    ],
    useCases: [
      { title: 'AI Customer Support Agent', desc: 'WhatsApp bot answers customer questions, checks order status, and sends updates.', icon: '💬' },
      { title: 'Order Confirmation Notifications', desc: 'Send transactional WhatsApp notifications with action buttons on checkout.', icon: '📦' },
      { title: '2FA & OTP Verification', desc: 'Deliver instant 6-digit OTP codes via WhatsApp to users globally.', icon: '🔒' }
    ],
    features: ['WhatsApp Template Buttons', 'Interactive WhatsApp Flows', 'Broadcast Campaigns', 'Incoming Message Webhooks', 'Read Receipts & Status'],
    curlCode: `curl -X POST https://api.rockyt.com/v1/whatsapp/messages \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+14155550199",
    "type": "text",
    "body": "Your AI Agent report is ready. Reply YES to download."
  }'`,
    nodeCode: `await rockyt.whatsapp.send({
  to: "+14155550199",
  text: "Your AI Agent report is ready. Reply YES to download."
});`,
    pyCode: `client.whatsapp.send(
    to="+14155550199",
    text="Your AI Agent report is ready. Reply YES to download."
)`,
    mcpCode: `{
  "tool": "rockyt_send_whatsapp",
  "arguments": {
    "to": "+14155550199",
    "text": "Your AI Agent report is ready."
  }
}`,
    jsonResponse: `{\n  "status": "sent",\n  "messageId": "wamid.HBgLMTE0MTU1NT...",\n  "to": "+14155550199",\n  "timestamp": "2026-08-01T07:18:00Z"\n}`,
    faq: [
      { q: "Can I send template messages?", a: "Yes, approved Meta template buttons and quick replies are fully supported." },
      { q: "Do you support interactive WhatsApp Flows?", a: "Yes, publish and trigger full multi-step interactive JSON flows directly." }
    ]
  }
};

const defaultPlatformData = {
  name: 'Platform API Specification',
  tagline: 'Unified Social Media & Messaging API for AI Agents',
  badge: 'ROCKYT NATIVE',
  category: 'UNIFIED API',
  endpoint: 'POST /v1/posts',
  description: 'Connect and automate this platform with Rockyt unified REST endpoints or MCP tool calls.',
  transformation: [
    { before: 'Weeks of custom API integration and native dev app setup', after: '30-second setup with Rockyt unified credentials' },
    { before: 'Custom code for every platform API quirks and rate limits', after: 'One API format for 16 social & messaging channels' }
  ],
  useCases: [
    { title: 'Automated AI Content Agent', desc: 'Schedule and publish multi-channel updates with zero manual effort.', icon: '⚡' },
    { title: 'Unified Customer Messaging', desc: 'Manage customer DMs and notifications from one unified inbox endpoint.', icon: '📬' }
  ],
  features: ['Unified REST API', 'MCP Tool Compatible', 'Hosted OAuth', 'Real-time Webhooks', 'Analytics Insights'],
  curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{"content": "Automated update via Rockyt API!"}'`,
  nodeCode: `await rockyt.posts.create({ content: "Automated update via Rockyt API!" });`,
  pyCode: `client.posts.create(content="Automated update via Rockyt API!")`,
  mcpCode: `{ "tool": "rockyt_post_content", "arguments": { "content": "Automated update" } }`,
  jsonResponse: `{\n  "status": "success",\n  "published": true\n}`,
  faq: [
    { q: "How quickly can I integrate?", a: "Takes less than 30 seconds. Get your free API key and publish instantly." }
  ]
};

const PlatformPage: React.FC<PlatformPageProps> = ({ slug, onBack, onGetApiKey }) => {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'py' | 'mcp'>('node');
  const [copied, setCopied] = useState(false);

  const data = platformDataMap[slug] || {
    ...defaultPlatformData,
    name: `${slug.replace('/', '').toUpperCase()} API`,
    endpoint: `POST /v1${slug}`
  };

  const getCodeSnippet = () => {
    switch (activeTab) {
      case 'curl': return data.curlCode;
      case 'node': return data.nodeCode;
      case 'py': return data.pyCode;
      case 'mcp': return data.mcpCode;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 relative z-10 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-brand font-bold uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Back to Rockyt Home
          </button>

          <span className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 bg-brand rounded-full animate-ping"></span>
            {data.category}
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-zinc-900 border border-white/15 p-6 sm:p-8 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="bg-brand text-white text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest">
              {data.badge}
            </span>
            <span className="bg-zinc-800 text-white/70 border border-white/10 text-[10px] px-2 py-0.5 font-bold">
              {data.endpoint}
            </span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight text-white mb-3">
            {data.name}
          </h1>
          <p className="text-sm text-brand font-bold mb-4">{data.tagline}</p>
          <p className="text-xs text-white/70 leading-relaxed max-w-3xl">{data.description}</p>
        </div>

        {/* Code Terminal Section */}
        <div className="bg-zinc-950 border border-white/15 p-6 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div className="flex gap-2">
              {[
                { id: 'node', label: 'Node.js SDK' },
                { id: 'py', label: 'Python SDK' },
                { id: 'curl', label: 'cURL API' },
                { id: 'mcp', label: 'MCP Protocol' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand text-white'
                      : 'bg-zinc-900 text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={copyCode}
              className="text-xs text-brand hover:text-white flex items-center gap-1 font-bold"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'COPIED' : 'COPY CODE'}
            </button>
          </div>

          <pre className="text-xs text-emerald-400 overflow-x-auto p-2">
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>

        {/* FAQ Section */}
        <div className="bg-zinc-900 border border-white/15 p-6 sm:p-8">
          <h3 className="font-display font-bold text-2xl uppercase mb-6 text-white">FREQUENTLY ASKED QUESTIONS</h3>
          <div className="space-y-4">
            {data.faq.map((item, idx) => (
              <div key={idx} className="bg-black p-4 border border-white/10">
                <h4 className="text-xs text-brand font-bold uppercase mb-1">{item.q}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformPage;
