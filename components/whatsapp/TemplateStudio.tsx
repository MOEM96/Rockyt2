import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutTemplate, Plus, CheckCircle2, AlertCircle, Trash2, 
  Sparkles, ExternalLink, Phone, Copy, Check, 
  Smartphone, MessageSquare, RefreshCw, Send, Loader2,
  Clock, ShieldAlert, BookOpen, Globe, Sliders, Info,
  Search, Eye, HelpCircle, Image as ImageIcon, Video, FileText,
  ChevronRight, ArrowRight, CornerDownLeft, AlertTriangle,
  ChevronDown, Edit3, ArrowLeft, CheckCircle, Flame, ShieldCheck,
  X, Filter, UploadCloud, ShoppingBag, Store, MapPin, Layers, FileUp, Link
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppTemplateComponent, WhatsAppTemplateStatus, WhatsAppButtonType } from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

export interface TemplateStudioProps {
  userSession?: any;
}

export interface ButtonItem {
  id: string;
  type: WhatsAppButtonType;
  text: string;
  url?: string;
  urlType?: 'static' | 'dynamic';
  urlExample?: string;
  phone_number?: string;
  code?: string;
  flow_id?: string;
  flow_action?: 'navigate' | 'data_exchange';
  navigate_screen?: string;
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

const BUTTON_TYPE_OPTIONS: Array<{
  type: WhatsAppButtonType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { type: 'QUICK_REPLY', label: 'Quick Reply', description: 'Pre-written response for fast replies', icon: CornerDownLeft },
  { type: 'URL', label: 'URL', description: 'Direct link to external website or checkout', icon: ExternalLink },
  { type: 'PHONE_NUMBER', label: 'Call', description: 'Dial a direct phone number', icon: Phone },
  { type: 'COPY_CODE', label: 'Copy code', description: '1-tap coupon or authentication code copy', icon: Copy },
  { type: 'FLOW', label: 'Flow', description: 'Interactive Meta WhatsApp Form/Flow', icon: Sliders },
  { type: 'REQUEST_CONTACT', label: 'Request Contact Info', description: 'Ask customer for location or phone number', icon: Smartphone },
  { type: 'CATALOG', label: 'Catalog', description: 'Open your business catalog in WhatsApp', icon: ShoppingBag },
  { type: 'MPM', label: 'Multi-product', description: 'Present multiple catalog items to browse', icon: Store },
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
    body: 'Your verification code is {{1}}. This passcode expires in 10 minutes. Do not share this code with anyone.',
    sampleVariables: ['849-201'],
    buttons: [
      { type: 'COPY_CODE' as const, text: 'Copy Code 📋', code: '849-201' }
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
  const [activeView, setActiveView] = useState<'list' | 'inspect' | 'library'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
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

  // Inspector test variable inputs
  const [customVariableInputs, setCustomVariableInputs] = useState<Record<string, string>>({});

  // Builder Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');

  // Header State
  const [headerChoice, setHeaderChoice] = useState<'NONE' | 'TEXT' | 'MEDIA'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerSample, setHeaderSample] = useState('');
  const [headerMediaType, setHeaderMediaType] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('IMAGE');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerMediaFileName, setHeaderMediaFileName] = useState('');
  const [headerMediaFileSize, setHeaderMediaFileSize] = useState<number | null>(null);
  const [mediaUploadMode, setMediaUploadMode] = useState<'file' | 'url'>('file');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Body & Footer State
  const [bodyText, setBodyText] = useState('Hello {{1}}, thank you for contacting us! How can we assist you with our services today?');
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({
    '{{1}}': 'Alex',
  });
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe');

