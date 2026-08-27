import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, Plus, CheckCircle2, AlertCircle, Trash2, 
  Sparkles, ExternalLink, Phone, ArrowUpRight, Copy, Check, 
  Smartphone, MessageSquare, RefreshCw, Send, Loader2
} from 'lucide-react';
import { WhatsAppTemplate } from '../../lib/whatsappTypes';

export const TemplateStudio: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateName, setActiveTemplateName] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Template Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('Hello {{1}}, thank you for contacting us! How can we assist you with our services?');
  const [footerText, setFooterText] = useState('Reply STOP to opt out');
  const [buttonText, setButtonText] = useState('Book a Demo 📅');

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/whatsapp/templates');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setTemplates(data.data);
          if (!activeTemplateName && data.data.length > 0) {
            setActiveTemplateName(data.data[0].name);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const activeTemplate = templates.find((t) => t.name === activeTemplateName);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bodyText) return;

    try {
      const components: any[] = [];
      if (headerText) {
        components.push({ type: 'HEADER', format: 'TEXT', text: headerText });
      }
      components.push({ type: 'BODY', text: bodyText });
      if (footerText) {
        components.push({ type: 'FOOTER', text: footerText });
      }
      if (buttonText) {
        components.push({
          type: 'BUTTONS',
          buttons: [{ type: 'QUICK_REPLY', text: buttonText }],
        });
      }

      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          language: 'en_US',
          components,
        }),
      });

      if (res.ok) {
        await loadTemplates();
        setActiveTemplateName(name.toLowerCase().replace(/\s+/g, '_'));
        setIsCreating(false);
        setName('');
        setHeaderText('');
        setBodyText('Hello {{1}}, thank you for contacting us!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (tmplName: string) => {
    if (!confirm(`Delete template ${tmplName}?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/templates/${tmplName}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTemplates();
      }
    } catch (e) {}
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ─── LEFT: Templates List ─── */}
      <div className="w-80 border-r border-zinc-800/80 flex flex-col bg-zinc-950/70">
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Meta Templates</h3>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 space-y-1">
          {templates.map((tmpl) => {
            const isSelected = tmpl.name === activeTemplateName && !isCreating;

            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  setActiveTemplateName(tmpl.name);
                  setIsCreating(false);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold font-mono truncate">{tmpl.name}</h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                    {tmpl.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{tmpl.category}</span>
                  <span>{tmpl.language}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CENTER: Template Editor / Inspector ─── */}
      <div className="flex-1 p-6 overflow-y-auto bg-zinc-950/40">
        {isCreating ? (
          <div className="max-w-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Create Meta WhatsApp Template</span>
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Template Name (snake_case)
                </label>
                <input
                  type="text"
                  placeholder="e.g. promo_vip_discount_v2"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MARKETING">MARKETING</option>
                  <option value="UTILITY">UTILITY</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Header (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive Offer for {{1}} 🎉"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Body Text (Supports {'{{1}}'}, {'{{2}}'})
                </label>
                <textarea
                  rows={4}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Footer (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Reply STOP to unsubscribe"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Quick Reply Button</label>
                <input
                  type="text"
                  placeholder="e.g. Book a Demo 📅"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Submit Template to Meta for Approval
              </button>
            </form>
          </div>
        ) : activeTemplate ? (
          <div className="max-w-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white font-mono">{activeTemplate.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-semibold">
                    {activeTemplate.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    ✓ {activeTemplate.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTemplate(activeTemplate.name)}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors"
                title="Delete Template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {activeTemplate.components.map((c, i) => (
                <div key={i} className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{c.type}</span>
                  {c.text && <p className="text-zinc-200 leading-relaxed font-sans">{c.text}</p>}
                  {c.buttons && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {c.buttons.map((btn, bIdx) => (
                        <span key={bIdx} className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-[11px] font-medium">
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No Meta Templates Created Yet</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Meta approved templates let you initiate conversations or re-engage WhatsApp customers outside the 24-hour customer service window.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Meta Template</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Live WhatsApp Device Preview ─── */}
      <div className="w-96 border-l border-zinc-800/80 p-6 flex flex-col items-center justify-center bg-zinc-950/80">
        <div className="w-72 bg-zinc-900 border-4 border-zinc-700 rounded-[36px] p-3 shadow-2xl relative overflow-hidden flex flex-col h-[520px]">
          {/* Mobile Camera Notch */}
          <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>

          {/* WhatsApp Header Mock */}
          <div className="bg-emerald-800 text-white p-2 px-3 rounded-t-xl flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold">
              W
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-bold">Rockyt WhatsApp Hub</div>
              <div className="text-[9px] text-emerald-200">Official Business Account</div>
            </div>
          </div>

          {/* WhatsApp Chat Bubble */}
          <div className="flex-1 overflow-y-auto space-y-2 p-1">
            <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl rounded-tl-none p-3 text-[11px] text-white shadow space-y-1.5">
              {/* Header */}
              {isCreating ? (
                headerText && <div className="font-bold text-emerald-200">{headerText.replace('{{1}}', 'Sarah')}</div>
              ) : (
                activeTemplate?.components.find((c) => c.type === 'HEADER')?.text && (
                  <div className="font-bold text-emerald-200">
                    {activeTemplate.components.find((c) => c.type === 'HEADER')!.text!.replace('{{1}}', 'Sarah')}
                  </div>
                )
              )}

              {/* Body */}
              <div className="leading-relaxed">
                {isCreating
                  ? bodyText.replace('{{1}}', 'Sarah').replace('{{2}}', 'WA-2026')
                  : activeTemplate?.components.find((c) => c.type === 'BODY')?.text?.replace('{{1}}', 'Sarah').replace('{{2}}', 'WA-2026') ||
                    'Select a template to preview'}
              </div>

              {/* Footer */}
              {isCreating ? (
                footerText && <div className="text-[9px] text-zinc-400 pt-1">{footerText}</div>
              ) : (
                activeTemplate?.components.find((c) => c.type === 'FOOTER')?.text && (
                  <div className="text-[9px] text-zinc-400 pt-1">
                    {activeTemplate.components.find((c) => c.type === 'FOOTER')!.text}
                  </div>
                )
              )}

              <div className="text-[8px] text-zinc-400 text-right">10:45 AM</div>
            </div>

            {/* Buttons */}
            {isCreating ? (
              buttonText && (
                <div className="w-full py-2 bg-emerald-950/80 border border-emerald-700/50 rounded-xl text-center text-xs font-bold text-emerald-300 shadow">
                  {buttonText}
                </div>
              )
            ) : (
              activeTemplate?.components.find((c) => c.type === 'BUTTONS')?.buttons?.map((btn, i) => (
                <div key={i} className="w-full py-2 bg-emerald-950/80 border border-emerald-700/50 rounded-xl text-center text-xs font-bold text-emerald-300 shadow">
                  {btn.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
