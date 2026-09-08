import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutTemplate, Plus, CheckCircle2, AlertCircle, Trash2, 
  Sparkles, ExternalLink, Phone, ArrowUpRight, Copy, Check, 
  Smartphone, MessageSquare, RefreshCw, Send, Loader2,
  Clock, ShieldAlert, BookOpen, Globe, Sliders, Info,
  Search, Eye, HelpCircle, Image as ImageIcon, Video, FileText,
  ChevronRight, ArrowRight, CornerDownLeft, AlertTriangle,
  ChevronDown, Edit3
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppTemplateComponent, WhatsAppTemplateStatus } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

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
    name: 'account_creation_confirmation_3',
    category: 'UTILITY' as const,
    language: 'en_US',
    title: 'Account Welcome & Activation',
    description: 'Instant pre-approved template for customer signup and account verification.',
    body: 'Hi {{1}}, welcome to our platform! Your account has been verified and is ready. Click below to access your dashboard.',
    sampleVariables: ['Sarah'],
    buttons: [
      { type: 'URL' as const, text: 'View Account', url: 'https://rockyt.io/account' }
    ]
  },
  {
    name: 'order_confirmation',
    category: 'UTILITY' as const,
    language: 'en_US',
    title: 'Order Confirmation & Tracking',
    description: 'Confirm new purchase orders and provide parcel tracking link.',
    body: 'Hi {{1}}, your order {{2}} has been confirmed! We are preparing your shipment. Track parcel status below.',
    sampleVariables: ['Ana', 'ORD-98124'],
    buttons: [
      { type: 'URL' as const, text: 'Track Shipment', url: 'https://rockyt.io/orders' },
      { type: 'QUICK_REPLY' as const, text: 'Need Help? 💬' }
    ]
  },
  {
    name: 'appointment_reminder',
    category: 'UTILITY' as const,
    language: 'en_US',
    title: 'Appointment Reminder',
    description: 'Reduce no-shows with automated scheduled appointment alerts.',
    body: 'Hello {{1}}, reminder for your upcoming reservation on {{2}} at {{3}}. Please reply to confirm or reschedule.',
    sampleVariables: ['David', 'Tomorrow', '2:30 PM'],
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'Confirm Attendance ✅' },
      { type: 'QUICK_REPLY' as const, text: 'Reschedule 📅' }
    ]
  },
  {
    name: 'two_factor_authentication_code',
    category: 'AUTHENTICATION' as const,
    language: 'en_US',
    title: 'One-Time Security Passcode (OTP)',
    description: 'Authentication OTP code for rapid passwordless login or phone verification.',
    body: 'Your verification code is {{1}}. This passcode expires in 10 minutes. Do not share this code with anyone.',
    sampleVariables: ['849-201'],
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'Copy Code 📋' }
    ]
  },
  {
    name: 'vip_exclusive_offer',
    category: 'MARKETING' as const,
    language: 'en_US',
    title: 'VIP Flash Sale Promotion',
    description: 'Drive sales with a targeted discount code and direct link.',
    body: 'Special offer for {{1}}! Enjoy {{2}} discount on your next purchase with code {{3}}. Valid for 48 hours only!',
    sampleVariables: ['Emily', '30%', 'ROCKYT30'],
    buttons: [
      { type: 'URL' as const, text: 'Shop Now 🛍️', url: 'https://rockyt.io/store' },
      { type: 'QUICK_REPLY' as const, text: 'Stop Promotions' }
    ]
  }
];

export interface TemplateStudioProps {
  userSession?: any;
}

