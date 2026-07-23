# ROCKYT AUTHENTICATION & API KEY GUIDE FOR AI AGENTS
# Base URL: https://rockyt.io/api/v1

This document explains how AI agents and developer applications authenticate with the Rockyt Platform.

---

## 1. OVERVIEW

Rockyt uses Bearer Token Authentication for all REST API endpoints.

- **API Keys**: Issued with the prefix `rkt_live_` (or `zwl_`).
- **Scope**: Granted full access to create posts, schedule campaigns, inspect account usage, and connect social channels for the parent user account.
- **Location**: Must be sent in the HTTP `Authorization` header.

Header Syntax:
```http
Authorization: Bearer rkt_live_YOUR_API_KEY
```

---

## 2. GENERATING AN API KEY

### Option A: Via Dashboard (Recommended for Users)
1. Sign in to the Rockyt Dashboard at `https://rockyt.io/`.
2. Navigate to the **APIs / Developer Settings** tab in the top/sidebar menu.
3. Click **Get API Key** or **Create API Key**.
4. Copy the generated key (`rkt_live_...`) and store it securely in your `.env` file as `ROCKYT_API_KEY`.

### Option B: Via Programmatic API Endpoint (For Automated Agents)
If your agent possesses an active Supabase user session token (`access_token`):

`POST https://rockyt.io/api/v1/keys`

Headers:
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

Response (201 Created):
```json
{
  "key": "rkt_live_7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c"
}
```

---

## 3. VERIFYING AN API KEY

To verify that an API key is valid and check connected account quotas:

`GET https://rockyt.io/api/v1/me/dashboard-usage`

Headers:
```http
Authorization: Bearer rkt_live_YOUR_API_KEY
```

Response (200 OK):
```json
{
  "connectedAccounts": 1,
  "maxAccounts": 1
}
```

---

## 4. SECURITY BEST PRACTICES FOR AGENTS

1. Never hardcode API keys directly into source files or git repositories.
2. Always read the key from environment variables (`process.env.ROCKYT_API_KEY` or `os.getenv("ROCKYT_API_KEY")`).
3. Add `.env` to `.gitignore`.
4. If a key is compromised, immediately revoke it via `DELETE https://rockyt.io/api/v1/keys/:id` or through the dashboard.

---
END OF AUTH GUIDE
