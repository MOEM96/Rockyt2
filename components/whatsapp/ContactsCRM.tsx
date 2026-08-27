import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Phone, Mail, 
  Tag, Megaphone, ArrowUpRight, RefreshCw, MessageSquare 
} from 'lucide-react';
import { WhatsAppContact } from '../../lib/whatsappTypes';

interface ContactsCRMProps {
  onSelectContactChat?: (phone: string) => void;
}

export const ContactsCRM: React.FC<ContactsCRMProps> = () => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tagInput, setTagInput] = useState('CTWA_Lead');

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/whatsapp/contacts');
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
        headers: { 'Content-Type': 'application/json' },
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
            <h2 className="text-base font-bold text-white tracking-tight">WhatsApp CRM Contacts</h2>
            <p className="text-xs text-zinc-400">Manage customer phone numbers, custom fields, and CTWA ad sources.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={loadContacts}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors"
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
      <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts by name, phone number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
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
                <th className="p-3.5 pr-5">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No WhatsApp contacts found. Add a contact above or activate sandbox messaging.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((cnt) => (
                <tr key={cnt.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-white flex items-center gap-3">
                    <img
                      src={cnt.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={cnt.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                    />
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
                  <td className="p-3.5 pr-5 text-zinc-500 text-[11px]">
                    {new Date(cnt.last_activity_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
