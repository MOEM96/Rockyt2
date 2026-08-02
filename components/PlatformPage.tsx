import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Copy, ShieldCheck, Zap, Layers, 
  ArrowRight, Sparkles, Code, Play, ExternalLink, HelpCircle,
  FileText, Image, Video, Link2, MessageSquare, Send, CheckCircle2, AlertCircle
} from 'lucide-react';

interface PlatformPageProps {
  slug: string;
  onBack: () => void;
  onGetApiKey: () => void;
  onNavigateToPath?: (path: string) => void;
}

interface PlatformConfig {
  name: string;
  displayName: string;
  badge: string;
  category: string;
  endpoint: string;
  icon: string;
  tagline: string;
  description: string;
  directApiName: string;
  directApiCons: string[];
  rockytPros: string[];
  specialHighlight: { title: string; desc: string };
  contentTypes: { name: string; icon: string }[];
  guides: { title: string; desc: string }[];
  crossPromo?: { text: string; linkText: string; slug: string };
  curlCode: string;
  nodeCode: string;
  pyCode: string;
  mcpCode: string;
  faq: { q: string; a: string }[];
}

const allPlatformsList = {
  social: [
    { name: 'Twitter / X', slug: '/x', icon: '𝕏' },
    { name: 'Instagram', slug: '/instagram', icon: '📷' },
    { name: 'TikTok', slug: '/tiktok', icon: '🎵' },
    { name: 'LinkedIn', slug: '/linkedin', icon: '💼' },
    { name: 'YouTube', slug: '/youtube', icon: '▶️' },
    { name: 'Threads', slug: '/threads', icon: '🧵' },
    { name: 'Reddit', slug: '/reddit', icon: '🤖' },
    { name: 'Pinterest', slug: '/pinterest', icon: '📌' },
    { name: 'Bluesky', slug: '/bluesky', icon: '🦋' },
    { name: 'Snapchat', slug: '/snapchat', icon: '👻' },
    { name: 'Google Business', slug: '/googlebusiness', icon: '📍' },
  ],
  messaging: [
    { name: 'WhatsApp', slug: '/whatsapp', icon: '💬' },
    { name: 'Telegram', slug: '/telegram', icon: '✈️' },
    { name: 'Discord', slug: '/discord', icon: '👾' },
    { name: 'Slack', slug: '/slack', icon: '📢' },
  ],
  ads: [
    { name: 'Meta Ads', slug: '/meta-ads', icon: '🎯' },
    { name: 'Google Ads', slug: '/google-ads', icon: '🔍' },
    { name: 'LinkedIn Ads', slug: '/linkedin-ads', icon: '💼' },
    { name: 'TikTok Ads', slug: '/tiktok-ads', icon: '🎵' },
    { name: 'Pinterest Ads', slug: '/pinterest-ads', icon: '📌' },
    { name: 'X Ads', slug: '/x-ads', icon: '𝕏' },
  ]
};

const platformDataMap: Record<string, PlatformConfig> = {
  '/linkedin': {
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    badge: 'LINKEDIN MARKETING PARTNER',
    category: 'SOCIAL PUBLISHING',
    endpoint: 'POST /v1/posts',
    icon: '💼',
    tagline: 'Programmatic Posts, Articles, Document Carousels & Company Pages for AI Agents',
    description: "Stop wrestling with LinkedIn's Marketing API. Rockyt handles OAuth, rate limits, media hosting, and API changes - so you can focus on building your product.",
    directApiName: 'LinkedIn Marketing API',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Automatic retries & queue management',
      'Upload directly - we handle LinkedIn\'s format',
      'Zero maintenance forever',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Complex OAuth with LinkedIn partner program approval required',
      'Strict rate limits, with daily quota management overhead',
      'Media must be uploaded in multiple complex steps',
      'Frequent API changes require constant engineering updates',
      'Must build separate integration per social platform'
    ],
    specialHighlight: {
      title: 'Personal Profiles & Company Pages Supported',
      desc: 'Post to your personal LinkedIn profile or any company page you admin. Perfect for thought leadership, B2B marketing, and building your professional brand automatically.'
    },
    contentTypes: [
      { name: 'Text Posts', icon: '📄' },
      { name: 'Photos', icon: '🖼️' },
      { name: 'Videos', icon: '🎥' },
      { name: 'Documents (PDFs)', icon: '📑' },
      { name: 'Link Previews', icon: '🔗' }
    ],
    guides: [
      { title: 'LinkedIn Posting API Guide', desc: 'Complete guide to posting on LinkedIn via API. OAuth 2.0 setup, permissions, and code examples.' },
      { title: 'Post to LinkedIn via API', desc: 'Step by step tutorial for posting to LinkedIn profiles and company pages programmatically.' },
      { title: 'Schedule LinkedIn Posts', desc: 'Learn how to schedule LinkedIn posts via API for optimal engagement timing.' }
    ],
    crossPromo: {
      text: 'Also available: LinkedIn Ads API',
      linkText: 'Run paid ads on LinkedIn programmatically via the same API',
      slug: '/linkedin-ads'
    },
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": [
      {
        "platform": "linkedin",
        "accountId": "your-linkedin-account-id"
      }
    ],
    "content": "Publishing LinkedIn Thought Leadership content via Rockyt API!",
    "mediaItems": [
      {
        "type": "document",
        "url": "https://your-domain.com/presentation.pdf",
        "title": "B2B AI Agent Playbook"
      }
    ],
    "scheduledFor": "2026-08-04T14:00:00Z"
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

const result = await rockyt.posts.create({
  platforms: [
    { platform: "linkedin", accountId: "acc_linkedin_9812" }
  ],
  content: "Publishing LinkedIn Thought Leadership content via Rockyt!",
  mediaItems: [
    { type: "document", url: "https://your-domain.com/presentation.pdf", title: "B2B AI Agent Playbook" }
  ],
  scheduledFor: "2026-08-04T14:00:00Z"
});

