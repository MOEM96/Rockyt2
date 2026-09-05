import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Phone, Mail, 
  Tag, Megaphone, ArrowUpRight, RefreshCw, MessageSquare 
} from 'lucide-react';
import { WhatsAppContact } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface ContactsCRMProps {
  onSelectContactChat?: (phone: string, name?: string) => void;
}

export const ContactsCRM: React.FC<ContactsCRMProps> = ({ onSelectContactChat }) => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tagInput, setTagInput] = useState('CTWA_Lead');

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/whatsapp/contacts', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.data) setContacts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) return;

    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name,
          phone_number: phone,
          email,
          tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        await loadContacts();
        setIsCreating(false);
        setName('');
        setPhone('');
        setEmail('');
      }
    } catch (e) {}
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      await fetch(`/api/whatsapp/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
    } catch (e) {}
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Lifecycle Stage', 'Tags', 'CTWA Clid', 'Last Activity'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone_number}"`,
      `"${c.email || ''}"`,
      c.lifecycle_stage,
      `"${c.tags.join(', ')}"`,
      `"${c.ctwa_source?.ctwa_clid || ''}"`,
      c.last_activity_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const filteredContacts = contacts.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTag = selectedTag === 'all' || c.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">WhatsApp CRM Contacts ({contacts.length})</h2>
            <p className="text-xs text-zinc-400">Manage customer phone numbers, custom fields, and CTWA ad sources.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadContacts}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors"
            title="Refresh Contacts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Tag Filter ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts by name, phone number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Tag:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                selectedTag === 'all' ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors whitespace-nowrap ${
                  selectedTag === tag ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Create Contact Modal ─── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold mb-4">Add WhatsApp CRM Contact</h3>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Phone Number (E.164 with Country Code)</label>
                <input
                  type="text"
                  placeholder="e.g. +14155552671"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. CTWA_Lead, Enterprise, VIP"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Contact Detail Modal ─── */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {selectedContact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedContact.name}</h3>
                  <p className="text-xs font-mono text-zinc-400">{selectedContact.phone_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Lifecycle Stage</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold uppercase text-[10px]">
                  {selectedContact.lifecycle_stage.replace('_', ' ')}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Email</span>
                <span className="text-zinc-300 font-mono text-[11px]">{selectedContact.email || 'None'}</span>
              </div>
            </div>

            {/* CTWA Attribution */}
            <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" /> Meta Click-to-WhatsApp Attribution
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                  {selectedContact.ctwa_source?.source_type || 'ad'}
                </span>
              </div>
              {selectedContact.ctwa_source ? (
                <div className="space-y-1 font-mono text-[11px] text-zinc-300">
                  {selectedContact.ctwa_source.campaign_name && (
                    <div><strong>Campaign:</strong> {selectedContact.ctwa_source.campaign_name}</div>
                  )}
                  {selectedContact.ctwa_source.ad_id && (
                    <div><strong>Ad ID:</strong> {selectedContact.ctwa_source.ad_id}</div>
                  )}
                  {selectedContact.ctwa_source.ctwa_clid && (
                    <div><strong>CTWA Clid:</strong> <span className="text-blue-300 break-all">{selectedContact.ctwa_source.ctwa_clid}</span></div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400">Direct organic inbound contact (no paid Meta ad click referral attached).</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-rose-950/40 text-rose-400 border border-zinc-800 hover:border-rose-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                Delete Contact
              </button>
              <button
                onClick={() => {
                  const phone = selectedContact.phone_number;
                  const name = selectedContact.name;
                  setSelectedContact(null);
                  if (onSelectContactChat) onSelectContactChat(phone, name);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp Inbox</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Contacts Table ─── */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5 pl-5">Contact</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Lifecycle Stage</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">CTWA Ad Source</th>
                <th className="p-3.5">Last Activity</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    No WhatsApp contacts found. Add a contact above or activate sandbox messaging.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((cnt) => (
                <tr key={cnt.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {cnt.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{cnt.name}</div>
                      {cnt.email && <div className="text-[10px] text-zinc-500 font-normal">{cnt.email}</div>}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-300">{cnt.formatted_phone}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-semibold uppercase">
                      {cnt.lifecycle_stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {cnt.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5">
                    {cnt.ctwa_source ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-semibold">
                        <Megaphone className="w-2.5 h-2.5" />
                        {cnt.ctwa_source.campaign_name || 'CTWA Ad'}
                      </span>
                    ) : (
                      <span className="text-zinc-600">Direct Contact</span>
                    )}
                  </td>
                  <td className="p-3.5 text-zinc-500 text-[11px]">
                    {new Date(cnt.last_activity_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3.5 pr-5 text-right space-x-2">
                    <button
                      onClick={() => setSelectedContact(cnt)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onSelectContactChat && onSelectContactChat(cnt.phone_number, cnt.name)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Chat
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
