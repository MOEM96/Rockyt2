# @rockyt/node

Official Rockyt Node.js & TypeScript SDK for Unified Social Media, Messaging, and Ads API.

## Installation

```bash
npm install @rockyt/node
# or
yarn add @rockyt/node
# or
pnpm add @rockyt/node
```

## Quick Start

```typescript
import Rockyt from "@rockyt/node";

const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);

// 1. Connect any of 15+ channels via hosted OAuth
const { authUrl } = await rockyt.accounts.connect({
  platform: "instagram",
  profileId: "usr_942"
});

// 2. Publish everywhere in one call
await rockyt.posts.create({
  content: "Launch day with Rockyt API!",
  mediaItems: [{ type: "video", url: "https://example.com/demo.mp4" }],
  platforms: [
    { platform: "instagram", accountId: "acc_ig" },
    { platform: "linkedin", accountId: "acc_li" },
    { platform: "tiktok", accountId: "acc_tt" }
  ]
});

// 3. Unified messaging & AI Agent MCP action server
await rockyt.messaging.sendMessage({
  to: "+1234567890",
  text: "Welcome aboard!"
});
```

## How to Publish to npm

From inside `packages/rockyt-node`:

```bash
npm run build
npm publish --access public
```
