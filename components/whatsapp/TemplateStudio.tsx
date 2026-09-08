import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutTemplate, Plus, CheckCircle2, AlertCircle, Trash2, 
  Sparkles, ExternalLink, Phone, ArrowUpRight, Copy, Check, 
  Smartphone, MessageSquare, RefreshCw, Send, Loader2,
  Clock, ShieldAlert, BookOpen, Globe, Sliders, Info,
  Search, Eye, HelpCircle, Image as ImageIcon, Video, FileText,
  ChevronRight, ArrowRight, CornerDownLeft, AlertTriangle
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppTemplateComponent, WhatsAppTemplateStatus } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

interface ButtonConfig {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
  url_suffix_example?: string;
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
  { code: 'ru', label: 'Russian (Русский)' },
];

const PRESET_LIBRARY_TEMPLATES = [
  {
    name: 'account_creation_confirmation_3',
    category: 'UTILITY' as const,
    language: 'en_US',
    title: 'Account Welcome & Activation',
    description: 'Instant pre-approved template for customer signup and account confirmation.',
    body: 'Hi {{1}}, welcome to our platform! Your account has been verified and is ready for use. Click below to view your account dashboard.',
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
    description: 'Confirm new purchase orders and provide real-time tracking numbers.',
    body: 'Hi {{1}}, your order {{2}} has been confirmed! We are preparing your shipment. Track your parcel status at any time using the link below.',
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
    title: 'Scheduled Appointment Reminder',
    description: 'Reduce no-shows by reminding customers of upcoming reservations or appointments.',
    body: 'Hello {{1}}, this is a friendly reminder for your upcoming appointment on {{2}} at {{3}}. Please reply to confirm or reschedule.',
    sampleVariables: ['David', 'Tomorrow, Sep 9', '2:30 PM'],
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
    description: 'Authentication OTP code for rapid passwordless logins or verification.',
    body: 'Your verification code is {{1}}. This passcode will expire in 10 minutes. For your security, do not share this code with anyone.',
    sampleVariables: ['849-201'],
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'Copy Code 📋' }
    ]
  },
  {
    name: 'vip_exclusive_offer',
    category: 'MARKETING' as const,
    language: 'en_US',
    title: 'VIP Promo & Flash Sale',
    description: 'Drive high conversions with a tailored discount code and clear call-to-action.',
    body: 'Exciting news {{1}}! Enjoy an exclusive {{2}} discount on your next order with code {{3}}. Hurry, this special offer is valid for the next 48 hours only!',
    sampleVariables: ['Emily', '30%', 'ROCKYT30'],
    buttons: [
      { type: 'URL' as const, text: 'Shop Now 🛍️', url: 'https://rockyt.io/store' },
      { type: 'QUICK_REPLY' as const, text: 'Stop Promotions' }
    ]
  }
];

