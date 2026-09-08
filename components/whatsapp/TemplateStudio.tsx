import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutTemplate, Plus, CheckCircle2, AlertCircle, Trash2, 
  Sparkles, ExternalLink, Phone, Copy, Check, 
  Smartphone, MessageSquare, RefreshCw, Send, Loader2,
  Clock, ShieldAlert, BookOpen, Globe, Sliders, Info,
  Search, Eye, HelpCircle, Image as ImageIcon, Video, FileText,
  ChevronRight, ArrowRight, CornerDownLeft, AlertTriangle,
  ChevronDown, Edit3, ArrowLeft, CheckCircle, Flame, ShieldCheck,
  X, Filter
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppTemplateComponent, WhatsAppTemplateStatus } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

export interface TemplateStudioProps {
  userSession?: any;
}

interface ButtonConfig {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

const COMMON_LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en', label: 'English (UK)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'pt_BR', label: 'Portuguese (Brasil)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'id', label: 'Indonesian (Bahasa)' },
  { code: 'tr', label: 'Turkish (Türkçe)' },
];

const PRESET_LIBRARY_TEMPLATES = [
  {
    name: 'welcome_greeting',
    category: 'MARKETING' as const,
    language: 'en_US',
    title: 'Customer Welcome & Introduction',
    description: 'Warm greeting for inbound leads and newly onboarded customers.',
    body: 'Hi {{1}}, welcome to our community! We are thrilled to have you with us. Explore our catalog or message our support team anytime.',
    sampleVariables: ['Sarah'],
    buttons: [
      { type: 'URL' as const, text: 'Explore Catalog 🛍️', url: 'https://rockyt.io' },
      { type: 'QUICK_REPLY' as const, text: 'Talk to Support 💬' }
    ]
  },
  {
    name: 'appointment_reminder',
    category: 'UTILITY' as const,
    language: 'en_US',
    title: 'Scheduled Appointment Reminder',
    description: 'Reduce no-shows with automated scheduled booking alerts.',
    body: 'Hello {{1}}, this is a friendly reminder for your upcoming appointment on {{2}} at {{3}}. Please reply to confirm or reschedule.',
    sampleVariables: ['David', 'Tomorrow', '2:30 PM'],
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'Confirm Booking ✅' },
      { type: 'QUICK_REPLY' as const, text: 'Reschedule 📅' }
    ]
  },
  {
    name: 'two_factor_auth_code',
    category: 'AUTHENTICATION' as const,
    language: 'en_US',
    title: 'One-Time Security Passcode (OTP)',
    description: 'Instant security OTP code for rapid passwordless login.',
    body: 'Your Rockyt verification code is {{1}}. This passcode expires in 10 minutes. Do not share this code with anyone.',
    sampleVariables: ['849-201'],
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'Copy Passcode 📋' }
    ]
  },
  {
    name: 'vip_exclusive_offer',
    category: 'MARKETING' as const,
    language: 'en_US',
    title: 'VIP Exclusive Discount Offer',
    description: 'Drive repeat sales with personalized discount incentives.',
    body: 'Special offer for {{1}}! Enjoy {{2}} discount on your next purchase with code {{3}}. Valid for the next 48 hours only!',
    sampleVariables: ['Emily', '30%', 'ROCKYT30'],
    buttons: [
      { type: 'URL' as const, text: 'Claim Discount 🎁', url: 'https://rockyt.io' },
      { type: 'QUICK_REPLY' as const, text: 'Stop Promotions' }
    ]
  }
];

