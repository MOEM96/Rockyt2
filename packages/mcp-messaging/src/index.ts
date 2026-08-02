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
    name: 'rockyt-mcp-messaging',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Messaging Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rockyt_list_conversations',
        description: 'List active DM conversations across Instagram DMs, Facebook Messenger, WhatsApp, X DMs, and Telegram.',
        inputSchema: {
          type: 'object',
          properties: {
            channel: {
              type: 'string',
              description: 'Filter by channel (e.g. instagram, whatsapp, messenger, twitter, telegram)',
            },
            status: {
              type: 'string',
              enum: ['open', 'resolved', 'all'],
              description: 'Filter by conversation status (default: open)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of conversations to return (default: 20)',
            },
          },
        },
      },
      {
        name: 'rockyt_get_messages',
        description: 'Fetch message thread history for a specific conversation ID.',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
              description: 'ID of the conversation thread',
            },
            limit: {
              type: 'number',
              description: 'Number of recent messages to return (default: 50)',
            },
          },
          required: ['conversationId'],
        },
      },
      {
        name: 'rockyt_send_message',
        description: 'Send a direct message or customer reply to a conversation thread.',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
              description: 'ID of the target conversation thread',
            },
            text: {
              type: 'string',
              description: 'Message content to send to the recipient',
            },
            attachments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional pre-signed media URLs for images or document attachments',
            },
          },
          required: ['conversationId', 'text'],
        },
      },
      {
        name: 'rockyt_presign_media',
        description: 'Generate pre-signed upload URLs for uploading images/videos to attached messages or posts.',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file (e.g. image.jpg, video.mp4)',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type of the media file (e.g. image/jpeg, video/mp4)',
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
            },
          },
          required: ['filename', 'mimeType', 'size'],
        },
      },
      {
        name: 'rockyt_set_auto_reply',
        description: 'Configure automated AI response rules or keywords for inbound messages.',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Keyword trigger or * for all inbound DMs',
            },
            responseTemplate: {
              type: 'string',
              description: 'Automated response template or instructions for AI agent',
            },
            enabled: {
              type: 'boolean',
              description: 'Enable or disable the auto-reply rule',
            },
          },
          required: ['keyword', 'responseTemplate'],
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
    if (name === 'rockyt_list_conversations') {
      const { channel, status, limit } = (args || {}) as any;
      const params = new URLSearchParams();
      if (channel) params.append('channel', channel);
      if (status) params.append('status', status);
      if (limit) params.append('limit', String(limit));

      const res = await callRockytApi(`/api/v1/inbox/conversations?${params.toString()}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_get_messages') {
      const { conversationId, limit } = args as any;
      const params = new URLSearchParams();
      if (limit) params.append('limit', String(limit));

      const res = await callRockytApi(`/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_send_message') {
      const { conversationId, text, attachments } = args as any;
      const res = await callRockytApi(`/api/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, 'POST', {
        text,
        attachments: attachments || [],
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_presign_media') {
      const { filename, mimeType, size } = args as any;
      const res = await callRockytApi('/api/v1/media/presign', 'POST', {
        filename,
        mimeType,
        size,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    if (name === 'rockyt_set_auto_reply') {
      const { keyword, responseTemplate, enabled } = args as any;
      const res = await callRockytApi('/api/v1/inbox/auto-reply-rules', 'POST', {
        keyword,
        responseTemplate,
        enabled: enabled !== false,
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
  console.error('Rockyt Messaging MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Fatal error starting mcp-messaging:', err);
  process.exit(1);
});
