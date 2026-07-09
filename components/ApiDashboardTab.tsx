import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const BG      = '#161616';
const SURF    = '#1D1D1D';
const BORDER  = 'rgba(255,255,255,0.08)';
const TXT     = '#FFFFFF';
const MUTED   = '#888888';
const BLUE    = '#4450F2';
const PINK    = '#FF2E93';
const YELLOW  = '#FFE241';

export const ApiDashboardTab: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<{ id: string, key_prefix: string, created_at: string }[]>([]);
  const [usage, setUsage] = useState<{ connectedAccounts: number, maxAccounts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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
        // Refresh keys list and usage
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

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || (loading && !usage && keys.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" style={{ color: TXT }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 animate-bounce"></div>
        <p className="text-sm font-mono" style={{ color: MUTED }}>Loading API dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        <p className="text-base" style={{ color: TXT }}>Please sign in to access your API keys.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: TXT }}>Developer Settings</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Manage your API credentials and track connected channels usage.
        </p>
      </div>

       {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:danger-bold" class="text-lg"></iconify-icon>
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData} 
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-white rounded text-xs font-bold transition-all"
            >
              Retry
            </button>
            <button onClick={() => setError(null)} className="hover:text-white font-bold px-2">×</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Usage card */}
        <div className="md:col-span-1 rounded-xl p-6 flex flex-col justify-between" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <iconify-icon icon="solar:chart-square-bold" class="text-xl text-blue-500"></iconify-icon>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: MUTED }}>API Usage</h2>
            </div>
            <p className="text-xs" style={{ color: MUTED }}>Connected accounts vs limit</p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-black" style={{ color: TXT }}>
                {usage ? usage.connectedAccounts : 0}
              </span>
              <span className="text-sm font-mono" style={{ color: MUTED }}>
                / {usage ? usage.maxAccounts : 0} Max
              </span>
            </div>
            {/* Progress bar */}
            {usage && usage.maxAccounts > 0 && (
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-blue-500"
                  style={{ 
                    width: `${Math.min(100, (usage.connectedAccounts / usage.maxAccounts) * 100)}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="md:col-span-2 rounded-xl p-6" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-3">
            <iconify-icon icon="solar:info-circle-bold" class="text-xl text-yellow-400"></iconify-icon>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: MUTED }}>Integration Details</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: TXT }}>
            Use your API key to authenticate requests with Zernio's multi-channel API. 
            All endpoints are accessible via <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-white/5 border border-white/10">https://rockyt.com/api/v1/*</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a 
              href="https://docs.zernio.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/5 hover:bg-white/10 border border-white/10" 
              style={{ color: TXT }}
            >
              <span>API Documentation</span>
              <iconify-icon icon="solar:arrow-right-up-bold"></iconify-icon>
            </a>
          </div>
        </div>
      </div>

      {/* Keys Management */}
      <div className="rounded-xl p-6" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:key-bold" class="text-xl text-yellow-400"></iconify-icon>
            <h2 className="text-base font-bold" style={{ color: TXT }}>Credentials</h2>
          </div>
          <button 
            onClick={generateKey} 
            disabled={generating}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-[#FFE241] text-[#161616] hover:bg-[#ffeb7a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate New Key'}
          </button>
        </div>

        {newKey && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <iconify-icon icon="solar:shield-check-bold" class="text-lg"></iconify-icon>
              <span>New API Key Generated Successfully</span>
            </div>
            <p className="text-xs mb-3 text-green-400/80">
              Copy this key now. For your security, this key will not be displayed again.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={newKey} 
                className="flex-grow px-3 py-2 rounded bg-black/40 text-xs font-mono border border-green-500/20 text-white focus:outline-none" 
              />
              <button 
                onClick={handleCopy}
                className="px-4 py-2 rounded bg-green-500/20 hover:bg-green-500/30 text-xs font-bold transition-all flex items-center gap-1 text-white"
              >
                <iconify-icon icon={copied ? "solar:check-circle-bold" : "solar:copy-bold"} class="text-sm"></iconify-icon>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg" style={{ borderColor: BORDER }}>
              <p className="text-sm" style={{ color: MUTED }}>No active API keys found. Generate one above to get started.</p>
            </div>
          ) : (
            keys.map(key => (
              <div 
                key={key.id} 
                className="flex justify-between items-center p-4 rounded-lg transition-all" 
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-white/5">
                    <iconify-icon icon="solar:key-linear" class="text-lg" style={{ color: MUTED }}></iconify-icon>
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold" style={{ color: TXT }}>
                      {key.key_prefix}••••••••••••••••••••••••••••••••
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: MUTED }}>
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => revokeKey(key.id)} 
                  className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="text-sm"></iconify-icon>
                  <span>Revoke</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
