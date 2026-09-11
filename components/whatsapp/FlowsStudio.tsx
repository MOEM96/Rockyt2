import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GitBranch, Plus, CheckCircle2, AlertCircle, Trash2,
  Sparkles, ExternalLink, Copy, Check, Smartphone,
  RefreshCw, Send, Loader2, BookOpen, Layers, Edit3,
  X, Filter, Search, ArrowRight, Play, Eye, Code,
  Sliders, ShieldAlert, ArrowLeft, CheckCircle, Flame,
  Download, Upload, Server, ShieldCheck, ChevronDown,
  ChevronRight, Calendar, Hash, Type, AlignLeft,
  ListFilter, CheckSquare, Radio, ToggleLeft, CornerDownRight,
  HelpCircle, MessageSquare
} from 'lucide-react';
import {
  WhatsAppFlow,
  WhatsAppFlowCategory,
  WhatsAppFlowStatus,
  FlowScreen,
  FlowComponent,
  FlowComponentType,
  FlowJSON,
  WhatsAppFlowResponse,
  WhatsAppFlowVersion,
  WhatsAppFlowValidationError
} from '../../lib/whatsappTypes';
import { getAuthHeaders } from '../../lib/frontendAuth';

export interface FlowsStudioProps {
  userSession?: any;
}

const FLOW_CATEGORIES: { id: WhatsAppFlowCategory; label: string; desc: string }[] = [
  { id: 'LEAD_GENERATION', label: 'Lead Generation', desc: 'Capture customer contact details and quote requests' },
  { id: 'APPOINTMENT_BOOKING', label: 'Appointment Booking', desc: 'Allow customers to pick services, dates and time slots' },
  { id: 'SURVEY', label: 'Survey & Feedback', desc: 'Collect CSAT ratings, NPS, reviews and opinions' },
  { id: 'SIGN_UP', label: 'Registration & RSVP', desc: 'Event, webinar, or account registrations' },
  { id: 'SIGN_IN', label: 'Sign In / Verification', desc: 'Quick customer identification or login verification' },
  { id: 'CONTACT_US', label: 'Contact Us', desc: 'Customer inquiries, inquiries and general outreach' },
  { id: 'CUSTOMER_SUPPORT', label: 'Customer Support', desc: 'Troubleshooting and support tickets submission' },
  { id: 'OTHER', label: 'Custom Workflow', desc: 'Flexible multi-screen business workflow' },
];

const COMPONENT_PALETTE: {
  type: FlowComponentType;
  label: string;
  category: 'text' | 'input' | 'select' | 'action';
  icon: any;
  defaultProps: Partial<FlowComponent>;
}[] = [
  {
    type: 'TextHeading',
    label: 'Heading',
    category: 'text',
    icon: Type,
    defaultProps: { text: 'Screen Heading Title' },
  },
  {
    type: 'TextSubheading',
    label: 'Subheading',
    category: 'text',
    icon: Type,
    defaultProps: { text: 'Detailed Section Subtitle' },
  },
  {
    type: 'TextBody',
    label: 'Body Text',
    category: 'text',
    icon: AlignLeft,
    defaultProps: { text: 'Provide clear instructions or context for the customer here.' },
  },
  {
    type: 'TextCaption',
    label: 'Caption Note',
    category: 'text',
    icon: AlignLeft,
    defaultProps: { text: 'Terms & conditions apply. Response is encrypted.' },
  },
  {
    type: 'TextInput',
    label: 'Text Input',
    category: 'input',
    icon: Type,
    defaultProps: {
      name: 'input_field',
      label: 'Your Answer',
      required: true,
      'input-type': 'text',
      'helper-text': 'Enter text',
    },
  },
  {
    type: 'TextArea',
    label: 'Text Area',
    category: 'input',
    icon: AlignLeft,
    defaultProps: {
      name: 'message_details',
      label: 'Detailed Information',
      required: false,
      'helper-text': 'Type your message or notes here...',
    },
  },
  {
    type: 'Dropdown',
    label: 'Dropdown Menu',
    category: 'select',
    icon: ListFilter,
    defaultProps: {
      name: 'selected_choice',
      label: 'Select an Option',
      required: true,
      'data-source': [
        { id: 'opt_1', title: 'Option 1', description: 'First option description' },
        { id: 'opt_2', title: 'Option 2', description: 'Second option description' },
      ],
    },
  },
  {
    type: 'RadioButtonsGroup',
    label: 'Radio Options',
    category: 'select',
    icon: Radio,
    defaultProps: {
      name: 'radio_choice',
      label: 'Choose One Option',
      required: true,
      'data-source': [
        { id: 'choice_a', title: 'Choice A' },
        { id: 'choice_b', title: 'Choice B' },
        { id: 'choice_c', title: 'Choice C' },
      ],
    },
  },
  {
    type: 'CheckboxGroup',
    label: 'Checkboxes',
    category: 'select',
    icon: CheckSquare,
    defaultProps: {
      name: 'multi_selection',
      label: 'Select All That Apply',
      required: false,
      'data-source': [
        { id: 'item_1', title: 'Feature 1' },
        { id: 'item_2', title: 'Feature 2' },
        { id: 'item_3', title: 'Feature 3' },
      ],
    },
  },
  {
    type: 'DatePicker',
    label: 'Date Picker',
    category: 'input',
    icon: Calendar,
    defaultProps: {
      name: 'selected_date',
      label: 'Select Date',
    },
  },
  {
    type: 'OptIn',
    label: 'Consent Opt-In',
    category: 'select',
    icon: ToggleLeft,
    defaultProps: {
      name: 'opt_in_consent',
      label: 'I agree to receive updates via WhatsApp',
    },
  },
  {
    type: 'Footer',
    label: 'Footer / Action Button',
    category: 'action',
    icon: CornerDownRight,
    defaultProps: {
      label: 'Submit',
      'on-click-action': {
        name: 'complete',
        payload: {},
      },
    },
  },
];