export const TemplateStudio: React.FC<TemplateStudioProps> = ({ userSession }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateName, setActiveTemplateName] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en_US');
  const [activeView, setActiveView] = useState<'inspect' | 'create' | 'library'>('inspect');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [hasConnectedAccount, setHasConnectedAccount] = useState<boolean>(true);
  const [previewWithSamples, setPreviewWithSamples] = useState<boolean>(true);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  // Template Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerSample, setHeaderSample] = useState('');
  const [bodyText, setBodyText] = useState('Hi {{1}}, thank you for contacting us! How can we assist you today?');
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
  const [libraryButtonInputs, setLibraryButtonInputs] = useState<string[]>([]);
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
          next[v] = idx === 0 ? 'Alex' : idx === 1 ? 'ORD-8921' : `Value_${idx + 1}`;
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

        if (list.length > 0) {
          // If current selection not found, select first template
          if (!list.some(t => t.name === activeTemplateName)) {
            setActiveTemplateName(list[0].name);
            setSelectedLanguage(list[0].language || 'en_US');
          }
        } else {
          setActiveTemplateName('');
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
    return templates.find(t => t.name === activeTemplateName && (t.language === selectedLanguage || !selectedLanguage)) 
      || templates.find(t => t.name === activeTemplateName);
  }, [templates, activeTemplateName, selectedLanguage]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(tmpl => {
      const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || tmpl.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [templates, searchQuery, statusFilter]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    const pending = templates.filter(t => t.status === 'PENDING').length;
    const approved = templates.filter(t => t.status === 'APPROVED').length;
    const rejected = templates.filter(t => t.status === 'REJECTED').length;
    return { all: templates.length, pending, approved, rejected };
  }, [templates]);

  const handleInsertVariable = () => {
    const nextIndex = detectedVariables.length + 1;
    const token = `{{${nextIndex}}}`;
    setBodyText(prev => prev + ` ${token}`);
  };

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (buttons.length >= 3) {
      alert('Meta WhatsApp templates support a maximum of 3 buttons.');
      return;
    }
    if (type === 'QUICK_REPLY') {
      setButtons(prev => [...prev, { type: 'QUICK_REPLY', text: 'Quick Reply' }]);
    } else if (type === 'URL') {
      setButtons(prev => [...prev, { type: 'URL', text: 'Visit Website', url: 'https://rockyt.io' }]);
    } else if (type === 'PHONE_NUMBER') {
      setButtons(prev => [...prev, { type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '+1 800 555 0199' }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, patch: Partial<ButtonConfig>) => {
    setButtons(prev => prev.map((b, i) => i === index ? { ...b, ...patch } : b));
  };

  const handleStartCreate = (reset = true) => {
    if (reset) {
      setName('');
      setCategory('MARKETING');
      setLanguage('en_US');
      setHeaderType('NONE');
      setHeaderText('');
      setHeaderSample('');
      setBodyText('Hi {{1}}, thank you for contacting us! How can we assist you today?');
      setFooterText('Reply STOP to unsubscribe');
      setButtons([
        { type: 'QUICK_REPLY', text: 'Talk to Support 💬' }
      ]);
      setDeliveryTtlSeconds('');
      setIsEditing(false);
    }
    setActiveView('create');
  };

  const handleStartEdit = (tmpl: WhatsAppTemplate) => {
    setName(tmpl.name);
    setCategory(tmpl.category);
    setLanguage(tmpl.language || 'en_US');
    setIsEditing(true);

    const headerComp = tmpl.components?.find(c => c.type === 'HEADER' || (c.type as any) === 'header');
    if (headerComp) {
      setHeaderType((headerComp.format as any) || 'TEXT');
      setHeaderText(headerComp.text || '');
    } else {
      setHeaderType('NONE');
      setHeaderText('');
    }

    const bodyComp = tmpl.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
    if (bodyComp && bodyComp.text) {
      setBodyText(bodyComp.text);
    }

    const footerComp = tmpl.components?.find(c => c.type === 'FOOTER' || (c.type as any) === 'footer');
    setFooterText(footerComp?.text || '');

    const btnComp = tmpl.components?.find(c => c.type === 'BUTTONS' || (c.type as any) === 'buttons');
    if (btnComp && btnComp.buttons) {
      setButtons(btnComp.buttons.map(b => ({
        type: b.type as any,
        text: b.text,
        url: b.url,
        phone_number: b.phone_number
      })));
    } else {
      setButtons([]);
    }

    setDeliveryTtlSeconds(tmpl.message_send_ttl_seconds || '');
    setActiveView('create');
  };

  const handleSubmitCustomTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanName || !/^[a-z][a-z0-9_]*$/.test(cleanName)) {
      setErrorBanner('Template name must start with a lowercase letter and contain only letters, numbers, and underscores.');
      return;
    }

    if (!bodyText.trim()) {
      setErrorBanner('Message body text is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const components: WhatsAppTemplateComponent[] = [];

      if (headerType === 'TEXT' && headerText.trim()) {
        const headerObj: WhatsAppTemplateComponent = {
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim()
        };
        if (headerText.includes('{{1}}')) {
          headerObj.example = { header_text: [headerSample.trim() || 'Notice'] };
        }
        components.push(headerObj);
      } else if (headerType !== 'NONE') {
        components.push({ type: 'HEADER', format: headerType });
      }

      const bodyObj: WhatsAppTemplateComponent = {
        type: 'BODY',
        text: bodyText.trim()
      };
      if (detectedVariables.length > 0) {
        const sampleRow = detectedVariables.map(v => bodySamples[v]?.trim() || 'Sample');
        bodyObj.example = { body_text: [sampleRow] };
      }
      components.push(bodyObj);

      if (footerText.trim()) {
        components.push({ type: 'FOOTER', text: footerText.trim() });
      }

      if (buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: buttons.map(b => ({
            type: b.type,
            text: b.text,
            url: b.url,
            phone_number: b.phone_number
          }))
        });
      }

      const payload: any = {
        name: cleanName,
        category,
        language,
        components,
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
          ? `Template "${cleanName}" updated and resubmitted to Meta.`
          : `Template "${cleanName}" created and submitted to Meta! Status is PENDING review.`
      );

      await loadTemplates();
      setActiveTemplateName(cleanName);
      setSelectedLanguage(language);
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

      const buttonInputs = preset.buttons
        .filter(b => b.type === 'URL')
        .map(b => ({
          type: 'URL',
          url: { base_url: b.url || 'https://rockyt.io', url_suffix_example: b.url || 'https://rockyt.io' }
        }));

      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(userSession) },
        body: JSON.stringify({
          name: preset.name,
          category: preset.category,
          language: preset.language,
          library_template_name: preset.name,
          library_template_button_inputs: buttonInputs.length > 0 ? buttonInputs : undefined,
          components: [
            { type: 'BODY', text: preset.body },
            ...(preset.buttons.length > 0 ? [{ type: 'BUTTONS', buttons: preset.buttons }] : [])
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import template.');

      setSuccessBanner(`Pre-approved template "${preset.name}" imported and APPROVED instantly!`);
      await loadTemplates();
      setActiveTemplateName(preset.name);
      setSelectedLanguage(preset.language);
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
      const btns = data.template?.buttons || [];
      setLibraryButtonInputs(btns.map(() => 'https://rockyt.io'));
    } catch (err: any) {
      setErrorBanner(err.message || 'Lookup failed.');
      setLibraryLookupResult(null);
    } finally {
      setIsLookingUpLibrary(false);
    }
  };

  const handleImportLookupResult = async () => {
    if (!libraryLookupResult) return;
    try {
      setIsSubmitting(true);
      setErrorBanner(null);

      const btns = libraryLookupResult.buttons || [];
      const buttonInputs = btns.map((b: any, idx: number) => {
        if (b.type === 'URL') {
          const val = libraryButtonInputs[idx] || 'https://rockyt.io';
          return { type: 'URL', url: { base_url: val, url_suffix_example: val } };
        }
        return { type: b.type };
      });

      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(userSession) },
        body: JSON.stringify({
          name: libraryLookupResult.name,
          category: libraryLookupResult.category || 'UTILITY',
          language: libraryLookupResult.language || 'en_US',
          library_template_name: libraryLookupResult.name,
          library_template_button_inputs: buttonInputs.length > 0 ? buttonInputs : undefined,
          components: [
            { type: 'BODY', text: libraryLookupResult.body || '' },
            ...(btns.length > 0 ? [{ type: 'BUTTONS', buttons: btns }] : [])
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');

      setSuccessBanner(`Template "${libraryLookupResult.name}" imported and ready to use!`);
      await loadTemplates();
      setActiveTemplateName(libraryLookupResult.name);
      setSelectedLanguage(libraryLookupResult.language || 'en_US');
      setActiveView('inspect');
      setLibraryLookupResult(null);
    } catch (e: any) {
      setErrorBanner(e.message || 'Failed to import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (tmplName: string) => {
    if (!confirm(`Delete template "${tmplName}"?`)) return;

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
      if (activeTemplateName === tmplName) {
        setActiveTemplateName('');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error deleting template.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(id);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  // Status Badge Component
  const renderStatusBadge = (status: WhatsAppTemplateStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  // Preview Data Calculation
  const previewData = useMemo(() => {
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
        renderedBody = renderedBody
          .replace(/\{\{1\}\}/g, 'Alex')
          .replace(/\{\{2\}\}/g, 'ORD-2026')
          .replace(/\{\{3\}\}/g, '25% OFF')
          .replace(/\{\{(\d+)\}\}/g, 'Value');

        renderedHeader = renderedHeader.replace(/\{\{1\}\}/g, 'Special Update');
      }

      return {
        headerType: headerComp?.format || (headerComp?.text ? 'TEXT' : 'NONE'),
        headerText: renderedHeader,
        bodyText: renderedBody,
        footerText: footerComp?.text || '',
        buttons: btnComp?.buttons?.map(b => ({ text: b.text, type: b.type })) || [],
      };
    }

    return null;
  }, [activeView, activeTemplate, headerType, headerText, headerSample, bodyText, bodySamples, footerText, buttons, previewWithSamples]);

  return (
    <div className="space-y-4">
      {/* ─── Top Header Bar (Compact & Sleek) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 sm:px-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight">
                WhatsApp Template Studio
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                Official Meta WABA
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              Create and manage Meta-reviewed templates for customer outreach and broadcasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTemplates(true)}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-700 transition flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Refresh review verdicts live from Meta"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Status'}</span>
          </button>

          <button
            onClick={() => setActiveView('library')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              activeView === 'library'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Meta Pre-Approved Library</span>
          </button>

          <button
            onClick={() => handleStartCreate(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* ─── Alerts & Status Banners ─── */}
      {errorBanner && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{errorBanner}</div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-500 hover:text-rose-700 text-sm font-bold">&times;</button>
        </div>
      )}

      {successBanner && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{successBanner}</div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* ─── Main 3-Column Compact Workbench ─── */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xs flex flex-col lg:flex-row overflow-hidden min-h-[580px]">
        
        {/* ─── PANEL 1: Templates List (Compact & Scannable) ─── */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-gray-50/40 dark:bg-zinc-900/50 shrink-0">
          <div className="p-3 border-b border-gray-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                Templates ({templates.length})
              </span>
              <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                {statusCounts.approved} Approved • {statusCounts.pending} Pending
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search template name..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tabs with Counts */}
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => {
                const count = st === 'ALL' ? statusCounts.all : st === 'PENDING' ? statusCounts.pending : st === 'APPROVED' ? statusCounts.approved : statusCounts.rejected;
                const isSelected = statusFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`py-1 rounded font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-gray-900 text-white dark:bg-emerald-500 dark:text-black shadow-2xs'
                        : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'APPROVED' ? 'Approved' : 'Rejected'} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[520px]">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-14 px-3 text-center text-xs text-gray-400 space-y-2">
                <LayoutTemplate className="w-6 h-6 mx-auto text-gray-300 dark:text-zinc-600" />
                <p className="font-semibold text-gray-600 dark:text-zinc-300">
                  {statusFilter === 'ALL' ? 'No Templates Found' : `No ${statusFilter.toLowerCase()} templates`}
                </p>
                <p className="text-[11px] text-gray-400">
                  Create a custom template or import one from Meta's library.
                </p>
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const isSelected = tmpl.name === activeTemplateName && activeView === 'inspect';
                return (
                  <div
                    key={`${tmpl.name}_${tmpl.language}`}
                    onClick={() => {
                      setActiveTemplateName(tmpl.name);
                      setSelectedLanguage(tmpl.language || 'en_US');
                      setActiveView('inspect');
                    }}
                    className={`p-2.5 rounded-lg cursor-pointer transition border text-left ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-gray-900 dark:text-white shadow-2xs'
                        : 'border-transparent hover:bg-white dark:hover:bg-zinc-800/70 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold truncate">
                        {tmpl.name}
                      </span>
                      {renderStatusBadge(tmpl.status)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                      <span className="font-semibold uppercase">{tmpl.category}</span>
                      <span>{tmpl.language || 'en_US'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── PANEL 2: Center Inspector / Creator / Library (Flexible) ─── */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 overflow-y-auto max-h-[620px]">
          
          {/* CREATION FORM VIEW */}
          {activeView === 'create' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isEditing ? `Edit Template: ${name}` : 'Create WhatsApp Message Template'}</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    Templates require reviewer samples for variables like {'{{1}}'} to pass Meta review.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveView('inspect'); setIsEditing(false); }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitCustomTemplate} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Template Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. order_shipped_v2"
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MARKETING">MARKETING (Promotions)</option>
                      <option value="UTILITY">UTILITY (Notifications & Updates)</option>
                      <option value="AUTHENTICATION">AUTHENTICATION (OTP Security)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Language <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      {COMMON_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.label} ({lang.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Header (Optional) */}
                <div className="p-3 bg-gray-50/70 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/80 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">
                      Header (Optional)
                    </label>
                    <div className="flex items-center gap-1">
                      {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setHeaderType(type)}
                          className={`px-2 py-0.5 text-[10px] rounded font-medium transition cursor-pointer ${
                            headerType === type
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {headerType === 'TEXT' && (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="e.g. Special Update for {{1}}"
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-gray-900 dark:text-white focus:outline-none"
                      />
                      {headerText.includes('{{1}}') && (
                        <input
                          type="text"
                          value={headerSample}
                          onChange={(e) => setHeaderSample(e.target.value)}
                          placeholder="Header Sample (e.g. VIP Member)"
                          className="w-full px-2.5 py-1 text-[11px] bg-white dark:bg-zinc-800 border border-amber-300 rounded-md text-gray-900 dark:text-white"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">
                      Body Message <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertVariable}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insert {'{{var}}'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Type your WhatsApp message. Use {{1}}, {{2}} for dynamic customer parameters."
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                    required
                  />

                  {/* Sample values inputs */}
                  {detectedVariables.length > 0 && (
                    <div className="mt-2 p-2.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-1.5">
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Meta Reviewer Sample Values:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {detectedVariables.map(v => (
                          <div key={v}>
                            <span className="text-[9px] font-mono text-gray-500 block">{v}:</span>
                            <input
                              type="text"
                              value={bodySamples[v] || ''}
                              onChange={(e) => setBodySamples({ ...bodySamples, [v]: e.target.value })}
                              placeholder={`Sample for ${v}`}
                              className="w-full px-2 py-0.5 text-xs bg-white dark:bg-zinc-900 border border-amber-200 rounded"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer & TTL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Footer Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="e.g. Reply STOP to opt out"
                      className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Delivery Window (TTL seconds)
                    </label>
                    <input
                      type="number"
                      value={deliveryTtlSeconds}
                      onChange={(e) => setDeliveryTtlSeconds(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 3600 (1 hour)"
                      className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Buttons Configurator */}
                <div className="p-3 bg-gray-50/70 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/80 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">
                      Buttons (Max 3)
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleAddButton('QUICK_REPLY')}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 cursor-pointer"
                      >
                        + Quick Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('URL')}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 cursor-pointer"
                      >
                        + URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('PHONE_NUMBER')}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 cursor-pointer"
                      >
                        + Phone
                      </button>
                    </div>
                  </div>

                  {buttons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase w-16 text-emerald-600">
                            {btn.type === 'QUICK_REPLY' ? 'Reply' : btn.type === 'URL' ? 'URL' : 'Call'}
                          </span>
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(idx, { text: e.target.value })}
                            placeholder="Label"
                            className="flex-1 px-2 py-0.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 rounded"
                            required
                          />
                          {btn.type === 'URL' && (
                            <input
                              type="url"
                              value={btn.url || ''}
                              onChange={(e) => handleUpdateButton(idx, { url: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 px-2 py-0.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 rounded"
                              required
                            />
                          )}
                          {btn.type === 'PHONE_NUMBER' && (
                            <input
                              type="tel"
                              value={btn.phone_number || ''}
                              onChange={(e) => handleUpdateButton(idx, { phone_number: e.target.value })}
                              placeholder="+1..."
                              className="flex-1 px-2 py-0.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 rounded"
                              required
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer px-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to Meta...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Save & Resubmit Template' : 'Submit Template to Meta for Approval'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* META PRE-APPROVED LIBRARY VIEW */}
          {activeView === 'library' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Meta Pre-Approved Library</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    Import templates that skip the 24-hour review wait and approve immediately.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('inspect')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Custom Search in Meta's Library */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/80 rounded-lg space-y-2">
                <span className="text-[11px] font-bold text-gray-800 dark:text-zinc-200 block">
                  Search Meta Template Library by Name:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={libraryLookupName}
                    onChange={(e) => setLibraryLookupName(e.target.value)}
                    placeholder="e.g. account_creation_confirmation_3"
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-gray-900 dark:text-white focus:outline-none"
                  />
                  <select
                    value={libraryLookupLang}
                    onChange={(e) => setLibraryLookupLang(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                  >
                    <option value="en_US">en_US</option>
                    <option value="en">en</option>
                    <option value="es">es</option>
                    <option value="pt_BR">pt_BR</option>
                  </select>
                  <button
                    onClick={handleLookupCustomLibrary}
                    disabled={isLookingUpLibrary}
                    className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isLookingUpLibrary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    <span>Lookup</span>
                  </button>
                </div>

                {libraryLookupResult && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {libraryLookupResult.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">Meta Pre-Approved</span>
                    </div>
                    <p className="text-gray-700 dark:text-zinc-200 text-[11px]">{libraryLookupResult.body}</p>
                    <button
                      onClick={handleImportLookupResult}
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Import Instantly</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Curated Pre-Approved List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Curated Meta Pre-Approved Templates
                </span>

                {PRESET_LIBRARY_TEMPLATES.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-3 border border-gray-200 dark:border-zinc-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-800 transition bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{preset.title}</h4>
                        <span className="font-mono text-[10px] text-gray-500">{preset.name}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Pre-Approved
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed">
                      {preset.body}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400 font-semibold">{preset.category}</span>
                      <button
                        onClick={() => handleImportPreset(preset)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Import &amp; Use</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE TEMPLATE INSPECT VIEW */}
          {activeView === 'inspect' && (
            activeTemplate ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Header info */}
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white font-mono">
                        {activeTemplate.name}
                      </h2>
                      {renderStatusBadge(activeTemplate.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold text-gray-700 dark:text-zinc-300 uppercase">
                        {activeTemplate.category}
                      </span>
                      <span>{activeTemplate.language || 'en_US'}</span>
                      {activeTemplate.id && (
                        <span className="font-mono text-[10px] text-gray-400">ID: {activeTemplate.id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(activeTemplate)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(activeTemplate.name)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Banners */}
                {activeTemplate.status === 'PENDING' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Under Meta Automated Review (~24h)</span>
                      </div>
                      <button
                        onClick={() => loadTemplates(true)}
                        className="px-2 py-0.5 bg-amber-200/60 hover:bg-amber-200 rounded text-[10px] font-bold text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Refresh Verdict</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed">
                      This template was submitted to Meta. Once approved, you can start broadcasting and sending it to customers immediately.
                    </p>
                  </div>
                )}

                {activeTemplate.status === 'APPROVED' && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Live &amp; Ready for Broadcasts</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                      Sendable
                    </span>
                  </div>
                )}

                {activeTemplate.status === 'REJECTED' && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Meta Rejection Reason:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {activeTemplate.rejected_reason || 'Template content did not meet Meta guidelines. Ensure body variables have realistic examples and avoid promotional terms in UTILITY category.'}
                    </p>
                    <button
                      onClick={() => handleStartEdit(activeTemplate)}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                    >
                      Fix &amp; Resubmit to Meta
                    </button>
                  </div>
                )}

                {/* Components Display */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Message Components
                  </span>

                  {activeTemplate.components?.map((c, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/70 rounded-lg space-y-1 text-xs">
                      <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                        {c.type} {c.format ? `(${c.format})` : ''}
                      </span>
                      {c.text && (
                        <p className="text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {c.text}
                        </p>
                      )}
                      {c.buttons && c.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.buttons.map((btn, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-medium flex items-center gap-1"
                            >
                              {btn.type === 'URL' && <ExternalLink className="w-3 h-3 text-emerald-600" />}
                              {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3 text-emerald-600" />}
                              {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3 text-emerald-600" />}
                              <span>{btn.text}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Copy Snippet */}
                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-[11px]">Template Name: <code className="font-mono text-gray-800 dark:text-zinc-200 font-bold">{activeTemplate.name}</code></span>
                  <button
                    onClick={() => copyToClipboard(activeTemplate.name, 'name')}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBadge === 'name' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBadge === 'name' ? 'Copied' : 'Copy Name'}</span>
                  </button>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mx-auto">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">No Templates Available</h3>
                <p className="text-xs max-w-xs mx-auto text-gray-500 dark:text-zinc-400">
                  Create a custom WhatsApp template or browse the Meta Pre-Approved Library to get started.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => handleStartCreate(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Create Custom Template
                  </button>
                  <button
                    onClick={() => setActiveView('library')}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Browse Meta Library
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                <LayoutTemplate className="w-8 h-8 mx-auto text-gray-300" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-zinc-300">Select a Template</h3>
                <p className="text-xs text-gray-400">
                  Choose a template from the list on the left to inspect its details and review verdict.
                </p>
              </div>
            )
          )}
        </div>

        {/* ─── PANEL 3: Live Smartphone Simulator (Compact & Fixed) ─── */}
        <div className="w-full lg:w-68 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-zinc-800 p-3 bg-gray-50/50 dark:bg-zinc-950 flex flex-col items-center justify-start shrink-0">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp Preview</span>
            </span>
            <button
              onClick={() => setPreviewWithSamples(!previewWithSamples)}
              className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {previewWithSamples ? 'Raw {{1}}' : 'Sample Data'}
            </button>
          </div>

          {/* Sleek Scaled Phone Frame */}
          <div className="w-[230px] sm:w-[240px] bg-zinc-900 border-[5px] border-zinc-800 rounded-[32px] p-2 shadow-xl relative flex flex-col h-[450px] overflow-hidden select-none">
            {/* Camera notch */}
            <div className="w-16 h-3 bg-zinc-800 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            </div>

            {/* WhatsApp App Header */}
            <div className="bg-emerald-800 text-white p-1.5 px-2 rounded-t-xl flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold">
                R
              </div>
              <div className="leading-tight flex-1">
                <div className="text-[10px] font-bold flex items-center gap-0.5">
                  <span>Rockyt Business</span>
                  <span className="w-2 h-2 rounded-full bg-white text-emerald-800 flex items-center justify-center text-[7px] font-bold">✓</span>
                </div>
                <div className="text-[8px] text-emerald-200">Official Account</div>
              </div>
            </div>

            {/* WhatsApp Chat Canvas */}
            <div className="flex-1 overflow-y-auto space-y-1.5 p-1 bg-[#0b141a]/95 rounded-b-xl flex flex-col justify-end">
              {previewData ? (
                <div className="space-y-1">
                  {/* Message bubble */}
                  <div className="bg-[#005c4b] border border-[#005c4b]/50 rounded-xl rounded-tl-xs p-2 text-[10px] text-white shadow space-y-1">
                    {previewData.headerType === 'TEXT' && previewData.headerText && (
                      <div className="font-bold text-emerald-200 text-[10px] border-b border-emerald-600/40 pb-0.5">
                        {previewData.headerText}
                      </div>
                    )}
                    {previewData.headerType !== 'NONE' && previewData.headerType !== 'TEXT' && (
                      <div className="w-full h-16 bg-emerald-950/80 rounded flex flex-col items-center justify-center text-emerald-300 gap-0.5 border border-emerald-700/40">
                        {previewData.headerType === 'IMAGE' && <ImageIcon className="w-4 h-4" />}
                        {previewData.headerType === 'VIDEO' && <Video className="w-4 h-4" />}
                        {previewData.headerType === 'DOCUMENT' && <FileText className="w-4 h-4" />}
                        <span className="text-[8px] font-bold uppercase">{previewData.headerType}</span>
                      </div>
                    )}

                    <div className="leading-relaxed whitespace-pre-wrap font-sans text-[10px]">
                      {previewData.bodyText}
                    </div>

                    {previewData.footerText && (
                      <div className="text-[8px] text-emerald-300/70 pt-0.5 border-t border-emerald-600/30">
                        {previewData.footerText}
                      </div>
                    )}

                    <div className="text-[7px] text-emerald-200/80 flex items-center justify-end gap-0.5">
                      <span>10:45 AM</span>
                      <span className="text-sky-300 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  {previewData.buttons && previewData.buttons.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      {previewData.buttons.map((btn, i) => (
                        <div
                          key={i}
                          className="w-full py-1 bg-[#1f2c34] hover:bg-[#2a3942] border border-[#2a3942] rounded-lg text-center text-[10px] font-bold text-sky-400 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {btn.type === 'URL' && <ExternalLink className="w-2.5 h-2.5" />}
                          {btn.type === 'PHONE_NUMBER' && <Phone className="w-2.5 h-2.5" />}
                          {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-2.5 h-2.5" />}
                          <span className="truncate">{btn.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-[10px] py-16">
                  Select a template to preview chat
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
