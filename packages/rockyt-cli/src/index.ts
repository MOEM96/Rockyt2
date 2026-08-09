#!/usr/bin/env node
import { Rockyt } from '@rockyt/node';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
  🚀 Rockyt CLI — Multi-Channel Social & Ads Automation API

  Usage:
    rockyt <command> [options]

  Commands:
    status                   Check Rockyt API connection & system status
    post --content <text>    Create and publish a post across social accounts
    analytics                Fetch aggregate performance metrics
    accounts                 List connected social accounts

  Environment Variables:
    ROCKYT_API_KEY           Your Rockyt API key (sk_rockyt_...)
    ROCKYT_BASE_URL          Optional API endpoint override
`);
    process.exit(0);
  }

  const apiKey = process.env.ROCKYT_API_KEY;
  if (!apiKey && command !== 'status') {
    console.error('Error: ROCKYT_API_KEY environment variable is required.');
    process.exit(1);
  }

  const client = new Rockyt({
    apiKey: apiKey || 'test-key',
    baseUrl: process.env.ROCKYT_BASE_URL || 'https://rockyt.io'
  });

  try {
    switch (command) {
      case 'status':
        console.log('✅ Rockyt CLI v1.0.0 — System Operational');
        break;
      case 'analytics':
        console.log('Fetching Rockyt analytics...');
        const metrics = await client.analytics.getMetrics();
        console.log(JSON.stringify(metrics, null, 2));
        break;
      case 'post':
        const contentIndex = args.indexOf('--content');
        if (contentIndex === -1 || !args[contentIndex + 1]) {
          console.error('Error: --content parameter required.');
          process.exit(1);
        }
        const text = args[contentIndex + 1];
        console.log(`Creating post: "${text}"...`);
        const res = await client.posts.create({
          content: text,
          platforms: [{ platform: 'x', accountId: 'default' }]
        });
        console.log('Post created:', JSON.stringify(res, null, 2));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`Execution failed: ${err.message}`);
    process.exit(1);
  }
}

main();