// ── Pre-built Flow Templates Library ──
const PRESET_FLOW_TEMPLATES: {
  id: string;
  name: string;
  category: WhatsAppFlowCategory;
  description: string;
  flow_json: FlowJSON;
}[] = [
  {
    id: 'lead_capture_quote',
    name: 'Lead Capture & Quote',
    category: 'LEAD_GENERATION',
    description: 'Capture name, email, phone number, and project budget with high-converting native WhatsApp form.',
    flow_json: {
      version: '6.0',
      screens: [
        {
          id: 'LEAD_FORM',
          title: 'Request a Quote',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Get Your Personalized Quote' },
              { type: 'TextBody', text: 'Please complete the details below so our specialists can prepare your proposal.' },
              { type: 'TextInput', name: 'full_name', label: 'Full Name', required: true, 'input-type': 'text' },
              { type: 'TextInput', name: 'email', label: 'Work Email Address', required: true, 'input-type': 'email' },
              { type: 'TextInput', name: 'phone', label: 'Phone Number', required: false, 'input-type': 'phone' },
              {
                type: 'Dropdown',
                name: 'budget_range',
                label: 'Estimated Budget',
                required: true,
                'data-source': [
                  { id: 'tier_1', title: '$1,000 - $5,000', description: 'Starter project' },
                  { id: 'tier_2', title: '$5,000 - $20,000', description: 'Growth project' },
                  { id: 'tier_3', title: '$20,000+', description: 'Enterprise solution' },
                ],
              },
              { type: 'OptIn', name: 'consent_contact', label: 'Yes, contact me on WhatsApp regarding this request' },
              {
                type: 'Footer',
                label: 'Submit Quote Request',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    full_name: '${form.full_name}',
                    email: '${form.email}',
                    phone: '${form.phone}',
                    budget: '${form.budget_range}',
                    consent: '${form.consent_contact}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'appointment_booking_2screens',
    name: 'Appointment & Booking (Multi-Screen)',
    category: 'APPOINTMENT_BOOKING',
    description: 'Multi-screen flow where customers pick a service on screen 1, then choose appointment date on screen 2.',
    flow_json: {
      version: '6.0',
      screens: [
        {
          id: 'SELECT_SERVICE',
          title: 'Step 1: Choose Service',
          terminal: false,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Select Your Service' },
              { type: 'TextBody', text: 'Choose the consulting session or service you would like to book.' },
              {
                type: 'RadioButtonsGroup',
                name: 'service_choice',
                label: 'Available Services',
                required: true,
                'data-source': [
                  { id: 'strategy_consult', title: '1-on-1 Strategy Session (45 min)' },
                  { id: 'tech_onboarding', title: 'Technical Integration Review (60 min)' },
                  { id: 'account_audit', title: 'Account Performance Audit (30 min)' },
                ],
              },
              {
                type: 'Footer',
                label: 'Continue to Date & Time',
                'on-click-action': {
                  name: 'navigate',
                  next: { type: 'screen', name: 'PICK_DATE' },
                  payload: {
                    chosen_service: '${form.service_choice}',
                  },
                },
              },
            ],
          },
        },
        {
          id: 'PICK_DATE',
          title: 'Step 2: Pick Date',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Pick Date & Confirm' },
              { type: 'TextBody', text: 'Select your preferred appointment date.' },
              { type: 'DatePicker', name: 'booking_date', label: 'Appointment Date' },
              {
                type: 'Dropdown',
                name: 'time_slot',
                label: 'Preferred Time of Day',
                required: true,
                'data-source': [
                  { id: 'morning', title: 'Morning (09:00 - 12:00)' },
                  { id: 'afternoon', title: 'Afternoon (13:00 - 17:00)' },
                  { id: 'evening', title: 'Evening (18:00 - 20:00)' },
                ],
              },
              { type: 'TextInput', name: 'attendee_name', label: 'Your Name', required: true, 'input-type': 'text' },
              {
                type: 'Footer',
                label: 'Confirm Appointment',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    service: '${screen.SELECT_SERVICE.form.service_choice}',
                    booking_date: '${form.booking_date}',
                    time_slot: '${form.time_slot}',
                    attendee_name: '${form.attendee_name}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'csat_survey',
    name: 'Customer Feedback & CSAT',
    category: 'SURVEY',
    description: 'Collect 5-star ratings, qualitative feedback comments, and follow-up consent in seconds.',
    flow_json: {
      version: '6.0',
      screens: [
        {
          id: 'SURVEY_FORM',
          title: 'Feedback Survey',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'How did we do?' },
              { type: 'TextBody', text: 'Your feedback helps us make your experience even better.' },
              {
                type: 'RadioButtonsGroup',
                name: 'rating',
                label: 'Overall Satisfaction',
                required: true,
                'data-source': [
                  { id: 'rating_5', title: '⭐⭐⭐⭐⭐ Excellent' },
                  { id: 'rating_4', title: '⭐⭐⭐⭐ Good' },
                  { id: 'rating_3', title: '⭐⭐⭐ Average' },
                  { id: 'rating_2', title: '⭐⭐ Poor' },
                  { id: 'rating_1', title: '⭐ Terrible' },
                ],
              },
              { type: 'TextArea', name: 'comments', label: 'What could we improve?', required: false },
              { type: 'OptIn', name: 'followup_ok', label: 'I agree to be contacted if needed' },
              {
                type: 'Footer',
                label: 'Submit Feedback',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    rating: '${form.rating}',
                    comments: '${form.comments}',
                    followup: '${form.followup_ok}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'event_rsvp',
    name: 'Webinar & Event RSVP',
    category: 'SIGN_UP',
    description: 'Fast registration flow with job title, company size, and guest count.',
    flow_json: {
      version: '6.0',
      screens: [
        {
          id: 'RSVP_SCREEN',
          title: 'Reserve Your Seat',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Live Webinar RSVP' },
              { type: 'TextBody', text: 'Save your spot for our upcoming live masterclass on WhatsApp automation.' },
              { type: 'TextInput', name: 'attendee_name', label: 'Full Name', required: true, 'input-type': 'text' },
              { type: 'TextInput', name: 'work_email', label: 'Work Email', required: true, 'input-type': 'email' },
              { type: 'TextInput', name: 'company', label: 'Company / Organization', required: false, 'input-type': 'text' },
              {
                type: 'RadioButtonsGroup',
                name: 'session_time',
                label: 'Select Session Time',
                required: true,
                'data-source': [
                  { id: 'session_am', title: 'Thursday 10:00 AM EST' },
                  { id: 'session_pm', title: 'Thursday 4:00 PM EST' },
                ],
              },
              {
                type: 'Footer',
                label: 'Reserve My Spot',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    name: '${form.attendee_name}',
                    email: '${form.work_email}',
                    company: '${form.company}',
                    session: '${form.session_time}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'support_ticket',
    name: 'Support Ticket / Contact Us',
    category: 'CONTACT_US',
    description: 'Structured ticket submission with issue categorization, severity rating, and problem description.',
    flow_json: {
      version: '6.0',
      screens: [
        {
          id: 'TICKET_SCREEN',
          title: 'Submit Support Ticket',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Need Assistance?' },
              { type: 'TextBody', text: 'Submit your issue and our technical team will review and reply within 1 business hour.' },
              {
                type: 'Dropdown',
                name: 'category',
                label: 'Issue Category',
                required: true,
                'data-source': [
                  { id: 'billing', title: 'Billing & Payments' },
                  { id: 'integration', title: 'API & Webhooks' },
                  { id: 'meta_verification', title: 'Meta WABA Verification' },
                  { id: 'bug', title: 'Bug Report / Feature Request' },
                ],
              },
              {
                type: 'RadioButtonsGroup',
                name: 'priority',
                label: 'Priority Level',
                required: true,
                'data-source': [
                  { id: 'p3_low', title: '🟢 Low - General inquiry' },
                  { id: 'p2_medium', title: '🟡 Medium - Feature degraded' },
                  { id: 'p1_urgent', title: '🔴 High - Critical outage' },
                ],
              },
              { type: 'TextArea', name: 'description', label: 'Detailed Description of Problem', required: true },
              {
                type: 'Footer',
                label: 'Submit Support Ticket',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    category: '${form.category}',
                    priority: '${form.priority}',
                    description: '${form.description}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'data_exchange_endpoint',
    name: 'Data Exchange Dynamic Flow',
    category: 'OTHER',
    description: 'Advanced flow powered by a custom HTTPS server endpoint with dynamic screen evaluation.',
    flow_json: {
      version: '6.0',
      data_api_version: '3.0',
      routing_model: {
        LOOKUP_SCREEN: ['CONFIRM_SCREEN'],
        CONFIRM_SCREEN: [],
      },
      screens: [
        {
          id: 'LOOKUP_SCREEN',
          title: 'Account Lookup',
          terminal: false,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Dynamic Account Verification' },
              { type: 'TextBody', text: 'Enter your Customer ID to dynamically fetch balance and status from your server.' },
              { type: 'TextInput', name: 'customer_id', label: 'Customer ID / Order #', required: true, 'input-type': 'text' },
              {
                type: 'Footer',
                label: 'Fetch Details from Server',
                'on-click-action': {
                  name: 'data_exchange',
                  payload: {
                    customer_id: '${form.customer_id}',
                  },
                },
              },
            ],
          },
        },
        {
          id: 'CONFIRM_SCREEN',
          title: 'Confirm Action',
          terminal: true,
          success: true,
          refresh_on_back: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Verification Completed' },
              { type: 'TextBody', text: 'Server returned updated details.' },
              {
                type: 'Footer',
                label: 'Finalize Transaction',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    customer_id: '${screen.LOOKUP_SCREEN.form.customer_id}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
];

export const FlowsStudio: React.FC<FlowsStudioProps> = () => {
  // ── Flows State ──
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // ── Banners & Notifications ──
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // ── Modals State ──
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isResponsesOpen, setIsResponsesOpen] = useState<boolean>(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState<boolean>(false);

  // ── Active Flow In Builder ──
  const [editingFlow, setEditingFlow] = useState<WhatsAppFlow | null>(null);
  const [builderScreens, setBuilderScreens] = useState<FlowScreen[]>([]);
  const [activeScreenIndex, setActiveScreenIndex] = useState<number>(0);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null);
  const [builderTab, setBuilderTab] = useState<'visual' | 'code' | 'endpoint'>('visual');
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'simulator' | 'json'>('inspector');
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [endpointUri, setEndpointUri] = useState<string>('');

  // ── Simulator Interactive State ──
  const [simScreenId, setSimScreenId] = useState<string>('');
  const [simFormState, setSimFormState] = useState<Record<string, any>>({});
  const [simScreenHistory, setSimScreenHistory] = useState<string[]>([]);
  const [simCompleted, setSimCompleted] = useState<boolean>(false);
  const [simSubmittedPayload, setSimSubmittedPayload] = useState<any>(null);

  // ── Send Test Flow State ──
  const [sendTargetFlow, setSendTargetFlow] = useState<WhatsAppFlow | null>(null);
  const [sendRecipient, setSendRecipient] = useState<string>('+13105551234');
  const [sendCta, setSendCta] = useState<string>('Open Form');
  const [sendMessageBody, setSendMessageBody] = useState<string>('Please fill out this form to continue.');
  const [sendIsDraft, setSendIsDraft] = useState<boolean>(true);
  const [isSendingFlow, setIsSendingFlow] = useState<boolean>(false);
  const [sendResultMsg, setSendResultMsg] = useState<string | null>(null);

  // ── Responses State ──
  const [responseTargetFlow, setResponseTargetFlow] = useState<WhatsAppFlow | null>(null);
  const [responsesList, setResponsesList] = useState<WhatsAppFlowResponse[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState<boolean>(false);
  const [isSimulatingResponse, setIsSimulatingResponse] = useState<boolean>(false);

  // ── Versions State ──
  const [versionTargetFlow, setVersionTargetFlow] = useState<WhatsAppFlow | null>(null);
  const [versionsList, setVersionsList] = useState<WhatsAppFlowVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);

  // ── Copy Feedback ──
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // ── Fetch Flows from Backend ──
  const loadFlows = async (sync = false) => {
    if (sync) setIsSyncing(true);
    else setIsLoading(true);
    setErrorBanner(null);

    try {
      const res = await fetch(`/api/whatsapp/flows${sync ? '?sync=true' : ''}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load WhatsApp flows');
      }
      setFlows(Array.isArray(data.data) ? data.data : []);
      if (sync) {
        setSuccessBanner('Flows synced live from Meta WhatsApp Business API.');
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err: any) {
      console.error('[loadFlows error]:', err);
      setErrorBanner(err.message || 'Error fetching WhatsApp flows.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    const total = flows.length;
    const published = flows.filter(f => f.status === 'PUBLISHED').length;
    const drafts = flows.filter(f => f.status === 'DRAFT').length;
    const deprecated = flows.filter(f => f.status === 'DEPRECATED').length;
    return { total, published, drafts, deprecated };
  }, [flows]);

  // ── Filtered Flows List ──
  const filteredFlows = useMemo(() => {
    return flows.filter(f => {
      const matchesSearch = searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.includes(searchQuery.trim());
      const matchesCat = selectedCategory === 'ALL' || f.categories.includes(selectedCategory as any);
      const matchesStatus = selectedStatus === 'ALL' || f.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [flows, searchQuery, selectedCategory, selectedStatus]);

  // ── Open Visual Builder ──
  const openFlowBuilder = (flow?: WhatsAppFlow) => {
    if (flow) {
      const matchedTemplate = PRESET_FLOW_TEMPLATES.find(t => t.category === (flow.categories?.[0] || 'LEAD_GENERATION')) || PRESET_FLOW_TEMPLATES[0];
      const currentJson = flow.flow_json || matchedTemplate.flow_json;
      const screens = currentJson.screens || [];
      setBuilderScreens(screens);
      setActiveScreenIndex(0);
      setSelectedComponentIndex(null);
      setEndpointUri(flow.endpoint_uri || '');
      setRawJsonText(JSON.stringify(currentJson, null, 2));
      initSimulator(screens, 0);
    } else {
      // New Flow
      const defaultScreens: FlowScreen[] = [
        {
          id: 'LEAD_FORM',
          title: 'Get a Quote',
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextHeading', text: 'Welcome to Our Service' },
              { type: 'TextBody', text: 'Please enter your information below.' },
              { type: 'TextInput', name: 'full_name', label: 'Full Name', required: true, 'input-type': 'text' },
              { type: 'TextInput', name: 'email', label: 'Email Address', required: true, 'input-type': 'email' },
              {
                type: 'Footer',
                label: 'Submit Form',
                'on-click-action': {
                  name: 'complete',
                  payload: {
                    full_name: '${form.full_name}',
                    email: '${form.email}',
                  },
                },
              },
            ],
          },
        },
      ];

      const newFlow: WhatsAppFlow = {
        id: `draft_${Date.now()}`,
        name: 'new_flow_lead_capture',
        status: 'DRAFT',
        categories: ['LEAD_GENERATION'],
        version: 1,
        flow_json: {
          version: '6.0',
          screens: defaultScreens,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEditingFlow(newFlow);
      setBuilderScreens(defaultScreens);
      setActiveScreenIndex(0);
      setSelectedComponentIndex(null);
      setEndpointUri('');
      setRawJsonText(JSON.stringify({ version: '6.0', screens: defaultScreens }, null, 2));
      initSimulator(defaultScreens, 0);
    }

    setBuilderTab('visual');
    setRightPanelTab('inspector');
    setIsBuilderOpen(true);
  };

  // ── Apply Template from Library ──
  const applyPresetTemplate = (template: typeof PRESET_FLOW_TEMPLATES[0]) => {
    const screens = template.flow_json.screens;
    const newFlow: WhatsAppFlow = {
      id: `draft_${Date.now()}`,
      name: template.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40),
      status: 'DRAFT',
      categories: [template.category],
      version: 1,
      flow_json: template.flow_json,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditingFlow(newFlow);
    setBuilderScreens(screens);
    setActiveScreenIndex(0);
    setSelectedComponentIndex(null);
    setEndpointUri('');
    setRawJsonText(JSON.stringify(template.flow_json, null, 2));
    initSimulator(screens, 0);

    setIsLibraryOpen(false);
    setIsBuilderOpen(true);
  };

  // ── Simulator Initializer ──
  const initSimulator = (screens: FlowScreen[], screenIdx = 0) => {
    if (screens.length > 0 && screens[screenIdx]) {
      setSimScreenId(screens[screenIdx].id);
      setSimScreenHistory([screens[screenIdx].id]);
    } else {
      setSimScreenId('');
      setSimScreenHistory([]);
    }
    setSimFormState({});
    setSimCompleted(false);
    setSimSubmittedPayload(null);
  };

  const activeScreen: FlowScreen | undefined = builderScreens[activeScreenIndex];
  const activeComponent: FlowComponent | undefined =
    activeScreen && selectedComponentIndex !== null
      ? activeScreen.layout.children[selectedComponentIndex]
      : undefined;

  // ── Sync Visual Builder to Flow JSON ──
  const currentCompiledJson: FlowJSON = useMemo(() => {
    const base: FlowJSON = {
      version: '6.0',
      screens: builderScreens,
    };
    if (endpointUri.trim()) {
      base.data_api_version = '3.0';
    }
    return base;
  }, [builderScreens, endpointUri]);

  // Keep rawJsonText synced when builderScreens changes while in visual mode
  useEffect(() => {
    if (builderTab === 'visual') {
      setRawJsonText(JSON.stringify(currentCompiledJson, null, 2));
    }
  }, [currentCompiledJson, builderTab]);

  // ── Screen Management Handlers ──
  const addScreen = () => {
    const newScreenId = `SCREEN_${builderScreens.length + 1}`;
    const newScreen: FlowScreen = {
      id: newScreenId,
      title: `Screen ${builderScreens.length + 1}`,
      terminal: false,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextHeading', text: `Screen ${builderScreens.length + 1} Heading` },
          { type: 'TextBody', text: 'Configure inputs and components for this screen.' },
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': {
              name: 'complete',
              payload: {},
            },
          },
        ],
      },
    };
    const updated = [...builderScreens, newScreen];
    setBuilderScreens(updated);
    setActiveScreenIndex(updated.length - 1);
    setSelectedComponentIndex(null);
  };

  const removeScreen = (idx: number) => {
    if (builderScreens.length <= 1) {
      alert('A Flow must have at least one screen.');
      return;
    }
    const updated = builderScreens.filter((_, i) => i !== idx);
    setBuilderScreens(updated);
    setActiveScreenIndex(Math.max(0, idx - 1));
    setSelectedComponentIndex(null);
  };

  const updateScreenProperty = (key: keyof FlowScreen, val: any) => {
    if (!activeScreen) return;
    const updated = [...builderScreens];
    updated[activeScreenIndex] = {
      ...updated[activeScreenIndex],
      [key]: val,
    };
    setBuilderScreens(updated);
  };

  // ── Component Management Handlers ──
  const addComponentToActiveScreen = (paletteItem: typeof COMPONENT_PALETTE[0]) => {
    if (!activeScreen) return;
    const newComponent: FlowComponent = {
      type: paletteItem.type,
      ...JSON.parse(JSON.stringify(paletteItem.defaultProps)),
    };
    // Ensure unique name for input components
    if (newComponent.name) {
      newComponent.name = `${newComponent.name}_${Date.now().toString().slice(-4)}`;
    }

    const updatedChildren = [...activeScreen.layout.children];
    // Insert before footer if footer exists
    const footerIdx = updatedChildren.findIndex(c => c.type === 'Footer');
    if (footerIdx !== -1 && newComponent.type !== 'Footer') {
      updatedChildren.splice(footerIdx, 0, newComponent);
      setSelectedComponentIndex(footerIdx);
    } else {
      updatedChildren.push(newComponent);
      setSelectedComponentIndex(updatedChildren.length - 1);
    }

    updateScreenProperty('layout', {
      type: 'SingleColumnLayout',
      children: updatedChildren,
    });
  };

  const removeComponent = (compIdx: number) => {
    if (!activeScreen) return;
    const updatedChildren = activeScreen.layout.children.filter((_, i) => i !== compIdx);
    updateScreenProperty('layout', {
      type: 'SingleColumnLayout',
      children: updatedChildren,
    });
    setSelectedComponentIndex(null);
  };

  const moveComponent = (compIdx: number, direction: 'up' | 'down') => {
    if (!activeScreen) return;
    const children = [...activeScreen.layout.children];
    const targetIdx = direction === 'up' ? compIdx - 1 : compIdx + 1;
    if (targetIdx < 0 || targetIdx >= children.length) return;
    const temp = children[compIdx];
    children[compIdx] = children[targetIdx];
    children[targetIdx] = temp;
    updateScreenProperty('layout', {
      type: 'SingleColumnLayout',
      children,
    });
    setSelectedComponentIndex(targetIdx);
  };

  const updateActiveComponent = (patch: Partial<FlowComponent>) => {
    if (!activeScreen || selectedComponentIndex === null) return;
    const updatedChildren = [...activeScreen.layout.children];
    updatedChildren[selectedComponentIndex] = {
      ...updatedChildren[selectedComponentIndex],
      ...patch,
    };
    updateScreenProperty('layout', {
      type: 'SingleColumnLayout',
      children: updatedChildren,
    });
  };

  // ── Raw JSON Mode Application ──
  const applyRawJsonToVisual = () => {
    try {
      setJsonParseError(null);
      const parsed = JSON.parse(rawJsonText);
      if (!parsed.screens || !Array.isArray(parsed.screens) || parsed.screens.length === 0) {
        throw new Error("Flow JSON must contain a non-empty 'screens' array.");
      }
      setBuilderScreens(parsed.screens);
      setActiveScreenIndex(0);
      setSelectedComponentIndex(null);
      setBuilderTab('visual');
      initSimulator(parsed.screens, 0);
      setSuccessBanner('Flow JSON successfully validated and loaded into visual canvas.');
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (e: any) {
      setJsonParseError(e.message || 'Invalid JSON syntax');
    }
  };

  // ── Save Flow to Supabase / Backend ──
  const handleSaveFlow = async (isNewDraft = false) => {
    if (!editingFlow) return;
    setIsSaving(true);
    setErrorBanner(null);

    try {
      const flowJsonToSave = currentCompiledJson;

      if (isNewDraft || editingFlow.id.startsWith('draft_')) {
        // Create new flow
        const payload = {
          name: editingFlow.name,
          categories: editingFlow.categories,
          flow_json: flowJsonToSave,
          endpointUri: endpointUri.trim() || undefined,
        };
        const res = await fetch('/api/whatsapp/flows', {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create flow');
        }
        setEditingFlow(data.flow);
        setSuccessBanner(`Flow "${data.flow.name}" successfully created!`);
      } else {
        // Update existing flow JSON
        const res = await fetch(`/api/whatsapp/flows/${editingFlow.id}/json`, {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flow_json: flowJsonToSave,
            endpoint_uri: endpointUri.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update Flow JSON');
        }
        setSuccessBanner('Flow JSON uploaded and saved successfully.');
      }

      await loadFlows();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      console.error('[handleSaveFlow error]:', err);
      setErrorBanner(err.message || 'Error saving flow');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Publish Flow ──
  const handlePublishFlow = async (flowId?: string) => {
    const targetId = flowId || editingFlow?.id;
    if (!targetId) return;

    if (!confirm('Are you sure you want to publish this Flow?\n\nPublishing makes the Flow LIVE and IMMUTABLE per Meta specifications. Any future changes will require cloning into a new version.')) {
      return;
    }

    setIsPublishing(true);
    setErrorBanner(null);

    try {
      // If inside builder and unsaved, save first
      if (isBuilderOpen && editingFlow) {
        await handleSaveFlow();
      }

      const res = await fetch(`/api/whatsapp/flows/${targetId}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish flow');
      }

      setSuccessBanner('Flow successfully published! It is now live and ready to send to WhatsApp users.');
      if (editingFlow && editingFlow.id === targetId) {
        setEditingFlow({ ...editingFlow, status: 'PUBLISHED' });
      }
      await loadFlows();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      console.error('[handlePublishFlow error]:', err);
      setErrorBanner(err.message || 'Error publishing flow');
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Clone Flow as New Version ──
  const handleCloneVersion = async (flow: WhatsAppFlow) => {
    try {
      setIsLoading(true);
      setErrorBanner(null);
      const res = await fetch('/api/whatsapp/flows', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flow.name,
          categories: flow.categories,
          cloneFlowId: flow.id,
          asVersion: true,
          flow_json: flow.flow_json,
          endpointUri: flow.endpoint_uri,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clone new version');
      }

      setSuccessBanner(`Created new draft version (v${data.flow.version || 2}) for "${flow.name}".`);
      await loadFlows();
      openFlowBuilder(data.flow);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error creating new version');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Deprecate Flow ──
  const handleDeprecateFlow = async (flowId: string) => {
    if (!confirm('Deprecating a flow makes it permanently unsendable to customers. Do you want to continue?')) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/whatsapp/flows/${flowId}/deprecate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deprecate flow');
      }
      setSuccessBanner('Flow marked as DEPRECATED.');
      await loadFlows();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (e: any) {
      setErrorBanner(e.message || 'Error deprecating flow');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete Flow ──
  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this draft flow? This action cannot be undone.')) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/whatsapp/flows/${flowId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete flow');
      }
      setSuccessBanner('Draft flow deleted successfully.');
      await loadFlows();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (e: any) {
      setErrorBanner(e.message || 'Error deleting flow');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Open Test Send Modal ──
  const openSendModal = (flow: WhatsAppFlow) => {
    setSendTargetFlow(flow);
    setSendCta('Open Form');
    setSendMessageBody(`Fill out the ${flow.name.replace(/_/g, ' ')} form on WhatsApp.`);
    setSendIsDraft(flow.status === 'DRAFT');
    setSendResultMsg(null);
    setIsSendModalOpen(true);
  };

  const handleSendTestFlow = async () => {
    if (!sendTargetFlow) return;
    setIsSendingFlow(true);
    setSendResultMsg(null);

    try {
      const res = await fetch('/api/whatsapp/flows/send', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: sendRecipient.trim(),
          flow_id: sendTargetFlow.id,
          flow_cta: sendCta,
          flow_action: sendTargetFlow.endpoint_uri ? 'data_exchange' : 'navigate',
          body: sendMessageBody,
          draft: sendIsDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send WhatsApp flow');
      }
      setSendResultMsg(`Flow successfully sent! Message ID: ${data.messageId}`);
    } catch (err: any) {
      setSendResultMsg(`Error: ${err.message}`);
    } finally {
      setIsSendingFlow(false);
    }
  };

  // ── View Responses Drawer ──
  const openResponsesDrawer = async (flow: WhatsAppFlow) => {
    setResponseTargetFlow(flow);
    setIsResponsesOpen(true);
    setIsLoadingResponses(true);
    try {
      const res = await fetch(`/api/whatsapp/flows/${flow.id}/responses`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setResponsesList(Array.isArray(data.responses) ? data.responses : []);
    } catch (e) {
      console.error('[fetch responses error]:', e);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleSimulateResponse = async () => {
    if (!responseTargetFlow) return;
    setIsSimulatingResponse(true);
    try {
      const mockPayload: Record<string, any> = {
        full_name: 'Alex Johnson',
        email: 'alex.j@example.com',
        phone: '+13105559876',
        submission_source: 'WhatsApp Mobile Flow Test',
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(`/api/whatsapp/flows/${responseTargetFlow.id}/responses`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_phone: '+13105559876',
          sender_name: 'Alex Johnson',
          data: mockPayload,
        }),
      });
      const data = await res.json();
      if (data.response) {
        setResponsesList([data.response, ...responsesList]);
        setSuccessBanner('Simulated test customer submission recorded!');
        setTimeout(() => setSuccessBanner(null), 3000);
      }
    } catch (e: any) {
      alert('Error simulating response: ' + e.message);
    } finally {
      setIsSimulatingResponse(false);
    }
  };

  // ── View Versions Lineage ──
  const openVersionsModal = async (flow: WhatsAppFlow) => {
    setVersionTargetFlow(flow);
    setIsVersionsOpen(true);
    setIsLoadingVersions(true);
    try {
      const res = await fetch(`/api/whatsapp/flows/${flow.id}/versions`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setVersionsList(Array.isArray(data.versions) ? data.versions : []);
    } catch (e) {
      console.error('[fetch versions error]:', e);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // ── Simulator Interactive Step Logic ──
  const currentSimScreen = useMemo(() => {
    return builderScreens.find(s => s.id === simScreenId) || builderScreens[0];
  }, [builderScreens, simScreenId]);

  const handleSimFooterClick = (action: any) => {
    if (!action) return;

    if (action.name === 'navigate' && action.next?.name) {
      const targetScreenName = action.next.name;
      const targetExists = builderScreens.some(s => s.id === targetScreenName);
      if (targetExists) {
        setSimScreenId(targetScreenName);
        setSimScreenHistory([...simScreenHistory, targetScreenName]);
      } else {
        alert(`Target screen '${targetScreenName}' not found in Flow screens.`);
      }
    } else if (action.name === 'complete') {
      // Resolve payload tokens like ${form.field}
      const resolvedPayload: Record<string, any> = {};
      const payloadMap = action.payload || {};
      for (const [k, v] of Object.entries(payloadMap)) {
        if (typeof v === 'string' && v.startsWith('${form.') && v.endsWith('}')) {
          const fieldName = v.slice(7, -1);
          resolvedPayload[k] = simFormState[fieldName] ?? '';
        } else {
          resolvedPayload[k] = v;
        }
      }
      setSimSubmittedPayload({ ...simFormState, ...resolvedPayload });
      setSimCompleted(true);
    } else if (action.name === 'data_exchange') {
      alert(`[Data Exchange Simulator]: POST to ${endpointUri || 'https://example.com/flow-endpoint'} with payload: \n` + JSON.stringify(simFormState, null, 2));
      setSimSubmittedPayload(simFormState);
      setSimCompleted(true);
    }
  };

  const handleSimBack = () => {
    if (simScreenHistory.length > 1) {
      const updatedHistory = [...simScreenHistory];
      updatedHistory.pop();
      const prevScreenId = updatedHistory[updatedHistory.length - 1];
      setSimScreenId(prevScreenId);
      setSimScreenHistory(updatedHistory);
    }
  };

  const copyFlowJson = () => {
    navigator.clipboard.writeText(rawJsonText);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const downloadFlowJson = () => {
    const blob = new Blob([rawJsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editingFlow?.name || 'whatsapp_flow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ── Banners ── */}
      {errorBanner && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="hover:text-red-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="hover:text-emerald-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <GitBranch size={19} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">WhatsApp Flows Studio</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Design native multi-screen forms, surveys &amp; bookings directly inside WhatsApp with Meta Flow JSON v6.0.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadFlows(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
            title="Sync with live Meta WABA"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-600' : ''} />
            <span>Sync Meta</span>
          </button>

          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-xs"
          >
            <BookOpen size={13} className="text-purple-600" />
            <span>Template Library</span>
          </button>

          <button
            onClick={() => openFlowBuilder()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#07301f] bg-[#00D084] rounded-xl hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>+ Create Flow</span>
          </button>
        </div>
      </div>

      {/* ── Stats Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Flows</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{metrics.total}</span>
            <GitBranch size={16} className="text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Published &amp; Live</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{metrics.published}</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Drafts In Progress</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">{metrics.drafts}</span>
            <Sliders size={16} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Meta Flow JSON</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-600">v6.0</span>
            <Code size={16} className="text-indigo-400" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search flows by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {FLOW_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DEPRECATED">DEPRECATED</option>
          </select>
        </div>
      </div>

      {/* ── Flows Grid List ── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading your WhatsApp flows...</p>
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-3 border border-emerald-100">
            <GitBranch size={26} />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">No WhatsApp Flows Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Create interactive lead forms, customer satisfaction surveys, or booking workflows to engage customers natively inside WhatsApp.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-all"
            >
              Browse Template Library
            </button>
            <button
              onClick={() => openFlowBuilder()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#07301f] bg-[#00D084] hover:bg-[#00be77] cursor-pointer transition-all shadow-xs"
            >
              + Create Blank Flow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlows.map(flow => {
            const screensCount = flow.flow_json?.screens?.length || 1;
            const isPublished = flow.status === 'PUBLISHED';
            const isDraft = flow.status === 'DRAFT';

            return (
              <div
                key={flow.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm tracking-tight">{flow.name}</h3>
                        <span className="text-[10px] font-semibold text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                          v{flow.version || 1}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">ID: {flow.id}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDraft
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {flow.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {flow.categories.map((cat, i) => (
                      <span key={i} className="text-[10px] bg-emerald-50/70 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                        {cat.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {flow.endpoint_uri && (
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <Server size={10} />
                        <span>Data Exchange</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Screens</span>
                      <span className="font-semibold text-gray-800">{screensCount} {screensCount === 1 ? 'Screen' : 'Screens'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Submissions</span>
                      <button
                        onClick={() => openResponsesDrawer(flow)}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 underline text-xs cursor-pointer"
                      >
                        View Responses
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Card Action Buttons ── */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openFlowBuilder(flow)}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      {isPublished ? 'View Builder' : 'Edit Flow'}
                    </button>

                    <button
                      onClick={() => openSendModal(flow)}
                      className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                      title="Send Test Flow Message"
                    >
                      <Send size={15} />
                    </button>

                    <button
                      onClick={() => openVersionsModal(flow)}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                      title="View Version History"
                    >
                      <Layers size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {isPublished ? (
                      <>
                        <button
                          onClick={() => handleCloneVersion(flow)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all cursor-pointer"
                          title="Clone to new draft version"
                        >
                          + New Ver
                        </button>
                        <button
                          onClick={() => handleDeprecateFlow(flow.id)}
                          className="p-1 text-gray-400 hover:text-amber-600 rounded-lg transition-all cursor-pointer"
                          title="Deprecate Flow"
                        >
                          <ShieldAlert size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePublishFlow(flow.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Delete Draft"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PRE-BUILT TEMPLATES LIBRARY
      ========================================================================= */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">WhatsApp Flow Templates</h3>
                  <p className="text-xs text-gray-500">Pick a battle-tested flow layout to customize and publish in minutes.</p>
                </div>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_FLOW_TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {tmpl.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {tmpl.flow_json.screens.length} {tmpl.flow_json.screens.length === 1 ? 'Screen' : 'Screens'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mt-2">{tmpl.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{tmpl.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {tmpl.flow_json.screens[0]?.layout.children.map((c, i) => (
                        <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {c.type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => applyPresetTemplate(tmpl)}
                    className="mt-5 w-full py-2 bg-[#00D084] text-[#07301f] rounded-xl font-bold text-xs hover:bg-[#00be77] transition-all cursor-pointer"
                  >
                    Use This Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VISUAL FLOW BUILDER & STUDIO (FULL MODAL)
      ========================================================================= */}
      {isBuilderOpen && editingFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* ── Studio Top Bar ── */}
            <div className="px-6 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <GitBranch size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingFlow.name}
                      disabled={editingFlow.status === 'PUBLISHED'}
                      onChange={e => setEditingFlow({ ...editingFlow, name: e.target.value })}
                      className="font-bold text-gray-900 text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none px-1"
                      placeholder="flow_name_here"
                    />
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded">
                      v{editingFlow.version || 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      editingFlow.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {editingFlow.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Meta Flow JSON v6.0 Schema</span>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-gray-200/70 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setBuilderTab('visual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    builderTab === 'visual' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Visual Canvas
                </button>
                <button
                  onClick={() => {
                    setBuilderTab('code');
                    setRawJsonText(JSON.stringify(currentCompiledJson, null, 2));
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    builderTab === 'code' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Raw Flow JSON
                </button>
                <button
                  onClick={() => setBuilderTab('endpoint')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    builderTab === 'endpoint' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Data Endpoint
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {editingFlow.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => handleSaveFlow(false)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
                    >
                      {isSaving ? <Loader2 size={13} className="animate-spin text-emerald-600" /> : <Check size={13} />}
                      <span>Save Draft</span>
                    </button>

                    <button
                      onClick={() => handlePublishFlow()}
                      disabled={isPublishing}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#07301f] bg-[#00D084] rounded-xl hover:bg-[#00be77] transition-all cursor-pointer shadow-xs"
                    >
                      {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>Publish Flow</span>
                    </button>
                  </>
                )}

                {editingFlow.status === 'PUBLISHED' && (
                  <button
                    onClick={() => handleCloneVersion(editingFlow)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Create New Version</span>
                  </button>
                )}

                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Studio Body (3 Columns) ── */}
            {builderTab === 'visual' && (
              <div className="flex-1 flex overflow-hidden">
                {/* ── COLUMN 1: SCREENS NAVIGATOR ── */}
                <div className="w-64 border-r border-gray-200 bg-gray-50/40 p-4 flex flex-col justify-between overflow-y-auto shrink-0">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Flow Screens</span>
                      <button
                        onClick={addScreen}
                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all"
                        title="Add Screen"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {builderScreens.map((screen, idx) => (
                        <div
                          key={screen.id}
                          onClick={() => {
                            setActiveScreenIndex(idx);
                            setSelectedComponentIndex(null);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            activeScreenIndex === idx
                              ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                              : 'bg-white/70 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{screen.id}</span>
                            {screen.terminal && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                Terminal
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 truncate block mt-0.5">
                            {screen.title || 'Untitled Screen'}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {screen.layout?.children?.length || 0} components
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Screen Settings */}
                  {activeScreen && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Screen Settings
                      </span>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Screen ID</label>
                        <input
                          type="text"
                          value={activeScreen.id}
                          onChange={e => updateScreenProperty('id', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Top Bar Title</label>
                        <input
                          type="text"
                          value={activeScreen.title || ''}
                          onChange={e => updateScreenProperty('title', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-gray-700">Terminal Screen</label>
                        <input
                          type="checkbox"
                          checked={!!activeScreen.terminal}
                          onChange={e => updateScreenProperty('terminal', e.target.checked)}
                          className="accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      {builderScreens.length > 1 && (
                        <button
                          onClick={() => removeScreen(activeScreenIndex)}
                          className="w-full py-1 text-[11px] text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer font-medium mt-1"
                        >
                          Delete Screen
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── COLUMN 2: COMPONENT PALETTE & CANVAS ── */}
                <div className="flex-1 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
                  {/* Component Palette Strip */}
                  <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-1.5 overflow-x-auto shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
                      Add Component:
                    </span>
                    {COMPONENT_PALETTE.map((pal, i) => {
                      const Icon = pal.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => addComponentToActiveScreen(pal)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:text-emerald-700 transition-all shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Icon size={12} className="text-emerald-600" />
                          <span>{pal.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Screen Canvas */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
                    {activeScreen ? (
                      <div className="max-w-xl mx-auto space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                          <div>
                            <span className="text-xs font-bold text-gray-900">{activeScreen.id}</span>
                            <span className="text-[11px] text-gray-500 ml-2">SingleColumnLayout</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {activeScreen.layout.children.length} elements
                          </span>
                        </div>

                        {activeScreen.layout.children.length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-xs">
                            Screen is empty. Click any component above to add it.
                          </div>
                        ) : (
                          activeScreen.layout.children.map((comp, compIdx) => {
                            const isSelected = selectedComponentIndex === compIdx;
                            const isFooter = comp.type === 'Footer';

                            return (
                              <div
                                key={compIdx}
                                onClick={() => {
                                  setSelectedComponentIndex(compIdx);
                                  setRightPanelTab('inspector');
                                }}
                                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                                      {comp.type}
                                    </span>
                                    {comp.name && (
                                      <span className="text-[11px] text-gray-500 font-mono font-semibold">
                                        ${`{form.${comp.name}}`}
                                      </span>
                                    )}
                                    {comp.required && (
                                      <span className="text-[10px] text-red-500 font-bold">*Required</span>
                                    )}
                                  </div>

                                  {/* Component Controls */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        moveComponent(compIdx, 'up');
                                      }}
                                      disabled={compIdx === 0}
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        moveComponent(compIdx, 'down');
                                      }}
                                      disabled={compIdx === activeScreen.layout.children.length - 1}
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        removeComponent(compIdx);
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer ml-1"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-2 text-gray-800">
                                  {comp.text && <p className="font-medium">{comp.text}</p>}
                                  {comp.label && (
                                    <p className="font-semibold text-gray-900">
                                      {comp.label}
                                      {isFooter && (
                                        <span className="ml-2 text-[10px] font-normal text-emerald-600">
                                          Action: {comp['on-click-action']?.name || 'complete'}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {comp['data-source'] && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {comp['data-source'].map((item, optI) => (
                                        <span key={optI} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                          {item.title}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs py-12">No active screen selected.</div>
                    )}
                  </div>
                </div>

                {/* ── COLUMN 3: RIGHT PANEL (INSPECTOR, SIMULATOR, JSON) ── */}
                <div className="w-96 flex flex-col bg-white overflow-hidden shrink-0">
                  {/* Right Tab Switcher */}
                  <div className="flex items-center border-b border-gray-200 bg-gray-50/50 p-1.5 gap-1 shrink-0">
                    <button
                      onClick={() => setRightPanelTab('inspector')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        rightPanelTab === 'inspector'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Sliders size={13} />
                      <span>Inspector</span>
                    </button>

                    <button
                      onClick={() => {
                        setRightPanelTab('simulator');
                        initSimulator(builderScreens, activeScreenIndex);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        rightPanelTab === 'simulator'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Smartphone size={13} />
                      <span>Simulator</span>
                    </button>

                    <button
                      onClick={() => setRightPanelTab('json')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        rightPanelTab === 'json'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Code size={13} />
                      <span>JSON View</span>
                    </button>
                  </div>

                  {/* ── TAB 1: COMPONENT PROPERTY INSPECTOR ── */}
                  {rightPanelTab === 'inspector' && (
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
                      {activeComponent ? (
                        <>
                          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-900 text-sm">{activeComponent.type}</span>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                Component Properties
                              </span>
                            </div>
                            <button
                              onClick={() => removeComponent(selectedComponentIndex!)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Delete Component"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Text / Label */}
                          {'text' in activeComponent && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                                Text Content
                              </label>
                              <textarea
                                value={activeComponent.text || ''}
                                onChange={e => updateActiveComponent({ text: e.target.value })}
                                rows={2}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                              />
                            </div>
                          )}

                          {'label' in activeComponent && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                                Label Text
                              </label>
                              <input
                                type="text"
                                value={activeComponent.label || ''}
                                onChange={e => updateActiveComponent({ label: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                              />
                            </div>
                          )}

                          {/* Field Name */}
                          {'name' in activeComponent && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                                Field Identifier (Variable)
                              </label>
                              <input
                                type="text"
                                value={activeComponent.name || ''}
                                onChange={e =>
                                  updateActiveComponent({
                                    name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                                placeholder="client_name"
                              />
                              <span className="text-[10px] text-gray-400 mt-0.5 block">
                                Access via: <code className="text-emerald-700">${`{form.${activeComponent.name || 'field'}}`}</code>
                              </span>
                            </div>
                          )}

                          {/* Input Type */}
                          {activeComponent.type === 'TextInput' && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                                Input Keyboard Type
                              </label>
                              <select
                                value={activeComponent['input-type'] || 'text'}
                                onChange={e => updateActiveComponent({ 'input-type': e.target.value as any })}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="number">Number</option>
                                <option value="phone">Phone Number</option>
                                <option value="password">Password</option>
                              </select>
                            </div>
                          )}

                          {/* Required Toggle */}
                          {'required' in activeComponent && (
                            <div className="flex items-center justify-between pt-1">
                              <label className="text-[11px] font-medium text-gray-700">Required Field</label>
                              <input
                                type="checkbox"
                                checked={!!activeComponent.required}
                                onChange={e => updateActiveComponent({ required: e.target.checked })}
                                className="accent-emerald-600 cursor-pointer"
                              />
                            </div>
                          )}

                          {/* Helper Text */}
                          {'helper-text' in activeComponent && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                                Helper Hint Text
                              </label>
                              <input
                                type="text"
                                value={activeComponent['helper-text'] || ''}
                                onChange={e => updateActiveComponent({ 'helper-text': e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                                placeholder="e.g. Enter your corporate email"
                              />
                            </div>
                          )}

                          {/* Options Data Source */}
                          {'data-source' in activeComponent && (
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-gray-700">Options List</label>
                                <button
                                  onClick={() => {
                                    const opts = activeComponent['data-source'] || [];
                                    const nextIdx = opts.length + 1;
                                    updateActiveComponent({
                                      'data-source': [
                                        ...opts,
                                        { id: `opt_${nextIdx}`, title: `Option ${nextIdx}` },
                                      ],
                                    });
                                  }}
                                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                                >
                                  + Add Option
                                </button>
                              </div>

                              <div className="space-y-1.5">
                                {(activeComponent['data-source'] || []).map((item, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={e => {
                                        const opts = [...(activeComponent['data-source'] || [])];
                                        opts[optIdx] = { ...opts[optIdx], title: e.target.value };
                                        updateActiveComponent({ 'data-source': opts });
                                      }}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none"
                                      placeholder="Option label"
                                    />
                                    <button
                                      onClick={() => {
                                        const opts = (activeComponent['data-source'] || []).filter((_, i) => i !== optIdx);
                                        updateActiveComponent({ 'data-source': opts });
                                      }}
                                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer Action Routing */}
                          {activeComponent.type === 'Footer' && (
                            <div className="space-y-3 pt-3 border-t border-gray-100 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                                Action &amp; Routing
                              </span>

                              <div>
                                <label className="text-[11px] font-semibold text-gray-700 block mb-1">Action Type</label>
                                <select
                                  value={activeComponent['on-click-action']?.name || 'complete'}
                                  onChange={e => {
                                    const actionType = e.target.value as any;
                                    updateActiveComponent({
                                      'on-click-action': {
                                        name: actionType,
                                        next: actionType === 'navigate' ? { type: 'screen', name: builderScreens[1]?.id || '' } : undefined,
                                        payload: activeComponent['on-click-action']?.payload || {},
                                      },
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-xs cursor-pointer"
                                >
                                  <option value="complete">complete (Terminates &amp; Submits Flow)</option>
                                  <option value="navigate">navigate (Goes to Next Screen)</option>
                                  <option value="data_exchange">data_exchange (Posts to Server Endpoint)</option>
                                </select>
                              </div>

                              {activeComponent['on-click-action']?.name === 'navigate' && (
                                <div>
                                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Target Next Screen</label>
                                  <select
                                    value={activeComponent['on-click-action']?.next?.name || ''}
                                    onChange={e => {
                                      updateActiveComponent({
                                        'on-click-action': {
                                          ...activeComponent['on-click-action']!,
                                          next: { type: 'screen', name: e.target.value },
                                        },
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-xs cursor-pointer font-mono"
                                  >
                                    <option value="">Select Screen...</option>
                                    {builderScreens
                                      .filter(s => s.id !== activeScreen.id)
                                      .map(s => (
                                        <option key={s.id} value={s.id}>
                                          {s.id} ({s.title || 'Screen'})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <Sliders size={28} className="mx-auto mb-2 text-gray-300" />
                          <p className="font-medium text-xs text-gray-600">No Component Selected</p>
                          <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
                            Click any element in the center canvas to configure its properties here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 2: INTERACTIVE WHATSAPP PHONE SIMULATOR ── */}
                  {rightPanelTab === 'simulator' && (
                    <div className="flex-1 p-4 bg-gray-100 flex flex-col items-center justify-center overflow-y-auto">
                      {/* Realistic WhatsApp Mobile Frame */}
                      <div className="w-[300px] bg-white rounded-[32px] border-4 border-gray-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
                        {/* WhatsApp Top Header Bar */}
                        <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                            {simScreenHistory.length > 1 && (
                              <button onClick={handleSimBack} className="p-0.5 hover:bg-black/10 rounded cursor-pointer">
                                <ArrowLeft size={16} />
                              </button>
                            )}
                            <div>
                              <h4 className="font-bold text-xs tracking-tight truncate max-w-[170px]">
                                {currentSimScreen?.title || editingFlow.name}
                              </h4>
                              <span className="text-[9px] text-emerald-200 block">WhatsApp Flow</span>
                            </div>
                          </div>
                          <button
                            onClick={() => initSimulator(builderScreens, 0)}
                            className="p-1 hover:bg-black/10 rounded cursor-pointer"
                            title="Reset Simulator"
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>

                        {/* Simulator Screen Content */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/70 space-y-3.5 text-xs">
                          {simCompleted ? (
                            <div className="p-6 text-center py-12">
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 size={28} />
                              </div>
                              <h4 className="font-bold text-gray-900 text-sm">Flow Completed!</h4>
                              <p className="text-[11px] text-gray-500 mt-1">
                                Native response submitted to WhatsApp conversation.
                              </p>
                              <div className="mt-4 p-2.5 bg-gray-900 text-emerald-400 rounded-xl text-[10px] text-left font-mono overflow-x-auto">
                                <pre>{JSON.stringify(simSubmittedPayload, null, 2)}</pre>
                              </div>
                              <button
                                onClick={() => initSimulator(builderScreens, 0)}
                                className="mt-4 px-3 py-1.5 bg-[#00D084] text-[#07301f] rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Test Again
                              </button>
                            </div>
                          ) : currentSimScreen ? (
                            currentSimScreen.layout.children.map((comp, idx) => {
                              if (comp.type === 'TextHeading') {
                                return <h3 key={idx} className="font-bold text-gray-900 text-sm">{comp.text}</h3>;
                              }
                              if (comp.type === 'TextSubheading') {
                                return <h4 key={idx} className="font-semibold text-gray-800 text-xs">{comp.text}</h4>;
                              }
                              if (comp.type === 'TextBody') {
                                return <p key={idx} className="text-gray-600 text-[11px] leading-relaxed">{comp.text}</p>;
                              }
                              if (comp.type === 'TextCaption') {
                                return <p key={idx} className="text-gray-400 text-[10px] italic">{comp.text}</p>;
                              }
                              if (comp.type === 'TextInput') {
                                return (
                                  <div key={idx} className="space-y-1">
                                    <label className="text-[11px] font-medium text-gray-700 block">
                                      {comp.label || 'Input'} {comp.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                      type={comp['input-type'] || 'text'}
                                      placeholder={comp['helper-text'] || ''}
                                      value={simFormState[comp.name || ''] || ''}
                                      onChange={e =>
                                        setSimFormState({
                                          ...simFormState,
                                          [comp.name || '']: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#075E54]"
                                    />
                                  </div>
                                );
                              }
                              if (comp.type === 'TextArea') {
                                return (
                                  <div key={idx} className="space-y-1">
                                    <label className="text-[11px] font-medium text-gray-700 block">
                                      {comp.label || 'Details'}
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={simFormState[comp.name || ''] || ''}
                                      onChange={e =>
                                        setSimFormState({
                                          ...simFormState,
                                          [comp.name || '']: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                  </div>
                                );
                              }
                              if (comp.type === 'Dropdown') {
                                return (
                                  <div key={idx} className="space-y-1">
                                    <label className="text-[11px] font-medium text-gray-700 block">
                                      {comp.label || 'Select'}
                                    </label>
                                    <select
                                      value={simFormState[comp.name || ''] || ''}
                                      onChange={e =>
                                        setSimFormState({
                                          ...simFormState,
                                          [comp.name || '']: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none cursor-pointer"
                                    >
                                      <option value="">Choose an option...</option>
                                      {(comp['data-source'] || []).map((o, optI) => (
                                        <option key={optI} value={o.id}>{o.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              if (comp.type === 'RadioButtonsGroup') {
                                return (
                                  <div key={idx} className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-gray-700 block">
                                      {comp.label || 'Select One'}
                                    </label>
                                    <div className="space-y-1">
                                      {(comp['data-source'] || []).map((o, optI) => (
                                        <label key={optI} className="flex items-center gap-2 p-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer">
                                          <input
                                            type="radio"
                                            name={comp.name}
                                            value={o.id}
                                            checked={simFormState[comp.name || ''] === o.id}
                                            onChange={e =>
                                              setSimFormState({
                                                ...simFormState,
                                                [comp.name || '']: e.target.value,
                                              })
                                            }
                                            className="accent-[#075E54]"
                                          />
                                          <span className="text-[11px] text-gray-800">{o.title}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              if (comp.type === 'DatePicker') {
                                return (
                                  <div key={idx} className="space-y-1">
                                    <label className="text-[11px] font-medium text-gray-700 block">
                                      {comp.label || 'Date'}
                                    </label>
                                    <input
                                      type="date"
                                      value={simFormState[comp.name || ''] || ''}
                                      onChange={e =>
                                        setSimFormState({
                                          ...simFormState,
                                          [comp.name || '']: e.target.value,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none"
                                    />
                                  </div>
                                );
                              }
                              if (comp.type === 'OptIn') {
                                return (
                                  <label key={idx} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!simFormState[comp.name || '']}
                                      onChange={e =>
                                        setSimFormState({
                                          ...simFormState,
                                          [comp.name || '']: e.target.checked,
                                        })
                                      }
                                      className="accent-[#075E54]"
                                    />
                                    <span className="text-[11px] text-gray-700">{comp.label || 'I agree'}</span>
                                  </label>
                                );
                              }
                              if (comp.type === 'Footer') {
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSimFooterClick(comp['on-click-action'])}
                                    className="w-full mt-3 py-2.5 bg-[#00A884] text-white rounded-xl font-bold text-xs hover:bg-[#008f6f] transition-all cursor-pointer shadow-xs"
                                  >
                                    {comp.label || 'Submit'}
                                  </button>
                                );
                              }
                              return null;
                            })
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 3: LIVE JSON PREVIEW ── */}
                  {rightPanelTab === 'json' && (
                    <div className="flex-1 p-4 bg-gray-900 text-gray-100 flex flex-col overflow-hidden text-xs font-mono">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          Meta Flow JSON v6.0
                        </span>
                        <button
                          onClick={copyFlowJson}
                          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
                        >
                          {copiedJson ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="flex-1 overflow-y-auto text-[11px] leading-relaxed text-emerald-300">
                        {rawJsonText}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RAW FLOW JSON CODE EDITOR TAB ── */}
            {builderTab === 'code' && (
              <div className="flex-1 flex flex-col p-6 bg-gray-900 text-gray-100 overflow-hidden font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3 shrink-0">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-400">Meta Flow JSON Direct Editor</h3>
                    <p className="text-xs text-gray-400">Directly edit raw Flow JSON conforming to Meta developer documentation.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyFlowJson}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs cursor-pointer"
                    >
                      {copiedJson ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                    <button
                      onClick={downloadFlowJson}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download .json</span>
                    </button>
                    <button
                      onClick={applyRawJsonToVisual}
                      className="flex items-center gap-1 px-4 py-1.5 bg-[#00D084] text-[#07301f] font-bold rounded-xl text-xs hover:bg-[#00be77] cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Validate &amp; Sync to Canvas</span>
                    </button>
                  </div>
                </div>

                {jsonParseError && (
                  <div className="p-3 bg-red-900/40 border border-red-700 text-red-300 rounded-xl text-xs mb-3 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{jsonParseError}</span>
                  </div>
                )}

                <textarea
                  value={rawJsonText}
                  onChange={e => setRawJsonText(e.target.value)}
                  className="flex-1 w-full bg-gray-950 text-emerald-300 p-4 rounded-2xl border border-gray-800 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed resize-none"
                  spellCheck={false}
                />
              </div>
            )}

            {/* ── DATA ENDPOINT / SERVER SETTINGS TAB ── */}
            {builderTab === 'endpoint' && (
              <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">WhatsApp Flow Data Endpoint</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect your own HTTPS endpoint for <strong>data_exchange</strong> mode to dynamically render screens based on your server's backend database.
                  </p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-gray-800 block mb-1">Server Endpoint URL (`endpoint_uri`)</label>
                    <input
                      type="url"
                      value={endpointUri}
                      onChange={e => setEndpointUri(e.target.value)}
                      placeholder="https://your-api.com/api/whatsapp/flows/exchange"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Must be a valid HTTPS URL supporting Meta Flow JSON Data Exchange Protocol.
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 block mb-1">Data API Version</label>
                    <input
                      type="text"
                      value="3.0"
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">Current supported Meta Flow Data API version</span>
                  </div>
                </div>

                <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert size={16} className="text-amber-600" />
                    <span>RSA Encryption Requirement for Data Exchange</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Meta requires an active RSA 2048-bit business public key registered for your WhatsApp number when publishing in <strong>data_exchange</strong> mode.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SEND TEST FLOW MESSAGE MODAL
      ========================================================================= */}
      {isSendModalOpen && sendTargetFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">Send Flow to Customer</h3>
              </div>
              <button onClick={() => setIsSendModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Flow Name</label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800">
                  {sendTargetFlow.name} (v{sendTargetFlow.version || 1})
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Recipient Phone Number</label>
                <input
                  type="text"
                  value={sendRecipient}
                  onChange={e => setSendRecipient(e.target.value)}
                  placeholder="+13105551234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Flow Button Label (CTA)</label>
                <input
                  type="text"
                  value={sendCta}
                  onChange={e => setSendCta(e.target.value)}
                  placeholder="Get a quote"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Message Body</label>
                <textarea
                  rows={2}
                  value={sendMessageBody}
                  onChange={e => setSendMessageBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              {sendTargetFlow.status === 'DRAFT' && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="font-medium text-amber-800">Send in Test Mode (`draft: true`)</span>
                  <input
                    type="checkbox"
                    checked={sendIsDraft}
                    onChange={e => setSendIsDraft(e.target.checked)}
                    className="accent-amber-600 cursor-pointer"
                  />
                </div>
              )}

              {sendResultMsg && (
                <div className={`p-3 rounded-xl font-mono text-[11px] ${
                  sendResultMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {sendResultMsg}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSendTestFlow}
                disabled={isSendingFlow}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#07301f] bg-[#00D084] hover:bg-[#00be77] rounded-xl cursor-pointer"
              >
                {isSendingFlow ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Send WhatsApp Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER 4: FLOW SUBMISSIONS / RESPONSES
      ========================================================================= */}
      {isResponsesOpen && responseTargetFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Flow Customer Submissions</h3>
                  <p className="text-xs text-gray-500">Responses collected for {responseTargetFlow.name}</p>
                </div>
                <button onClick={() => setIsResponsesOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {responsesList.length} {responsesList.length === 1 ? 'Submission' : 'Submissions'} Recorded
                </span>
                <button
                  onClick={handleSimulateResponse}
                  disabled={isSimulatingResponse}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  <Sparkles size={13} />
                  <span>Simulate Test Submission</span>
                </button>
              </div>

              {isLoadingResponses ? (
                <div className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto mb-2" />
                  <span className="text-xs text-gray-400">Loading customer submissions...</span>
                </div>
              ) : responsesList.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs">
                  No responses submitted yet. Click "Simulate Test Submission" to test payload capture.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                  {responsesList.map((resp, rIdx) => (
                    <div key={resp.id || rIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{resp.sender_name || 'Customer'}</span>
                          <span className="text-gray-500 font-mono text-[11px]">{resp.from_phone}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(resp.received_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 overflow-x-auto">
                        <pre>{JSON.stringify(resp.data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsResponsesOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: VERSION HISTORY & LINEAGE
      ========================================================================= */}
      {isVersionsOpen && versionTargetFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">Flow Version History</h3>
              </div>
              <button onClick={() => setIsVersionsOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Meta WhatsApp Flows maintain an immutable lineage history. Each publication freezes the version and requires a cloned draft to iterate.
            </p>

            <div className="space-y-2 overflow-y-auto max-h-64 text-xs">
              {versionsList.map((ver, vIdx) => (
                <div key={vIdx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">Version {ver.version}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">ID: {ver.flowId}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ver.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {ver.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsVersionsOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
