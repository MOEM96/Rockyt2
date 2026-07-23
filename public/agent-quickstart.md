# ROCKYT AI AGENT COMPLETE API & SOCIAL ACCOUNT CONNECTION GUIDE
# Reference Architecture: Inspired by Zernio Platform API Specifications
# Base URL: https://rockyt.io/api/v1
# Format: Optimized for AI Agents (Cursor, Claude Code, Windsurf, ChatGPT, Custom Agents)

================================================================================
1. CORE ARCHITECTURE & GLOSSARY
================================================================================

Rockyt provides a unified REST API for social media publishing, ad management, DM inbox automation, and campaign analytics. 

Key Concepts:
- **Team**: Your top-level organization / workspace account. Rate limits and plan quotas (1 account limit for Growth/Trial, 10 for Scale) are computed per team.
- **Profile (`profileId`)**: A tenant container inside your workspace that groups connected social accounts (e.g. "Personal Brand", "Company A", or individual customer tenants).
- **Account (`accountId`)**: A specific connected social media channel (e.g., an Instagram Business page, a Facebook Page, a LinkedIn Org, a Twitter handle).
- **Post (`postId`)**: Content published or scheduled across one or multiple platforms via a unified JSON payload.
- **Idempotency (`x-request-id`)**: A unique request UUID sent in headers to ensure retried requests never produce duplicate posts within 5 minutes.

================================================================================
2. STEP-BY-STEP SOCIAL ACCOUNT CONNECTION FLOW FOR AI AGENTS
================================================================================

AI agents connect user social accounts through an OAuth authorization handshake.

--------------------------------------------------------------------------------
STEP 1: Create a Profile (Tenant Container)
--------------------------------------------------------------------------------
Profiles isolate connected accounts into logical brands or tenant buckets.

Endpoint: POST https://rockyt.io/api/v1/profiles
Headers:
  Authorization: Bearer rkt_live_YOUR_API_KEY
  Content-Type: application/json

Request Payload:
```json
{
  "name": "Main Marketing Profile",
  "description": "Primary social accounts for Rockyt platform"
}
```