console.log("LinkedIn post scheduled:", result.id);`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

response = client.posts.create(
    platforms=["linkedin"],
    content="Publishing LinkedIn Thought Leadership content via Rockyt!",
    media_url="https://your-domain.com/presentation.pdf",
    scheduled_for="2026-08-04T14:00:00Z"
)
print("LinkedIn post scheduled:", response.id)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "linkedin",
    "content": "Publishing LinkedIn Thought Leadership content via Rockyt!",
    "mediaUrl": "https://your-domain.com/presentation.pdf"
  }
}`,
    faq: [
      { q: "Do I need LinkedIn Partner Program approval?", a: "No. Rockyt handles all LinkedIn platform partnerships and approvals on your behalf. You get a simple API key and start posting immediately." },
      { q: "Can I post to both personal profiles and company pages?", a: "Yes. Connect personal LinkedIn profiles or any Company Page you admin. Both work through the exact same unified API endpoint." },
      { q: "Does the LinkedIn API support document posts (PDF carousels)?", a: "Yes. Rockyt supports LinkedIn document (PDF carousel-style) posts alongside text, photos, videos, and link previews." },
      { q: "Does Rockyt support LinkedIn analytics?", a: "Yes. The Analytics API add-on provides LinkedIn post performance data: impressions, clicks, engagement, and reactions - unified with analytics from all other platforms." },
      { q: "How much does the LinkedIn API integration cost?", a: "LinkedIn's Marketing API is free after Partner Program approval, but direct integration typically requires 6-8 weeks of engineering. Rockyt is free for up to 2 accounts and pay only for active account-days." }
    ]
  },
  '/x': {
    name: 'Twitter / X',
    displayName: 'Twitter / X',
    badge: 'X DEVELOPER PARTNER',
    category: 'SOCIAL PUBLISHING',
    endpoint: 'POST /v1/posts',
    icon: '𝕏',
    tagline: 'Programmatic Tweets, Long Threads, MP4 Video Clips & Analytics API for AI Agents',
    description: "Stop wrestling with Twitter's API v2 rate limits. Rockyt handles OAuth, thread chaining, video processing, and rate limit smoothing - so you can focus on building your product.",
    directApiName: 'Twitter API v2 Direct',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Automatic thread chaining & reply links',
      'Video processing & MP4 chunking managed for you',
      'Included in unified Rockyt monthly credits',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Paying $100/mo to $5,000/mo per basic Twitter API tier',
      'Strict rate limit blocks and daily quota management',
      'Manually chunking long text into Twitter thread arrays',
      'Complex multi-step media upload initialization & finalize calls',
      'Must build separate integration per platform'
    ],
    specialHighlight: {
      title: 'Automatic Thread Chaining & Long Video Support',
      desc: 'Pass an array of strings in the thread parameter and Rockyt automatically chains the replies. Upload 1080p MP4 videos without touching Twitter binary upload endpoints.'
    },
    contentTypes: [
      { name: 'Single Tweets', icon: '𝕏' },
      { name: 'Multi-Tweet Threads', icon: '🧵' },
      { name: 'MP4 Videos', icon: '🎥' },
      { name: 'GIFs & Images', icon: '🖼️' },
      { name: 'Quote Tweets', icon: '💬' }
    ],
    guides: [
      { title: 'X / Twitter Posting API Guide', desc: 'Complete guide to posting on X via API. Thread creation, video uploads, and code examples.' },
      { title: 'Post Threads to X via API', desc: 'Step by step tutorial for publishing multi-tweet threads programmatically.' },
      { title: 'Schedule X Posts & Media', desc: 'Learn how to schedule X tweets and threads via API for peak engagement.' }
    ],
    crossPromo: {
      text: 'Also available: X Ads API',
      linkText: 'Run paid campaigns on X programmatically via the same API',
      slug: '/x-ads'
    },
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": [{"platform": "x", "accountId": "acc_x_8819"}],
    "content": "Autonomous AI Agent campaign online!",
    "thread": [
      "Thread 2/3: Here is how our agent analyzes social data.",
      "Thread 3/3: Try it out live today at https://rockyt.io"
    ],
    "mediaItems": [{"type": "image", "url": "https://cdn.rockyt.com/img.png"}]
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.posts.create({
  platforms: [{ platform: "x", accountId: "acc_x_8819" }],
  content: "Autonomous AI Agent campaign online!",
  thread: [
    "Thread 2/3: Here is how our agent analyzes social data.",
    "Thread 3/3: Try it out live today at https://rockyt.io"
  ],
  mediaItems: [{ type: "image", url: "https://cdn.rockyt.com/img.png" }]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.posts.create(
    platforms=["x"],
    content="Autonomous AI Agent campaign online!",
    thread=["Thread 2/3...", "Thread 3/3..."],
    media_url="https://cdn.rockyt.com/img.png"
)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "x",
    "content": "Autonomous AI Agent campaign online!",
    "thread": ["Thread 2/3...", "Thread 3/3..."]
  }
}`,
    faq: [
      { q: "Do I need my own Twitter Developer Portal App?", a: "No. Rockyt provides pre-approved, hosted OAuth. Users authorize through Rockyt's verified X partner pipeline." },
      { q: "Can my AI Agent post multi-tweet threads?", a: "Yes. Pass an array of strings in the thread parameter and Rockyt automatically chains the replies with parent ID links." },
      { q: "How are X rate limits handled?", a: "Rockyt uses intelligent token bucket queueing to queue and smooth outbound tweets so your application never gets 429 blocked." },
      { q: "Can I monitor brand mentions on X?", a: "Yes. Register webhooks via `/v1/webhooks` to receive real-time notifications whenever your X handle is mentioned." }
    ]
  },
  '/instagram': {
    name: 'Instagram',
    displayName: 'Instagram',
    badge: 'META BUSINESS PARTNER',
    category: 'SOCIAL PUBLISHING',
    endpoint: 'POST /v1/posts',
    icon: '📷',
    tagline: 'Direct Reels, Single Photos, Carousels & Comment-to-DM Auto-Responders',
    description: "Stop wrestling with Meta Graph API app reviews. Rockyt handles container creation, video encoding, polling, and DM triggers - so you can focus on building your product.",
    directApiName: 'Meta Graph API Direct',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Direct Reels publishing without mobile push workarounds',
      'One-step photo & video carousel posting',
      'Comment-to-DM auto-responder webhooks built in',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Getting blocked by Meta App Review requirements',
      'Complex 2-step container creation and media publish polling',
      'Strict video aspect ratio and encoding format restrictions',
      'No built-in auto-responder for post comment triggers',
      'Must build separate integration per platform'
    ],
    specialHighlight: {
      title: 'Direct Reels Publishing & Auto-DM Webhooks',
      desc: 'Publish 1080x1920 MP4 Reels directly to Instagram Business & Creator accounts. Set up instant webhook triggers to auto-DM users when they comment on Reels.'
    },
    contentTypes: [
      { name: 'Reels Videos', icon: '🎬' },
      { name: 'Single Photos', icon: '📷' },
      { name: 'Photo Carousels', icon: '🖼️' },
      { name: 'Video Carousels', icon: '🎥' },
      { name: 'Comment Auto-DMs', icon: '💬' }
    ],
    guides: [
      { title: 'Instagram Reels API Guide', desc: 'Complete guide to publishing Instagram Reels via API. Video encoding, container polling, and code snippets.' },
      { title: 'Post Carousels to Instagram', desc: 'Step by step tutorial for uploading multi-photo and video carousel posts.' },
      { title: 'Instagram Comment-to-DM Automation', desc: 'Learn how to trigger automated DM replies when customers comment keywords.' }
    ],
    crossPromo: {
      text: 'Also available: Meta Ads API (FB & IG)',
      linkText: 'Run Instagram Feed & Reel ads programmatically via the same API',
      slug: '/meta-ads'
    },
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platforms": [{"platform": "instagram", "accountId": "acc_ig_3910"}],
    "content": "Check out our latest AI demo reel! #AI #Tech",
    "mediaItems": [{"type": "video", "url": "https://cdn.rockyt.com/reel.mp4"}]
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.posts.create({
  platforms: [{ platform: "instagram", accountId: "acc_ig_3910" }],
  content: "Check out our latest AI demo reel! #AI #Tech",
  mediaItems: [{ type: "video", url: "https://cdn.rockyt.com/reel.mp4" }]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.posts.create(
    platforms=["instagram"],
    content="Check out our latest AI demo reel!",
    media_url="https://cdn.rockyt.com/reel.mp4"
)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "instagram",
    "content": "Check out our latest AI demo reel!",
    "mediaUrl": "https://cdn.rockyt.com/reel.mp4"
  }
}`,
    faq: [
      { q: "Does this support Instagram Creator accounts?", a: "Yes. Both Instagram Business and Instagram Creator profiles connected to a Facebook Page are fully supported." },
      { q: "Can I publish video Reels programmatically?", a: "Yes. Pass an MP4 video URL and Rockyt handles container processing, status polling, and instant Reels publishing." },
      { q: "How does the Comment-to-DM automation work?", a: "When a user comments a keyword (e.g. 'DEMO') on your post, Rockyt triggers an instant webhook or sends an automated Instagram DM." }
    ]
  },
  '/whatsapp': {
    name: 'WhatsApp Business',
    displayName: 'WhatsApp Business',
    badge: 'META WHATSAPP PARTNER',
    category: 'DIRECT MESSAGING',
    endpoint: 'POST /v1/whatsapp/messages',
    icon: '💬',
    tagline: 'Message Templates, Interactive WhatsApp Flows, Broadcasts & Real-time DMs',
    description: "Stop wrestling with WhatsApp Business Solution Provider (BSP) setups. Rockyt provides pre-approved Meta Cloud API access, template registration, and interactive flows.",
    directApiName: 'WhatsApp Cloud API Direct',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Pre-approved Meta Cloud API pipeline',
      'Interactive WhatsApp Flows & button templates',
      'Unified inbox webhooks for customer support',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Complex BSP onboarding & Meta credit card registration',
      'Manual management of access token expiration & phone WABA IDs',
      'Difficult JSON payload construction for WhatsApp Flows',
      'No multi-channel messaging fallback',
      'Must build separate integration per platform'
    ],
    specialHighlight: {
      title: 'Interactive Buttons & WhatsApp Flows Supported',
      desc: 'Send interactive call-to-action buttons, quick replies, and multi-step interactive JSON forms directly inside customer WhatsApp chats.'
    },
    contentTypes: [
      { name: 'Text Messages', icon: '💬' },
      { name: 'Approved Templates', icon: '📋' },
      { name: 'Interactive Buttons', icon: '🔘' },
      { name: 'WhatsApp Flows', icon: '⚡' },
      { name: 'Documents & PDFs', icon: '📄' }
    ],
    guides: [
      { title: 'WhatsApp Business API Guide', desc: 'Complete guide to sending WhatsApp notifications, templates, and interactive messages via API.' },
      { title: 'Build WhatsApp Interactive Flows', desc: 'Step by step guide to creating multi-step interactive lead capture forms in WhatsApp.' },
      { title: 'WhatsApp Broadcast Campaigns', desc: 'Learn how to trigger opt-in WhatsApp marketing broadcasts to customer lists.' }
    ],
    crossPromo: {
      text: 'Also available: Unified Messaging API',
      linkText: 'Manage WhatsApp, Telegram, Discord, and Slack from one API endpoint',
      slug: '/telegram'
    },
    curlCode: `curl -X POST https://api.rockyt.com/v1/whatsapp/messages \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+14155550199",
    "type": "template",
    "templateName": "order_update_v1",
    "language": "en_US",
    "parameters": ["#8819", "Shipped"]
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.whatsapp.send({
  to: "+14155550199",
  template: "order_update_v1",
  parameters: ["#8819", "Shipped"]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.whatsapp.send(
    to="+14155550199",
    template="order_update_v1",
    parameters=["#8819", "Shipped"]
)`,
    mcpCode: `{
  "tool": "rockyt_send_whatsapp",
  "arguments": {
    "to": "+14155550199",
    "text": "Your order #8819 has shipped!"
  }
}`,
    faq: [
      { q: "Can I send WhatsApp template messages?", a: "Yes. Pre-approved Meta template buttons, quick replies, and parameter variables are fully supported." },
      { q: "Do you support interactive WhatsApp Flows?", a: "Yes. Trigger full multi-step interactive JSON flows directly inside WhatsApp for lead capture or booking." },
      { q: "Can I receive incoming customer messages?", a: "Yes. Configure webhooks at `/v1/webhooks` to receive incoming customer WhatsApp messages in real-time." }
    ]
  },
  '/tiktok': {
    name: 'TikTok',
    displayName: 'TikTok',
    badge: 'TIKTOK CONTENT PARTNER',
    category: 'SOCIAL PUBLISHING',
    endpoint: 'POST /v1/posts',
    icon: '🎵',
    tagline: 'Direct Video Uploads, Captions, Sound Sync & TikTok Photo Mode for AI Agents',
    description: "Stop wrestling with TikTok Content Posting API chunking and OAuth states. Rockyt handles video encoding, sound sync, and post privacy controls - so you can focus on building your product.",
    directApiName: 'TikTok Content Posting API',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Automatic video chunking & upload initialization',
      'Supports TikTok Video & Photo Slideshow mode',
      'Privacy settings & caption hashtag management',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Complex video chunking requirements for large files',
      'Strict video format and duration validation rules',
      'OAuth access token refresh handling overhead',
      'No multi-platform sync out of the box',
      'Must build separate integration per platform'
    ],
    specialHighlight: {
      title: 'Direct Video Uploads & Sound Sync Supported',
      desc: 'Publish 1080p MP4 videos directly to TikTok user profiles. Set captions, hashtags, comment permissions, and duet/stitch settings programmatically.'
    },
    contentTypes: [
      { name: 'Short Videos (MP4)', icon: '🎥' },
      { name: 'Photo Slideshows', icon: '🖼️' },
      { name: 'Comment Replies', icon: '💬' }
    ],
    guides: [
      { title: 'TikTok Content API Guide', desc: 'Complete guide to publishing TikTok videos via API. Video encoding, captions, and privacy controls.' },
      { title: 'Post Photos to TikTok API', desc: 'Step by step tutorial for creating TikTok Photo Mode posts programmatically.' }
    ],
    crossPromo: {
      text: 'Also available: TikTok Ads API',
      linkText: 'Run paid TikTok Spark & In-Feed ads via the same API',
      slug: '/tiktok-ads'
    },
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{
    "platforms": [{"platform": "tiktok", "accountId": "acc_tt_5521"}],
    "content": "AI Agent publishing live on TikTok! #AI #Tech",
    "mediaItems": [{"type": "video", "url": "https://cdn.rockyt.com/tiktok_video.mp4"}]
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.posts.create({
  platforms: [{ platform: "tiktok", accountId: "acc_tt_5521" }],
  content: "AI Agent publishing live on TikTok! #AI #Tech",
  mediaItems: [{ type: "video", url: "https://cdn.rockyt.com/tiktok_video.mp4" }]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.posts.create(
    platforms=["tiktok"],
    content="AI Agent publishing live on TikTok! #AI",
    media_url="https://cdn.rockyt.com/tiktok_video.mp4"
)`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": {
    "platform": "tiktok",
    "content": "AI Agent publishing live on TikTok!",
    "mediaUrl": "https://cdn.rockyt.com/tiktok_video.mp4"
  }
}`,
    faq: [
      { q: "What video formats are supported on TikTok?", a: "MP4 or MOV videos at 1080x1920 (9:16 aspect ratio), under 10 minutes in duration." },
      { q: "Can I set video privacy (public vs private draft)?", a: "Yes. Pass privacyLevel: 'PUBLIC_TO_EVERYONE' or 'MUTUAL_FOLLOW_FRIENDS' in the request." }
    ]
  },
  '/telegram': {
    name: 'Telegram',
    displayName: 'Telegram',
    badge: 'TELEGRAM BOT API',
    category: 'DIRECT MESSAGING',
    endpoint: 'POST /v1/telegram/messages',
    icon: '✈️',
    tagline: 'Bot Messages, Channel Broadcasting, Inline Action Keyboards & Media Files',
    description: "Stop wrestling with BotFather tokens and chat ID lookups. Rockyt provides unified Telegram messaging, channel broadcasting, and interactive inline buttons.",
    directApiName: 'Telegram Bot API Direct',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Channel broadcasting & bot DMs',
      'Inline URL & callback button keyboards',
      'Unified webhook handler for incoming commands',
      'One API for 16 platforms'
    ],
    directApiCons: [
      'Manually managing bot tokens and chat ID numerical formats',
      'Complex JSON inline keyboard layout structures',
      'Handling webhook SSL certificate validation',
      'No unified inbox across platforms',
      'Must build separate integration per platform'
    ],
    specialHighlight: {
      title: 'Channel Broadcasting & Inline Keyboards Supported',
      desc: 'Broadcast updates to unlimited Telegram channel subscribers or send 1-on-1 bot messages with interactive inline URL and callback buttons.'
    },
    contentTypes: [
      { name: 'Text Messages', icon: '💬' },
      { name: 'Photos & Videos', icon: '🖼️' },
      { name: 'Inline Keyboards', icon: '🔘' },
      { name: 'Documents & Files', icon: '📄' }
    ],
    guides: [
      { title: 'Telegram Bot API Guide', desc: 'Complete guide to sending Telegram messages, channel posts, and inline buttons via API.' }
    ],
    curlCode: `curl -X POST https://api.rockyt.com/v1/telegram/messages \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{
    "chatId": "@rockyt_announcements",
    "text": "🚀 New AI Agent release is live!",
    "replyMarkup": {
      "inline_keyboard": [[{"text": "View Release Notes", "url": "https://rockyt.io"}]]
    }
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.telegram.send({
  chatId: "@rockyt_announcements",
  text: "🚀 New AI Agent release is live!",
  buttons: [{ text: "View Release Notes", url: "https://rockyt.io" }]
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.telegram.send(
    chat_id="@rockyt_announcements",
    text="🚀 New AI Agent release is live!"
)`,
    mcpCode: `{
  "tool": "rockyt_send_telegram",
  "arguments": {
    "chatId": "@rockyt_announcements",
    "text": "🚀 New AI Agent release is live!"
  }
}`,
    faq: [
      { q: "Can I broadcast to Telegram public channels?", a: "Yes. Add your bot as an Admin in the Telegram Channel and pass the channel handle (e.g. `@my_channel`)." }
    ]
  },
  '/meta-ads': {
    name: 'Meta Ads',
    displayName: 'Meta Ads (FB & IG)',
    badge: 'META MARKETING API',
    category: 'PAID ADVERTISING',
    endpoint: 'POST /v1/ads/meta',
    icon: '🎯',
    tagline: 'Programmatic Facebook & Instagram Ad Campaigns, Audiences & ROAS Analytics',
    description: "Stop wrestling with Meta Marketing API SDK complex Graph nodes. Rockyt handles Campaign Budget Optimization (CBO), creative media upload, and conversion webhooks.",
    directApiName: 'Meta Marketing API Direct',
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Programmatic Campaign & Ad Set creation',
      'Automated Video & Image creative uploads',
      'Real-time ROAS & conversion webhooks',
      'One API for 6 ad networks'
    ],
    directApiCons: [
      'Complex System User token generation & App review permissions',
      'Extremely complex nested Graph API requests for Campaigns/AdSets/Ads',
      'Frequent ad policy API breaking changes',
      'Separate integration required per ad network',
      'Difficult custom audience hash formatting'
    ],
    specialHighlight: {
      title: 'Programmatic Ad Creation & Real-Time ROAS Webhooks',
      desc: 'Launch targeted Facebook & Instagram ad campaigns programmatically. Monitor real-time conversion webhooks and adjust budgets dynamically with AI agents.'
    },
    contentTypes: [
      { name: 'CBO Campaigns', icon: '📈' },
      { name: 'Ad Sets & Bidding', icon: '🎯' },
      { name: 'Video Ad Creatives', icon: '🎥' },
      { name: 'Custom Audiences', icon: '👥' }
    ],
    guides: [
      { title: 'Meta Ads API Guide', desc: 'Complete guide to launching Facebook & Instagram ads programmatically via API.' }
    ],
    curlCode: `curl -X POST https://api.rockyt.com/v1/ads/meta \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{
    "adAccountId": "act_991820192",
    "name": "AI Agent Growth Campaign",
    "dailyBudget": 5000,
    "creative": {
      "headline": "Ship Social API in 30s",
      "mediaUrl": "https://cdn.rockyt.com/ad_video.mp4"
    }
  }'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.ads.createMeta({
  adAccountId: "act_991820192",
  name: "AI Agent Growth Campaign",
  dailyBudget: 5000,
  creative: { headline: "Ship Social API in 30s", mediaUrl: "https://cdn.rockyt.com/ad_video.mp4" }
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.ads.create_meta(ad_account_id="act_991820192", daily_budget=5000)`,
    mcpCode: `{
  "tool": "rockyt_create_meta_ad",
  "arguments": {
    "adAccountId": "act_991820192",
    "name": "AI Agent Growth Campaign",
    "dailyBudget": 5000
  }
}`,
    faq: [
      { q: "Can I manage both Facebook and Instagram Ads?", a: "Yes. Meta Ads API covers placement across Facebook Feed, Instagram Reels, Stories, and Audience Network." }
    ]
  }
};

