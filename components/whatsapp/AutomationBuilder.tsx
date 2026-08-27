import React, { useState, useEffect } from 'react';
import { 
  Plus, Play, Save, Trash2, ArrowRight, Zap, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, MessageSquare, Megaphone, Tag, 
  GitBranch, Bot, Database, Activity, RefreshCw, X, HelpCircle, Loader2
} from 'lucide-react';
import { AutomationFlow, AutomationNode, AutomationEdge, AutomationNodeType } from '../../lib/whatsappTypes';

export const AutomationBuilder: React.FC = () => {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ log: string[] } | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load flows from backend
  const loadFlows = async () => {
    try {
      const res = await fetch('/api/whatsapp/automations');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setFlows(data.data);
          if (!activeFlowId && data.data.length > 0) {
            setActiveFlowId(data.data[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const activeFlow = flows.find((f) => f.id === activeFlowId);
  const selectedNode = activeFlow?.nodes.find((n) => n.id === selectedNodeId);

  const handleToggleFlow = async (flowId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/whatsapp/automations/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        setFlows((prev) =>
          prev.map((f) => (f.id === flowId ? { ...f, is_active: !currentStatus } : f))
        );
        showNotification(`Flow is now ${!currentStatus ? 'Active' : 'Paused'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestFlow = async () => {
    if (!activeFlowId) return;
    setIsRunningTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/whatsapp/automations/${activeFlowId}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.result) {
        setTestResult(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningTest(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNode = (type: AutomationNodeType, title: string) => {
    if (!activeFlow) return;
    const newNode: AutomationNode = {
      id: `node_${Date.now()}`,
      type,
      title,
      config: type === 'action_trigger_capi' ? { event_name: 'Lead', default_value: 25 } : { text: 'New automated reply' },
      position: { x: 300 + Math.random() * 50, y: 150 + Math.random() * 50 },
    };

    const updatedFlow: AutomationFlow = {
      ...activeFlow,
      nodes: [...activeFlow.nodes, newNode],
    };

    setFlows((prev) => prev.map((f) => (f.id === activeFlow.id ? updatedFlow : f)));
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeFlow) return;
    const updatedFlow: AutomationFlow = {
      ...activeFlow,
      nodes: activeFlow.nodes.filter((n) => n.id !== nodeId),
      edges: activeFlow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    };
    setFlows((prev) => prev.map((f) => (f.id === activeFlow.id ? updatedFlow : f)));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleUpdateNodeConfig = (key: string, value: any) => {
    if (!activeFlow || !selectedNodeId) return;
    const updatedNodes = activeFlow.nodes.map((n) => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          config: { ...n.config, [key]: value },
        };
      }
      return n;
    });

    const updatedFlow = { ...activeFlow, nodes: updatedNodes };
    setFlows((prev) => prev.map((f) => (f.id === activeFlow.id ? updatedFlow : f)));
  };

  const handleSaveFlow = async () => {
    if (!activeFlow) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/whatsapp/automations/${activeFlow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeFlow),
      });
      if (res.ok) {
        showNotification('Automation flow saved successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFlow = async () => {
    const newFlow: AutomationFlow = {
      id: `flow_${Date.now()}`,
      title: 'New WhatsApp Journey',
      description: 'Custom automated response and CAPI pipeline',
      is_active: true,
      trigger_type: 'keyword',
      execution_count: 0,
      nodes: [
        {
          id: 'node_1',
          type: 'trigger_incoming_message',
          title: 'Trigger: Keyword Match',
          config: { keyword: 'price' },
          position: { x: 100, y: 150 },
        },
        {
          id: 'node_2',
          type: 'condition_24h_window',
          title: 'Condition: 24h Window Check',
          config: {},
          position: { x: 380, y: 150 },
        },
        {
          id: 'node_3',
          type: 'action_send_message',
          title: 'Action: Send Pricing Sheet',
          config: { text: 'Here is our automated pricing catalog! Let us know if you have questions.' },
          position: { x: 660, y: 100 },
        },
        {
          id: 'node_4',
          type: 'action_trigger_capi',
          title: 'Action: Fire Meta CAPI Lead',
          config: { event_name: 'Lead', default_value: 30 },
          position: { x: 920, y: 150 },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_1', target: 'node_2' },
        { id: 'e2', source: 'node_2', target: 'node_3', label: 'Window Open' },
        { id: 'e3', source: 'node_3', target: 'node_4' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setFlows((prev) => [newFlow, ...prev]);
    setActiveFlowId(newFlow.id);
    await fetch('/api/whatsapp/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFlow),
    });
    showNotification('Created new automation flow!');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ─── LEFT: Flow List Sidebar ─── */}
      <div className="w-72 border-r border-zinc-800/80 flex flex-col bg-zinc-950/70">
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Automations</h3>
          </div>
          <button
            onClick={handleCreateNewFlow}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
            title="Create New Flow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 space-y-1">
          {flows.map((flow) => {
            const isSelected = flow.id === activeFlowId;

            return (
              <div
                key={flow.id}
                onClick={() => {
                  setActiveFlowId(flow.id);
                  setSelectedNodeId(null);
                  setTestResult(null);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold truncate">{flow.title}</h4>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFlow(flow.id, flow.is_active);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                      flow.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                    }`}
                  >
                    {flow.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 line-clamp-1 mb-1.5">{flow.description}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{flow.nodes.length} Nodes</span>
                  <span>{flow.execution_count} Runs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CENTER: Visual Node Graph Canvas ─── */}
      {activeFlow ? (
        <div className="flex-1 flex flex-col bg-zinc-950/40 relative">
          {/* Canvas Action Bar */}
          <div className="p-3.5 px-5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{activeFlow.title}</h2>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                  Trigger: {activeFlow.trigger_type.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{activeFlow.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Add Node Menu */}
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => handleAddNode('action_send_message', 'Action: Send WhatsApp Text')}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  + Text
                </button>
                <button
                  onClick={() => handleAddNode('condition_24h_window', 'Condition: 24h Window Check')}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  + 24h Check
                </button>
                <button
                  onClick={() => handleAddNode('action_trigger_capi', 'Action: Fire Meta CAPI Event')}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-blue-400" />
                  + Meta CAPI
                </button>
                <button
                  onClick={() => handleAddNode('action_add_tag', 'Action: Tag Contact')}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-purple-400" />
                  + Tag
                </button>
              </div>

              <button
                onClick={handleTestFlow}
                disabled={isRunningTest}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-zinc-700"
              >
                {isRunningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Test Run</span>
              </button>

              <button
                onClick={handleSaveFlow}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </div>

          {notification && (
            <div className="absolute top-16 right-5 z-20 p-2.5 px-4 bg-emerald-500 text-black text-xs font-bold rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
              {notification}
            </div>
          )}

          {/* Graph Canvas Visual Area */}
          <div className="flex-1 overflow-auto p-8 relative bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="min-w-[900px] min-h-[500px] flex items-center gap-6">
              {activeFlow.nodes.map((node, index) => {
                const isSelected = node.id === selectedNodeId;
                const isTrigger = node.type.startsWith('trigger_');
                const isCondition = node.type.startsWith('condition_');
                const isCapi = node.type === 'action_trigger_capi';

                return (
                  <React.Fragment key={node.id}>
                    {/* Node Card */}
                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-64 p-4 rounded-2xl border transition-all cursor-pointer shadow-xl relative ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-400 ring-2 ring-emerald-500/20'
                          : isTrigger
                          ? 'bg-zinc-950/90 border-blue-500/40 hover:border-blue-400'
                          : isCondition
                          ? 'bg-zinc-950/90 border-amber-500/40 hover:border-amber-400'
                          : isCapi
                          ? 'bg-zinc-950/90 border-emerald-500/40 hover:border-emerald-400'
                          : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                              isTrigger
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : isCondition
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : isCapi
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {isTrigger ? <Megaphone className="w-3.5 h-3.5" /> : isCondition ? <Clock className="w-3.5 h-3.5" /> : isCapi ? <Zap className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{node.title}</span>
                        </div>
                      </div>

                      {/* Node summary */}
                      <div className="text-[11px] text-zinc-400 line-clamp-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 font-mono">
                        {node.type === 'trigger_incoming_message' && `Keyword: "${node.config.keyword || 'all'}"`}
                        {node.type === 'trigger_ctwa_click' && 'Listening to all Meta CTWA clicks'}
                        {node.type === 'condition_24h_window' && 'Branches: Open ➡️ Text / Closed ➡️ Template'}
                        {node.type === 'action_send_message' && (node.config.text || 'Send text reply')}
                        {node.type === 'action_send_template' && `Template: ${node.config.template_name || 'lead_welcome_v1'}`}
                        {node.type === 'action_trigger_capi' && `Meta CAPI Event: "${node.config.event_name || 'Lead'}" ($${node.config.default_value || 25})`}
                        {node.type === 'action_add_tag' && `Tag: #${node.config.tag || 'Lead'}`}
                      </div>
                    </div>

                    {/* Arrow Connector */}
                    {index < activeFlow.nodes.length - 1 && (
                      <div className="flex flex-col items-center justify-center text-zinc-600">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Test Simulation Terminal */}
            {testResult && (
              <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-300 shadow-2xl space-y-1.5 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800 font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Live Flow Simulator Execution Log
                  </span>
                  <button onClick={() => setTestResult(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {testResult.log.map((entry, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
          Select or create an automation flow to begin.
        </div>
      )}

      {/* ─── RIGHT: Node Properties Drawer ─── */}
      {selectedNode && (
        <div className="w-80 border-l border-zinc-800/80 p-5 overflow-y-auto bg-zinc-950/95 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Node Configuration</h4>
            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Node"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={selectedNode.title}
              onChange={(e) => {
                const updated = activeFlow!.nodes.map((n) => (n.id === selectedNode.id ? { ...n, title: e.target.value } : n));
                setFlows((prev) => prev.map((f) => (f.id === activeFlow!.id ? { ...f, nodes: updated } : f)));
              }}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {selectedNode.type === 'trigger_incoming_message' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Matching Keyword</label>
              <input
                type="text"
                placeholder="e.g. demo, pricing, support"
                value={selectedNode.config.keyword || ''}
                onChange={(e) => handleUpdateNodeConfig('keyword', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {selectedNode.type === 'action_send_message' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Message Text (24h Window)</label>
              <textarea
                rows={4}
                value={selectedNode.config.text || ''}
                onChange={(e) => handleUpdateNodeConfig('text', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>
          )}

          {selectedNode.type === 'action_trigger_capi' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Meta CAPI Event Name</label>
                <select
                  value={selectedNode.config.event_name || 'Lead'}
                  onChange={(e) => handleUpdateNodeConfig('event_name', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Lead">Lead</option>
                  <option value="Schedule">Schedule / Booked Call</option>
                  <option value="Purchase">Purchase</option>
                  <option value="CompleteRegistration">Complete Registration</option>
                  <option value="InitiateCheckout">Initiate Checkout</option>
                  <option value="Contact">Contact</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Conversion Value ($ USD)</label>
                <input
                  type="number"
                  value={selectedNode.config.default_value || 25}
                  onChange={(e) => handleUpdateNodeConfig('default_value', Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'action_add_tag' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Tag Name</label>
              <input
                type="text"
                placeholder="e.g. High_Intent, Demo_Scheduled"
                value={selectedNode.config.tag || ''}
                onChange={(e) => handleUpdateNodeConfig('tag', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
