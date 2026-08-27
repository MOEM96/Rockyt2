import React, { useState, useEffect } from 'react';
import { 
  Radio, Plus, Users, Send, CheckCircle2, Clock, 
  Calendar, AlertCircle, RefreshCw, BarChart2, Sparkles, Filter 
} from 'lucide-react';
import { BroadcastCampaign, WhatsAppTemplate, WhatsAppContact } from '../../lib/whatsappTypes';

export const BroadcastManager: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [scheduledTime, setScheduledTime] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resBc, resTmpl, resCnt] = await Promise.all([
        fetch('/api/whatsapp/broadcasts'),
        fetch('/api/whatsapp/templates'),
        fetch('/api/whatsapp/contacts'),
      ]);

      if (resBc.ok) {
        const dataBc = await resBc.json();
        if (dataBc.data) setBroadcasts(dataBc.data);
      }
      if (resTmpl.ok) {
        const dataTmpl = await resTmpl.json();
        if (dataTmpl.data) {
          setTemplates(dataTmpl.data);
          if (dataTmpl.data.length > 0 && !selectedTemplate) {
            setSelectedTemplate(dataTmpl.data[0].name);
          }
        }
      }
      if (resCnt.ok) {
        const dataCnt = await resCnt.json();
        if (dataCnt.data) setContacts(dataCnt.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedTemplate) return;

    try {
      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          template_name: selectedTemplate,
          target_tags: selectedTag === 'All' ? [] : [selectedTag],
          scheduled_at: scheduledTime || undefined,
        }),
      });

      if (res.ok) {
        await loadData();
        setIsCreating(false);
        setTitle('');
        setScheduledTime('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  return (
    <div className="space-y-6">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">WhatsApp Broadcast Campaigns</h2>
            <p className="text-xs text-zinc-400">
              Deliver targeted Meta-approved templates with dynamic variables to segmented subscriber lists.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Broadcast</span>
          </button>
        </div>
      </div>

      {/* ─── Create Broadcast Modal ─── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Launch WhatsApp Broadcast Campaign</span>
            </h3>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Black Friday VIP Early Access"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Meta Approved Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Audience Tag</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Contacts ({contacts.length} recipients)</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Launch Broadcast Blast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Broadcast History Table ─── */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5 pl-5">Campaign Name</th>
                <th className="p-3.5">Template</th>
                <th className="p-3.5">Recipients</th>
                <th className="p-3.5">Sent</th>
                <th className="p-3.5">Delivered</th>
                <th className="p-3.5">Read Rate</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs">
                    No broadcast campaigns scheduled yet. Click "+ New Broadcast" to send a template blast.
                  </td>
                </tr>
              ) : (
                broadcasts.map((bc) => {
                const readRate = bc.sent_count > 0 ? ((bc.read_count / bc.sent_count) * 100).toFixed(1) : '0';

                return (
                  <tr key={bc.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-white flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{bc.title}</span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{bc.template_name}</td>
                    <td className="p-3.5 font-bold text-zinc-200">{bc.total_recipients.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-zinc-300">{bc.sent_count.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-emerald-400">{bc.delivered_count.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">{readRate}%</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                        {bc.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-zinc-500">
                      {new Date(bc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
