import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, Send, Check, CheckCheck, Clock, AlertTriangle, 
  Sparkles, Megaphone, Tag, User, Phone, Mail, DollarSign, 
  ChevronRight, RefreshCw, Paperclip, Smile, Zap, MessageSquare, 
  ShieldCheck, LayoutTemplate, ArrowUpRight, CheckCircle2, Loader2, Bot
} from 'lucide-react';
import { PlayCircle, Plus } from 'lucide-react';

interface WhatsAppInboxProps {
  onTriggerCapi?: (convId: string, eventName: string, value?: number) => void;
  onOpenConnect?: () => void;
  initialPhone?: string;
  initialName?: string;
}

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({ onOpenConnect, initialPhone, initialName }) => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [capiSuccess, setCapiSuccess] = useState<string | null>(null);
  const [isCapiSending, setIsCapiSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getStorageUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rockyt_user_id') || 'default_user';
    }
    return 'default_user';
  };

  const getStoredConversations = (): WhatsAppConversation[] => {
    try {
      const uid = getStorageUserId();
      const item = localStorage.getItem(`rockyt_wa_convs_${uid}`);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  };

  const setStoredConversations = (convs: WhatsAppConversation[]) => {
    try {
      const uid = getStorageUserId();
      localStorage.setItem(`rockyt_wa_convs_${uid}`, JSON.stringify(convs));
    } catch {}
  };

  const getStoredMessages = (convId: string): WhatsAppMessage[] => {
    try {
      const uid = getStorageUserId();
      const item = localStorage.getItem(`rockyt_wa_msgs_${uid}_${convId}`);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  };

  const setStoredMessages = (convId: string, msgs: WhatsAppMessage[]) => {
    try {
      const uid = getStorageUserId();
      localStorage.setItem(`rockyt_wa_msgs_${uid}_${convId}`, JSON.stringify(msgs));
    } catch {}
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('rockyt_user_id');
      if (uid) headers['x-user-id'] = uid;
    }
    return headers;
  };

  useEffect(() => {
    // Thoroughly purge any legacy unisolated conversation/sandbox cache
    try {
      localStorage.removeItem('rockyt_wa_conversations');
      localStorage.removeItem('rockyt_wa_messages');
      localStorage.removeItem('rockyt_wa_sandbox_session');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('rockyt_wa_messages_') || key.includes('201018252128') || key.includes('conv_'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    
    // Clear initial state
    setConversations([]);
    setActiveConvId('');
    setMessages([]);
  }, []);

  const handleSimulateSandboxInbound = async () => {
    setIsSimulating(true);
    try {
      let phone = activeConv?.contact?.phone_number || initialPhone || '+14155552671';
      let name = activeConv?.contact?.name || initialName || 'WhatsApp Lead';

      const res = await fetch('/api/whatsapp/sandbox/simulate-message', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: 'Hi! Testing WhatsApp inbox automation and real-time CRM responses.',
          name,
          phone_number: phone,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.conversation) {
          setConversations((prev) => {
            const next = [resData.conversation, ...prev.filter((c) => c.id !== resData.conversation.id)];
            setStoredConversations(next);
            return next;
          });
          setActiveConvId(resData.conversation.id);
        }
        if (resData.message) {
          setMessages((prev) => {
            const next = [...prev, resData.message];
            if (activeConvId) setStoredMessages(activeConvId, next);
            return next;
          });
        }
        await loadConversations(false);
        if (activeConvId) await loadMessages(activeConvId, false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Load conversations and templates
  const loadConversations = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        const cached = getStoredConversations();
        if (cached.length > 0) {
          setConversations(cached);
          if (!activeConvId) setActiveConvId(cached[0].id);
        }
      }
      const res = await fetch('/api/whatsapp/conversations', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          if (data.data.length === 0) {
            // Clean state when no conversations exist for this user
            setConversations([]);
            setActiveConvId('');
            setStoredConversations([]);
          } else {
            setConversations(data.data);
            setStoredConversations(data.data);
            setActiveConvId((prev) => {
              const exists = data.data.some((c: any) => c.id === prev);
              return exists ? prev : data.data[0].id;
            });
          }
        }
      }
    } catch (e) {
      console.error('[WhatsApp CRM] Failed to load conversations:', e);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.data) setTemplates(data.data);
      }
    } catch (e) {}
  };

  const loadMessages = async (convId: string, isInitial = false) => {
    if (!convId) return;
    try {
      if (isInitial) {
        const cachedMsgs = getStoredMessages(convId);
        if (cachedMsgs.length > 0) setMessages(cachedMsgs);
      }
      const res = await fetch(`/api/whatsapp/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          setMessages((prev) => {
            const map = new Map<string, WhatsAppMessage>();
            prev.forEach((m) => map.set(m.id, m));
            data.data.forEach((m: WhatsAppMessage) => map.set(m.id, m));
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setStoredMessages(convId, merged);
            return merged;
          });
        }
      }
    } catch (e) {}
  };

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const res = await fetch('/api/whatsapp/backfill', { method: 'POST' });
      if (res.ok) {
        await loadConversations(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackfilling(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
    loadTemplates();
    const interval = setInterval(() => loadConversations(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialPhone) {
      const cleanPhone = initialPhone.replace(/[^0-9]/g, '');
      const existing = conversations.find(
        (c) => c.contact?.phone_number?.replace(/[^0-9]/g, '') === cleanPhone
      );
      if (existing) {
        setActiveConvId(existing.id);
      } else {
        const newConvId = `conv_${Date.now()}`;
        const newConv: WhatsAppConversation = {
          id: newConvId,
          account_id: 'acc_primary',
          profile_id: 'prof_default',
          contact: {
            id: `cnt_${Date.now()}`,
            name: initialName || 'WhatsApp Contact',
            phone_number: initialPhone,
            formatted_phone: initialPhone,
            tags: ['CRM_Direct'],
            custom_fields: {},
            lifecycle_stage: 'lead',
            created_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          },
          unread_count: 0,
          status: 'active',
          last_customer_message_at: new Date().toISOString(),
          window_expires_at: new Date(Date.now() + 86400000).toISOString(),
          is_window_open: true,
          ai_agent_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => {
          const next = [newConv, ...prev];
          setStoredConversations(next);
          return next;
        });
        setActiveConvId(newConvId);
      }
    }
  }, [initialPhone, initialName, conversations.length]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId, true);
      // Mark as read
      fetch(`/api/whatsapp/conversations/${activeConvId}/read`, { method: 'POST' }).catch(() => {});

      const msgInterval = setInterval(() => {
        loadMessages(activeConvId, false);
      }, 3000);
      return () => clearInterval(msgInterval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Calculate 24-hour remaining time
  const getWindowTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return { isOpen: false, text: 'Expired' };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { isOpen: false, text: 'Window Closed (24h Expired)' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { isOpen: true, text: `${hours}h ${mins}m left in 24h window` };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText && !selectedTemplate) || isSending || !activeConvId) return;

    const sentText = inputText;
    const sentTemplate = selectedTemplate;

    // Optimistic UI update
    const optimisticMsg: WhatsAppMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: activeConvId,
      direction: 'outgoing',
      type: sentTemplate ? 'template' : 'text',
      text: sentText || (sentTemplate ? `[Template: ${sentTemplate}]` : ''),
      status: 'delivered',
      timestamp: new Date().toISOString(),
      sender_name: 'You (Support)',
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSelectedTemplate('');

    setIsSending(true);
    try {
      const body: any = {};
      if (sentTemplate) {
        body.template_name = sentTemplate;
      } else {
        body.text = sentText;
      }

      const res = await fetch(`/api/whatsapp/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadMessages(activeConvId, false);
        await loadConversations(false);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
        alert(err.error || 'Failed to send WhatsApp message');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerCapi = async (eventName: 'Lead' | 'Schedule' | 'Purchase' | 'Contact', defaultVal = 35) => {
    if (!activeConvId) return;
    setIsCapiSending(true);
    setCapiSuccess(null);
    try {
      const res = await fetch('/api/whatsapp/capi/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvId,
          event_name: eventName,
          value: defaultVal,
          currency: 'USD',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCapiSuccess(`Dispatched "${eventName}" to Meta CAPI! Event ID: ${data.event?.event_id?.slice(0, 14) || 'wa_capi'}...`);
        setTimeout(() => setCapiSuccess(null), 4500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapiSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchQuery =
      c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.formatted_phone.includes(searchQuery) ||
      (c.last_message?.text && c.last_message.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTag = filterTag === 'all' || c.contact.tags.includes(filterTag);
    return matchQuery && matchTag;
  });

  const windowInfo = activeConv ? getWindowTimeLeft(activeConv.window_expires_at) : { isOpen: false, text: '' };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ─── COLUMN 1: Conversation List ─── */}
      <div className="w-80 lg:w-96 border-r border-zinc-800/80 flex flex-col bg-zinc-950/60">
        {/* Search & Header */}
        <div className="p-3.5 border-b border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">WhatsApp Inbound CRM</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleBackfill}
                disabled={isBackfilling}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-zinc-900 transition-colors disabled:opacity-50"
                title="Backfill History from Zernio"
              >
                <ArrowUpRight className={`w-3.5 h-3.5 ${isBackfilling ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSimulateSandboxInbound}
                disabled={isSimulating}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-zinc-900 transition-colors disabled:opacity-50"
                title="Simulate Inbound WhatsApp Test Message"
              >
                <PlayCircle className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => loadConversations(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations, numbers, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Quick Tag Filter */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {['all', 'CTWA_Lead', 'High_Intent', 'VIP_Customer', 'Enterprise'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterTag === tag
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {tag === 'all' ? 'All Chats' : tag.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No active WhatsApp conversations found.</div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const win = getWindowTimeLeft(conv.window_expires_at);

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all flex gap-3 items-start ${
                    isSelected
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-400'
                      : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.contact.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={conv.contact.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{conv.contact.name}</h4>
                      <span className="text-[10px] text-zinc-500 flex-shrink-0">
                        {conv.last_message?.timestamp
                          ? new Date(conv.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 truncate mb-1.5">
                      {conv.last_message?.direction === 'outgoing' ? 'You: ' : ''}
                      {conv.last_message?.text || (conv.last_message?.template_name ? `[${conv.last_message.template_name}]` : 'New conversation')}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* CTWA Referral Tag */}
                      {conv.ctwa_referral && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-semibold">
                          <Megaphone className="w-2.5 h-2.5" />
                          CTWA Ad
                        </span>
                      )}

                      {/* 24h Window Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          win.isOpen
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {win.isOpen ? '24h Active' : 'Template Req'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── COLUMN 2: Active Chat Window ─── */}
      {activeConv ? (
        <>
        <div className="flex-1 flex flex-col bg-zinc-950 relative">
          {/* Chat Header */}
          <div className="p-3.5 px-5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeConv.contact.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={activeConv.contact.name}
                className="w-9 h-9 rounded-full object-cover border border-zinc-800"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activeConv.contact.name}</h3>
                  <span className="text-xs text-zinc-400 font-mono">{activeConv.contact.formatted_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`flex items-center gap-1 font-medium ${windowInfo.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Clock className="w-3 h-3" />
                    {windowInfo.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>MCP Agent Sync Active</span>
              </div>
            </div>
          </div>

          {/* CTWA Referral Banner if from Meta Ads */}
          {activeConv.ctwa_referral && (
            <div className="bg-blue-950/40 border-b border-blue-800/40 p-2.5 px-5 flex items-center justify-between text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-blue-200">Click-to-WhatsApp Ad:</span>{' '}
                  <span>{activeConv.ctwa_referral.headline || activeConv.ctwa_referral.campaign_name}</span>
                  {activeConv.ctwa_referral.ctwa_clid && (
                    <span className="ml-2 font-mono text-[10px] text-blue-400/80 bg-blue-900/40 px-1.5 py-0.5 rounded">
                      CLID: {activeConv.ctwa_referral.ctwa_clid.slice(0, 12)}...
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Attributed</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-zinc-950/40">
            {messages.map((msg) => {
              const isOutgoing = msg.direction === 'outgoing';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-sm ${
                      isOutgoing
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                    }`}
                  >
                    {msg.sender_name && isOutgoing && (
                      <div className="text-[10px] text-emerald-200 font-semibold mb-1 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {msg.sender_name}
                      </div>
                    )}

                    {msg.template_name && (
                      <div className="mb-1 text-[10px] uppercase font-bold text-emerald-200/90 bg-emerald-700/50 px-1.5 py-0.5 rounded w-max">
                        Template: {msg.template_name}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    <div
                      className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                        isOutgoing ? 'text-emerald-200' : 'text-zinc-500'
                      }`}
                    >
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOutgoing && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-cyan-200" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-200" />
                          ) : (
                            <Check className="w-3 h-3 text-emerald-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 24h Policy Warning & Template Switcher */}
          {!windowInfo.isOpen && (
            <div className="p-2.5 px-5 bg-amber-950/30 border-t border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>24-Hour Customer Window Closed.</strong> Meta requires an approved template message to resume.
                </span>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-zinc-900 border border-amber-700/50 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none"
              >
                <option value="">Select Approved Template...</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-zinc-800 bg-zinc-950/90 flex gap-2 items-center">
            {windowInfo.isOpen ? (
              <>
                <input
                  type="text"
                  placeholder="Type a WhatsApp reply (within 24h window)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText || isSending}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 text-xs text-zinc-400 italic">
                  {selectedTemplate ? `Ready to dispatch template: "${selectedTemplate}"` : 'Select a Meta Template above to message this contact.'}
                </div>
                <button
                  type="submit"
                  disabled={!selectedTemplate || isSending}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Template</span>
                </button>
              </>
            )}
          </form>
        </div>

        {/* ─── COLUMN 3: Realtime CRM & CTWA Customer Drawer ─── */}
        <div className="w-80 border-l border-zinc-800/80 bg-zinc-950/95 p-5 overflow-y-auto space-y-5">
          {/* Contact Header */}
          <div className="text-center pb-4 border-b border-zinc-800">
            <img
              src={activeConv.contact.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={activeConv.contact.name}
              className="w-16 h-16 rounded-full object-cover mx-auto mb-2.5 border-2 border-zinc-700 shadow-md"
            />
            <h3 className="text-sm font-bold text-white">{activeConv.contact.name}</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase">
              {activeConv.contact.lifecycle_stage.replace('_', ' ')}
            </span>
          </div>

          {/* Details List */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Contact Info</h4>
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-300">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-semibold">{activeConv.contact.name}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-mono">{activeConv.contact.formatted_phone}</span>
              </div>
              {activeConv.contact.email && (
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{activeConv.contact.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-400 mb-2">CRM Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {activeConv.contact.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-300 font-medium">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* CTWA Referral Attribution */}
          {activeConv.ctwa_referral && (
            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Megaphone className="w-3.5 h-3.5" />
                <span>CTWA Attribution</span>
              </div>
              <div className="text-[11px] text-zinc-300 space-y-1">
                <div>Campaign: <span className="text-white font-medium">{activeConv.ctwa_referral.campaign_name || 'Inbound'}</span></div>
                <div>Ad ID: <span className="text-white font-mono">{activeConv.ctwa_referral.ad_id || '9823412093'}</span></div>
                {activeConv.ctwa_referral.ctwa_clid && (
                  <div className="truncate text-zinc-400">
                    CLID: <span className="text-blue-300 font-mono">{activeConv.ctwa_referral.ctwa_clid}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instant Meta CAPI Dispatcher */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Click Meta CAPI Trigger</span>
              </h4>
            </div>
            <p className="text-[11px] text-zinc-400">
              Fire verified conversion events to Meta Conversions API with contact phone/email SHA-256 hashes and CTWA Click ID.
            </p>

            {capiSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{capiSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTriggerCapi('Lead', 25)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center"
              >
                + Lead ($25)
              </button>
              <button
                onClick={() => handleTriggerCapi('Schedule', 50)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center"
              >
                + Demo Booked ($50)
              </button>
              <button
                onClick={() => handleTriggerCapi('Purchase', 150)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center"
              >
                + Purchase ($150)
              </button>
              <button
                onClick={() => handleTriggerCapi('Contact', 10)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center"
              >
                + Contact ($10)
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">No Active WhatsApp Conversations</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            Incoming WhatsApp messages, CTWA Meta Ad clicks, and Sandbox test chats will appear here in real time with 24-hour window countdowns and AI agent sync.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenConnect && (
              <button
                onClick={onOpenConnect}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Connect WhatsApp / Sandbox</span>
              </button>
            )}
            <button
              onClick={handleSimulateSandboxInbound}
              disabled={isSimulating}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Simulate Inbound Test Message</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