Response (201 Created):
```json
{
  "profile": {
    "id": "66a1f0c2a4b9d3e8f1a2b3c4",
    "name": "Main Marketing Profile",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

--------------------------------------------------------------------------------
STEP 2: Generate Platform OAuth Connection URL
--------------------------------------------------------------------------------
To connect a social media account, request an OAuth authorization URL for the target platform.

Endpoint: GET https://rockyt.io/api/v1/connect/{platform}?profileId={profileId}
Headers:
  Authorization: Bearer rkt_live_YOUR_API_KEY

Supported Platforms ({platform}):
  - "facebook"    (Meta Facebook Pages & Ads)
  - "instagram"   (Instagram Business & Creator Accounts)
  - "tiktok"      (TikTok for Business)
  - "twitter"     (Twitter / X Accounts)
  - "linkedin"    (LinkedIn Personal & Organization Pages)
  - "youtube"     (YouTube Channels & Shorts)
  - "threads"     (Meta Threads)
  - "reddit"      (Reddit Community Accounts)
  - "pinterest"   (Pinterest Business Boards)
  - "bluesky"     (Bluesky Social AT Protocol)

Response (200 OK):
```json
{
  "authUrl": "https://rockyt.io/connect/oauth/authorize?platform=instagram&profileId=66a1f0c2a4b9d3e8f1a2b3c4&session_id=sess_12345"
}
```

Agent Instructions:
Present `authUrl` to the user or open it in a browser context. Once the user completes OAuth authorization, Rockyt automatically saves and binds the connected social account.

--------------------------------------------------------------------------------
STEP 3: List Connected Social Accounts
--------------------------------------------------------------------------------
Retrieve all active connected accounts to extract the `accountId` needed for posting.

Endpoint: GET https://rockyt.io/api/v1/accounts?profileId=66a1f0c2a4b9d3e8f1a2b3c4
Headers:
  Authorization: Bearer rkt_live_YOUR_API_KEY

Response (200 OK):
```json
{
  "accounts": [
    {
      "id": "acc_instagram_998877",
      "platform": "instagram",
      "username": "@rockyt_official",
      "profileId": "66a1f0c2a4b9d3e8f1a2b3c4",
      "status": "active"
    },
    {
      "id": "acc_twitter_112233",
      "platform": "twitter",
      "username": "@rockyt_io",
      "profileId": "66a1f0c2a4b9d3e8f1a2b3c4",
      "status": "active"
    }
  ]
}
```

================================================================================
3. COMPLETE ENDPOINT REFERENCE (ALL POSSIBLE ACTIONS)
================================================================================

--------------------------------------------------------------------------------
3.1 AUTHENTICATION & KEY MANAGEMENT
--------------------------------------------------------------------------------

Issue API Key:
  POST /api/v1/keys
  Headers: Authorization: Bearer <session_token>
  Response: { "key": "rkt_live_..." }

List Active Keys:
  GET /api/v1/keys
  Headers: Authorization: Bearer rkt_live_...
  Response: [{ "id": "key_123", "key_prefix": "rkt_live", "created_at": "..." }]

Revoke Key:
  DELETE /api/v1/keys/:id
  Headers: Authorization: Bearer rkt_live_...
  Response: { "success": true }

Check Quota & Account Usage:
  GET /api/v1/me/dashboard-usage
  Headers: Authorization: Bearer rkt_live_...
  Response: { "connectedAccounts": 1, "maxAccounts": 1 }

--------------------------------------------------------------------------------
3.2 MEDIA UPLOADS (PRESIGNED S3 URLS)
--------------------------------------------------------------------------------

Before posting images or videos, request a presigned upload URL:

Endpoint: POST /api/v1/media/presign
Headers:
  Authorization: Bearer rkt_live_YOUR_API_KEY
  Content-Type: application/json

Request Body:
```json
{
  "filename": "demo_video.mp4",
  "mimeType": "video/mp4",
  "size": 10485760
}
```

Response (200 OK):
```json
{
  "uploadUrl": "https://rockyt-media-storage.s3.amazonaws.com/uploads/demo_video.mp4?signature=...",
  "publicUrl": "https://rockyt.io/media/uploads/demo_video.mp4"
}
```

Workflow:
1. `PUT` the binary file bytes to `uploadUrl`.
2. Use `publicUrl` in the `media_urls` array when creating a post.

--------------------------------------------------------------------------------
3.3 MULTI-PLATFORM POSTING & SCHEDULING
--------------------------------------------------------------------------------

Endpoint: POST /api/v1/posts
Headers:
  Authorization: Bearer rkt_live_YOUR_API_KEY
  Content-Type: application/json
  x-request-id: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d (Optional idempotency UUID)

Request Body:
```json
{
  "content": "🚀 We just launched our AI Agent Social Automation API!",
  "scheduled_for": "2025-01-15T14:00:00Z",
  "timezone": "America/New_York",
  "media_urls": [
    "https://rockyt.io/media/uploads/demo_video.mp4"
  ],
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_twitter_112233"
    },
    {
      "platform": "instagram",
      "accountId": "acc_instagram_998877"
    }
  ]
}
```

Response (201 Created):
```json
{
  "id": "post_7766554433",
  "status": "scheduled",
  "content": "🚀 We just launched our AI Agent Social Automation API!",
  "scheduled_for": "2025-01-15T14:00:00Z",
  "platforms": [
    { "platform": "twitter", "status": "scheduled" },
    { "platform": "instagram", "status": "scheduled" }
  ]
}
```

--------------------------------------------------------------------------------
3.4 LIST & MANAGE POSTS
--------------------------------------------------------------------------------

List Posts:
  GET /api/v1/posts?status=scheduled&limit=20&page=1
  Headers: Authorization: Bearer rkt_live_...
  Response: { "posts": [...], "pagination": { "total": 12, "page": 1 } }

Get Single Post Details:
  GET /api/v1/posts/:id
  Headers: Authorization: Bearer rkt_live_...
  Response: { "id": "post_7766554433", "content": "...", "status": "published" }

Delete or Cancel Post:
  DELETE /api/v1/posts/:id
  Headers: Authorization: Bearer rkt_live_...
  Response: { "success": true, "message": "Post canceled successfully" }

--------------------------------------------------------------------------------
3.5 ANALYTICS & ROAS METRICS
--------------------------------------------------------------------------------

Get Account & Post Analytics:
  GET /api/v1/analytics?accountId=acc_instagram_998877&period=30d
  Headers: Authorization: Bearer rkt_live_...

Response (200 OK):
```json
{
  "accountId": "acc_instagram_998877",
  "metrics": {
    "impressions": 142500,
    "reach": 98200,
    "likes": 4820,
    "comments": 390,
    "shares": 185,
    "clicks": 1240,
    "estimated_roas": 3.85
  }
}
```

Sync External Platform Posts On-Demand:
  POST /api/v1/analytics/sync-external
  Headers: Authorization: Bearer rkt_live_...
  Request: { "accountId": "acc_instagram_998877" }
  Response: { "synced_posts": 14 }

--------------------------------------------------------------------------------
3.6 UNIFIED INBOX & MESSAGING
--------------------------------------------------------------------------------

List Direct Messages & Comments:
  GET /api/v1/inbox/messages?accountId=acc_instagram_998877
  Headers: Authorization: Bearer rkt_live_...

Response (200 OK):
```json
{
  "messages": [
    {
      "id": "msg_001122",
      "sender": "@customer_john",
      "content": "How do I connect my account?",
      "timestamp": "2025-01-15T11:20:00Z"
    }
  ]
}
```

Send Automated Reply:
  POST /api/v1/inbox/reply
  Headers: Authorization: Bearer rkt_live_...
  Request:
  ```json
  {
    "messageId": "msg_001122",
    "reply_text": "Hi @customer_john, check out our guide at https://rockyt.io/agent-quickstart.md!"
  }
  ```
  Response: { "success": true, "replyId": "rep_9988" }

--------------------------------------------------------------------------------
3.7 WEBHOOK SUBSCRIPTIONS
--------------------------------------------------------------------------------

Register Real-Time Event Webhook:
  POST /api/v1/webhooks
  Headers: Authorization: Bearer rkt_live_...
  Request:
  ```json
  {
    "url": "https://your-server.com/api/webhooks/rockyt",
    "events": ["post.published", "post.failed", "message.received"]
  }
  ```

================================================================================
4. CODE INTEGRATION PATTERNS FOR AGENTS
================================================================================

--------------------------------------------------------------------------------
TypeScript / Node.js
--------------------------------------------------------------------------------
```typescript
import Rockyt from '@rockyt/node';

