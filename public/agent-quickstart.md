# Rockyt AI Agent Quickstart

> Integrate Rockyt into your AI agent codebase to publish content, send DMs, manage ads, and trigger workflows across 16 channels.

## Step 1: Install the Rockyt SDK or CLI
- **Node.js**: `npm install @rockyt/sdk`
- **Python**: `pip install rockyt`
- **MCP Server**: `npx -y @rockyt/mcp-server`
- **CLI**: `npm install -g @rockyt/cli`

## Step 2: Initialize Rockyt Client
```typescript
import Rockyt from "@rockyt/sdk";
const rockyt = new Rockyt(process.env.ROCKYT_API_KEY!);
```

## Step 3: Connect Accounts (Hosted OAuth)
```typescript
// Generate hosted OAuth URL for your user
const { authUrl } = await rockyt.accounts.connect({
  platform: "instagram",
  profileId: "user_account_01"
});
```

## Step 4: Publish Across 16 Platforms
```typescript
await rockyt.posts.create({
  content: "Autonomous campaign online!",
  platforms: [
    { platform: "x", accountId: "acc_x" },
    { platform: "instagram", accountId: "acc_ig" },
    { platform: "linkedin", accountId: "acc_li" }
  ]
});
```

## Step 5: Send WhatsApp Messages
```typescript
await rockyt.whatsapp.send({
  to: "+14155550199",
  text: "Hello from Rockyt AI Agent!"
});
```
