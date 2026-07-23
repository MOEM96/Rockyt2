# ROCKYT AGENT QUICKSTART & INTEGRATION GUIDE
# Target: AI Coding Agents (Cursor, Claude Code, Windsurf, Custom LLMs)
# Base URL: https://rockyt.io/api/v1

This document provides instructions for AI agents to automatically issue API keys, configure environment variables, and integrate Rockyt REST API into any codebase.

---

## 1. AGENT WORKFLOW SUMMARY

1. **Obtain API Key**:
   - If user provided a bearer token or session token: Call `POST https://rockyt.io/api/v1/keys` with `Authorization: Bearer <session_token>` to issue a new API key.
   - Alternatively, prompt the user to paste their API key (`rkt_live_...`) generated in the Rockyt Dashboard.

2. **Configure Environment Variables**:
   - Add `ROCKYT_API_KEY=rkt_live_YOUR_KEY` to the project `.env` / `.env.local` file.
   - Add `ROCKYT_API_BASE_URL=https://rockyt.io/api/v1` to the environment.

3. **Install Client SDK or HTTP Helper**:
   - For Node.js / TypeScript:
     `npm install @rockyt/node` or use standard `fetch()` / `axios`.
   - For Python:
     `pip install requests` or use `rockyt` SDK.

---

## 2. API KEY GENERATION ENDPOINT

### Issue New API Key
`POST https://rockyt.io/api/v1/keys`

Headers:
```http
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

Response (201 Created):
```json
{
  "key": "rkt_live_7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c"
}
```

---

## 3. CORE ENDPOINT SPECIFICATION FOR AI AGENTS

### 3.1 Check Account Quota
`GET https://rockyt.io/api/v1/me/dashboard-usage`

Headers:
```http
Authorization: Bearer rkt_live_YOUR_KEY
```

Response:
```json
{
  "connectedAccounts": 1,
  "maxAccounts": 1
}
```
*Note: Growth / Free / Trial accounts allow up to 1 connected channel. Scale accounts allow up to 10 connected channels.*

---

### 3.2 Publish / Schedule Social Media Post
`POST https://rockyt.io/api/v1/posts`

Headers:
```http
Authorization: Bearer rkt_live_YOUR_KEY
Content-Type: application/json
```

Payload:
```json
{
  "content": "Automated post created by AI Agent!",
  "platforms": ["twitter", "linkedin", "instagram", "facebook"],
  "scheduled_for": "2025-01-15T09:00:00Z",
  "media_urls": ["https://example.com/demo.png"]
}
```

Supported Platforms:
- `"facebook"` (Meta Facebook Pages & Ads)
- `"instagram"` (Instagram Business & Reels)
- `"tiktok"` (TikTok Video Posts)
- `"twitter"` (Twitter / X Posts)
- `"linkedin"` (LinkedIn Profiles & Pages)
- `"youtube"` (YouTube Shorts & Videos)
- `"threads"` (Meta Threads)
- `"reddit"` (Reddit Community Posts)
- `"pinterest"` (Pinterest Pins)
- `"bluesky"` (Bluesky AT Protocol)

Response (200 OK):
```json
{
  "id": "post_99887766",
  "status": "scheduled",
  "platforms": ["twitter", "linkedin", "instagram", "facebook"],
  "scheduled_for": "2025-01-15T09:00:00Z",
  "created_at": "2025-01-14T18:30:00.000Z"
}
```

---

### 3.3 List Active API Keys
`GET https://rockyt.io/api/v1/keys`

Headers:
```http
Authorization: Bearer rkt_live_YOUR_KEY
```

Response:
```json
[
  {
    "id": "key_uuid_12345",
    "key_prefix": "rkt_live",
    "created_at": "2025-01-15T12:00:00.000Z"
  }
]
```

---

## 4. CODE INTEGRATION PATTERNS FOR AGENTS

### Node.js / TypeScript Example
```typescript
async function publishSocialPost(content: string, platforms: string[]) {
  const apiKey = process.env.ROCKYT_API_KEY;
  if (!apiKey) {
    throw new Error("ROCKYT_API_KEY environment variable is missing.");
  }

  const response = await fetch("https://rockyt.io/api/v1/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      platforms,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Rockyt API Error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
```

### Python Example
```python
import os
import requests

def publish_social_post(content: str, platforms: list):
    api_key = os.getenv("ROCKYT_API_KEY")
    if not api_key:
        raise ValueError("ROCKYT_API_KEY environment variable is not set.")

    url = "https://rockyt.io/api/v1/posts"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "content": content,
        "platforms": platforms
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()
```

---

## 5. ERROR HANDLING FOR AGENTS

Agents should parse HTTP error codes as follows:
- `400 Bad Request`: Check `content` length or unsupported platform parameter.
- `401 Unauthorized`: Verify `ROCKYT_API_KEY` Bearer token.
- `403 Forbidden`: Account quota reached (`connectedAccounts >= maxAccounts`).
- `429 Too Many Requests`: Throttle requests; retry after exponential backoff.
- `500 Server Error`: Retry up to 3 times before raising exception.

---
END OF AGENT GUIDE
