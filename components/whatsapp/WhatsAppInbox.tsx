import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Send, Check, CheckCheck, Clock, AlertTriangle, 
  Sparkles, Megaphone, User, Phone, Mail, 
  RefreshCw, Paperclip, Smile, Zap, MessageSquare, 
  ShieldCheck, LayoutTemplate, ArrowUpRight, CheckCircle2, Loader2, Bot,
  Info, ChevronRight
} from 'lucide-react';
import { PlayCircle } from 'lucide-react';
import { getAuthHeaders } from '../../lib/frontendAuth';
import { WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate } from '../../lib/whatsappTypes';

interface WhatsAppInboxProps {
  onTriggerCapi?: (convId: string, eventName: string, value?: number) => void;
  onOpenConnect?: () => void;
  initialPhone?: string;
  initialName?: string;
  userSession?: any;
}

// Deduplicate messages by ID or direction + text + timestamp proximity (120s)
const deduplicateMessages = (msgs: WhatsAppMessage[]): WhatsAppMessage[] => {
  const result: WhatsAppMessage[] = [];
  for (const msg of msgs) {
    const isDup = result.some((existing) => {
      if (existing.id === msg.id) return true;
      if (
        existing.direction === msg.direction &&
        (existing.text || '').trim().toLowerCase() === (msg.text || '').trim().toLowerCase() &&
        Math.abs(new Date(existing.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 120000
      ) {
        return true;
      }
      return false;
    });
    if (!isDup) {
      result.push(msg);
    }
  }
  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({ onTriggerCapi, onOpenConnect, initialPhone, initialName }) => {
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
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Dedicated container ref for message list (never scroll document or ancestor elements!)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef<boolean>(true);

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
    return getAuthHeaders();
  };

  // Safe inner container scroll to bottom without page hijacking
  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Format relative timestamp like Screenshot 1 ("5m", "1h", "Aug 28")
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSecs < 60) return 'just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Load conversations from backend
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
      const res = await fetch('/api/whatsapp/conversations', { headers: getHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          if (data.data.length > 0) {
            setConversations(data.data);
            setStoredConversations(data.data);
            setActiveConvId((prev) => {
              const exists = data.data.some((c: any) => c.id === prev);
              return exists && prev ? prev : data.data[0].id;
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

  // Load messages for a single thread
  const loadMessages = async (convId: string, isInitial = false) => {
    if (!convId) return;
    try {
      if (isInitial) {
        const cachedMsgs = getStoredMessages(convId);
        if (cachedMsgs.length > 0) {
          setMessages(cachedMsgs);
          setTimeout(() => scrollToBottom(false), 20);
        }
      }
      const res = await fetch(`/api/whatsapp/conversations/${convId}/messages`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const clean = deduplicateMessages(data.data);
          setMessages(clean);
          setStoredMessages(convId, clean);
          if (isInitial) {
            setTimeout(() => scrollToBottom(false), 50);
          }
        }
      }
    } catch (e) {}
  };

  // Full backfill & sync on demand
  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const res = await fetch('/api/whatsapp/backfill', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        await loadConversations(false);
        if (activeConvId) {
          await loadMessages(activeConvId, false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackfilling(false);
    }
  };

  // Simulate inbound WhatsApp test message
  const handleSimulateSandboxInbound = async () => {
    setIsSimulating(true);
    try {
      const phone = activeConv?.contact?.phone_number || initialPhone || '';
      const name = activeConv?.contact?.name || initialName || 'WhatsApp Contact';

      const res = await fetch('/api/whatsapp/sandbox/simulate-message', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: 'Hello! Testing real-time WhatsApp inbox sync and instant response.',
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
          setTimeout(() => scrollToBottom(true), 50);
        }
        await loadConversations(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Real-Time Server-Sent Events (SSE) Listener for zero-delay message & receipt sync
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      const uid = getStorageUserId();
      eventSource = new EventSource(`/api/whatsapp/events?userId=${encodeURIComponent(uid)}`);

      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'connected') return;

          const eventType = event.event || event.type;
          const msg = event.message;
          const convId = event.conversationId || msg?.conversationId || msg?.conversation_id;

          if (eventType === 'message.received' || eventType === 'message.sent') {
            if (msg) {
              // 1. If currently viewing this conversation, immediately append message to thread
              if (activeConvId && (convId === activeConvId || msg.conversation_id === activeConvId)) {
                setMessages((prev) => {
                  const exists = prev.some((m) =>
                    m.id === msg.id ||
                    (m.direction === msg.direction &&
                     (m.text || '').trim().toLowerCase() === (msg.text || '').trim().toLowerCase() &&
                     Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 120000)
                  );
                  if (exists) return prev;
                  const next = deduplicateMessages([...prev, msg]);
                  setStoredMessages(activeConvId, next);
                  return next;
                });

                // Only auto-scroll if near bottom or message was sent by user
                const container = messagesContainerRef.current;
                const isNearBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 180) : true;
                if (isNearBottom || msg.direction === 'outgoing') {
                  setTimeout(() => scrollToBottom(true), 50);
                }
              }

              // 2. Bump conversation in list and update preview
              setConversations((prev) => {
                const targetIdx = prev.findIndex((c) => c.id === convId || c.id === msg.conversation_id);
                if (targetIdx !== -1) {
                  const target = { ...prev[targetIdx] };
                  target.last_message = msg;
                  target.updated_at = msg.timestamp || new Date().toISOString();
                  if (msg.direction === 'incoming' && activeConvId !== convId) {
                    target.unread_count = (target.unread_count || 0) + 1;
                  }
                  const rest = prev.filter((_, idx) => idx !== targetIdx);
                  const updated = [target, ...rest];
                  setStoredConversations(updated);
                  return updated;
                } else if (event.conversation) {
                  const updated = [event.conversation, ...prev];
                  setStoredConversations(updated);
                  return updated;
                }
                return prev;
              });
            }
          } else if (eventType === 'message.delivered' || eventType === 'message.read') {
            if (msg?.id && msg?.status) {
              setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? { ...m, status: msg.status } : m))
              );
            }
          } else if (eventType === 'conversation.started') {
            if (event.conversation) {
              setConversations((prev) => {
                const exists = prev.some((c) => c.id === event.conversation.id);
                if (exists) return prev;
                const next = [event.conversation, ...prev];
                setStoredConversations(next);
                return next;
              });
            }
          }
        } catch (parseErr) {}
      };
    } catch (sseErr) {
      console.warn('[SSE Init notice]:', sseErr);
    }

    return () => {
      eventSource?.close();
    };
  }, [activeConvId, scrollToBottom]);

  // Initial load
  useEffect(() => {
    loadConversations(true);
    loadTemplates();
    // Reconcile in background every 20 seconds (without heavy polling)
    const interval = setInterval(() => loadConversations(false), 20000);
    return () => clearInterval(interval);
  }, []);

  // When active conversation changes, load messages once and scroll to bottom
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId, true);
      // Mark as read
      fetch(`/api/whatsapp/conversations/${activeConvId}/read`, { method: 'POST', headers: getHeaders() }).catch(() => {});
      // Reset unread count locally for instant responsiveness
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Calculate 24-hour remaining time
  const getWindowTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return { isOpen: false, text: 'Expired' };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { isOpen: false, text: 'Window Closed' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { isOpen: true, text: `${hours}h ${mins}m left in window` };
  };

  // Handle outbound message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText && !selectedTemplate) || isSending || !activeConvId) return;

    const sentText = inputText;
    const sentTemplate = selectedTemplate;

    // Optimistic UI update
    const optimisticMsg: WhatsAppMessage = {
      id: `opt_${Date.now()}`,
      conversation_id: activeConvId,
      direction: 'outgoing',
      type: sentTemplate ? 'template' : 'text',
      text: sentText || `[Template: ${sentTemplate}]`,
      template_name: sentTemplate || undefined,
      status: 'sent',
      timestamp: new Date().toISOString(),
      sender_name: 'You',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSelectedTemplate('');
    setTimeout(() => scrollToBottom(true), 30);

    setIsSending(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sentText,
          template_name: sentTemplate || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
          );
        }
      }
    } catch (err) {
      console.error('[Send message error]:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Trigger Meta CAPI conversion event
  const handleTriggerCapi = async (eventName: string, value: number = 25) => {
    if (!activeConv) return;
    setIsCapiSending(true);
    setCapiSuccess(null);
    try {
      if (onTriggerCapi) {
        onTriggerCapi(activeConv.id, eventName, value);
      }
      const res = await fetch('/api/whatsapp/capi/events', {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          conversationId: activeConv.id,
          value,
          currency: 'USD',
          phone: activeConv.contact.phone_number,
          name: activeConv.contact.name,
        }),
      });
      if (res.ok) {
        setCapiSuccess(`Meta CAPI event '${eventName}' ($ ${value}) dispatched!`);
        setTimeout(() => setCapiSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapiSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = c.contact?.name?.toLowerCase().includes(q) || false;
    const phoneMatch = c.contact?.phone_number?.includes(q) || false;
    const lastMsgMatch = c.last_message?.text?.toLowerCase().includes(q) || false;
    const matchQuery = !q || nameMatch || phoneMatch || lastMsgMatch;

    if (filterTag === 'unread') return matchQuery && (c.unread_count > 0);
    if (filterTag === 'active') return matchQuery && c.is_window_open;
    return matchQuery;
  });

  const windowInfo = activeConv ? getWindowTimeLeft(activeConv.window_expires_at) : { isOpen: false, text: '' };

  // Helper to extract initial letter for avatar circle
  const getInitial = (name?: string, phone?: string) => {
    if (name && name !== 'WhatsApp User' && name !== 'WhatsApp Contact') {
      const trimmed = name.trim();
      return trimmed.charAt(0).toUpperCase();
    }
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      return clean.charAt(0) || 'W';
    }
    return 'W';
  };

  // Clean message preview text (avoid raw "[Unsupported message]")
  const getMessagePreview = (text?: string, templateName?: string) => {
    if (templateName) return `[Template: ${templateName}]`;
    if (!text || text === '[Unsupported message]') return 'Media / message';
    return text;
  };

  return (
    <div className="flex-1 h-full min-h-0 flex bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ─── COLUMN 1: Conversation List (Exact Match to Screenshot 1) ─── */}
      <div className="w-80 lg:w-96 border-r border-zinc-800/80 flex flex-col bg-zinc-950/70 shrink-0 select-none">
        
        {/* Header & Search */}
        <div className="p-3.5 border-b border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Messages</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {conversations.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBackfill}
                disabled={isBackfilling}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Sync all chats & contacts from WhatsApp account"
              >
                <RefreshCw className={`w-3 h-3 ${isBackfilling ? 'animate-spin' : ''}`} />
                <span>{isBackfilling ? 'Syncing...' : 'Sync Chats'}</span>
              </button>
              <button
                onClick={handleSimulateSandboxInbound}
                disabled={isSimulating}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-zinc-900 transition-colors disabled:opacity-50"
                title="Simulate Inbound WhatsApp Test Message"
              >
                <PlayCircle className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search messages, contacts, numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {[
              { id: 'all', label: 'All Chats' },
              { id: 'unread', label: 'Unread' },
              { id: 'active', label: '24h Active' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTag(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterTag === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List View */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              {isLoading ? 'Loading chats from WhatsApp...' : 'No conversations found. Click "Sync Chats" to import.'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const contactName = conv.contact?.name || 'WhatsApp Contact';
              const contactPhone = conv.contact?.formatted_phone || conv.contact?.phone_number || '';
              const viaNumber = conv.via_phone_number || '';
              const initial = getInitial(contactName, contactPhone);
              const preview = getMessagePreview(conv.last_message?.text, conv.last_message?.template_name);
              const timeDisplay = formatTimeAgo(conv.last_message?.timestamp || conv.updated_at);
              const win = getWindowTimeLeft(conv.window_expires_at);

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all flex gap-3 items-start ${
                    isSelected
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-400'
                      : 'hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Circular Avatar with WhatsApp Badge (Screenshot 1) */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {initial}
                    </div>
                    {/* WhatsApp Green Icon Badge */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow">
                      <Phone className="w-2.5 h-2.5 fill-current" />
                    </div>
                  </div>

                  {/* Main Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      {/* Name · Phone · via Number */}
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span className="font-bold text-zinc-100">{contactName}</span>
                        {contactPhone && contactPhone !== contactName && (
                          <span className="text-[11px] text-zinc-400 font-normal truncate">
                            · {contactPhone}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-normal truncate">
                          · via {viaNumber}
                        </span>
                      </div>
                      
                      <span className="text-[10px] text-zinc-400 font-medium shrink-0 ml-1">
                        {timeDisplay}
                      </span>
                    </div>

                    {/* Preview line & Unread Dot */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-zinc-400 truncate leading-snug">
                        {conv.last_message?.direction === 'outgoing' ? <span className="text-zinc-500">You: </span> : ''}
                        {preview}
                      </p>

                      {/* Unread Indicator Red Dot (Screenshot 1) */}
                      {conv.unread_count > 0 && (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-sm animate-pulse" />
                      )}
                    </div>

                    {/* 24h Window Badge */}
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        win.isOpen
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
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

      {/* ─── COLUMN 2: Active Chat Area ─── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-zinc-950 relative min-w-0">
          
          {/* Chat Header */}
          <div className="p-3.5 px-5 border-b border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {getInitial(activeConv.contact?.name, activeConv.contact?.phone_number)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <Phone className="w-2 h-2 fill-current" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate">
                  <h3 className="text-sm font-bold text-white truncate">{activeConv.contact?.name}</h3>
                  <span className="text-xs text-zinc-400 font-mono">{activeConv.contact?.formatted_phone || activeConv.contact?.phone_number}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  {activeConv.via_phone_number && <span>via {activeConv.via_phone_number}</span>}
                  <span>•</span>
                  <span className={`flex items-center gap-1 font-medium ${windowInfo.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Clock className="w-3 h-3" />
                    {windowInfo.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>Live WhatsApp Sync</span>
              </div>
              <button
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showRightSidebar
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
                title="Toggle contact info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream (Container-managed scroll, NO page jumping!) */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-950/40"
          >
            {messages.length > 0 && (
              <div className="flex justify-center my-2">
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 rounded-full shadow-xs">
                  Today
                </span>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
                <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                <p>No messages in this conversation yet.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOutgoing = msg.direction === 'outgoing';
                const isUnsupported = msg.text === '[Unsupported message]';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isOutgoing
                          ? 'bg-[#005c4b] text-white rounded-br-sm'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-bl-sm'
                      }`}
                    >
                      

                      {msg.template_name && (
                        <div className="mb-1 text-[10px] uppercase font-bold text-emerald-200/90 bg-emerald-700/50 px-1.5 py-0.5 rounded w-max">
                          Template: {msg.template_name}
                        </div>
                      )}

                      {isUnsupported ? (
                        <div className="flex items-center gap-1.5 text-zinc-400 italic">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp interaction / media</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}

                      {/* Timestamp & Receipts */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                          isOutgoing ? 'text-emerald-200' : 'text-zinc-500'
                        }`}
                      >
                        <span>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                        {isOutgoing && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
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
              })
            )}
          </div>

          {/* 24-Hour Policy Alert when window is closed */}
          {!windowInfo.isOpen && (
            <div className="p-2.5 px-5 bg-amber-950/40 border-t border-amber-800/40 text-xs text-amber-300 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>24-Hour Customer Window Closed.</strong> Meta requires an approved template message to resume.
                </span>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-zinc-900 border border-amber-700/60 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none"
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

          {/* Chat Composer Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 border-t border-zinc-800 bg-zinc-950/90 flex gap-2 items-center shrink-0"
          >
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
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  disabled
                  placeholder="24-hour window closed. Select an approved template above to message..."
                  className="flex-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!selectedTemplate || isSending}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Template</span>
                </button>
              </>
            )}
          </form>
        </div>
      ) : (
        /* Empty state when no conversation is selected (Exact Match to Screenshot 1) */
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Select a conversation</h3>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            Select a conversation to view messages, send replies, or fire Meta CAPI conversion events.
          </p>
        </div>
      )}

      {/* ─── COLUMN 3: Collapsible Contact Info & Meta CAPI Drawer ─── */}
      {activeConv && showRightSidebar && (
        <div className="w-72 lg:w-80 border-l border-zinc-800/80 bg-zinc-950/80 flex flex-col shrink-0 overflow-y-auto p-4 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contact Info</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-base shadow">
                {getInitial(activeConv.contact?.name, activeConv.contact?.phone_number)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{activeConv.contact?.name}</h4>
                <p className="text-xs text-zinc-400 font-mono truncate">{activeConv.contact?.formatted_phone || activeConv.contact?.phone_number}</p>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Via Account:</span>
                <span className="text-zinc-200 font-mono text-[11px]">{activeConv.via_phone_number || 'WhatsApp'}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Customer Window:</span>
                <span className={`font-semibold ${windowInfo.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {windowInfo.isOpen ? 'Open (Active)' : 'Closed'}
                </span>
              </div>
            </div>
          </div>

          {/* CRM Tags */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold text-zinc-300">CRM Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {(activeConv.contact?.tags || ['WhatsApp_User', 'Synced_Contact']).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-semibold text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 1-Click Meta CAPI Trigger */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Click Meta CAPI Trigger</span>
              </h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Fire verified conversion events to Meta Conversions API with contact phone/email SHA-256 hashes and CTWA Click ID.
            </p>

            {capiSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{capiSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleTriggerCapi('Lead', 25)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center cursor-pointer disabled:opacity-50"
              >
                + Lead ($25)
              </button>
              <button
                onClick={() => handleTriggerCapi('Schedule', 50)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center cursor-pointer disabled:opacity-50"
              >
                + Demo ($50)
              </button>
              <button
                onClick={() => handleTriggerCapi('Purchase', 150)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center cursor-pointer disabled:opacity-50"
              >
                + Purchase ($150)
              </button>
              <button
                onClick={() => handleTriggerCapi('Contact', 10)}
                disabled={isCapiSending}
                className="p-2 bg-zinc-900 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all text-center cursor-pointer disabled:opacity-50"
              >
                + Contact ($10)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
