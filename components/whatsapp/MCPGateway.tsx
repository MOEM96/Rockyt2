import React, { useState, useEffect } from 'react';
import { 
  Bot, Key, Copy, Check, ExternalLink, Play, 
  Terminal, ShieldCheck, RefreshCw, Trash2, Plus, Sparkles, 
  Code, Loader2, CheckCircle2 
} from 'lucide-react';
import { MCPToken } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

export const MCPGateway: React.FC = () => {
  const [tokens, setTokens] = useState<MCPToken[]>([]);
  const [manifest, setManifest] = useState<any>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedTool, setSelectedTool] = useState('whatsapp_list_conversations');
  const [toolArgsJson, setToolArgsJson] = useState('{}');
  const [toolResult, setToolResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const loadData = async () => {
    try {
      const headers = getAuthHeaders();
      const [resTokens, resManifest] = await Promise.all([
        fetch('/api/mcp/tokens', { headers }),
        fetch('/api/mcp/manifest', { headers }),
      ]);
      if (resTokens.ok) {
        const dataTokens = await resTokens.json();
        if (dataTokens.data) setTokens(dataTokens.data);
      }
      if (resManifest.ok) {
        const dataManifest = await resManifest.json();
        if (dataManifest) setManifest(dataManifest);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    try {
      const res = await fetch('/api/mcp/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newKeyName, scopes: ['*'] }),
      });
      const data = await res.json();
      if (data.token) {
        setGeneratedRawKey(data.token);
        setNewKeyName('');
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      const res = await fetch(`/api/mcp/tokens/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) await loadData();
    } catch (e) {}
  };

  const handleExecuteTool = async () => {
    setIsExecuting(true);
    setToolResult(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgsJson);
      } catch (err) {
        alert('Invalid JSON in arguments');
        setIsExecuting(false);
        return;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'test_call_1',
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });

      const data = await res.json();
      setToolResult(data);
    } catch (e: any) {
      setToolResult({ error: e.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const claudeConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        rockyt_whatsapp: {
          url: manifest?.endpoint || 'http://localhost:3000/api/mcp',
          headers: {
            Authorization: 'Bearer ' + (generatedRawKey || 'mcp_wa_demo_agent_key_2026'),
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* ─── Top Header ─── */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">External MCP Agent Gateway</h2>
            <p className="text-xs text-zinc-400">
              Connect Claude Desktop, Cursor, LangChain, or custom autonomous cloud agents to your WhatsApp CRM & CAPI via Model Context Protocol.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>MCP Protocol 2024-11-05 Ready</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT: Claude Desktop & Cursor Config ─── */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>Claude Desktop & Cursor Config Snippet</span>
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(claudeConfigSnippet);
                setCopiedSnippet(true);
                setTimeout(() => setCopiedSnippet(false), 2000);
              }}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-semibold flex items-center gap-1 transition-colors"
            >
              {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSnippet ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="text-xs text-zinc-400">
            Paste this snippet into your <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">claude_desktop_config.json</code> or Cursor MCP settings to allow your AI agent to manage WhatsApp conversations and fire Meta CAPI events.
          </div>

          <pre className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 overflow-x-auto">
            {claudeConfigSnippet}
          </pre>

          {/* Generated Raw Key Alert */}
          {generatedRawKey && (
            <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>New MCP API Token Created:</span>
              </div>
              <div className="flex items-center justify-between font-mono bg-zinc-900 p-2 rounded-lg border border-purple-800/40">
                <span className="truncate">{generatedRawKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedRawKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="text-zinc-400 hover:text-white ml-2"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Token Creator */}
          <form onSubmit={handleCreateToken} className="pt-2 flex gap-2">
            <input
              type="text"
              placeholder="Agent Token Name (e.g. Claude Desktop Prod)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </form>

          {/* Active Tokens Table */}
          <div className="divide-y divide-zinc-900 border-t border-zinc-800 pt-2">
            {tokens.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="font-mono text-[10px] text-zinc-500">{t.token_prefix}</div>
                </div>
                <button
                  onClick={() => handleDeleteToken(t.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Live MCP Tool Playground ─── */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive MCP Tool Simulator</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">tools/call</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Select MCP Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => {
                  setSelectedTool(e.target.value);
                  if (e.target.value === 'whatsapp_list_conversations') setToolArgsJson('{}');
                  if (e.target.value === 'whatsapp_send_message') setToolArgsJson('{\n  "conversation_id": "conv_wa_001",\n  "text": "Hello from autonomous MCP Agent!"\n}');
                  if (e.target.value === 'whatsapp_trigger_capi_event') setToolArgsJson('{\n  "conversation_id": "conv_wa_001",\n  "event_name": "Lead",\n  "value": 45\n}');
                  if (e.target.value === 'whatsapp_get_templates') setToolArgsJson('{}');
                }}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="whatsapp_list_conversations">whatsapp_list_conversations</option>
                <option value="whatsapp_get_messages">whatsapp_get_messages</option>
                <option value="whatsapp_send_message">whatsapp_send_message (24h Window)</option>
                <option value="whatsapp_send_template">whatsapp_send_template</option>
                <option value="whatsapp_trigger_capi_event">whatsapp_trigger_capi_event (Meta CAPI)</option>
                <option value="whatsapp_update_contact">whatsapp_update_contact</option>
                <option value="whatsapp_get_templates">whatsapp_get_templates</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">JSON-RPC Arguments</label>
              <textarea
                rows={4}
                value={toolArgsJson}
                onChange={(e) => setToolArgsJson(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleExecuteTool}
              disabled={isExecuting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute Tool Call via MCP</span>
            </button>
          </div>

          {/* Result Terminal */}
          {toolResult && (
            <div className="mt-3 space-y-1">
              <div className="text-[10px] text-zinc-500 font-mono">Response Payload:</div>
              <pre className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto">
                {JSON.stringify(toolResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
