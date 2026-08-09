import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const ROCKYT_API_BASE = process.env.ROCKYT_API_BASE || 'https://rockyt.io';
const ROCKYT_API_KEY = process.env.ROCKYT_API_KEY || '';

const server = new Server(
  {
    name: 'rockyt-mcp-ads',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Ads Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rockyt_get_ad_account_balance',
        description: 'Retrieve prepaid balance, amount spent, spend cap, and status for ad accounts (Meta Ads, Google Ads, TikTok Ads).',
        inputSchema: {
          type: 'object',
          properties: {
            adAccountId: {
              type: 'string',
              description: 'Optional ad account ID (e.g. act_123456789). Omit to fetch primary ad account balance.',
            },
          },
        },
      },
      {
        name: 'rockyt_list_ad_campaigns',
        description: 'List active, paused, or draft ad campaigns with status, daily budget, and spend summary.',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              description: 'Filter campaigns by ad network (e.g. meta, google, tiktok)',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'ALL'],
              description: 'Filter campaigns by status (default: ALL)',
            },
            limit: {
              type: 'number',
              description: 'Maximum campaigns to return (default: 20)',
            },
          },
        },
      },
      {
        name: 'rockyt_create_ad_campaign',
        description: 'Create and launch a new ad campaign with daily budget, bidding strategy, and target audience.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Campaign name (e.g. "Q3 Retargeting Campaign")',
            },
            platform: {
              type: 'string',
              enum: ['meta', 'google', 'tiktok', 'twitter'],
              description: 'Ad network platform',
            },
            dailyBudget: {
              type: 'number',
              description: 'Daily budget in USD (e.g. 50.00)',
            },
            objective: {
              type: 'string',
              enum: ['CONVERSIONS', 'TRAFFIC', 'LEAD_GENERATION', 'BRAND_AWARENESS'],
              description: 'Campaign objective',
            },
            targetCountries: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target country ISO codes (e.g. ["US", "CA", "GB"])',
            },
          },
          required: ['name', 'platform', 'dailyBudget', 'objective'],
        },
      },
      {
        name: 'rockyt_update_ad_status',
        description: 'Pause, resume, archive, or adjust daily budget and spending caps for an ad campaign.',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'ID of the target ad campaign',
            },
            action: {
              type: 'string',
              enum: ['PAUSE', 'RESUME', 'ARCHIVE', 'UPDATE_BUDGET'],
              description: 'Action to perform on the campaign',
            },
            newDailyBudget: {
              type: 'number',
              description: 'Updated daily budget in USD (required if action is UPDATE_BUDGET)',
            },
          },
          required: ['campaignId', 'action'],
        },
      },
      {
        name: 'rockyt_get_ad_performance',
        description: 'Fetch detailed ad performance metrics (spend, impressions, clicks, CPC, CPM, conversions, and ROI).',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Optional campaign ID to get performance for a specific campaign',
            },
            period: {
              type: 'string',
              enum: ['7d', '30d', '90d', 'lifetime'],
              description: 'Analytics period (default: 30d)',
            },
          },
        },
      },
    ],
  };
});

// Helper for API calls
async function callRockytApi(endpoint: string, method = 'GET', body?: any) {
  const apiKey = ROCKYT_API_KEY || process.env.ROCKYT_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${ROCKYT_API_BASE}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rockyt API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'rockyt_get_ad_account_balance') {
      const { adAccountId } = (args || {}) as any;
      const endpoint = adAccountId
        ? `/api/v1/ads/accounts/${encodeURIComponent(adAccountId)}/balance`
        : `/api/v1/ads/accounts/balance`;

      const res = await callRockytApi(endpoint);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_list_ad_campaigns') {
      const { platform, status, limit } = (args || {}) as any;
      const params = new URLSearchParams();
      if (platform) params.append('platform', platform);
      if (status) params.append('status', status);
      if (limit) params.append('limit', String(limit));

      const res = await callRockytApi(`/api/v1/ads/campaigns?${params.toString()}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_create_ad_campaign') {
      const { name: campaignName, platform, dailyBudget, objective, targetCountries } = args as any;
      const res = await callRockytApi('/api/v1/ads/campaigns', 'POST', {
        name: campaignName,
        platform,
        dailyBudget,
        objective,
        targetCountries: targetCountries || ['US'],
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_update_ad_status') {
      const { campaignId, action, newDailyBudget } = args as any;
      const res = await callRockytApi(`/api/v1/ads/campaigns/${encodeURIComponent(campaignId)}/status`, 'POST', {
        action,
        newDailyBudget: newDailyBudget || null,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_get_ad_performance') {
      const { campaignId, period } = (args || {}) as any;
      const endpoint = campaignId
        ? `/api/v1/ads/campaigns/${encodeURIComponent(campaignId)}/performance?period=${period || '30d'}`
        : `/api/v1/ads/performance?period=${period || '30d'}`;

      const res = await callRockytApi(endpoint);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rockyt Ads MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Fatal error starting mcp-ads:', err);
  process.exit(1);
});