const defaultPlatformData = (slug: string): PlatformConfig => {
  const cleanName = slug.replace('/', '').replace('-', ' ').toUpperCase();
  return {
    name: cleanName,
    displayName: cleanName,
    badge: 'ROCKYT NATIVE PARTNER',
    category: 'UNIFIED API',
    endpoint: `POST /v1${slug}`,
    icon: '🔌',
    tagline: `Programmatic ${cleanName} Integration API for AI Agents & Developers`,
    description: `Stop wrestling with ${cleanName}'s native API limits. Rockyt handles OAuth, rate limits, media processing, and error handling - so you can focus on building your product.`,
    directApiName: `${cleanName} Direct API`,
    rockytPros: [
      'Simple API key - start in 30 seconds',
      'Automatic retries & queue management',
      'Upload directly - we handle formatting',
      'Zero maintenance forever',
      'One API for 16 platforms'
    ],
    directApiCons: [
      `Complex OAuth with ${cleanName} app review approval`,
      'Strict rate limits & daily quota management',
      'Media must be uploaded in multiple complex steps',
      'Frequent API breaking changes requiring maintenance',
      'Build separate integration per platform'
    ],
    specialHighlight: {
      title: `Official ${cleanName} Integration Supported`,
      desc: `Connect your ${cleanName} accounts and publish content or send messages programmatically. Unified under the exact same REST API and MCP protocol.`
    },
    contentTypes: [
      { name: 'Text Posts', icon: '📄' },
      { name: 'Media Uploads', icon: '🖼️' },
      { name: 'Scheduled Content', icon: '⏰' },
      { name: 'Webhooks', icon: '⚡' }
    ],
    guides: [
      { title: `${cleanName} Integration Guide`, desc: `Complete guide to connecting and automating ${cleanName} via Rockyt unified API.` }
    ],
    curlCode: `curl -X POST https://api.rockyt.com/v1/posts \\
  -H "Authorization: Bearer rockyt_live_99f381a94b8e21c" \\
  -d '{"platforms": [{"platform": "${slug.replace('/', '')}"}], "content": "Automated update!"}'`,
    nodeCode: `import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

await rockyt.posts.create({
  platforms: [{ platform: "${slug.replace('/', '')}" }],
  content: "Automated update!"
});`,
    pyCode: `from rockyt import Rockyt
client = Rockyt(api_key="rockyt_live_99f381a94b8e21c")

client.posts.create(platforms=["${slug.replace('/', '')}"], content="Automated update!")`,
    mcpCode: `{
  "tool": "rockyt_post_content",
  "arguments": { "platform": "${slug.replace('/', '')}", "content": "Automated update!" }
}`,
    faq: [
      { q: `How quickly can I integrate ${cleanName}?`, a: "Takes less than 30 seconds. Get your API key and publish your first request instantly." }
    ]
  };
};

