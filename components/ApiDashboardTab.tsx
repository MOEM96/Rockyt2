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
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');
  const [codeCopied, setCodeCopied] = useState(false);

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

  const snippets = {
    curl: `curl -X POST "https://rockyt.io/api/v1/posts" \\
  -H "Authorization: Bearer rkt_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Publishing across platforms via Rockyt API!",
    "platforms": ["instagram", "tiktok", "linkedin"]
  }'`,
    node: `import Rockyt from '@rockyt/node';

const rockyt = new Rockyt('rkt_live_YOUR_KEY');

await rockyt.posts.create({
  content: 'Automated post from AI Agent',
  platforms: ['instagram', 'tiktok']
});`,
    python: `import requests

headers = {
    "Authorization": "Bearer rkt_live_YOUR_KEY",
    "Content-Type": "application/json"
}

response = requests.post("https://rockyt.io/api/v1/posts", headers=headers, json={
    "content": "Automated post from AI Agent",
    "platforms": ["instagram", "tiktok"]
})`
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(snippets[codeTab]);
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
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-gray-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Developer Workspace
            </span>
            <span className="text-xs text-gray-500 font-mono">&bull; v1.0 API</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">API Credentials &amp; Limits</h1>
        </div>

        <button
          onClick={generateKey}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <iconify-icon icon="solar:key-minimalistic-bold" class="text-sm"></iconify-icon>
          <span>{generating ? 'Generating...' : 'Create API Key'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:danger-bold" class="text-base"></iconify-icon>
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-white rounded text-[10px] font-bold">
              Retry
            </button>
            <button onClick={() => setError(null)} className="hover:text-white font-bold px-1">&times;</button>
          </div>
        </div>
      )}

      {/* Grid: Quota & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Account Quota Card */}
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
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
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

        {/* Quick Docs & Endpoint Info Card */}
        <div className="md:col-span-2 rounded-xl p-5 bg-[#121319] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:code-square-bold" class="text-blue-400 text-lg"></iconify-icon>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">Unified REST Base URL</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              HTTP / REST v1
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0b0c10] border border-white/10 font-mono text-xs text-gray-300 flex items-center justify-between">
            <code>https://rockyt.io/api/v1/*</code>
            <span className="text-[10px] text-gray-500">Bearer Auth</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://aiads.tawk.help/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <span>API Reference</span>
              <iconify-icon icon="solar:arrow-right-up-linear" class="text-sm"></iconify-icon>
            </a>
          </div>
        </div>

      </div>

      {/* Generated New Key Alert */}
      {newKey && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-sm">
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:shield-check-bold" class="text-lg text-emerald-400"></iconify-icon>
              <span>New API Key Created</span>
            </div>
            <button onClick={() => setNewKey(null)} className="text-gray-400 hover:text-white">&times;</button>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Please store this key securely. For security reasons, it will not be displayed again.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={newKey}
              className="flex-grow px-3 py-2 rounded-md bg-black/60 text-white font-mono text-xs border border-white/20 focus:outline-none"
            />
            <button
              onClick={handleCopyNewKey}
              className="px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <iconify-icon icon={copied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-sm"></iconify-icon>
              <span>{copied ? 'COPIED' : 'COPY KEY'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Keys List Section */}
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
              No API keys generated yet. Click &quot;Create API Key&quot; above to issue credentials.
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

      {/* Code Snippet Quickstart Playground */}
      <div className="rounded-xl p-5 bg-[#121319] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <iconify-icon icon="solar:terminal-bold" class="text-blue-400 text-base"></iconify-icon>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">Quick Integration Snippet</h2>
          </div>

          <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-lg border border-white/10 font-mono text-[11px]">
            {(['curl', 'node', 'python'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${codeTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'node' ? 'Node.js' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0b0c10]">
          <div className="px-4 py-2 bg-[#16171e] border-b border-white/10 flex items-center justify-between font-mono text-[11px] text-gray-400">
            <span>Example API Post Request</span>
            <button
              onClick={copySnippet}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <iconify-icon icon={codeCopied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-xs"></iconify-icon>
              <span>{codeCopied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
            <code>{snippets[codeTab]}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};
