import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const ApiDashboardTab: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<{ id: string, key_prefix: string, created_at: string }[]>([]);
  const [usage, setUsage] = useState<{ connectedAccounts: number, maxAccounts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python' | 'go' | 'ruby' | 'java' | 'php' | 'dotnet'>('curl');
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const fetchData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(id);
      }
    };

    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      const [keysRes, usageRes] = await Promise.all([
        fetchWithTimeout('/api/v1/keys', { headers }),
        fetchWithTimeout('/api/v1/me/dashboard-usage', { headers })
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData || []);
      } else {
        const errData = await keysRes.json().catch(() => ({}));
        console.error('Keys API error:', keysRes.status, errData);
        setError('Failed to fetch API keys. Please verify your credentials or try again.');
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      } else {
        const errData = await usageRes.json().catch(() => ({}));
        console.error('Usage API error:', usageRes.status, errData);
        setError('Failed to fetch API usage limit.');
      }
    } catch (err: any) {
      console.error('Failed to fetch API tab data:', err);
      setError(err.name === 'AbortError' 
        ? 'Request timed out. Please check your network connection and try again.'
        : 'Failed to load API keys and usage. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [session, authLoading]);

  const generateKey = async () => {
    if (!session) {
      alert('You must be logged in to generate an API key.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setCopied(false);
        await fetchData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        setError(`Failed to generate key: ${errorData.error}`);
      }
    } catch (err: any) {
      console.error('Error generating key:', err);
      setError('An error occurred while generating the key.');
    } finally {
      setGenerating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!session) {
      alert('You must be logged in to revoke an API key.');
      return;
    }
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone and any integrations using it will break.')) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/v1/keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        await fetchData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        setError(`Failed to revoke key: ${errorData.error}`);
      }
    } catch (err: any) {
      console.error('Error revoking key:', err);
      setError('An error occurred while revoking the key.');
    }
  };

  const handleCopyNewKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const agentPromptText = "Get an API key from rockyt.io/api/v1, then follow rockyt.io/docs/quickstart to integrate Rockyt REST API into the codebase.";

  const copyAgentPrompt = () => {
    navigator.clipboard.writeText(agentPromptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST "https://rockyt.io/api/v1/posts" \\
  -H "Authorization: Bearer rkt_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Shipped v2.0! Check it out",
    "platforms": ["twitter", "linkedin", "instagram"],
    "scheduled_for": "2025-01-15T09:00:00Z"
  }'`,
    node: `import Rockyt from '@rockyt/node';

const rockyt = new Rockyt('rkt_live_YOUR_KEY');

const post = await rockyt.posts.create({
  content: 'Shipped v2.0! Check it out',
  platforms: ['twitter', 'linkedin', 'instagram'],
  scheduledFor: '2025-01-15T09:00:00Z'
});

console.log(post.id, post.status);`,
    python: `from rockyt import RockytClient

client = RockytClient(api_key="rkt_live_YOUR_KEY")

post = client.posts.create(
    content="Shipped v2.0! Check it out",
    platforms=["twitter", "linkedin", "instagram"],
    scheduled_for="2025-01-15T09:00:00Z"
)

print(f"Post {post.id} scheduled!")`,
    go: `package main

import (
    "fmt"
    "github.com/rockyt-io/rockyt-go"
)

func main() {
    client := rockyt.NewClient("rkt_live_YOUR_KEY")
    post, err := client.Posts.Create(&rockyt.PostRequest{
        Content:   "Shipped v2.0! Check it out",
        Platforms: []string{"twitter", "linkedin", "instagram"},
    })
    if err == nil {
        fmt.Println("Post ID:", post.ID)
    }
}`,
    ruby: `require 'rockyt'

client = Rockyt::Client.new(api_key: 'rkt_live_YOUR_KEY')

post = client.posts.create(
  content: 'Shipped v2.0! Check it out',
  platforms: ['twitter', 'linkedin', 'instagram']
)

puts "Post #{post.id} created!"`,
    java: `import io.rockyt.RockytClient;
import io.rockyt.models.PostResponse;

public class Main {
    public static void main(String[] args) {
        RockytClient client = new RockytClient("rkt_live_YOUR_KEY");
        PostResponse post = client.posts().create(
            "Shipped v2.0! Check it out",
            List.of("twitter", "linkedin", "instagram")
        );
        System.out.println("Post ID: " + post.getId());
    }
}`,
    php: `<?php
use Rockyt\\RockytClient;

$client = new RockytClient('rkt_live_YOUR_KEY');

$post = $client->posts->create([
    'content' => 'Shipped v2.0! Check it out',
    'platforms' => ['twitter', 'linkedin', 'instagram']
]);

echo "Post ID: " . $post->id;`,
    dotnet: `using Rockyt.Sdk;

var client = new RockytClient("rkt_live_YOUR_KEY");

var post = await client.Posts.CreateAsync(new PostCreateOptions {
    Content = "Shipped v2.0! Check it out",
    Platforms = new[] { "twitter", "linkedin", "instagram" }
});

Console.WriteLine($"Post {post.Id} created!");`
  };

  const copyCodeSnippet = () => {
    navigator.clipboard.writeText(codeSnippets[codeTab]);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (authLoading || (loading && !usage && keys.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 font-mono">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-xs tracking-wider uppercase">Loading developer workspace...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl p-8 text-center bg-[#121319] border border-white/10 text-gray-300">
        <p className="text-sm font-medium">Please sign in to access your API keys and developer settings.</p>
      </div>
    );
  }

  const connectedCount = usage ? usage.connectedAccounts : 0;
  const maxAccounts = usage ? usage.maxAccounts : 1;
  const usagePercent = Math.min(100, Math.round((connectedCount / maxAccounts) * 100));

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans text-gray-200 py-2">

      {/* ═══ 1. HERO HEADER ═══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            AI-Ready API Tools
          </span>
          <span className="text-xs text-gray-500 font-mono">&bull; REST v1.0</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
          Social Media for AI Agents
        </h1>

        <p className="text-sm md:text-base text-gray-400 max-w-2xl leading-relaxed">
          Give your AI agent the power to manage social media and ad operations autonomously. 
          Unified REST API with 8 SDKs across 15+ channels.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={generateKey}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shrink-0"
          >
            <iconify-icon icon="solar:key-minimalistic-bold" class="text-base"></iconify-icon>
            <span>{generating ? 'Generating...' : 'Get API Key'}</span>
          </button>

          <a
            href="https://aiads.tawk.help/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-mono text-xs font-bold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>Read the Docs</span>
            <iconify-icon icon="solar:arrow-right-up-linear" class="text-sm"></iconify-icon>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:danger-bold" class="text-lg"></iconify-icon>
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-white rounded text-[10px] font-bold">
              Retry
            </button>
            <button onClick={() => setError(null)} className="hover:text-white font-bold px-1">&times;</button>
          </div>
        </div>
      )}

      {/* ═══ 2. ACTIVE CREDENTIALS & QUOTA SECTION ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Account Quota Gauge */}
        <div className="md:col-span-1 rounded-xl p-5 bg-[#121319] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Account Quota</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                {maxAccounts === 10 ? 'Scale Plan' : 'Growth Plan'}
              </span>
            </div>
            <p className="text-xs text-gray-400">Connected Social Channels</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2 font-mono">
              <span className="text-3xl font-extrabold text-white">{connectedCount}</span>
              <span className="text-xs text-gray-400 font-medium">/ {maxAccounts} Max</span>
            </div>
            
            {/* Progress Gauge */}
            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-gray-500">
              <span>{usagePercent}% Used</span>
              <span>{maxAccounts - connectedCount} Available</span>
            </div>
          </div>
        </div>

        {/* Base API Endpoint Info */}
        <div className="md:col-span-2 rounded-xl p-5 bg-[#121319] border border-white/10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:code-square-bold" class="text-blue-400 text-xl"></iconify-icon>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">Unified REST Base URL</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              HTTP / REST v1
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/10 font-mono text-xs text-gray-300 flex items-center justify-between">
            <code className="text-blue-300">https://rockyt.io/api/v1/*</code>
            <span className="text-[10px] text-gray-500">Bearer Token Auth</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-400">
            <span>Pass <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">Authorization: Bearer rkt_live_...</code> on every request</span>
            <a
              href="https://aiads.tawk.help/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-blue-400 hover:underline"
            >
              <span>View Endpoints</span>
              <iconify-icon icon="solar:arrow-right-linear" class="text-xs"></iconify-icon>
            </a>
          </div>
        </div>

      </div>

      {/* Generated Key Modal/Alert */}
      {newKey && (
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-sm">
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:shield-check-bold" class="text-xl text-emerald-400"></iconify-icon>
              <span>New API Key Created</span>
            </div>
            <button onClick={() => setNewKey(null)} className="text-gray-400 hover:text-white text-lg font-bold">&times;</button>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Please store this key securely now. For security reasons, it will not be displayed again.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={newKey}
              className="flex-grow px-3.5 py-2.5 rounded-lg bg-black/60 text-white font-mono text-xs border border-white/20 focus:outline-none"
            />
            <button
              onClick={handleCopyNewKey}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <iconify-icon icon={copied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-base"></iconify-icon>
              <span>{copied ? 'COPIED' : 'COPY KEY'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active API Keys List */}
      <div className="rounded-xl p-5 bg-[#121319] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <iconify-icon icon="solar:key-linear" class="text-gray-400 text-base"></iconify-icon>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">Active Credentials ({keys.length})</h2>
          </div>
        </div>

        <div className="space-y-2.5">
          {keys.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-lg font-mono text-xs text-gray-500">
              No API keys generated yet. Click &quot;Get API Key&quot; above to issue credentials.
            </div>
          ) : (
            keys.map(key => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#0b0c10] border border-white/10 font-mono text-xs transition-all hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                    <iconify-icon icon="solar:key-minimalistic-square-bold" class="text-base"></iconify-icon>
                  </div>
                  <div>
                    <div className="font-bold text-white tracking-wide">
                      {key.key_prefix}&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => revokeKey(key.id)}
                  className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="text-sm"></iconify-icon>
                  <span>Revoke</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ 3. "LET YOUR AGENT DO IT" AGENT INTEGRATION PROMPT BOX ═══ */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <iconify-icon icon="solar:bot-bold" class="text-lg"></iconify-icon>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Let your AI agent do it</h2>
              <p className="text-xs text-gray-400">One prompt. Your coding agent connects Rockyt REST API directly into your codebase.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            RECOMMENDED FOR CURSOR &amp; CLAUDE CODE
          </span>
        </div>

        <div className="relative rounded-lg bg-[#0b0c10] border border-white/10 p-3.5 font-mono text-xs text-gray-300">
          <p className="pr-12 leading-relaxed">{agentPromptText}</p>
          <button
            onClick={copyAgentPrompt}
            className="absolute top-2.5 right-2.5 p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Copy Agent Prompt"
          >
            <iconify-icon icon={promptCopied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-sm"></iconify-icon>
          </button>
        </div>
        <p className="text-[11px] text-gray-500 font-mono">Paste into Cursor, Claude Code, Windsurf, or any AI coding assistant.</p>
      </div>

      {/* ═══ 4. QUICKSTART SDK CODE SNIPPET ═══ */}
      <div className="rounded-xl p-5 bg-[#121319] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <iconify-icon icon="solar:terminal-bold" class="text-blue-400 text-base"></iconify-icon>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">REST API &amp; 8 SDK Quickstart</h2>
          </div>

          {/* Language Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-[#0b0c10] p-1 rounded-lg border border-white/10 font-mono text-[11px]">
            {(['curl', 'node', 'python', 'go', 'ruby', 'java', 'php', 'dotnet'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${codeTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'node' ? 'Node.js' : tab === 'dotnet' ? '.NET' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0b0c10]">
          <div className="px-4 py-2 bg-[#16171e] border-b border-white/10 flex items-center justify-between font-mono text-[11px] text-gray-400">
            <span>Post Creation Request Example</span>
            <button
              onClick={copyCodeSnippet}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <iconify-icon icon={codeCopied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-xs"></iconify-icon>
              <span>{codeCopied ? 'COPIED' : 'COPY CODE'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
            <code>{codeSnippets[codeTab]}</code>
          </pre>
        </div>
      </div>

      {/* ═══ 5. WHY ROCKYT FOR AI AGENTS (6 FEATURE CARDS) ═══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
            WHY ROCKYT FOR AI AGENTS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "AI-Ready Structured JSON",
              desc: "Every API endpoint returns clean, structured JSON optimized for LLM parsing and execution without post-processing.",
              icon: "solar:code-file-bold",
            },
            {
              title: "15+ Social Channels",
              desc: "One single integration reaches Meta (Facebook, Instagram), TikTok, Twitter/X, LinkedIn, YouTube, Threads, Reddit, Pinterest, Bluesky.",
              icon: "solar:share-circle-bold",
            },
            {
              title: "REST API + 8 SDK Languages",
              desc: "Official SDKs for Node.js, Python, Go, Ruby, Java, PHP, .NET, and Rust for seamless integration.",
              icon: "solar:box-minimalistic-bold",
            },
            {
              title: "Rich Media & Ad Formats",
              desc: "Upload images, reels, videos, and carousel ads with automated platform-specific ratio & format validation.",
              icon: "solar:videocamera-record-bold",
            },
            {
              title: "Analytics & ROAS Inbox",
              desc: "Pull real-time engagement metrics, impressions, conversion telemetry, and follower statistics programmatically.",
              icon: "solar:chart-2-bold",
            },
            {
              title: "High Availability & Low Latency",
              desc: "Sub-100ms API response latency with 99.9% uptime SLA built for high-throughput autonomous agent workloads.",
              icon: "solar:bolt-bold",
            },
          ].map((card, i) => (
            <div key={i} className="rounded-xl p-5 bg-[#121319] border border-white/10 hover:border-white/20 transition-all space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mb-3">
                <iconify-icon icon={card.icon} class="text-base"></iconify-icon>
              </div>
              <h3 className="text-sm font-bold text-white font-mono">{card.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 6. HOW IT WORKS (3-STEP CONNECTION GUIDE) ═══ */}
      <div className="rounded-xl p-6 bg-[#121319] border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
            HOW TO CONNECT YOUR AGENT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs border border-blue-500/30">
              1
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Get your API Key</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generate an API key directly in this workspace tab to authorize your agent requests.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs border border-blue-500/30">
              2
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Set Authorization Header</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pass your key in the HTTP header: <code className="text-blue-300 font-mono bg-black/60 px-1 py-0.5 rounded">Authorization: Bearer rkt_live_...</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs border border-blue-500/30">
              3
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Start Automating</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Create posts, schedule content, launch ad campaigns, and fetch real-time analytics programmatically.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 7. AI-READY DOCS & OPENAPI SPEC ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              AI-READY DOCUMENTATION
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://aiads.tawk.help/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl p-4 bg-[#121319] border border-white/10 hover:border-blue-500/50 transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                <span>llms-full.txt</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">LLM Context</span>
              </div>
              <p className="text-xs text-gray-400">Full documentation in a single file optimized for LLM context windows.</p>
            </div>
            <iconify-icon icon="solar:arrow-right-up-linear" class="text-gray-500 group-hover:text-blue-400 text-lg transition-colors"></iconify-icon>
          </a>

          <a
            href="https://aiads.tawk.help/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl p-4 bg-[#121319] border border-white/10 hover:border-blue-500/50 transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                <span>OpenAPI v3 Spec</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Schema</span>
              </div>
              <p className="text-xs text-gray-400">Machine-readable specification for auto-generating SDK clients &amp; agent tool schemas.</p>
            </div>
            <iconify-icon icon="solar:arrow-right-up-linear" class="text-gray-500 group-hover:text-blue-400 text-lg transition-colors"></iconify-icon>
          </a>
        </div>
      </div>

      {/* ═══ 8. SUPPORTED PLATFORMS FOOTER ═══ */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400">Supported Channels:</span>
          {['Meta / Facebook', 'Instagram', 'TikTok', 'Twitter / X', 'LinkedIn', 'YouTube', 'Threads', 'Reddit', 'Pinterest', 'Bluesky'].map(p => (
            <span key={p} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px]">
              {p}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