const rockyt = new Rockyt(process.env.ROCKYT_API_KEY);

// Step 1: List connected accounts
const { accounts } = await rockyt.accounts.list();

// Step 2: Post across channels
const post = await rockyt.posts.create({
  content: 'Automated launch update from AI Agent!',
  platforms: accounts.map(a => ({ platform: a.platform, accountId: a.id }))
});

console.log('Post status:', post.status);
```

--------------------------------------------------------------------------------
Python
--------------------------------------------------------------------------------
```python
import os
import requests

API_KEY = os.getenv("ROCKYT_API_KEY")
BASE_URL = "https://rockyt.io/api/v1"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def publish_agent_post(text, platforms):
    payload = {"content": text, "platforms": platforms}
    res = requests.post(f"{BASE_URL}/posts", headers=HEADERS, json=payload)
    res.raise_for_status()
    return res.json()

result = publish_agent_post("Hello World!", ["twitter", "linkedin"])
print("Result:", result)
```

================================================================================
5. ERROR CODES & RETRY STRATEGY
================================================================================

HTTP Status Codes:
- `200 OK` / `201 Created`: Request succeeded.
- `400 Bad Request`: Invalid payload parameters.
- `401 Unauthorized`: API key is invalid or revoked.
- `403 Forbidden`: Account quota limit reached (1 account max for Growth/Trial, 10 for Scale).
- `409 Conflict`: Duplicate post content detected within 24 hours.
- `429 Too Many Requests`: Rate limit reached (100 req/min). Exponential backoff recommended.
- `500 Internal Server Error`: Temporary server glitch. Retry up to 3 times.

---
END OF COMPLETE AGENT GUIDE