export const TemplateStudio: React.FC<TemplateStudioProps> = ({ userSession }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateName, setActiveTemplateName] = useState<string>('');
  const [activeView, setActiveView] = useState<'list' | 'inspect' | 'create' | 'library'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [hasConnectedAccount, setHasConnectedAccount] = useState<boolean>(true);
  const [previewWithSamples, setPreviewWithSamples] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inspector dynamic test variable states
  const [customVariableInputs, setCustomVariableInputs] = useState<Record<string, string>>({});

  // Builder Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerSample, setHeaderSample] = useState('');
  const [bodyText, setBodyText] = useState('Hello {{1}}, thank you for contacting us! How can we assist you with our services today?');
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({
    '{{1}}': 'Alex',
  });
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe');
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { type: 'QUICK_REPLY', text: 'Chat with Support 💬' }
  ]);
  const [deliveryTtlSeconds, setDeliveryTtlSeconds] = useState<number | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  // Library Lookup State
  const [libraryLookupName, setLibraryLookupName] = useState('');
  const [libraryLookupLang, setLibraryLookupLang] = useState('en_US');
  const [libraryLookupResult, setLibraryLookupResult] = useState<any | null>(null);
  const [isLookingUpLibrary, setIsLookingUpLibrary] = useState(false);

  // Extract variables like {{1}}, {{2}} from body text
  const detectedVariables = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches)).sort();
  }, [bodyText]);

  useEffect(() => {
    setBodySamples(prev => {
      const next: Record<string, string> = { ...prev };
      detectedVariables.forEach((v, idx) => {
        if (!next[v]) {
          next[v] = idx === 0 ? 'Alex' : idx === 1 ? 'ORD-8921' : `Sample_${idx + 1}`;
        }
      });
      return next;
    });
  }, [detectedVariables]);

  const loadTemplates = async (showSyncIndicator = false) => {
    try {
      if (showSyncIndicator) setIsSyncing(true);
      else setIsLoading(true);
      setErrorBanner(null);

      const res = await fetch(`/api/whatsapp/templates${showSyncIndicator ? '?sync=true' : ''}`, {
        headers: getAuthHeaders(userSession),
      });

      if (res.ok) {
        const data = await res.json();
        const list: WhatsAppTemplate[] = Array.isArray(data.data) ? data.data : [];
        setTemplates(list);
        setHasConnectedAccount(data.accountConnected !== false);

        if (list.length > 0 && !activeTemplateName) {
          setActiveTemplateName(list[0].name);
        }

        if (showSyncIndicator) {
          setSuccessBanner('Templates refreshed live with Meta WhatsApp Business API.');
          setTimeout(() => setSuccessBanner(null), 3500);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorBanner(err.error || 'Failed to load templates.');
      }
    } catch (e: any) {
      setErrorBanner(e.message || 'Error fetching templates.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [userSession?.id, userSession?.email]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.name === activeTemplateName) || templates[0] || null;
  }, [templates, activeTemplateName]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = templates.length;
    const approved = templates.filter(t => t.status === 'APPROVED').length;
    const pending = templates.filter(t => t.status === 'PENDING').length;
    const rejected = templates.filter(t => t.status === 'REJECTED').length;
    return { total, approved, pending, rejected };
  }, [templates]);

  // Filtered Templates List
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bodyComp = t.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
        const matchName = t.name.toLowerCase().includes(q);
        const matchBody = (bodyComp?.text || '').toLowerCase().includes(q);
        if (!matchName && !matchBody) return false;
      }
      return true;
    });
  }, [templates, statusFilter, categoryFilter, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartCreate = (reset = true) => {
    if (reset) {
      setName('');
      setCategory('MARKETING');
      setLanguage('en_US');
      setHeaderType('NONE');
      setHeaderText('');
      setHeaderSample('');
      setBodyText('Hello {{1}}, thank you for contacting us! How can we assist you with our services today?');
      setBodySamples({ '{{1}}': 'Alex' });
      setFooterText('Reply STOP to unsubscribe');
      setButtons([{ type: 'QUICK_REPLY', text: 'Chat with Support 💬' }]);
      setDeliveryTtlSeconds('');
      setIsEditing(false);
    }
    setActiveView('create');
  };

  const handleEditTemplate = (tmpl: WhatsAppTemplate) => {
    setName(tmpl.name);
    setCategory(tmpl.category);
    setLanguage(tmpl.language || 'en_US');

    const header = tmpl.components?.find(c => c.type === 'HEADER' || (c.type as any) === 'header');
    const body = tmpl.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
    const footer = tmpl.components?.find(c => c.type === 'FOOTER' || (c.type as any) === 'footer');
    const btns = tmpl.components?.find(c => c.type === 'BUTTONS' || (c.type as any) === 'buttons');

    if (header) {
      setHeaderType(header.format || (header.text ? 'TEXT' : 'NONE'));
      setHeaderText(header.text || '');
      setHeaderSample(header.example?.header_text?.[0] || '');
    } else {
      setHeaderType('NONE');
      setHeaderText('');
      setHeaderSample('');
    }

    setBodyText(body?.text || '');
    setFooterText(footer?.text || '');
    setButtons(btns?.buttons?.map(b => ({
      type: b.type as any,
      text: b.text,
      url: b.url,
      phone_number: b.phone_number
    })) || []);
    setDeliveryTtlSeconds(tmpl.message_send_ttl_seconds || '');
    setIsEditing(true);
    setActiveView('create');
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanName || !/^[a-z][a-z0-9_]*$/.test(cleanName)) {
      setErrorBanner('Template name must begin with a lowercase letter and contain only lowercase letters, numbers, and underscores.');
      return;
    }

    if (!bodyText.trim()) {
      setErrorBanner('Message body text cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);

      const componentsPayload: WhatsAppTemplateComponent[] = [];

      if (headerType === 'TEXT' && headerText.trim()) {
        componentsPayload.push({
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim(),
          example: headerSample.trim() ? { header_text: [headerSample.trim()] } : undefined,
        });
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        componentsPayload.push({
          type: 'HEADER',
          format: headerType as any,
        });
      }

      const bodyExampleRows = detectedVariables.map(v => bodySamples[v] || 'Sample');
      componentsPayload.push({
        type: 'BODY',
        text: bodyText.trim(),
        example: bodyExampleRows.length > 0 ? { body_text: [bodyExampleRows] } : undefined,
      });

      if (footerText.trim()) {
        componentsPayload.push({
          type: 'FOOTER',
          text: footerText.trim(),
        });
      }

      if (buttons.length > 0) {
        componentsPayload.push({
          type: 'BUTTONS',
          buttons: buttons.map(b => ({
            type: b.type,
            text: b.text.trim(),
            url: b.type === 'URL' ? b.url : undefined,
            phone_number: b.type === 'PHONE_NUMBER' ? b.phone_number : undefined,
          })),
        });
      }

      const payload = {
        name: cleanName,
        category,
        language,
        components: componentsPayload,
        message_send_ttl_seconds: deliveryTtlSeconds ? Number(deliveryTtlSeconds) : undefined,
      };

      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/whatsapp/templates/${cleanName}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(userSession) },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(userSession) },
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit template to Meta.');
      }

      setSuccessBanner(
        isEditing
          ? `Template "${cleanName}" updated and resubmitted to Meta review.`
          : `Template "${cleanName}" created and submitted to Meta! Status is PENDING review.`
      );

      await loadTemplates();
      setActiveTemplateName(cleanName);
      setActiveView('inspect');
      setIsEditing(false);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error submitting template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportPreset = async (preset: typeof PRESET_LIBRARY_TEMPLATES[0]) => {
    try {
      setIsSubmitting(true);
      setErrorBanner(null);

      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(userSession) },
        body: JSON.stringify({
          name: preset.name,
          category: preset.category,
          language: preset.language,
          library_template_name: preset.name,
          components: [
            { type: 'BODY', text: preset.body },
            ...(preset.buttons.length > 0 ? [{ type: 'BUTTONS', buttons: preset.buttons }] : [])
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import template.');

      setSuccessBanner(`Template "${preset.name}" imported and ready to use!`);
      await loadTemplates();
      setActiveTemplateName(preset.name);
      setActiveView('inspect');
    } catch (e: any) {
      setErrorBanner(e.message || 'Failed to import library template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupCustomLibrary = async () => {
    if (!libraryLookupName.trim()) return;
    try {
      setIsLookingUpLibrary(true);
      setErrorBanner(null);
      const res = await fetch(`/api/whatsapp/templates/library?name=${encodeURIComponent(libraryLookupName.trim())}&language=${libraryLookupLang}`, {
        headers: getAuthHeaders(userSession),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Template not found in Meta Library.');
      setLibraryLookupResult(data.template);
    } catch (err: any) {
      setErrorBanner(err.message || 'Lookup failed.');
      setLibraryLookupResult(null);
    } finally {
      setIsLookingUpLibrary(false);
    }
  };

  const handleDeleteTemplate = async (tmplName: string) => {
    if (!confirm(`Are you sure you want to permanently delete template "${tmplName}"?`)) return;

    try {
      setIsLoading(true);
      setErrorBanner(null);
      const res = await fetch(`/api/whatsapp/templates/${tmplName}`, {
        method: 'DELETE',
        headers: getAuthHeaders(userSession),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete template.');
      }

      setSuccessBanner(`Template "${tmplName}" deleted.`);
      await loadTemplates();
      setActiveView('list');
    } catch (err: any) {
      setErrorBanner(err.message || 'Error deleting template.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preview Data computation for phone simulator
  const activePreviewData = useMemo(() => {
    if (activeView === 'create') {
      let finalHeader = headerText;
      let finalBody = bodyText;

      if (previewWithSamples) {
        if (headerSample) finalHeader = finalHeader.replace('{{1}}', headerSample);
        Object.entries(bodySamples).forEach(([k, v]) => {
          if (v) finalBody = finalBody.replaceAll(k, v);
        });
      }

      return {
        name: name || 'new_template',
        category,
        status: isEditing ? 'PENDING' : 'DRAFT',
        headerType,
        headerText: finalHeader,
        bodyText: finalBody,
        footerText,
        buttons: buttons.map(b => ({ text: b.text, type: b.type })),
      };
    }

    if (activeTemplate) {
      const headerComp = activeTemplate.components?.find(c => c.type === 'HEADER' || (c.type as any) === 'header');
      const bodyComp = activeTemplate.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
      const footerComp = activeTemplate.components?.find(c => c.type === 'FOOTER' || (c.type as any) === 'footer');
      const btnComp = activeTemplate.components?.find(c => c.type === 'BUTTONS' || (c.type as any) === 'buttons');

      let renderedBody = bodyComp?.text || 'No message content.';
      let renderedHeader = headerComp?.text || '';

      if (previewWithSamples) {
        const vars = renderedBody.match(/\{\{(\d+)\}\}/g) || [];
        vars.forEach(v => {
          const val = customVariableInputs[v] || (v === '{{1}}' ? 'Alex' : v === '{{2}}' ? '25% OFF' : 'VIP');
          renderedBody = renderedBody.replaceAll(v, val);
        });

        if (renderedHeader.includes('{{1}}')) {
          renderedHeader = renderedHeader.replace('{{1}}', customVariableInputs['header'] || 'Special Offer');
        }
      }

      return {
        name: activeTemplate.name,
        category: activeTemplate.category,
        status: activeTemplate.status,
        headerType: headerComp?.format || (headerComp?.text ? 'TEXT' : 'NONE'),
        headerText: renderedHeader,
        bodyText: renderedBody,
        footerText: footerComp?.text || '',
        buttons: btnComp?.buttons?.map(b => ({ text: b.text, type: b.type })) || [],
      };
    }

    return null;
  }, [activeView, activeTemplate, headerType, headerText, headerSample, bodyText, bodySamples, footerText, buttons, previewWithSamples, name, category, isEditing, customVariableInputs]);

  // Phone Simulator Component
  const renderPhoneSimulator = () => {
    if (!activePreviewData) return null;
    return (
      <div className="flex flex-col items-center">
        {/* Toggle sample preview */}
        <div className="flex items-center justify-between w-full max-w-[280px] mb-3 px-1">
          <span className="text-xs font-semibold text-gray-700">Live Preview</span>
          <button
            type="button"
            onClick={() => setPreviewWithSamples(!previewWithSamples)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
              previewWithSamples 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            {previewWithSamples ? 'Variables Substituted' : 'Raw Placeholders {{1}}'}
          </button>
        </div>

        {/* Smartphone Shell */}
        <div className="w-[280px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 relative">
          {/* Dynamic Notch */}
          <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
          </div>

          {/* Screen Content */}
          <div className="bg-[#e5ddd5] rounded-[24px] overflow-hidden flex flex-col h-[460px] text-gray-900 relative shadow-inner">
            {/* WhatsApp Top Bar */}
            <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center gap-2 shadow-sm shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-xs">
                R
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold truncate">Your Business</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                </div>
                <div className="text-[10px] text-emerald-100/90 leading-tight">Official WhatsApp Account</div>
              </div>
            </div>

            {/* Chat Area with WhatsApp Wallpaper Pattern */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]">
              {/* Date Stamp */}
              <div className="text-center my-1">
                <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-[10px] font-semibold text-gray-600 shadow-2xs">
                  Today
                </span>
              </div>

              {/* Message Bubble */}
              <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[95%] border border-gray-100 text-xs space-y-2 relative">
                {/* Header preview */}
                {activePreviewData.headerType === 'TEXT' && activePreviewData.headerText && (
                  <div className="font-bold text-gray-900 text-[13px] pb-1 border-b border-gray-100">
                    {activePreviewData.headerText}
                  </div>
                )}
                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(activePreviewData.headerType) && (
                  <div className="h-28 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-1 text-[11px]">
                    {activePreviewData.headerType === 'IMAGE' && <ImageIcon className="w-6 h-6 text-gray-500" />}
                    {activePreviewData.headerType === 'VIDEO' && <Video className="w-6 h-6 text-gray-500" />}
                    {activePreviewData.headerType === 'DOCUMENT' && <FileText className="w-6 h-6 text-gray-500" />}
                    <span className="font-semibold text-gray-500">{activePreviewData.headerType} Header</span>
                  </div>
                )}

                {/* Body text */}
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[12px]">
                  {activePreviewData.bodyText}
                </div>

                {/* Footer preview */}
                {activePreviewData.footerText && (
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                    {activePreviewData.footerText}
                  </div>
                )}

                {/* Timestamp & double checks */}
                <div className="flex items-center justify-end gap-1 text-[9px] text-gray-400 pt-0.5">
                  <span>10:45 AM</span>
                  <span className="text-[#34b7f1] font-bold">✓✓</span>
                </div>
              </div>

              {/* Action Buttons */}
              {activePreviewData.buttons && activePreviewData.buttons.length > 0 && (
                <div className="space-y-1 pt-1 max-w-[95%]">
                  {activePreviewData.buttons.map((btn, idx) => (
                    <div 
                      key={idx}
                      className="bg-white hover:bg-gray-50 text-[#00a884] font-bold text-[11px] py-1.5 px-3 rounded-lg text-center shadow-xs border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5 transition"
                    >
                      {btn.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                      {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3" />}
                      {btn.type === 'QUICK_REPLY' && <MessageSquare className="w-3 h-3" />}
                      <span>{btn.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Home indicator bar */}
          <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto mt-2.5"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Control Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 sm:px-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              WhatsApp Message Templates
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              Meta WABA Synced
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Create, test, and manage Meta-approved interactive message templates for outbound broadcasts and notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTemplates(true)}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
            title="Fetch latest review verdicts live from Meta"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking Meta...' : 'Sync Live Status'}</span>
          </button>

          <button
            onClick={() => setActiveView('library')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer ${
              activeView === 'library'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meta Pre-Approved Library</span>
          </button>

          <button
            onClick={() => handleStartCreate(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* ─── Notifications / Alerts ─── */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-500 hover:text-rose-700 font-bold text-base cursor-pointer">&times;</button>
        </div>
      )}

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-base cursor-pointer">&times;</button>
        </div>
      )}

      {/* ─── 4 Metric Stat Cards Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Templates */}
        <div 
          onClick={() => { setStatusFilter('ALL'); setActiveView('list'); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-gray-300 ${
            statusFilter === 'ALL' && activeView === 'list' ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">All Templates</span>
            <LayoutTemplate className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Verified in tenant workspace</div>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => { setStatusFilter('PENDING'); setActiveView('list'); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-amber-300 ${
            statusFilter === 'PENDING' && activeView === 'list' ? 'ring-2 ring-amber-500/20 border-amber-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Under Meta Review</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium">Awaiting automated / manual review</div>
        </div>

        {/* Approved & Ready */}
        <div 
          onClick={() => { setStatusFilter('APPROVED'); setActiveView('list'); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-emerald-300 ${
            statusFilter === 'APPROVED' && activeView === 'list' ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved & Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.approved}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">Ready for broadcasts & API sends</div>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => { setStatusFilter('REJECTED'); setActiveView('list'); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:border-rose-300 ${
            statusFilter === 'REJECTED' && activeView === 'list' ? 'ring-2 ring-rose-500/20 border-rose-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.rejected}</div>
          <div className="text-[11px] text-rose-700/80 mt-1 font-medium">Requires component modifications</div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}

      {/* VIEW 1: TEMPLATE DIRECTORY (GRID & CARDS) */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {st === 'ALL' && `All (${stats.total})`}
                  {st === 'PENDING' && `Pending (${stats.pending})`}
                  {st === 'APPROVED' && `Approved (${stats.approved})`}
                  {st === 'REJECTED' && `Rejected (${stats.rejected})`}
                </button>
              ))}
            </div>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search template name or text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-medium focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
          </div>

          {/* Templates Cards Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map(tmpl => {
                const bodyComp = tmpl.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
                const headerComp = tmpl.components?.find(c => c.type === 'HEADER' || (c.type as any) === 'header');
                const btnComp = tmpl.components?.find(c => c.type === 'BUTTONS' || (c.type as any) === 'buttons');

                return (
                  <div
                    key={tmpl.id || tmpl.name}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide uppercase ${
                          tmpl.category === 'MARKETING'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : tmpl.category === 'UTILITY'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {tmpl.category}
                        </span>

                        {/* Status badge */}
                        {tmpl.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {tmpl.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            In Review
                          </span>
                        )}
                        {tmpl.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Template Name & ID */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition truncate">
                          {tmpl.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tmpl.name, tmpl.name);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded transition cursor-pointer"
                          title="Copy template name"
                        >
                          {copiedId === tmpl.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span>{tmpl.language || 'en_US'}</span>
                        <span>•</span>
                        <span>ID: {tmpl.id ? tmpl.id.substring(0, 10) + '...' : 'Meta Live'}</span>
                      </div>

                      {/* Message Body Box */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 line-clamp-3 mb-4 font-mono leading-relaxed">
                        {bodyComp?.text || 'No message body content.'}
                      </div>

                      {/* Summary Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        {headerComp && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-medium">
                            Header: {headerComp.format || 'Text'}
                          </span>
                        )}
                        {btnComp?.buttons && btnComp.buttons.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-medium">
                            {btnComp.buttons.length} Interactive Button{btnComp.buttons.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setActiveTemplateName(tmpl.name);
                          setActiveView('inspect');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Preview</span>
                      </button>

                      <button
                        onClick={() => handleEditTemplate(tmpl)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                        title="Edit template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(tmpl.name)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <LayoutTemplate className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Templates Found</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No templates match your selected filters. Clear the search or filter to see more templates.'
                  : 'You do not have any message templates saved yet. Create your first template or explore Meta\'s pre-approved library to start immediately.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartCreate(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Create New Template
                </button>
                <button
                  onClick={() => setActiveView('library')}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Explore Meta Library
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TEMPLATE INSPECTOR & SIDE-BY-SIDE INTERACTIVE PHONE SIMULATOR */}
      {activeView === 'inspect' && activeTemplate && (
        <div className="space-y-4">
          {/* Back Action Bar */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 px-6 shadow-xs">
            <button
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-emerald-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Templates</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadTemplates(true)}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Check Live Meta Verdict</span>
              </button>

              <button
                onClick={() => handleEditTemplate(activeTemplate)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDeleteTemplate(activeTemplate.name)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Two-Column Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Template Details & Review Banner */}
            <div className="lg:col-span-7 space-y-4">
              {/* Review Status Banner */}
              {activeTemplate.status === 'PENDING' && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm">
                    <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                    <span>Template Under Meta Review</span>
                  </div>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Meta automated checks and reviewers are currently evaluating this template for WhatsApp business policy compliance. Reviews usually complete within 5 to 30 minutes. Once approved, it will automatically become active and ready for broadcasts.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => loadTemplates(true)}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Checking Meta...' : 'Refresh Status Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTemplate.status === 'APPROVED' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Template Approved & Active</span>
                  </div>
                  <p className="text-xs text-emerald-800/90 leading-relaxed">
                    This template passed Meta review and is 100% active. You can send it directly through WhatsApp Inbox, incorporate it into Broadcast Campaigns, or trigger it via the WhatsApp Cloud API.
                  </p>
                </div>
              )}

              {activeTemplate.status === 'REJECTED' && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>Template Rejected by Meta</span>
                  </div>
                  <p className="text-xs text-rose-800/90 leading-relaxed">
                    {activeTemplate.rejected_reason || 'This template was rejected by Meta for violating formatting, categorization, or promotional guidelines. Edit the components and resubmit for approval.'}
                  </p>
                  <button
                    onClick={() => handleEditTemplate(activeTemplate)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Fix & Resubmit to Meta</span>
                  </button>
                </div>
              )}

              {/* Template Metadata Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Template Information
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Template Name</div>
                    <div className="text-xs font-bold text-gray-900 mt-1 font-mono">{activeTemplate.name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Category</div>
                    <div className="text-xs font-bold text-indigo-700 mt-1">{activeTemplate.category}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Language</div>
                    <div className="text-xs font-bold text-gray-900 mt-1">{activeTemplate.language || 'en_US'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Meta ID</div>
                    <div className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1">
                      <span className="font-mono">{activeTemplate.id ? activeTemplate.id.substring(0, 10) + '...' : 'Pending'}</span>
                      {activeTemplate.id && (
                        <button 
                          onClick={() => copyToClipboard(activeTemplate.id, 'meta_id')}
                          className="text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {copiedId === 'meta_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Variable Testing Panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Interactive Variable Testing</h3>
                    <p className="text-xs text-gray-500">Test how the template displays with custom customer values</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="space-y-3">
                  {detectedVariables.length > 0 ? (
                    detectedVariables.map((v, idx) => (
                      <div key={v} className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-mono text-xs font-bold shrink-0">
                          {v}
                        </span>
                        <input
                          type="text"
                          placeholder={`Enter value for ${v}`}
                          value={customVariableInputs[v] ?? (idx === 0 ? 'Alex' : idx === 1 ? '25% OFF' : 'VIP')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomVariableInputs(prev => ({ ...prev, [v]: val }));
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic py-1">
                      This template has no variable placeholders (e.g., {'{{1}}'}).
                    </div>
                  )}
                </div>
              </div>

              {/* Components Structure */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Template Components Breakdown
                </h3>

                <div className="space-y-3 text-xs">
                  {activeTemplate.components?.map((comp, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-gray-800">
                        <span className="uppercase text-[11px] tracking-wider text-emerald-700 font-extrabold">{comp.type}</span>
                        {comp.format && <span className="text-[10px] text-gray-500">Format: {comp.format}</span>}
                      </div>
                      {comp.text && (
                        <div className="text-gray-700 font-mono text-[11px] whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-gray-100">
                          {comp.text}
                        </div>
                      )}
                      {comp.buttons && comp.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {comp.buttons.map((b, bIdx) => (
                            <span key={bIdx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md font-bold text-[11px] text-gray-700">
                              [{b.type}]: {b.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Smartphone Simulator */}
            <div className="lg:col-span-5 lg:sticky lg:top-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col items-center">
                {renderPhoneSimulator()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TEMPLATE BUILDER (CREATE / EDIT) */}
      {activeView === 'create' && (
        <div className="space-y-4">
          {/* Back Action Bar */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 px-6 shadow-xs">
            <button
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-emerald-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Return to Templates</span>
            </button>
            <div className="text-xs text-gray-500 font-medium">
              Step-by-step Meta WhatsApp Template Builder
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <form onSubmit={handleSubmitTemplate} className="lg:col-span-7 space-y-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {isEditing ? `Edit Template: ${name}` : 'Create WhatsApp Message Template'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Fill in the required components. Meta automatically reviews all submissions.
                  </p>
                </div>

                {/* Step 1: Details */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Template Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      placeholder="e.g. order_confirmation_v2"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono disabled:opacity-60"
                      required
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Only lowercase letters, numbers, and underscores are allowed by Meta.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="MARKETING">Marketing (Promotions & Offers)</option>
                        <option value="UTILITY">Utility (Order alerts & Account updates)</option>
                        <option value="AUTHENTICATION">Authentication (OTP codes)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        Language <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                      >
                        {COMMON_LANGUAGES.map(l => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Header */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800">
                    Header (Optional)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setHeaderType(type)}
                        className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                          headerType === type
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {headerType === 'TEXT' && (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        placeholder="Header text..."
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none"
                      />
                      {headerText.includes('{{1}}') && (
                        <input
                          type="text"
                          placeholder="Header variable sample (e.g. Special Offer)"
                          value={headerSample}
                          onChange={(e) => setHeaderSample(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Body */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-800">
                      Message Body <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = detectedVariables.length + 1;
                        setBodyText(prev => prev + ` {{${nextNum}}}`);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 transition cursor-pointer"
                    >
                      + Add Variable {'{{' + (detectedVariables.length + 1) + '}}'}
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Type your WhatsApp template message content here..."
                    className="w-full p-3.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono leading-relaxed"
                    required
                  />

                  {/* Sample variables inputs required by Meta */}
                  {detectedVariables.length > 0 && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Meta Review Samples (Mandatory for Approval)</span>
                      </div>
                      <p className="text-[11px] text-emerald-900/80">
                        Meta reviewers require sample values for every placeholder to confirm the message complies with WhatsApp policies.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {detectedVariables.map(v => (
                          <div key={v} className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 w-12">{v}:</span>
                            <input
                              type="text"
                              value={bodySamples[v] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBodySamples(prev => ({ ...prev, [v]: val }));
                              }}
                              className="flex-1 px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none"
                              placeholder="e.g. Alex"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4: Footer */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-800">
                    Footer Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reply STOP to opt out"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Step 5: Buttons */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-800">
                      Interactive Buttons (Optional - Max 3)
                    </label>
                    {buttons.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setButtons(prev => [...prev, { type: 'QUICK_REPLY', text: `Button ${prev.length + 1}` }])}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 cursor-pointer"
                      >
                        + Add Button
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
                        <select
                          value={btn.type}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            setButtons(prev => prev.map((b, i) => i === idx ? { ...b, type: newType } : b));
                          }}
                          className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 font-medium cursor-pointer"
                        >
                          <option value="QUICK_REPLY">Quick Reply</option>
                          <option value="URL">Website URL</option>
                          <option value="PHONE_NUMBER">Phone Number</option>
                        </select>

                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setButtons(prev => prev.map((b, i) => i === idx ? { ...b, text: val } : b));
                          }}
                          placeholder="Button text..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                          required
                        />

                        {btn.type === 'URL' && (
                          <input
                            type="url"
                            value={btn.url || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setButtons(prev => prev.map((b, i) => i === idx ? { ...b, url: val } : b));
                            }}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                            required
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => setButtons(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button bar */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Submitting to Meta...' : 'Submit to Meta for Review'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Live Phone Preview Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col items-center">
                {renderPhoneSimulator()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: META PRE-APPROVED LIBRARY */}
      {activeView === 'library' && (
        <div className="space-y-5">
          {/* Back Bar */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 px-6 shadow-xs">
            <button
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-emerald-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Templates</span>
            </button>
            <div className="text-xs text-gray-500 font-medium">
              Meta Verified Pre-Approved Template Catalog
            </div>
          </div>

          {/* Intro Box */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-200" />
                <h3 className="text-lg font-bold tracking-tight">Instant Meta Pre-Approved Templates</h3>
              </div>
              <p className="text-xs text-emerald-50/90 max-w-2xl leading-relaxed">
                Import official WhatsApp pre-approved templates with 1-click. Because these templates follow standard Meta structures, they avoid review delays and are available immediately.
              </p>
            </div>
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_LIBRARY_TEMPLATES.map(preset => (
              <div
                key={preset.name}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {preset.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Instant Approval
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900">{preset.title}</h4>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                  
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono text-xs text-gray-700 leading-relaxed">
                    {preset.body}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">{preset.name}</span>
                  <button
                    onClick={() => handleImportPreset(preset)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Import to Workspace</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Meta Template Lookup Search */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Search Meta Global Library</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Look up any Meta pre-approved library template by exact name to import into your account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. account_creation_confirmation_3"
                value={libraryLookupName}
                onChange={(e) => setLibraryLookupName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
              <select
                value={libraryLookupLang}
                onChange={(e) => setLibraryLookupLang(e.target.value)}
                className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                {COMMON_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <button
                onClick={handleLookupCustomLibrary}
                disabled={isLookingUpLibrary}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5 justify-center"
              >
                {isLookingUpLibrary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Find Template</span>
              </button>
            </div>

            {libraryLookupResult && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 font-mono">{libraryLookupResult.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">Found in Meta Library</span>
                </div>
                <div className="text-xs text-gray-700 font-mono whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                  {libraryLookupResult.body || 'Template found.'}
                </div>
                <button
                  onClick={() => handleImportPreset(libraryLookupResult)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Import Found Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateStudio;