  // Buttons State
  const [buttons, setButtons] = useState<ButtonItem[]>([
    { id: 'btn_1', type: 'QUICK_REPLY', text: 'Chat with Support 💬' }
  ]);
  const [activeButtonDropdown, setActiveButtonDropdown] = useState<string | null>(null);
  const [deliveryTtlSeconds, setDeliveryTtlSeconds] = useState<number | ''>('');

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
          next[v] = idx === 0 ? 'Alex' : idx === 1 ? 'ORD-8921' : idx === 2 ? '25%' : `Sample_${idx + 1}`;
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
      setHeaderChoice('NONE');
      setHeaderText('');
      setHeaderSample('');
      setHeaderMediaType('IMAGE');
      setHeaderMediaUrl('');
      setHeaderMediaFileName('');
      setHeaderMediaFileSize(null);
      setMediaUploadError(null);
      setBodyText('Hello {{1}}, thank you for contacting us! How can we assist you with our services today?');
      setBodySamples({ '{{1}}': 'Alex' });
      setFooterText('Reply STOP to unsubscribe');
      setButtons([{ id: 'btn_1', type: 'QUICK_REPLY', text: 'Chat with Support 💬' }]);
      setDeliveryTtlSeconds('');
      setIsEditing(false);
      setEditingTemplateId(null);
    }
    setIsCreateModalOpen(true);
  };

  const handleEditTemplate = (tmpl: WhatsAppTemplate) => {
    setName(tmpl.name);
    setCategory(tmpl.category);
    setLanguage(tmpl.language || 'en_US');
    setEditingTemplateId(tmpl.id);

    const header = tmpl.components?.find(c => c.type === 'HEADER' || (c.type as any) === 'header');
    const body = tmpl.components?.find(c => c.type === 'BODY' || (c.type as any) === 'body');
    const footer = tmpl.components?.find(c => c.type === 'FOOTER' || (c.type as any) === 'footer');
    const btns = tmpl.components?.find(c => c.type === 'BUTTONS' || (c.type as any) === 'buttons');

    if (header) {
      const fmt = (header.format || (header.text ? 'TEXT' : 'NONE')).toUpperCase();
      if (fmt === 'TEXT') {
        setHeaderChoice('TEXT');
        setHeaderText(header.text || '');
        setHeaderSample(header.example?.header_text?.[0] || '');
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(fmt)) {
        setHeaderChoice('MEDIA');
        setHeaderMediaType(fmt as any);
        const mUrl = header.media_url || header.example?.header_handle?.[0] || tmpl.media_url || '';
        setHeaderMediaUrl(mUrl);
        setHeaderMediaFileName(mUrl ? mUrl.split('/').pop() || 'Media Asset' : '');
      } else {
        setHeaderChoice('NONE');
      }
    } else {
      setHeaderChoice('NONE');
      setHeaderText('');
      setHeaderSample('');
      setHeaderMediaUrl('');
    }

    setBodyText(body?.text || '');
    setFooterText(footer?.text || '');
    
    if (btns?.buttons && btns.buttons.length > 0) {
      setButtons(btns.buttons.map((b, idx) => ({
        id: `btn_${idx}_${Date.now()}`,
        type: (b.type as any).toUpperCase() || 'QUICK_REPLY',
        text: b.text || '',
        url: b.url,
        urlType: b.url_type || (b.url?.includes('{{1}}') ? 'dynamic' : 'static'),
        urlExample: b.url_example || (Array.isArray(b.example) ? b.example[0] : (typeof b.example === 'string' ? b.example : undefined)),
        phone_number: b.phone_number,
        code: b.code || (typeof b.example === 'string' ? b.example : undefined),
        flow_id: b.flow_id,
        flow_action: (b.flow_action as any) || 'navigate',
        navigate_screen: b.navigate_screen,
      })));
    } else {
      setButtons([]);
    }

    setDeliveryTtlSeconds(tmpl.message_send_ttl_seconds || '');
    setIsEditing(true);
    setIsCreateModalOpen(true);
  };

  // Upload file handler (Images, Videos, Documents)
  const processUploadedFile = async (file: File) => {
    if (!file) return;
    setIsUploadingMedia(true);
    setMediaUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/whatsapp/templates/upload-media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(userSession),
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
              base64Data,
              mediaType: headerMediaType,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to upload media asset to storage.');
          }

          setHeaderMediaUrl(data.url);
          setHeaderMediaFileName(file.name);
          setHeaderMediaFileSize(file.size);
        } catch (uploadErr: any) {
          setMediaUploadError(uploadErr.message || 'Media upload failed.');
        } finally {
          setIsUploadingMedia(false);
        }
      };

      reader.onerror = () => {
        setMediaUploadError('Error reading file from disk.');
        setIsUploadingMedia(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setMediaUploadError(err.message || 'File upload failed.');
      setIsUploadingMedia(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleInsertVariable = () => {
    const nextVarNumber = detectedVariables.length + 1;
    const token = `{{${nextVarNumber}}}`;
    
    if (bodyTextareaRef.current) {
      const el = bodyTextareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = bodyText;
      const updated = current.substring(0, start) + token + current.substring(end);
      setBodyText(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 50);
    } else {
      setBodyText(prev => prev + ` ${token}`);
    }
  };

  const handleAddButton = () => {
    if (buttons.length >= 10) return;
    const newBtn: ButtonItem = {
      id: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'QUICK_REPLY',
      text: `Button ${buttons.length + 1}`,
    };
    setButtons(prev => [...prev, newBtn]);
  };

  const handleRemoveButton = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateButton = (id: string, updates: Partial<ButtonItem>) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
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

    if (headerChoice === 'MEDIA' && !headerMediaUrl.trim()) {
      setErrorBanner(`Please upload a sample ${headerMediaType.toLowerCase()} asset or enter a direct URL for your template header.`);
      return;
    }

    try {
      setIsSubmitting(true);

      const componentsPayload: WhatsAppTemplateComponent[] = [];

      // 1. Header Component
      if (headerChoice === 'TEXT' && headerText.trim()) {
        componentsPayload.push({
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim(),
          example: headerSample.trim() ? { header_text: [headerSample.trim()] } : undefined,
        });
      } else if (headerChoice === 'MEDIA') {
        componentsPayload.push({
          type: 'HEADER',
          format: headerMediaType,
          media_url: headerMediaUrl.trim(),
          example: {
            header_handle: [headerMediaUrl.trim()],
            header_url: [headerMediaUrl.trim()],
          },
        });
      }

      // 2. Body Component
      const bodyExampleRows = detectedVariables.map(v => bodySamples[v] || 'Sample');
      componentsPayload.push({
        type: 'BODY',
        text: bodyText.trim(),
        example: bodyExampleRows.length > 0 ? { body_text: [bodyExampleRows] } : undefined,
      });

      // 3. Footer Component
      if (footerText.trim()) {
        componentsPayload.push({
          type: 'FOOTER',
          text: footerText.trim(),
        });
      }

      // 4. Buttons Component (Up to 10 Meta Buttons)
      if (buttons.length > 0) {
        componentsPayload.push({
          type: 'BUTTONS',
          buttons: buttons.map(b => {
            const base: any = {
              type: b.type,
              text: b.text.trim() || 'Action',
            };

            if (b.type === 'URL') {
              base.url = b.url?.trim() || 'https://rockyt.io';
              base.url_type = b.urlType || 'static';
              if (b.urlExample?.trim()) {
                base.example = [b.urlExample.trim()];
              }
            } else if (b.type === 'PHONE_NUMBER') {
              base.phone_number = b.phone_number?.trim() || '+10000000000';
            } else if (b.type === 'COPY_CODE') {
              base.code = b.code?.trim() || 'COUPON25';
              base.example = b.code?.trim() || 'COUPON25';
            } else if (b.type === 'FLOW') {
              base.flow_id = b.flow_id?.trim() || 'flow_123';
              base.flow_action = b.flow_action || 'navigate';
              base.navigate_screen = b.navigate_screen?.trim() || 'START';
            }

            return base;
          }),
        });
      }

      const payload = {
        name: cleanName,
        category,
        language,
        header_type: headerChoice === 'TEXT' ? 'TEXT' : (headerChoice === 'MEDIA' ? headerMediaType : 'NONE'),
        media_url: headerChoice === 'MEDIA' ? headerMediaUrl.trim() : null,
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
          ? `Template "${cleanName}" updated and resubmitted for Meta review.`
          : `Template "${cleanName}" created successfully! Status is PENDING review.`
      );

      await loadTemplates();
      setActiveTemplateName(cleanName);
      setIsCreateModalOpen(false);
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
    if (isCreateModalOpen) {
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
        language,
        status: isEditing ? 'PENDING' : 'DRAFT',
        headerChoice,
        headerType: headerChoice === 'TEXT' ? 'TEXT' : (headerChoice === 'MEDIA' ? headerMediaType : 'NONE'),
        headerText: finalHeader,
        headerMediaUrl,
        headerMediaFileName,
        bodyText: finalBody,
        footerText,
        buttons: buttons.map(b => ({ text: b.text || 'Action', type: b.type })),
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

      const hFormat = (headerComp?.format || (headerComp?.text ? 'TEXT' : 'NONE')).toUpperCase();

      return {
        name: activeTemplate.name,
        category: activeTemplate.category,
        language: activeTemplate.language || 'en_US',
        status: activeTemplate.status,
        headerChoice: hFormat === 'TEXT' ? 'TEXT' : (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hFormat) ? 'MEDIA' : 'NONE'),
        headerType: hFormat,
        headerText: renderedHeader,
        headerMediaUrl: headerComp?.media_url || headerComp?.example?.header_handle?.[0] || activeTemplate.media_url || '',
        headerMediaFileName: activeTemplate.name,
        bodyText: renderedBody,
        footerText: footerComp?.text || '',
        buttons: btnComp?.buttons?.map(b => ({ text: b.text, type: b.type })) || [],
      };
    }

    return null;
  }, [
    isCreateModalOpen, activeTemplate, headerChoice, headerText, headerSample, 
    headerMediaType, headerMediaUrl, headerMediaFileName, bodyText, bodySamples, 
    footerText, buttons, previewWithSamples, name, category, language, isEditing, customVariableInputs
  ]);

  // Phone Simulator Component
  const renderPhoneSimulator = (isCompact = false) => {
    if (!activePreviewData) return null;

    return (
      <div className="flex flex-col items-center w-full">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between w-full max-w-[310px] mb-2 px-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Preview</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase">
            {activePreviewData.category} · {activePreviewData.language?.split('_')[0].toUpperCase()}
          </span>
        </div>

        {/* WhatsApp Phone Card Mockup */}
        <div className="w-full max-w-[310px] bg-[#efeae2] rounded-2xl border border-gray-300 shadow-lg overflow-hidden flex flex-col relative text-gray-900">
          {/* Subtle WhatsApp Chat Wallpaper Pattern */}
          <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-end bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:14px_14px]">
            
            {/* WhatsApp Message Bubble */}
            <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-xs border border-gray-100 text-xs space-y-2.5 relative">
              
              {/* Media Header Preview */}
              {activePreviewData.headerChoice === 'MEDIA' && (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {activePreviewData.headerType === 'IMAGE' && (
                    activePreviewData.headerMediaUrl ? (
                      <img 
                        src={activePreviewData.headerMediaUrl} 
                        alt="Header preview" 
                        className="w-full h-36 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-32 bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4 text-center">
                        <ImageIcon className="w-7 h-7 text-gray-400" />
                        <span className="text-[11px] font-medium text-gray-500">Image Header</span>
                      </div>
                    )
                  )}

                  {activePreviewData.headerType === 'VIDEO' && (
                    <div className="h-32 bg-slate-900 flex flex-col items-center justify-center text-white relative">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-sm">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-200 mt-2">
                        {activePreviewData.headerMediaFileName || 'Video Header'}
                      </span>
                    </div>
                  )}

                  {activePreviewData.headerType === 'DOCUMENT' && (
                    <div className="p-3 bg-gray-50 flex items-center gap-3 border-l-4 border-[#00a884]">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-gray-800 truncate">
                          {activePreviewData.headerMediaFileName || 'Document.pdf'}
                        </div>
                        <div className="text-[9px] text-gray-500">PDF Document</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Header Preview */}
              {activePreviewData.headerChoice === 'TEXT' && activePreviewData.headerText && (
                <div className="font-bold text-gray-900 text-[13px] leading-tight pb-1 border-b border-gray-50">
                  {activePreviewData.headerText}
                </div>
              )}

              {/* Message Body Content */}
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[12px] font-normal">
                {activePreviewData.bodyText || 'Your message will appear here'}
              </div>

              {/* Message Footer */}
              {activePreviewData.footerText && (
                <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                  {activePreviewData.footerText}
                </div>
              )}

              {/* Timestamp & Double Checkmarks */}
              <div className="flex items-center justify-end gap-1 text-[9px] text-gray-400 pt-0.5">
                <span>12:00</span>
                <span className="text-[#53bdeb] font-bold">✓✓</span>
              </div>
            </div>

            {/* Interactive Action Buttons */}
            {activePreviewData.buttons && activePreviewData.buttons.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                {activePreviewData.buttons.map((btn, idx) => {
                  const bType = String(btn.type).toUpperCase();
                  return (
                    <div 
                      key={idx}
                      className="bg-white hover:bg-gray-50 text-[#00a884] font-semibold text-[11px] py-2 px-3 rounded-xl text-center shadow-xs border border-gray-200 flex items-center justify-center gap-1.5 transition select-none"
                    >
                      {bType === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                      {(bType === 'PHONE_NUMBER' || bType === 'CALL') && <Phone className="w-3.5 h-3.5" />}
                      {bType === 'COPY_CODE' && <Copy className="w-3.5 h-3.5" />}
                      {bType === 'FLOW' && <Sliders className="w-3.5 h-3.5" />}
                      {(bType === 'REQUEST_CONTACT' || bType === 'REQUEST_LOCATION' || bType === 'REQUEST_PHONE_NUMBER') && <Smartphone className="w-3.5 h-3.5" />}
                      {(bType === 'CATALOG' || bType === 'VIEW_CATALOG') && <ShoppingBag className="w-3.5 h-3.5" />}
                      {(bType === 'MPM' || bType === 'MULTI_PRODUCT') && <Store className="w-3.5 h-3.5" />}
                      {bType === 'QUICK_REPLY' && <CornerDownLeft className="w-3.5 h-3.5" />}
                      <span className="truncate">{btn.text || 'Button'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Simulator Variable Toggle */}
        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setPreviewWithSamples(!previewWithSamples)}
            className={`text-[10px] font-semibold px-3 py-1 rounded-full border transition cursor-pointer ${
              previewWithSamples 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {previewWithSamples ? 'Variables Substituted' : 'Raw Placeholders {{1}}'}
          </button>
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
          <div className="text-[11px] text-gray-500 mt-1 font-medium">Verified in workspace</div>
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
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium">Awaiting automated verification</div>
        </div>

        {/* Approved & Live */}
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
                const headerFormat = (headerComp?.format || (headerComp?.text ? 'TEXT' : 'NONE')).toUpperCase();

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

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                          tmpl.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tmpl.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tmpl.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {tmpl.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                          {tmpl.status === 'REJECTED' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                          <span>{tmpl.status}</span>
                        </span>
                      </div>

                      {/* Template Title & Language */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-sm font-mono truncate max-w-[200px]" title={tmpl.name}>
                            {tmpl.name}
                          </h3>
                          <span className="text-[11px] font-semibold text-gray-500 uppercase">
                            {tmpl.language || 'en_US'}
                          </span>
                        </div>
                        {headerFormat !== 'NONE' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                            {headerFormat === 'TEXT' && <FileText className="w-3 h-3 text-gray-400" />}
                            {headerFormat === 'IMAGE' && <ImageIcon className="w-3 h-3 text-blue-500" />}
                            {headerFormat === 'VIDEO' && <Video className="w-3 h-3 text-purple-500" />}
                            {headerFormat === 'DOCUMENT' && <FileUp className="w-3 h-3 text-emerald-500" />}
                            <span>Header: {headerFormat}</span>
                          </div>
                        )}
                      </div>

                      {/* Message Body Snippet */}
                      <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-xl border border-gray-100 font-sans leading-relaxed">
                        {bodyComp?.text || 'No message content defined.'}
                      </p>

                      {/* Action Buttons Chips */}
                      {btnComp?.buttons && btnComp.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {btnComp.buttons.slice(0, 3).map((b, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium border border-gray-200 flex items-center gap-1"
                            >
                              <span>{b.text}</span>
                            </span>
                          ))}
                          {btnComp.buttons.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-semibold self-center">
                              +{btnComp.buttons.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setActiveTemplateName(tmpl.name);
                          setActiveView('inspect');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Test</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTemplate(tmpl)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(tmpl.name)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

              {/* Components Breakdown */}
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
                      {comp.media_url && (
                        <div className="text-gray-600 text-[11px] flex items-center gap-1.5 bg-white p-2.5 rounded-lg border border-gray-100">
                          <Link className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{comp.media_url}</span>
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

            {/* Right Column: Phone Simulator */}
            <div className="lg:col-span-5 lg:sticky lg:top-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col items-center">
                {renderPhoneSimulator()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: META PRE-APPROVED LIBRARY */}
      {activeView === 'library' && (
        <div className="space-y-5">
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

      {/* ─── MODAL: CREATE / EDIT MESSAGE TEMPLATE (Matches Screenshot Design) ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Top Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  {isEditing ? `Edit Message Template: ${name}` : 'Create Message Template'}
                </h2>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Editing Mode
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditing(false);
                }}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2-Column Layout */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="create-template-form" onSubmit={handleSubmitTemplate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Form Fields */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* General Details: Name, Category, Language */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        Template Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isEditing}
                        placeholder="e.g. spring_promo_blast"
                        value={name}
                        onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono disabled:opacity-60"
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
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="MARKETING">Marketing (Offers & Promotions)</option>
                          <option value="UTILITY">Utility (Order alerts & Updates)</option>
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
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                        >
                          {COMMON_LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Header (optional) */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-800">
                          Header
                        </label>
                        <span className="text-xs text-gray-400 font-normal">optional</span>
                      </div>
                      
                      {/* None / Text / Media selector */}
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setHeaderChoice('NONE')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            headerChoice === 'NONE'
                              ? 'bg-white text-gray-900 shadow-2xs font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderChoice('TEXT')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            headerChoice === 'TEXT'
                              ? 'bg-white text-gray-900 shadow-2xs font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span>Text</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderChoice('MEDIA')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            headerChoice === 'MEDIA'
                              ? 'bg-white text-gray-900 shadow-2xs font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <UploadCloud className="w-3 h-3 text-emerald-600" />
                          <span>Media</span>
                        </button>
                      </div>
                    </div>

                    {/* Text Header Input */}
                    {headerChoice === 'TEXT' && (
                      <div className="space-y-2 pt-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-gray-600">Header Text (Max 60 chars)</span>
                          <span className="text-[10px] text-gray-400">{headerText.length}/60</span>
                        </div>
                        <input
                          type="text"
                          maxLength={60}
                          placeholder="e.g. Special Weekend Announcement"
                          value={headerText}
                          onChange={(e) => setHeaderText(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        {headerText.includes('{{1}}') && (
                          <div className="pt-1">
                            <label className="text-[10px] font-bold text-emerald-800 block mb-1">
                              Header Sample Variable Value (Required by Meta):
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 50% Flash Sale"
                              value={headerSample}
                              onChange={(e) => setHeaderSample(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg text-gray-700 focus:outline-none"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Header (Image, Video, Document) */}
                    {headerChoice === 'MEDIA' && (
                      <div className="space-y-3 pt-1 bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                        {/* Media Format Picker */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-700">Select Media Type:</span>
                          <div className="flex items-center gap-1.5">
                            {(['IMAGE', 'VIDEO', 'DOCUMENT'] as const).map(fmt => (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => {
                                  setHeaderMediaType(fmt);
                                  setHeaderMediaUrl('');
                                  setHeaderMediaFileName('');
                                }}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                                  headerMediaType === fmt
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {fmt === 'IMAGE' && <ImageIcon className="w-3 h-3" />}
                                {fmt === 'VIDEO' && <Video className="w-3 h-3" />}
                                {fmt === 'DOCUMENT' && <FileText className="w-3 h-3" />}
                                <span>{fmt === 'IMAGE' ? 'Image' : fmt === 'VIDEO' ? 'Video' : 'Document'}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Upload vs URL Tabs */}
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                          <button
                            type="button"
                            onClick={() => setMediaUploadMode('file')}
                            className={`text-[11px] font-bold pb-1 transition cursor-pointer ${
                              mediaUploadMode === 'file'
                                ? 'text-emerald-700 border-b-2 border-emerald-600'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            Upload {headerMediaType === 'IMAGE' ? 'Image' : headerMediaType === 'VIDEO' ? 'Video' : 'Document'}
                          </button>
                          <span className="text-gray-300 text-xs">|</span>
                          <button
                            type="button"
                            onClick={() => setMediaUploadMode('url')}
                            className={`text-[11px] font-bold pb-1 transition cursor-pointer ${
                              mediaUploadMode === 'url'
                                ? 'text-emerald-700 border-b-2 border-emerald-600'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            Enter Direct Public URL
                          </button>
                        </div>

                        {/* Mode 1: File Drag & Drop Upload */}
                        {mediaUploadMode === 'file' && (
                          <div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  processUploadedFile(e.target.files[0]);
                                }
                              }}
                              accept={
                                headerMediaType === 'IMAGE'
                                  ? 'image/jpeg,image/png,image/webp'
                                  : headerMediaType === 'VIDEO'
                                  ? 'video/mp4,video/3gpp'
                                  : '.pdf,.doc,.docx,.txt,application/pdf'
                              }
                              className="hidden"
                            />

                            {!headerMediaUrl ? (
                              <div
                                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                                onDragLeave={() => setIsDraggingFile(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                  isDraggingFile 
                                    ? 'border-emerald-500 bg-emerald-50/50' 
                                    : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-gray-50'
                                }`}
                              >
                                {isUploadingMedia ? (
                                  <div className="py-2 flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                                    <span className="text-xs font-semibold text-gray-700">Uploading media asset to storage...</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                      <UploadCloud className="w-5 h-5" />
                                    </div>
                                    <div className="text-xs font-bold text-gray-800">
                                      Click to browse or drag &amp; drop {headerMediaType.toLowerCase()}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                      {headerMediaType === 'IMAGE' && 'Supported: JPG, PNG, WEBP (Max 5MB)'}
                                      {headerMediaType === 'VIDEO' && 'Supported: MP4, 3GPP (Max 16MB)'}
                                      {headerMediaType === 'DOCUMENT' && 'Supported: PDF, DOC, DOCX (Max 50MB)'}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              /* Uploaded Media Preview Card */
                              <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  {headerMediaType === 'IMAGE' && (
                                    <img 
                                      src={headerMediaUrl} 
                                      alt="Thumbnail" 
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" 
                                    />
                                  )}
                                  {headerMediaType === 'VIDEO' && (
                                    <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0">
                                      <Video className="w-6 h-6" />
                                    </div>
                                  )}
                                  {headerMediaType === 'DOCUMENT' && (
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                                      <FileText className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-gray-900 truncate">
                                      {headerMediaFileName || 'Uploaded Media Asset'}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      <span>Uploaded to storage CDN</span>
                                      {headerMediaFileSize && (
                                        <span className="text-gray-400">
                                          · {(headerMediaFileSize / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                                  >
                                    Replace
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHeaderMediaUrl('');
                                      setHeaderMediaFileName('');
                                      setHeaderMediaFileSize(null);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Remove asset"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mode 2: Direct URL Input */}
                        {mediaUploadMode === 'url' && (
                          <div className="space-y-1.5">
                            <input
                              type="url"
                              placeholder={`https://example.com/assets/${headerMediaType.toLowerCase()}_sample.${headerMediaType === 'IMAGE' ? 'jpg' : headerMediaType === 'VIDEO' ? 'mp4' : 'pdf'}`}
                              value={headerMediaUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                setHeaderMediaUrl(val);
                                setHeaderMediaFileName(val.split('/').pop() || 'Media Asset');
                              }}
                              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <span className="text-[10px] text-gray-400 block">
                              Must be a direct, publicly reachable URL ending in an approved format.
                            </span>
                          </div>
                        )}

                        {mediaUploadError && (
                          <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 pt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{mediaUploadError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Body (required) */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800">
                        Body <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleInsertVariable}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add a variable</span>
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        ref={bodyTextareaRef}
                        rows={4}
                        maxLength={1024}
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Type the message content that recipients will receive..."
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans leading-relaxed"
                        required
                      />
                      <div className="absolute right-3 bottom-2 text-[10px] text-gray-400">
                        {bodyText.length}/1024
                      </div>
                    </div>

                    {/* Detected Variables Sample Inputs (Meta Compliance) */}
                    {detectedVariables.length > 0 && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Sample Values for Review (Required by Meta)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                  {/* Section 3: Footer (optional) */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-800">
                          Footer
                        </label>
                        <span className="text-xs text-gray-400 font-normal">optional</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{footerText.length}/60</span>
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Reply STOP to opt out"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Section 4: Buttons (All 8 Meta Button Types) */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-800">
                          Buttons
                        </label>
                        <span className="text-xs text-gray-400 font-normal">optional ({buttons.length}/10)</span>
                      </div>

                      {buttons.length < 10 && (
                        <button
                          type="button"
                          onClick={handleAddButton}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add button</span>
                        </button>
                      )}
                    </div>

                    {/* Button Cards List */}
                    <div className="space-y-3">
                      {buttons.map((btn, idx) => {
                        const activeOpt = BUTTON_TYPE_OPTIONS.find(o => o.type === btn.type) || BUTTON_TYPE_OPTIONS[0];
                        const IconComponent = activeOpt.icon;

                        return (
                          <div key={btn.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative">
                            {/* Button Card Header */}
                            <div className="flex items-center justify-between gap-3">
                              
                              {/* Type Select Dropdown */}
                              <div className="relative flex-1 sm:max-w-xs">
                                <select
                                  value={btn.type}
                                  onChange={(e) => {
                                    const newType = e.target.value as WhatsAppButtonType;
                                    let defaultTxt = btn.text;
                                    if (newType === 'COPY_CODE' && (!btn.text || btn.text.startsWith('Button'))) defaultTxt = 'Copy code';
                                    if (newType === 'PHONE_NUMBER' && (!btn.text || btn.text.startsWith('Button'))) defaultTxt = 'Call';
                                    if (newType === 'CATALOG' && (!btn.text || btn.text.startsWith('Button'))) defaultTxt = 'View catalog';
                                    if (newType === 'MPM' && (!btn.text || btn.text.startsWith('Button'))) defaultTxt = 'View products';
                                    handleUpdateButton(btn.id, { type: newType, text: defaultTxt });
                                  }}
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 font-semibold focus:outline-none cursor-pointer"
                                >
                                  {BUTTON_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.type} value={opt.type}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Button Label Input */}
                              <div className="flex-1">
                                <input
                                  type="text"
                                  maxLength={25}
                                  value={btn.text}
                                  onChange={(e) => handleUpdateButton(btn.id, { text: e.target.value })}
                                  placeholder="Button text..."
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                                  required
                                />
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(btn.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete button"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Type Specific Fields */}
                            {/* 1. URL Button Configuration */}
                            {btn.type === 'URL' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/60">
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Website URL</label>
                                  <input
                                    type="url"
                                    value={btn.url || ''}
                                    onChange={(e) => handleUpdateButton(btn.id, { url: e.target.value })}
                                    placeholder="https://rockyt.io"
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">URL Type</label>
                                  <select
                                    value={btn.urlType || 'static'}
                                    onChange={(e) => handleUpdateButton(btn.id, { urlType: e.target.value as any })}
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg"
                                  >
                                    <option value="static">Static URL</option>
                                    <option value="dynamic">Dynamic (with variable)</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* 2. Call Button Configuration */}
                            {btn.type === 'PHONE_NUMBER' && (
                              <div className="pt-1 border-t border-gray-200/60">
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Phone Number (with country code)</label>
                                <input
                                  type="tel"
                                  value={btn.phone_number || ''}
                                  onChange={(e) => handleUpdateButton(btn.id, { phone_number: e.target.value })}
                                  placeholder="+15551234567"
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                                  required
                                />
                              </div>
                            )}

                            {/* 3. Copy Code Button Configuration */}
                            {btn.type === 'COPY_CODE' && (
                              <div className="pt-1 border-t border-gray-200/60">
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Sample Coupon or Auth Passcode</label>
                                <input
                                  type="text"
                                  value={btn.code || ''}
                                  onChange={(e) => handleUpdateButton(btn.id, { code: e.target.value })}
                                  placeholder="e.g. FLASH25"
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:outline-none"
                                  required
                                />
                              </div>
                            )}

                            {/* 4. WhatsApp Flow Button Configuration */}
                            {btn.type === 'FLOW' && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-200/60">
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Flow ID</label>
                                  <input
                                    type="text"
                                    value={btn.flow_id || ''}
                                    onChange={(e) => handleUpdateButton(btn.id, { flow_id: e.target.value })}
                                    placeholder="e.g. 1928471203"
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:outline-none"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Action</label>
                                  <select
                                    value={btn.flow_action || 'navigate'}
                                    onChange={(e) => handleUpdateButton(btn.id, { flow_action: e.target.value as any })}
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg"
                                  >
                                    <option value="navigate">Navigate</option>
                                    <option value="data_exchange">Data Exchange</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Screen Name</label>
                                  <input
                                    type="text"
                                    value={btn.navigate_screen || ''}
                                    onChange={(e) => handleUpdateButton(btn.id, { navigate_screen: e.target.value })}
                                    placeholder="SCREEN_ONE"
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* 5. Request Contact Info Info banner */}
                            {btn.type === 'REQUEST_CONTACT' && (
                              <div className="pt-1 text-[11px] text-gray-500 border-t border-gray-200/60">
                                When clicked by the recipient, WhatsApp presents a native dialog to share their phone number or location.
                              </div>
                            )}

                            {/* 6. Catalog info banner */}
                            {btn.type === 'CATALOG' && (
                              <div className="pt-1 text-[11px] text-gray-500 border-t border-gray-200/60">
                                Opens your Meta Commerce Manager catalog directly in the WhatsApp chat window.
                              </div>
                            )}

                            {/* 7. Multi-product info banner */}
                            {btn.type === 'MPM' && (
                              <div className="pt-1 text-[11px] text-gray-500 border-t border-gray-200/60">
                                Displays a multi-product selector containing up to 30 items from your product catalog.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Phone Mockup Preview */}
                <div className="lg:col-span-5 lg:sticky lg:top-0">
                  <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 flex flex-col items-center">
                    {renderPhoneSimulator()}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Bottom Footer Action Bar */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
              <div className="text-xs text-gray-500">
                {isEditing ? 'Editing will resubmit template for Meta review' : 'New templates undergo automated Meta verification'}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="create-template-form"
                  disabled={isSubmitting || isUploadingMedia}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Meta...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Create Template'}</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateStudio;