export const TemplateStudio: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTemplateName, setActiveTemplateName] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en_US');
  const [activeView, setActiveView] = useState<'inspect' | 'create' | 'library'>('inspect');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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
  const [bodyText, setBodyText] = useState('Hi {{1}}, thank you for choosing Rockyt! Your request {{2}} is being processed.');
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({
    '{{1}}': 'Sarah',
    '{{2}}': 'REQ-2049'
  });
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe');
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { type: 'QUICK_REPLY', text: 'Chat with Support 💬' },
    { type: 'URL', text: 'Track Order', url: 'https://rockyt.io/orders' }
  ]);
  const [deliveryTtlSeconds, setDeliveryTtlSeconds] = useState<number | ''>('');

  // Editing existing template
  const [isEditing, setIsEditing] = useState(false);

  // Library Template Search
  const [libraryLookupName, setLibraryLookupName] = useState('');
  const [libraryLookupLang, setLibraryLookupLang] = useState('en_US');
  const [libraryLookupResult, setLibraryLookupResult] = useState<any | null>(null);
  const [libraryButtonInputs, setLibraryButtonInputs] = useState<string[]>([]);
  const [isLookingUpLibrary, setIsLookingUpLibrary] = useState(false);

  // Extract variables like {{1}}, {{2}} from text
  const detectedVariables = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches)).sort();
  }, [bodyText]);

  // Keep body sample keys in sync with detected variables
  useEffect(() => {
    setBodySamples(prev => {
      const next: Record<string, string> = { ...prev };
      detectedVariables.forEach((v, idx) => {
        if (!next[v]) {
          next[v] = idx === 0 ? 'Alex' : idx === 1 ? 'ORD-8921' : `Sample ${idx + 1}`;
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
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setTemplates(list);
        setHasConnectedAccount(data.accountConnected !== false);

        if (list.length > 0 && !activeTemplateName) {
          setActiveTemplateName(list[0].name);
          setSelectedLanguage(list[0].language || 'en_US');
        }

        if (showSyncIndicator) {
          setSuccessBanner('Templates synchronized live with Meta WhatsApp Business API.');
          setTimeout(() => setSuccessBanner(null), 4000);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorBanner(err.error || 'Failed to load templates.');
      }
    } catch (e: any) {
      setErrorBanner(e.message || 'Network error fetching templates.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleInsertVariable = () => {
    const nextIndex = detectedVariables.length + 1;
    const token = `{{${nextIndex}}}`;
    setBodyText(prev => prev + ` ${token}`);
  };

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (buttons.length >= 3) {
      alert('Meta WhatsApp templates support up to 3 quick reply or action buttons.');
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
      setBodyText('Hi {{1}}, thank you for choosing Rockyt! Your request {{2}} is being processed.');
      setFooterText('Reply STOP to unsubscribe');
      setButtons([
        { type: 'QUICK_REPLY', text: 'Chat with Support 💬' },
        { type: 'URL', text: 'Track Order', url: 'https://rockyt.io/orders' }
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

    // Parse existing components
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
      setErrorBanner('Body text is mandatory for WhatsApp templates.');
      return;
    }

    try {
      setIsSubmitting(true);
      const components: WhatsAppTemplateComponent[] = [];

      // 1. Header component
      if (headerType === 'TEXT' && headerText.trim()) {
        const headerObj: WhatsAppTemplateComponent = {
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim()
        };
        if (headerText.includes('{{1}}')) {
          headerObj.example = { header_text: [headerSample.trim() || 'Special Update'] };
        }
        components.push(headerObj);
      } else if (headerType !== 'NONE') {
        components.push({
          type: 'HEADER',
          format: headerType,
        });
      }

      // 2. Body component
      const bodyObj: WhatsAppTemplateComponent = {
        type: 'BODY',
        text: bodyText.trim()
      };
      if (detectedVariables.length > 0) {
        const sampleRow = detectedVariables.map(v => bodySamples[v]?.trim() || 'Sample');
        bodyObj.example = {
          body_text: [sampleRow]
        };
      }
      components.push(bodyObj);

      // 3. Footer component
      if (footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: footerText.trim()
        });
      }

      // 4. Buttons component
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
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit template to Meta.');
      }

      setSuccessBanner(
        isEditing
          ? `Template "${cleanName}" updated successfully. It has been resubmitted to Meta for review.`
          : `Template "${cleanName}" submitted to Meta for review! Review verdict usually arrives within 24 hours.`
      );

      await loadTemplates();
      setActiveTemplateName(cleanName);
      setSelectedLanguage(language);
      setActiveView('inspect');
      setIsEditing(false);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error creating template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportPreset = async (preset: typeof PRESET_LIBRARY_TEMPLATES[0]) => {
    if (!confirm(`Import pre-approved template "${preset.name}"? This bypasses the 24-hour review wait.`)) return;

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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: preset.name,
          category: preset.category,
          language: preset.language,
          library_template_name: preset.name,
          library_template_button_inputs: buttonInputs.length > 0 ? buttonInputs : undefined,
          components: [
            { type: 'BODY', text: preset.body },
            ...(preset.buttons.length > 0 ? [{
              type: 'BUTTONS',
              buttons: preset.buttons
            }] : [])
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');

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
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Template not found in Meta Library.');
      setLibraryLookupResult(data.template);

      // Pre-fill input slots for buttons
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

      setSuccessBanner(`Library template "${libraryLookupResult.name}" successfully imported!`);
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
    if (!confirm(`Are you sure you want to delete template "${tmplName}"? Meta will mark it PENDING_DELETION and remove it permanently.`)) return;

    try {
      setIsLoading(true);
      setErrorBanner(null);
      const res = await fetch(`/api/whatsapp/templates/${tmplName}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete template.');
      }

      setSuccessBanner(`Template "${tmplName}" deleted successfully.`);
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

  // Render Status Badge
  const renderStatusBadge = (status: WhatsAppTemplateStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            In Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
            <ShieldAlert className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'IN_APPEAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60">
            In Appeal
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/60">
            Paused
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
            Disabled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
            {status}
          </span>
        );
    }
  };

  // Live WhatsApp Bubble Computation
  const previewData = useMemo(() => {
    if (activeView === 'create') {
      let finalHeader = headerText;
      let finalBody = bodyText;

      if (previewWithSamples) {
        if (headerSample) {
          finalHeader = finalHeader.replace('{{1}}', headerSample);
        }
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
        status: isEditing ? (activeTemplate?.status || 'PENDING') : 'PENDING'
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
        // Substitute sample values if available
        renderedBody = renderedBody
          .replace(/\{\{1\}\}/g, 'Sarah')
          .replace(/\{\{2\}\}/g, 'ORD-2026-9')
          .replace(/\{\{3\}\}/g, '20% OFF')
          .replace(/\{\{(\d+)\}\}/g, 'Sample Value');

        renderedHeader = renderedHeader.replace(/\{\{1\}\}/g, 'Exclusive Update');
      }

      return {
        headerType: headerComp?.format || (headerComp?.text ? 'TEXT' : 'NONE'),
        headerText: renderedHeader,
        bodyText: renderedBody,
        footerText: footerComp?.text || '',
        buttons: btnComp?.buttons?.map(b => ({ text: b.text, type: b.type })) || [],
        status: activeTemplate.status
      };
    }

    return null;
  }, [activeView, activeTemplate, headerType, headerText, headerSample, bodyText, bodySamples, footerText, buttons, previewWithSamples, isEditing]);

  return (
    <div className="space-y-6">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                WhatsApp Template Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                Meta Cloud API
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Create, review, and synchronize WhatsApp Business templates for 24h+ conversation opening & broadcasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTemplates(true)}
            disabled={isSyncing}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            title="Fetch latest approval verdicts from Meta WABA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Meta'}</span>
          </button>

          <button
            onClick={() => setActiveView('library')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-sm ${
              activeView === 'library'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-750'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Meta Pre-Approved Library</span>
          </button>

          <button
            onClick={() => handleStartCreate(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Custom Template</span>
          </button>
        </div>
      </div>

      {/* ─── Alerts & Status Banners ─── */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{errorBanner}</div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-500 hover:text-rose-700 text-sm leading-none">&times;</button>
        </div>
      )}

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{successBanner}</div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 hover:text-emerald-700 text-sm leading-none">&times;</button>
        </div>
      )}

      {/* ─── Main 3-Column Studio Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* ─── LEFT COLUMN: Templates Directory (4 cols) ─── */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Saved Templates ({templates.length})
              </span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                {templates.filter(t => t.status === 'APPROVED').length} Approved
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded-md font-medium transition ${
                    statusFilter === st
                      ? 'bg-gray-900 text-white dark:bg-emerald-500 dark:text-black font-semibold'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800 p-2 space-y-1">
            {isLoading ? (
              <div className="py-12 text-center text-gray-400 dark:text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span>Loading Meta templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-400 dark:text-zinc-500 text-xs">
                <LayoutTemplate className="w-7 h-7 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="font-semibold text-gray-600 dark:text-zinc-300">No templates found</p>
                <p className="mt-1 text-[11px]">Create a custom template or import from the pre-approved library.</p>
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
                    className={`p-3 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800/80 shadow-xs'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {tmpl.name}
                      </span>
                      {renderStatusBadge(tmpl.status)}
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-medium text-[10px] text-gray-700 dark:text-zinc-300">
                          {tmpl.category}
                        </span>
                        <span>{tmpl.language || 'en_US'}</span>
                      </div>
                      {tmpl.message_send_ttl_seconds && (
                        <span className="text-[10px] text-gray-400" title="Delivery TTL window">
                          ⏳ {Math.round(tmpl.message_send_ttl_seconds / 60)}m
                        </span>
                      )}
                    </div>

                    {tmpl.status === 'REJECTED' && tmpl.rejected_reason && (
                      <div className="mt-2 text-[10px] p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{tmpl.rejected_reason}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Connected WABA Notice Footer */}
          <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 border-t border-gray-200 dark:border-zinc-800 text-[11px] text-gray-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasConnectedAccount ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {hasConnectedAccount ? 'WABA Linked & Synced' : 'Offline / Standalone Mode'}
            </span>
            <span className="text-[10px] text-gray-400">Meta Review: 0-24h</span>
          </div>
        </div>

        {/* ─── CENTER COLUMN: Editor / Inspector / Library (5 cols) ─── */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 overflow-y-auto max-h-[750px]">
          {/* VIEW 1: CREATE OR EDIT FORM */}
          {activeView === 'create' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isEditing ? `Edit Template: ${name}` : 'Design New Template'}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Follow Meta policies: Positional variables {'{{1}}'} must include realistic samples.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('inspect');
                    setIsEditing(false);
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitCustomTemplate} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-zinc-200 mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. order_shipped_v2"
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Only lowercase letters, numbers, and underscores. Cannot start with a digit.
                  </span>
                </div>

                {/* Category & Language Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MARKETING">MARKETING (Offers, Re-engagement)</option>
                      <option value="UTILITY">UTILITY (Receipts, Account alerts)</option>
                      <option value="AUTHENTICATION">AUTHENTICATION (OTPs, Security)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-zinc-200 mb-1">
                      Language <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      {COMMON_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.label} ({lang.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Header Selector */}
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 bg-gray-50/50 dark:bg-zinc-800/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                      Header (Optional)
                    </label>
                    <div className="flex items-center gap-1">
                      {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setHeaderType(type)}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition ${
                            headerType === type
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {headerType === 'TEXT' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="e.g. Special Announcement for {{1}} 🎉"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                      {headerText.includes('{{1}}') && (
                        <input
                          type="text"
                          value={headerSample}
                          onChange={(e) => setHeaderSample(e.target.value)}
                          placeholder="Header Sample for Meta Review (e.g. VIP Customer)"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 rounded-lg text-gray-900 dark:text-white focus:outline-none text-[11px]"
                        />
                      )}
                    </div>
                  )}

                  {headerType !== 'NONE' && headerType !== 'TEXT' && (
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      Dynamic {headerType.toLowerCase()} header will be attached to each message send.
                    </p>
                  )}
                </div>

                {/* Body Text */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                      Body Message <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertVariable}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[11px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insert Variable</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Enter your message text. Use {{1}}, {{2}} for customer name, order number, etc."
                    className="w-full p-3 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                    required
                  />

                  {/* Variables Samples Mapping for Review Approval */}
                  {detectedVariables.length > 0 && (
                    <div className="mt-2 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-400">
                        <Info className="w-3.5 h-3.5" />
                        <span>Meta Reviewer Sample Values (Required by Meta)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {detectedVariables.map((variable) => (
                          <div key={variable}>
                            <label className="block text-[10px] font-mono font-semibold text-gray-600 dark:text-zinc-400 mb-0.5">
                              Sample for {variable}
                            </label>
                            <input
                              type="text"
                              value={bodySamples[variable] || ''}
                              onChange={(e) => setBodySamples({ ...bodySamples, [variable]: e.target.value })}
                              placeholder={`Sample for ${variable}`}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/80 rounded-md text-gray-900 dark:text-white"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-zinc-200 mb-1">
                    Footer Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="e.g. Reply STOP to opt out"
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action & Quick Reply Buttons */}
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 bg-gray-50/50 dark:bg-zinc-800/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                      Interactive Buttons (Max 3)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddButton('QUICK_REPLY')}
                        className="px-2 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded text-[10px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100"
                      >
                        + Quick Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('URL')}
                        className="px-2 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded text-[10px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100"
                      >
                        + Website URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('PHONE_NUMBER')}
                        className="px-2 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded text-[10px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100"
                      >
                        + Phone
                      </button>
                    </div>
                  </div>

                  {buttons.length === 0 ? (
                    <p className="text-[11px] text-gray-400">No buttons configured.</p>
                  ) : (
                    <div className="space-y-2">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                              {btn.type === 'QUICK_REPLY' ? 'Quick Reply' : btn.type === 'URL' ? 'Website URL' : 'Call Phone'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) => handleUpdateButton(idx, { text: e.target.value })}
                              placeholder="Button Label"
                              className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-900 dark:text-white"
                              required
                            />

                            {btn.type === 'URL' && (
                              <input
                                type="url"
                                value={btn.url || ''}
                                onChange={(e) => handleUpdateButton(idx, { url: e.target.value })}
                                placeholder="https://your-site.com"
                                className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-900 dark:text-white"
                                required
                              />
                            )}

                            {btn.type === 'PHONE_NUMBER' && (
                              <input
                                type="tel"
                                value={btn.phone_number || ''}
                                onChange={(e) => handleUpdateButton(idx, { phone_number: e.target.value })}
                                placeholder="+1 555 019 2831"
                                className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-900 dark:text-white"
                                required
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Window (TTL) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1">
                      <span>Delivery Window (TTL)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {category === 'AUTHENTICATION' ? '30-900s (Default: 600s)' : category === 'UTILITY' ? '30-43200s (12h)' : '12h-30 days'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={deliveryTtlSeconds}
                    onChange={(e) => setDeliveryTtlSeconds(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`e.g. ${category === 'AUTHENTICATION' ? '600' : '3600'} (seconds)`}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    How long Meta keeps attempting delivery. Messages undelivered inside the window are dropped.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Meta Reviews...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isEditing ? 'Save & Resubmit to Meta' : 'Submit Template to Meta for Approval'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 2: META PRE-APPROVED TEMPLATE LIBRARY */}
          {activeView === 'library' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Meta Pre-Approved Template Library</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Import standard templates pre-certified by Meta. They bypass the 24-hour review process!
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('inspect')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200"
                >
                  Close
                </button>
              </div>

              {/* Popular Library Cards */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                  Featured Pre-Approved Templates
                </span>

                {PRESET_LIBRARY_TEMPLATES.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-800 transition bg-gray-50/60 dark:bg-zinc-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{preset.title}</h4>
                        <span className="font-mono text-[10px] text-gray-500 dark:text-zinc-400">{preset.name}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Instant Approval
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-sans">
                      {preset.body}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400 font-medium">Category: {preset.category}</span>
                      <button
                        onClick={() => handleImportPreset(preset)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Import & Use</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Meta Library Lookup */}
              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                  Search Meta Template Library by Name
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={libraryLookupName}
                    onChange={(e) => setLibraryLookupName(e.target.value)}
                    placeholder="e.g. account_creation_confirmation_3"
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                  />
                  <select
                    value={libraryLookupLang}
                    onChange={(e) => setLibraryLookupLang(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="en_US">en_US</option>
                    <option value="en">en</option>
                    <option value="es">es</option>
                    <option value="pt_BR">pt_BR</option>
                  </select>
                  <button
                    onClick={handleLookupCustomLibrary}
                    disabled={isLookingUpLibrary}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    {isLookingUpLibrary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Lookup</span>
                  </button>
                </div>

                {libraryLookupResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {libraryLookupResult.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Found in Meta Library
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-zinc-200">{libraryLookupResult.body}</p>

                    {libraryLookupResult.buttons?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 block">
                          Configure Button Destinations:
                        </span>
                        {libraryLookupResult.buttons.map((b: any, bIdx: number) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-24 truncate">{b.text}:</span>
                            <input
                              type="text"
                              value={libraryButtonInputs[bIdx] || ''}
                              onChange={(e) => {
                                const copy = [...libraryButtonInputs];
                                copy[bIdx] = e.target.value;
                                setLibraryButtonInputs(copy);
                              }}
                              placeholder="https://your-site.com"
                              className="flex-1 px-2 py-0.5 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleImportLookupResult}
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Import Immediately</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: INSPECT SELECTED TEMPLATE */}
          {activeView === 'inspect' && (
            activeTemplate ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white font-mono">
                        {activeTemplate.name}
                      </h2>
                      {renderStatusBadge(activeTemplate.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-semibold text-[11px] text-gray-700 dark:text-zinc-300">
                        {activeTemplate.category}
                      </span>
                      <span>Language: {activeTemplate.language || 'en_US'}</span>
                      {activeTemplate.id && (
                        <span className="font-mono text-[10px] text-gray-400">ID: {activeTemplate.id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(activeTemplate)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg text-xs font-semibold transition"
                      title="Edit template content or TTL"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(activeTemplate.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Notice Banners */}
                {activeTemplate.status === 'REJECTED' && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Meta Rejection Reason:</span>
                    </div>
                    <p className="leading-relaxed">
                      {activeTemplate.rejected_reason || 'Template content violates WhatsApp Business messaging policies (e.g. incorrect category, missing sample variable values, or spam-like phrasing).'}
                    </p>
                    <button
                      onClick={() => handleStartEdit(activeTemplate)}
                      className="mt-1 px-3 py-1 bg-rose-600 text-white rounded-md font-bold text-[11px] hover:bg-rose-700 transition"
                    >
                      Fix Content & Resubmit to Meta
                    </button>
                  </div>
                )}

                {activeTemplate.status === 'PENDING' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold block">Currently Under Meta Review</span>
                      <span>Review takes between a few minutes and 24 hours. The status updates automatically when approved.</span>
                    </div>
                  </div>
                )}

                {activeTemplate.status === 'APPROVED' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">Live & Sendable on WhatsApp</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Ready for Broadcasts
                    </span>
                  </div>
                )}

                {/* Components List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    Template Components
                  </span>

                  {activeTemplate.components?.map((c, i) => (
                    <div key={i} className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {c.type} {c.format ? `(${c.format})` : ''}
                        </span>
                      </div>

                      {c.text && (
                        <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                          {c.text}
                        </p>
                      )}

                      {c.buttons && c.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {c.buttons.map((btn, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs"
                            >
                              {btn.type === 'URL' && <ExternalLink className="w-3 h-3 text-emerald-600" />}
                              {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3 text-emerald-600" />}
                              {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3 text-emerald-600" />}
                              <span>{btn.text}</span>
                              {btn.url && <span className="text-[10px] text-gray-400 font-mono">({btn.url})</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Copy Template Identifier */}
                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Copy template call snippet:</span>
                  <button
                    onClick={() => copyToClipboard(`templateName: "${activeTemplate.name}", templateLanguage: "${activeTemplate.language || 'en_US'}"`, 'call_snippet')}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedBadge === 'call_snippet' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBadge === 'call_snippet' ? 'Copied' : 'Copy Code Snippet'}</span>
                  </button>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-zinc-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                  <LayoutTemplate className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">No Templates Created Yet</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-gray-500 dark:text-zinc-400">
                  Only templates you explicitly create or import will appear here. Create your own custom message template or choose from Meta's pre-approved library to start sending.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleStartCreate(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Template</span>
                  </button>
                  <button
                    onClick={() => setActiveView('library')}
                    className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 text-gray-700 dark:text-zinc-200 rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Browse Meta Library</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400 dark:text-zinc-500 space-y-3">
                <LayoutTemplate className="w-10 h-10 mx-auto text-emerald-500/50" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Select a Template to Inspect</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Choose a template from the list on the left to review its review verdict, message structure, and buttons.
                </p>
                <button
                  onClick={() => handleStartCreate(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Template</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* ─── RIGHT COLUMN: Live Smartphone Device Preview (3 cols) ─── */}
        <div className="lg:col-span-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Phone Preview</span>
            </span>
            <button
              onClick={() => setPreviewWithSamples(!previewWithSamples)}
              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>{previewWithSamples ? 'Show Raw {{1}}' : 'Show Samples'}</span>
            </button>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[280px] bg-zinc-900 border-[6px] border-zinc-800 rounded-[40px] p-2.5 shadow-2xl relative flex flex-col h-[540px] overflow-hidden">
            {/* Camera Notch */}
            <div className="w-20 h-4 bg-zinc-800 rounded-full mx-auto mb-1.5 flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>

            {/* WhatsApp App Bar */}
            <div className="bg-emerald-800 text-white p-2 px-2.5 rounded-t-2xl flex items-center gap-2 mb-2 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">
                R
              </div>
              <div className="leading-tight flex-1">
                <div className="text-[11px] font-bold flex items-center gap-1">
                  <span>Rockyt Verified</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-white text-emerald-800 flex items-center justify-center text-[8px] font-bold">✓</span>
                </div>
                <div className="text-[9px] text-emerald-200">Official Business Account</div>
              </div>
            </div>

            {/* WhatsApp Chat Canvas */}
            <div className="flex-1 overflow-y-auto space-y-2 p-1 bg-[#0b141a]/95 rounded-b-2xl flex flex-col justify-end">
              {previewData ? (
                <div className="space-y-1.5">
                  {/* The Message Bubble */}
                  <div className="bg-[#005c4b] border border-[#005c4b]/50 rounded-2xl rounded-tl-xs p-3 text-[11px] text-white shadow-md space-y-1.5">
                    {/* Header */}
                    {previewData.headerType === 'TEXT' && previewData.headerText && (
                      <div className="font-bold text-emerald-200 text-xs border-b border-emerald-600/40 pb-1">
                        {previewData.headerText}
                      </div>
                    )}
                    {previewData.headerType !== 'NONE' && previewData.headerType !== 'TEXT' && (
                      <div className="w-full h-24 bg-emerald-950/80 rounded-lg flex flex-col items-center justify-center text-emerald-300 gap-1 border border-emerald-700/40">
                        {previewData.headerType === 'IMAGE' && <ImageIcon className="w-6 h-6" />}
                        {previewData.headerType === 'VIDEO' && <Video className="w-6 h-6" />}
                        {previewData.headerType === 'DOCUMENT' && <FileText className="w-6 h-6" />}
                        <span className="text-[9px] font-bold uppercase">{previewData.headerType} ATTACHMENT</span>
                      </div>
                    )}

                    {/* Body */}
                    <div className="leading-relaxed whitespace-pre-wrap font-sans">
                      {previewData.bodyText}
                    </div>

                    {/* Footer */}
                    {previewData.footerText && (
                      <div className="text-[9px] text-emerald-300/70 pt-0.5 border-t border-emerald-600/30">
                        {previewData.footerText}
                      </div>
                    )}

                    {/* Timestamp & Double Blue Checks */}
                    <div className="text-[8px] text-emerald-200/80 flex items-center justify-end gap-1 pt-0.5">
                      <span>10:45 AM</span>
                      <span className="text-sky-300 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Buttons below message bubble */}
                  {previewData.buttons && previewData.buttons.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      {previewData.buttons.map((btn, i) => (
                        <div
                          key={i}
                          className="w-full py-1.5 bg-[#1f2c34] hover:bg-[#2a3942] border border-[#2a3942] rounded-xl text-center text-[11px] font-bold text-sky-400 shadow flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          {btn.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                          {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3" />}
                          {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3" />}
                          <span>{btn.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-[11px] py-20">
                  Select or create a template to preview live bubble
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
