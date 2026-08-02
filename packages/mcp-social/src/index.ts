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
    name: 'rockyt-mcp-social',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Social Media Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rockyt_create_post',
        description: 'Publish or schedule a social media post across platforms (Facebook, Instagram, LinkedIn, TikTok, X/Twitter, YouTube, Pinterest, Google Business).',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Text caption or post copy',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of target platform names (e.g. ["facebook", "instagram", "linkedin", "twitter"])',
            },
            mediaUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional public URLs of images or videos to attach to the post',
            },
            scheduledAt: {
              type: 'string',
              description: 'ISO-8601 timestamp to schedule post for future publishing (e.g. 2026-08-01T14:00:00Z). Omit to publish immediately.',
            },
          },
          required: ['content', 'platforms'],
        },
      },
      {
        name: 'rockyt_list_posts',
        description: 'Retrieve published or scheduled social media posts with status and platform filtering.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['all', 'published', 'scheduled', 'failed'],
              description: 'Filter posts by status',
            },
            platform: {
              type: 'string',
              description: 'Filter posts by platform (e.g. facebook, instagram, linkedin)',
            },
            limit: {
              type: 'number',
              description: 'Number of posts to return (default 20)',
            },
          },
        },
      },
      {
        name: 'rockyt_delete_post',
        description: 'Delete or cancel a scheduled or published social media post by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            postId: {
              type: 'string',
              description: 'Unique ID of the post to delete or cancel',
            },
          },
          required: ['postId'],
        },
      },
      {
        name: 'rockyt_get_post_analytics',
        description: 'Fetch engagement analytics, impressions, views, likes, shares, and clicks for posts or profiles.',
        inputSchema: {
          type: 'object',
          properties: {
            postId: {
              type: 'string',
              description: 'Optional post ID to get analytics for a single post',
            },
            period: {
              type: 'string',
              enum: ['7d', '30d', '90d', '1y'],
              description: 'Time period for aggregated channel analytics (default 30d)',
            },
          },
        },
      },
      {
        name: 'rockyt_list_comments',
        description: 'Fetch user comments and feedback on social media posts across connected channels.',
        inputSchema: {
          type: 'object',
          properties: {
            postId: {
              type: 'string',
              description: 'Optional post ID to filter comments for a specific post',
            },
            platform: {
              type: 'string',
              description: 'Optional platform filter (e.g. facebook, instagram)',
            },
          },
        },
      },
      {
        name: 'rockyt_reply_comment',
        description: 'Post a reply to a specific user comment on a social media post.',
        inputSchema: {
          type: 'object',
          properties: {
            commentId: {
              type: 'string',
              description: 'ID of the comment to reply to',
            },
            replyMessage: {
              type: 'string',
              description: 'Text content of the reply',
            },
          },
          required: ['commentId', 'replyMessage'],
        },
      },
    ],
  };
});

// Helper for API requests
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

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'rockyt_create_post') {
      const { content, platforms, mediaUrls, scheduledAt } = args as any;
      const res = await callRockytApi('/api/v1/posts', 'POST', {
        content,
        platforms,
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt || null,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_list_posts') {
      const { status, platform, limit } = (args || {}) as any;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (platform) params.append('platform', platform);
      if (limit) params.append('limit', String(limit));

      const res = await callRockytApi(`/api/v1/posts?${params.toString()}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_delete_post') {
      const { postId } = args as any;
      const res = await callRockytApi(`/api/v1/posts/${encodeURIComponent(postId)}`, 'DELETE');
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_get_post_analytics') {
      const { postId, period } = (args || {}) as any;
      const endpoint = postId
        ? `/api/v1/posts/${encodeURIComponent(postId)}/analytics`
        : `/api/v1/analytics?period=${period || '30d'}`;
      const res = await callRockytApi(endpoint);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_list_comments') {
      const { postId, platform } = (args || {}) as any;
      const params = new URLSearchParams();
      if (postId) params.append('postId', postId);
      if (platform) params.append('platform', platform);

      const res = await callRockytApi(`/api/v1/comments?${params.toString()}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_reply_comment') {
      const { commentId, replyMessage } = args as any;
      const res = await callRockytApi(`/api/v1/comments/${encodeURIComponent(commentId)}/reply`, 'POST', {
        message: replyMessage,
      });
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
  console.error('Rockyt Social Media MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Fatal error starting mcp-social:', err);
  process.exit(1);
});
