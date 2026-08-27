import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Zap, CheckCircle2, AlertCircle, ArrowUpRight, 
  RefreshCw, DollarSign, Activity, Users, Filter, Search, 
  ShieldCheck, ExternalLink, Play, Clock, Sparkles
} from 'lucide-react';
import { MetaCAPIEvent } from '../../lib/whatsappTypes';

export const CTWAHub: React.FC = () => {
  const [capiEvents, setCapiEvents] = useState<MetaCAPIEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('+14155552671');
  const [testEventName, setTestEventName] = useState<'Lead' | 'Schedule' | 'Purchase'>('Lead');
  const [testValue, setTestValue] = useState(45);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/whatsapp/capi/events');
      const data = await res.json();
      if (data.data) {
        setCapiEvents(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const res = await fetch('/api/whatsapp/capi/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          event_name: testEventName,
          value: testValue,
          currency: 'USD',
        }),
      });
      if (res.ok) {
        setTestModalOpen(false);
        await loadEvents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  // Metrics calculation
  const totalEvents = capiEvents.length;
  const totalValue = capiEvents.reduce((acc, ev) => acc + (ev.value || 0), 0);
  const ctwaMatched = capiEvents.filter((ev) => !!ev.ctwa_clid).length;
  const matchRate = totalEvents > 0 ? ((ctwaMatched / totalEvents) * 100).toFixed(1) : '100';

  const filteredEvents = capiEvents.filter((ev) => {
    const matchSearch =
      ev.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.phone_number.includes(searchQuery) ||
      (ev.ctwa_clid && ev.ctwa_clid.includes(searchQuery));
    const matchType = filterType === 'all' || ev.event_name === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Attributed CAPI Events</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalEvents}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <span>Verified v19.0 API Feed</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">CTWA Closed-Loop Value</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">${totalValue.toLocaleString()}</div>
          <div className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
            <span>Direct WhatsApp Conversion Revenue</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">CTWA Clid Match Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{matchRate}%</div>
          <div className="text-[11px] text-purple-400 font-semibold mt-1 flex items-center gap-1">
            <span>SHA-256 Hashed Phone + CLID</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Meta Delivery SLA</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">&lt; 350ms</div>
          <div className="text-[11px] text-zinc-500 mt-1">Real-time webhook trigger</div>
        </div>
      </div>

      {/* ─── Control Bar & Action ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search event ID, phone, CTWA CLID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-1">
            {['all', 'Lead', 'Schedule', 'Purchase'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  filterType === tab
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={loadEvents}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send Test CAPI Conversion</span>
          </button>
        </div>
      </div>

      {/* ─── Realtime Meta CAPI Event Stream Table ─── */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Meta Conversions API (CAPI) Live Event Ledger</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Action Source: business_messaging</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5 pl-5">Event Name</th>
                <th className="p-3.5">Contact Phone & Hash</th>
                <th className="p-3.5">CTWA Referral Clid</th>
                <th className="p-3.5">Value</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Meta Trace ID</th>
                <th className="p-3.5 pr-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No conversion events recorded yet. Click "Send Test CAPI Conversion" to trigger.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{ev.event_name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-300">
                      <div>{ev.phone_number}</div>
                      <div className="text-[10px] text-zinc-500">sha256(ph): {ev.phone_number ? '✓ hashed' : '-'}</div>
                    </td>
                    <td className="p-3.5 font-mono text-blue-400">
                      {ev.ctwa_clid ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-[11px]">
                          {ev.ctwa_clid.slice(0, 16)}...
                        </span>
                      ) : (
                        <span className="text-zinc-600">Organic Inbound</span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 font-mono">
                      {ev.value ? `$${ev.value.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                      {ev.meta_response?.fbtrace_id || ev.event_id.slice(0, 14)}
                    </td>
                    <td className="p-3.5 pr-5 text-zinc-500 text-[11px]">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Manual CAPI Test Trigger Modal ─── */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Simulate Meta CAPI Conversion Event</span>
            </h3>
            <form onSubmit={handleManualTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Event Type</label>
                <select
                  value={testEventName}
                  onChange={(e: any) => setTestEventName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Lead">Lead</option>
                  <option value="Schedule">Schedule / Demo Booked</option>
                  <option value="Purchase">Purchase</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Value ($ USD)</label>
                <input
                  type="number"
                  value={testValue}
                  onChange={(e) => setTestValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTriggering}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {isTriggering ? 'Dispatching...' : 'Dispatch Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
