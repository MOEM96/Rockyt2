# Rockyt Authentication & API Key Setup

> Quickstart guide for developers and AI agents to authenticate with the Rockyt API and MCP server.

## 1. Sign Up & Get Your API Key
- Navigate to https://rockyt.io or open the Rockyt Developer Portal.
- Sign in with Google or create your developer account.
- Copy your live API key (`rockyt_live_...`).

## 2. Set Environment Variable
Export your key in your shell or `.env` file:
```bash
export ROCKYT_API_KEY="rockyt_live_your_api_key_here"
```

## 3. Verify Authentication
Test your API key with cURL:
```bash
curl -X GET https://api.rockyt.com/v1/me \
  -H "Authorization: Bearer $ROCKYT_API_KEY"
```

## 4. MCP Server Integration for AI Agents (Cursor, Claude Desktop, Windsurf)
Add the following to your `claude_desktop_config.json` or Cursor MCP settings:
```json
{
  "mcpServers": {
    "rockyt": {
      "command": "npx",
      "args": ["-y", "@rockyt/mcp-server"],
      "env": {
        "ROCKYT_API_KEY": "YOUR_ROCKYT_LIVE_API_KEY"
      }
    }
  }
}
```