const PlatformPage: React.FC<PlatformPageProps> = ({ slug, onBack, onGetApiKey, onNavigateToPath }) => {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'py' | 'mcp'>('node');
  const [copied, setCopied] = useState(false);
  const [demoInput, setDemoInput] = useState('');

  const data = platformDataMap[slug] || defaultPlatformData(slug);

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
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-24 px-4 sm:px-6 relative z-10 font-mono">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* 1. TOP NAVIGATION BAR */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-brand font-bold uppercase transition-colors"
          >
            <ArrowLeft size={16} /> Back to Rockyt Home
          </button>

          <span className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5 bg-brand/10 border border-brand/30 px-2.5 py-1">
            <span className="w-2 h-2 bg-brand rounded-full animate-ping"></span>
            {data.category}
          </span>
        </div>

        {/* 2. HERO SECTION */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-brand text-white text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-widest">
                {data.badge}
              </span>
              <span className="bg-zinc-900 text-white/80 border border-white/15 text-[10px] px-2.5 py-0.5 font-bold font-mono">
                {data.endpoint}
              </span>
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-6xl uppercase tracking-tight text-white leading-tight mb-4">
              Ship Your <span className="text-brand inline-flex items-center gap-2">{data.icon} {data.displayName}</span> Integration In Minutes, Not Months
            </h1>
            
            <p className="text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">
              {data.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-6">
              <button
                onClick={onGetApiKey}
                className="bg-brand text-white font-bold text-xs uppercase px-6 py-3.5 tracking-wider hover:bg-white hover:text-black transition-all border-2 border-brand flex items-center gap-2"
              >
                Start Free Trial <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  const docsEl = document.getElementById('code-example-section');
                  docsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-zinc-900 text-white font-bold text-xs uppercase px-6 py-3.5 tracking-wider hover:bg-zinc-800 border border-white/20 transition-all"
              >
                View API Docs
              </button>
            </div>

            <p className="text-[11px] text-white/50 pt-3">
              No credit card required • <span className="text-brand cursor-pointer hover:underline" onClick={onGetApiKey}>View {data.name} API Reference →</span>
            </p>
          </div>

          {/* Hero Code Terminal Window */}
          <div className="bg-zinc-950 border-2 border-white/20 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-zinc-900 border-b border-white/15 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-xs font-mono text-white/60 ml-2">{data.endpoint}</span>
              </div>
              <span className="text-[10px] text-brand uppercase font-bold tracking-widest">HTTP 200 OK</span>
            </div>
            <pre className="p-4 sm:p-6 text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed bg-black/90">
              <code>{data.curlCode}</code>
            </pre>
          </div>
        </div>

        {/* 3. ROCKYT VS DIRECT API COMPARISON TABLE */}
        <div className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/15 pb-4 gap-2">
            <div>
              <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// DIRECT API VS UNIFIED API</span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-tight">
                ROCKYT VS <span className="text-brand">{data.directApiName.toUpperCase()}</span>
              </h2>
            </div>
            <span className="text-xs bg-brand/10 border border-brand/40 text-brand px-3 py-1 font-bold uppercase">
              ⚡ SHIP IN 30 SECONDS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rockyt API (Pros) */}
            <div className="bg-zinc-900/90 border border-emerald-500/30 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <span className="font-display font-bold text-lg text-emerald-400 uppercase">Rockyt Unified API</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 font-bold uppercase">RECOMMENDED</span>
              </div>
              <ul className="space-y-3 text-xs">
                {data.rockytPros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/90">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct API (Cons) */}
            <div className="bg-zinc-900/40 border border-red-500/20 p-6 space-y-4 opacity-80">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                <span className="font-display font-bold text-lg text-red-400 uppercase">{data.directApiName}</span>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 font-bold uppercase">HIGH FRICTION</span>
              </div>
              <ul className="space-y-3 text-xs">
                {data.directApiCons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/60">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-brand/10 border border-brand/40 p-4 text-center">
            <p className="text-xs text-white/90 font-mono">
              <strong className="text-brand uppercase">Ship in 30 Seconds:</strong> Ship {data.name} API integration today, not next month.
            </p>
          </div>
        </div>

        {/* 4. SPECIALIZED HIGHLIGHT CALLOUT BOX */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-2 border-brand p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-hard">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{data.icon}</span>
              <h3 className="font-display font-bold text-xl uppercase text-white tracking-wide">
                {data.specialHighlight.title}
              </h3>
            </div>
            <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
              {data.specialHighlight.desc}
            </p>
          </div>
          <button
            onClick={onGetApiKey}
            className="bg-brand text-white font-bold text-xs uppercase px-5 py-3 tracking-wider hover:bg-white hover:text-black transition-all shrink-0 border border-brand"
          >
            Connect Account Now
          </button>
        </div>

        {/* 5. INTERACTIVE PLAYGROUND / LIVE SANDBOX */}
        <div className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/15 pb-4">
            <div>
              <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// LIVE SANDBOX</span>
              <h3 className="font-display font-bold text-2xl uppercase">INTERACTIVE PLAYGROUND</h3>
            </div>
            <span className="text-xs text-white/60">No credit card required</span>
          </div>

          <p className="text-xs text-white/70">
            Connect your {data.name} account and send a test request through the API. No signup form, no credit card. Just click and ship.
          </p>

          <div className="bg-zinc-900 border border-white/15 p-6 space-y-4">
            <div className="flex items-center gap-3 bg-black p-3 border border-white/10">
              <span className="text-xs text-brand font-bold uppercase">{data.endpoint}</span>
              <input
                type="text"
                placeholder={`Try publishing to ${data.name}...`}
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none flex-1 font-mono"
              />
            </div>
            <button
              onClick={onGetApiKey}
              className="bg-brand text-white font-bold text-xs uppercase px-6 py-3 tracking-wider hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 border border-brand"
            >
              Connect {data.displayName} &amp; Test Request <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 6. CONTENT TYPES GRID */}
        <div className="space-y-6">
          <div className="border-b border-white/15 pb-4">
            <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// FORMAT SUPPORT</span>
            <h3 className="font-display font-bold text-2xl uppercase">SUPPORTED CONTENT TYPES</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.contentTypes.map((ct, idx) => (
              <div key={idx} className="bg-zinc-900 border border-white/15 p-4 text-center space-y-2 hover:border-brand transition-colors">
                <span className="text-2xl block">{ct.icon}</span>
                <span className="text-xs font-bold uppercase text-white block">{ct.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. HOW IT WORKS (3 STEPS) */}
        <div className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-8">
          <div className="border-b border-white/15 pb-4">
            <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// INTEGRATION ARCHITECTURE</span>
            <h3 className="font-display font-bold text-2xl uppercase">HOW IT WORKS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3 relative">
              <span className="text-brand font-display font-bold text-3xl opacity-40">01</span>
              <h4 className="font-display font-bold text-lg uppercase text-white">1. Connect Account</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Link your {data.name} profile or account through our dashboard. One-click OAuth authorization — we handle all permissions.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3 relative">
              <span className="text-brand font-display font-bold text-3xl opacity-40">02</span>
              <h4 className="font-display font-bold text-lg uppercase text-white">2. Build Integration</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Use our simple REST API or native MCP tool to schedule posts with text, images, videos, or documents. Same format works for all 16 platforms.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3 relative">
              <span className="text-brand font-display font-bold text-3xl opacity-40">03</span>
              <h4 className="font-display font-bold text-lg uppercase text-white">3. We Handle the Rest</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Rockyt publishes at your scheduled time, retries on failures, and notifies you via webhooks. You never touch {data.name}'s native API directly.
              </p>
            </div>
          </div>
        </div>

        {/* 8. KEY FEATURES & BENEFITS GRID */}
        <div className="space-y-6">
          <div className="border-b border-white/15 pb-4">
            <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// ARCHITECTURE ADVANTAGES</span>
            <h3 className="font-display font-bold text-2xl uppercase">KEY FEATURES</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3">
              <div className="p-2 bg-brand/10 border border-brand/40 text-brand w-fit">🚀</div>
              <h4 className="font-display font-bold text-lg uppercase text-white">Ship Faster</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Go from zero to posting in under 60 seconds. No partner program approval — just get your API key and start building.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3">
              <div className="p-2 bg-brand/10 border border-brand/40 text-brand w-fit">🛡️</div>
              <h4 className="font-display font-bold text-lg uppercase text-white">Official API, Zero Hassle</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                We use {data.name}'s official API under the hood. You get full compliance and reliability without the integration headache.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/15 p-6 space-y-3">
              <div className="p-2 bg-brand/10 border border-brand/40 text-brand w-fit">⚙️</div>
              <h4 className="font-display font-bold text-lg uppercase text-white">We Handle the Hard Parts</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Rate limits, token refreshes, media processing, error handling — all managed for you. Focus on your product, not infrastructure.
              </p>
            </div>
          </div>
        </div>

        {/* 9. CROSS PROMO BANNER */}
        {data.crossPromo && (
          <div className="bg-zinc-900 border border-white/15 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-brand text-lg font-bold">💡</span>
              <div>
                <span className="text-xs font-bold text-white uppercase block">{data.crossPromo.text}</span>
                <span className="text-[11px] text-white/60">{data.crossPromo.linkText}</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateToPath && onNavigateToPath(data.crossPromo!.slug)}
              className="text-xs text-brand hover:underline font-bold uppercase shrink-0 flex items-center gap-1"
            >
              Explore {data.crossPromo.slug.replace('/', '')} →
            </button>
          </div>
        )}

        {/* 10. CODE EXAMPLE & IMPLEMENTATION SECTION */}
        <div id="code-example-section" className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
            <div>
              <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// CODE EXAMPLE</span>
              <h3 className="font-display font-bold text-2xl uppercase">IMPLEMENTATION SNIPPET</h3>
            </div>

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
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand text-white'
                      : 'bg-zinc-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black border border-white/15 rounded relative">
            <button
              onClick={copyCode}
              className="absolute top-3 right-3 text-xs text-brand hover:text-white flex items-center gap-1 font-bold bg-zinc-900 border border-white/15 px-3 py-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
            <pre className="p-4 text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>

          <p className="text-[11px] text-white/50 text-right">
            <span className="text-brand hover:underline cursor-pointer" onClick={onGetApiKey}>View Complete API Documentation →</span>
          </p>
        </div>

        {/* 11. API ERROR REFERENCE BANNER */}
        <div className="bg-zinc-900 border border-white/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-lg uppercase text-white">{data.name} API Error Reference</h4>
            <p className="text-xs text-white/70">
              Comprehensive guide to {data.name} API error codes. Find solutions and troubleshoot common integration issues.
            </p>
          </div>
          <button
            onClick={onGetApiKey}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-brand font-bold uppercase px-4 py-2 border border-brand/40 shrink-0"
          >
            View Error Reference →
          </button>
        </div>

        {/* 12. FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <div className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/15 pb-4">
            <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// FAQ</span>
            <h3 className="font-display font-bold text-2xl uppercase">FREQUENTLY ASKED QUESTIONS</h3>
          </div>

          <div className="space-y-4">
            {data.faq.map((item, idx) => (
              <div key={idx} className="bg-zinc-900 border border-white/15 p-5 space-y-2">
                <h4 className="text-xs text-brand font-bold uppercase flex items-center gap-2">
                  <HelpCircle size={16} /> {item.q}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 13. ONE API, 16 PLATFORMS NAVIGATION DIRECTORY */}
        <div className="bg-zinc-950 border-2 border-white/20 p-6 sm:p-8 space-y-8">
          <div className="border-b border-white/15 pb-4">
            <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// FULL PLATFORM COVERAGE</span>
            <h3 className="font-display font-bold text-2xl uppercase">ONE API, 16 PLATFORMS</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Social */}
            <div className="space-y-3">
              <span className="text-xs text-brand font-bold uppercase tracking-wider block border-b border-brand/30 pb-1">
                SOCIAL PUBLISHING
              </span>
              <ul className="space-y-2 text-xs">
                {allPlatformsList.social.map((p) => (
                  <li 
                    key={p.slug}
                    onClick={() => onNavigateToPath && onNavigateToPath(p.slug)}
                    className={`cursor-pointer flex items-center justify-between p-1.5 rounded transition-colors ${
                      slug === p.slug ? 'bg-brand/20 text-brand font-bold border border-brand/40' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2"><span>{p.icon}</span> {p.name}</span>
                    {slug === p.slug && <span className="text-[10px] text-brand">ACTIVE</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Messaging */}
            <div className="space-y-3">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block border-b border-emerald-500/30 pb-1">
                DIRECT MESSAGING
              </span>
              <ul className="space-y-2 text-xs">
                {allPlatformsList.messaging.map((p) => (
                  <li 
                    key={p.slug}
                    onClick={() => onNavigateToPath && onNavigateToPath(p.slug)}
                    className={`cursor-pointer flex items-center justify-between p-1.5 rounded transition-colors ${
                      slug === p.slug ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2"><span>{p.icon}</span> {p.name}</span>
                    {slug === p.slug && <span className="text-[10px] text-emerald-400">ACTIVE</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ads */}
            <div className="space-y-3">
              <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider block border-b border-yellow-500/30 pb-1">
                PAID ADVERTISING
              </span>
              <ul className="space-y-2 text-xs">
                {allPlatformsList.ads.map((p) => (
                  <li 
                    key={p.slug}
                    onClick={() => onNavigateToPath && onNavigateToPath(p.slug)}
                    className={`cursor-pointer flex items-center justify-between p-1.5 rounded transition-colors ${
                      slug === p.slug ? 'bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/40' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2"><span>{p.icon}</span> {p.name}</span>
                    {slug === p.slug && <span className="text-[10px] text-yellow-400">ACTIVE</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 14. BOTTOM CTA BANNER */}
        <div className="bg-zinc-950 border-2 border-brand p-8 sm:p-12 text-center space-y-6 shadow-hard relative overflow-hidden">
          <span className="text-[10px] text-brand font-bold uppercase tracking-widest">// START BUILDING</span>
          <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-tight max-w-2xl mx-auto">
            READY TO SHIP YOUR <span className="text-brand">{data.displayName.toUpperCase()}</span> INTEGRATION?
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
            Join 10,000+ developers who choose Rockyt over building with {data.name}'s API directly. Save reliability, write less code.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onGetApiKey}
              className="bg-brand text-white font-bold text-xs uppercase px-8 py-4 tracking-wider hover:bg-white hover:text-black transition-all border-2 border-brand shadow-hard"
            >
              Start Free Trial
            </button>
            <button
              onClick={onGetApiKey}
              className="bg-zinc-900 text-white font-bold text-xs uppercase px-8 py-4 tracking-wider hover:bg-zinc-800 border border-white/20 transition-all"
            >
              Read Documentation
            </button>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> SOC 2 TYPE II CERTIFIED</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> GDPR COMPLIANT</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformPage;
