import { FlowScreen, FlowComponent, FlowJSON } from './whatsappTypes';

export interface FlowQualityIssue {
  severity: 'error' | 'warning';
  title: string;
  rule?: string;
  message: string;
  remediation?: string;
  screenId?: string;
  componentIndex?: number;
  autoFixable: boolean;
}

const META_DIGIT_WORDS: Record<string, string> = {
  '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR',
  '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE',
};

/**
 * Sanitize Screen ID to strictly match Meta ^[A-Za-z_]+$
 */
export function sanitizeMetaScreenId(rawId: string, fallbackIdx = 1): string {
  let clean = (rawId || `SCREEN_${fallbackIdx}`).trim();
  if (/[0-9]/.test(clean)) {
    clean = clean.replace(/[0-9]/g, d => `_${META_DIGIT_WORDS[d] || 'EXTRA'}_`);
  }
  clean = clean.toUpperCase().replace(/[^A-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!clean) clean = `SCREEN_STEP_${fallbackIdx}`;
  if (clean === 'SUCCESS') clean = 'SUCCESS_SCREEN';
  return clean;
}

/**
 * Client-safe Flow Quality Checker for Meta WhatsApp Flow JSON v7.3
 */
export function evaluateFlowQuality(screens: FlowScreen[], endpointUri?: string): FlowQualityIssue[] {
  const issues: FlowQualityIssue[] = [];

  if (!Array.isArray(screens) || screens.length === 0) {
    issues.push({
      severity: 'error',
      title: 'No Screens Defined',
      message: 'Flow must declare at least one screen.',
      autoFixable: true,
    });
    return issues;
  }

  const screenIds = new Set<string>();
  const screenMap = new Map<string, FlowScreen>();
  const totalScreens = screens.length;

  // Pass 1: Validate Screen IDs
  screens.forEach((s, idx) => {
    const rawId = s.id || `SCREEN_${idx + 1}`;
    if (!/^[A-Za-z_]+$/.test(rawId)) {
      issues.push({
        severity: 'error',
        title: 'Invalid Screen ID',
        message: `Screen '${rawId}' contains digits or special characters. Meta specification requires uppercase letters and underscores only.`,
        screenId: rawId,
        autoFixable: true,
      });
    }
    if (rawId.toUpperCase() === 'SUCCESS') {
      issues.push({
        severity: 'error',
        title: 'Forbidden Screen ID',
        message: `'SUCCESS' is a reserved Meta keyword and cannot be used as a screen id.`,
        screenId: rawId,
        autoFixable: true,
      });
    }
    screenIds.add(rawId);
    screenMap.set(rawId, s);
  });

  // Map input fields to declaring screen
  const inputToScreen = new Map<string, string>();
  screens.forEach(s => {
    (s.layout?.children || []).forEach(c => {
      if (c.name && typeof c.name === 'string') {
        inputToScreen.set(c.name, s.id);
      }
    });
  });

  // Pass 2: Screen State Machine, Footers & Data Model Consistency
  screens.forEach((s, idx) => {
    const isLast = idx === totalScreens - 1;
    const footer = s.layout?.children?.find(c => c.type === 'Footer');

    if (!isLast) {
      if (s.terminal) {
        issues.push({
          severity: 'error',
          title: 'Intermediate Screen Marked Terminal',
          message: `Screen '${s.id}' is an intermediate step but has 'terminal: true'. Only the final screen should be terminal.`,
          screenId: s.id,
          autoFixable: true,
        });
      }
      if (footer && footer['on-click-action']?.name === 'complete') {
        issues.push({
          severity: 'error',
          title: 'Complete Action on Intermediate Screen',
          message: `Screen '${s.id}' has action 'complete', which terminates the flow prematurely before step ${idx + 2}. Intermediate screens must use 'navigate'.`,
          screenId: s.id,
          autoFixable: true,
        });
      }
    } else {
      if (!s.terminal) {
        issues.push({
          severity: 'error',
          title: 'Terminal Screen Missing terminal: true',
          message: `Final screen '${s.id}' must be marked as terminal (terminal: true) to complete the flow.`,
          screenId: s.id,
          autoFixable: true,
        });
      }
      if (footer && footer['on-click-action']?.name === 'navigate') {
        issues.push({
          severity: 'error',
          title: 'Navigate Action on Terminal Screen',
          message: `Terminal screen '${s.id}' cannot have action 'navigate'. It must terminate with 'complete'.`,
          screenId: s.id,
          autoFixable: true,
        });
      }
    }

    if (!footer) {
      issues.push({
        severity: 'error',
        title: 'Missing Footer Component',
        message: `Screen '${s.id}' is missing a Footer action button. Every screen in Meta Flows must contain a Footer.`,
        screenId: s.id,
        autoFixable: true,
      });
    } else if (footer['on-click-action']?.name === 'navigate') {
      const targetName = footer['on-click-action']?.next?.name;
      if (!targetName) {
        issues.push({
          severity: 'error',
          title: 'Missing Navigation Target',
          message: `Footer on screen '${s.id}' has action 'navigate' but no target next screen is specified.`,
          screenId: s.id,
          autoFixable: true,
        });
      } else if (!screenIds.has(targetName)) {
        issues.push({
          severity: 'error',
          title: 'Target Screen Not Found',
          message: `Footer on screen '${s.id}' targets screen '${targetName}', which does not exist in this flow.`,
          screenId: s.id,
          autoFixable: true,
        });
      } else {
        // CRITICAL CHECK: Following fields are missing in the next screen's data model: [...]
        const targetScreen = screenMap.get(targetName);
        const targetData = targetScreen?.data || {};
        const payload = footer['on-click-action']?.payload || {};
        const missingKeys: string[] = [];

        for (const pk of Object.keys(payload)) {
          if (!targetData[pk]) {
            missingKeys.push(pk);
          }
        }

        if (missingKeys.length > 0) {
          issues.push({
            severity: 'error',
            rule: 'DATA_MODEL_MISMATCH',
            title: 'Data Model Mismatch',
            message: `Following fields are missing in the next screen's data model: [${missingKeys.join(', ')}].`,
            remediation: "In Meta Flow JSON v4.0+, navigate payloads carrying user inputs must be empty '{}' or the destination screen must declare them in 'data' with an '__example__' property.",
            screenId: s.id,
            autoFixable: true,
          });
        }
      }
    }

    // Check screen data model: mandatory __example__ on every declared property
    if (s.data && typeof s.data === 'object' && !Array.isArray(s.data)) {
      for (const [propName, propDef] of Object.entries(s.data)) {
        if (!propDef || typeof propDef !== 'object' || !(propDef as any).__example__) {
          issues.push({
            severity: 'error',
            title: 'Missing Mandatory __example__ in Data Model',
            message: `Field '${propName}' in screen '${s.id}' data model is missing the mandatory '__example__' mock value required by Meta.`,
            screenId: s.id,
            autoFixable: true,
          });
        }
      }
    }

    // Check undeclared dynamic data references ${data.field}
    const screenLayoutJson = JSON.stringify(s.layout || {});
    const dataRefMatches = screenLayoutJson.match(/\$\{data\.([a-zA-Z0-9_]+)\}/g);
    if (dataRefMatches) {
      dataRefMatches.forEach(ref => {
        const fieldName = ref.slice(7, -1);
        if (!s.data?.[fieldName]) {
          issues.push({
            severity: 'error',
            title: 'Undeclared Dynamic Data Reference',
            message: `Dynamic reference '${ref}' on screen '${s.id}' is not declared in the screen's data model.`,
            screenId: s.id,
            autoFixable: true,
          });
        }
      });
    }

    // Check component limit
    if (s.layout?.children && s.layout.children.length > 50) {
      issues.push({
        severity: 'error',
        title: 'Max Components Exceeded',
        message: `Screen '${s.id}' contains ${s.layout.children.length} components (Meta limit is 50).`,
        screenId: s.id,
        autoFixable: false,
      });
    }

    // Check interactive component names
    const interactiveTypes = ['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'];
    (s.layout?.children || []).forEach((comp, cIdx) => {
      if (interactiveTypes.includes(comp.type) && !comp.name) {
        issues.push({
          severity: 'error',
          title: 'Missing Component Name',
          message: `Interactive component '${comp.type}' on screen '${s.id}' is missing a 'name' identifier.`,
          screenId: s.id,
          componentIndex: cIdx,
          autoFixable: true,
        });
      }
    });
  });

  return issues;
}

/**
 * 1-Click Auto-Fixer: transforms any screen array into 100% compliant Meta Flow JSON v7.3 specification
 */
export function autoFixFlowScreens(screens: FlowScreen[], endpointUri?: string): FlowScreen[] {
  if (!Array.isArray(screens) || screens.length === 0) return screens;

  const totalScreens = screens.length;
  const idMap = new Map<string, string>();

  // 1. Sanitize screen IDs
  const sanitized = screens.map((s, idx) => {
    const rawId = s.id || `SCREEN_${idx + 1}`;
    const cleanId = sanitizeMetaScreenId(rawId, idx + 1);
    if (cleanId !== rawId) idMap.set(rawId, cleanId);

    return {
      ...s,
      id: cleanId,
      data: s.data && typeof s.data === 'object' && !Array.isArray(s.data) ? { ...s.data } : {},
      layout: {
        type: 'SingleColumnLayout',
        children: (s.layout?.children || []).map(c => ({ ...c })),
      },
    };
  });

  // 2. Cascade ID renames
  if (idMap.size > 0) {
    sanitized.forEach(s => {
      s.layout.children.forEach(comp => {
        const action = comp['on-click-action'];
        if (action?.next?.name && idMap.has(action.next.name)) {
          action.next.name = idMap.get(action.next.name)!;
        }
      });
    });
  }

  // 3. Map inputs
  const inputToScreen = new Map<string, string>();
  sanitized.forEach(s => {
    s.layout.children.forEach(comp => {
      if (comp.name && typeof comp.name === 'string') {
        inputToScreen.set(comp.name, s.id);
      }
    });
  });

  // 4. Heal chains, state machine, and navigate payloads
  sanitized.forEach((screen, idx) => {
    const isLastScreen = idx === totalScreens - 1;
    let footer = screen.layout.children.find(c => c.type === 'Footer');

    if (!isLastScreen) {
      screen.terminal = false;
      delete screen.success;

      const nextScreenId = sanitized[idx + 1].id;
      const targetScreen = sanitized[idx + 1];

      if (!footer) {
        footer = {
          type: 'Footer',
          label: 'Continue',
          'on-click-action': {
            name: 'navigate',
            next: { type: 'screen', name: nextScreenId },
            payload: {},
          },
        };
        screen.layout.children.push(footer);
      } else {
        const action = footer['on-click-action'];
        if (!action || action.name !== 'data_exchange') {
          // Meta rule: navigate payloads carrying user form data must be empty {}
          const existingPayload = action?.payload || {};
          const cleanPayload: Record<string, any> = {};
          const targetScreenLayoutJson = JSON.stringify(targetScreen?.layout || {});

          for (const [pk, pv] of Object.entries(existingPayload)) {
            if (targetScreenLayoutJson.includes(`\${data.${pk}}`)) {
              cleanPayload[pk] = pv;
              if (!targetScreen.data[pk]) {
                targetScreen.data[pk] = {
                  type: 'string',
                  __example__: typeof pv === 'string' && !pv.startsWith('${') ? pv : `sample_${pk}`,
                };
              }
            } else if (targetScreen?.data?.[pk]) {
              cleanPayload[pk] = pv;
            }
          }

          footer['on-click-action'] = {
            name: 'navigate',
            next: { type: 'screen', name: action?.next?.name || nextScreenId },
            payload: cleanPayload,
          };
        } else if (action.name === 'navigate' && (!action.next || !action.next.name)) {
          action.next = { type: 'screen', name: nextScreenId };
        }
        if (!footer.label || footer.label === 'Submit') footer.label = 'Continue';
      }
    } else {
      // Terminal screen
      screen.terminal = true;
      screen.success = true;

      if (!footer) {
        const defaultPayload: Record<string, string> = {};
        inputToScreen.forEach((srcScreen, fieldName) => {
          defaultPayload[fieldName] = srcScreen === screen.id ? `\${form.${fieldName}}` : `\${screen.${srcScreen}.form.${fieldName}}`;
        });
        footer = {
          type: 'Footer',
          label: 'Submit',
          'on-click-action': {
            name: 'complete',
            payload: defaultPayload,
          },
        };
        screen.layout.children.push(footer);
      } else {
        const action = footer['on-click-action'];
        if (!action || action.name === 'navigate') {
          const payloadMap = action?.payload || {};
          if (Object.keys(payloadMap).length === 0) {
            inputToScreen.forEach((srcScreen, fieldName) => {
              payloadMap[fieldName] = srcScreen === screen.id ? `\${form.${fieldName}}` : `\${screen.${srcScreen}.form.${fieldName}}`;
            });
          }
          footer['on-click-action'] = {
            name: 'complete',
            payload: payloadMap,
          };
        }
        if (!footer.label || footer.label === 'Continue') footer.label = 'Submit';
      }
    }

    // Qualify cross-screen form expressions in footer payloads
    if (footer && footer['on-click-action']?.payload && typeof footer['on-click-action'].payload === 'object') {
      const payloadObj = footer['on-click-action'].payload;
      for (const [k, v] of Object.entries(payloadObj)) {
        if (typeof v === 'string') {
          const formMatch = v.match(/^\$\{form\.([a-zA-Z0-9_]+)\}$/);
          if (formMatch) {
            const field = formMatch[1];
            const sourceScreen = inputToScreen.get(field);
            if (sourceScreen && sourceScreen !== screen.id) {
              payloadObj[k] = `\${screen.${sourceScreen}.form.${field}}`;
            }
          }
        }
      }
    }
  });

  // 5. Ensure any remaining navigate payload keys have schema in targetScreen.data with __example__
  sanitized.forEach(screen => {
    screen.layout.children.forEach(comp => {
      const action = comp['on-click-action'];
      if (action && action.name === 'navigate' && action.next?.name) {
        const target = sanitized.find(s => s.id === action.next.name);
        if (target) {
          if (!target.data || typeof target.data !== 'object' || Array.isArray(target.data)) {
            target.data = {};
          }
          if (action.payload && typeof action.payload === 'object') {
            for (const [k, v] of Object.entries(action.payload)) {
              if (!target.data[k]) {
                target.data[k] = {
                  type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
                  __example__: typeof v === 'string' && !v.startsWith('${') ? v : (k.includes('email') ? 'user@example.com' : k.includes('phone') ? '+15551234567' : `sample_${k}`),
                };
              } else if (!target.data[k].__example__) {
                target.data[k].__example__ = k.includes('email') ? 'user@example.com' : `sample_${k}`;
              }
            }
          }
        }
      }
    });
  });

  // 6. Ensure any ${data.x} reference in components has a matching schema in screen.data with __example__
  sanitized.forEach(screen => {
    if (!screen.data || typeof screen.data !== 'object' || Array.isArray(screen.data)) {
      screen.data = {};
    }
    const screenLayoutJson = JSON.stringify(screen.layout || {});
    const dataRefMatches = screenLayoutJson.match(/\$\{data\.([a-zA-Z0-9_]+)\}/g);
    if (dataRefMatches) {
      dataRefMatches.forEach(ref => {
        const fieldName = ref.slice(7, -1);
        if (!screen.data[fieldName]) {
          screen.data[fieldName] = {
            type: 'string',
            __example__: fieldName.includes('email') ? 'user@example.com' : fieldName.includes('name') ? 'John Doe' : `sample_${fieldName}`,
          };
        } else if (!screen.data[fieldName].__example__) {
          screen.data[fieldName].__example__ = fieldName.includes('email') ? 'user@example.com' : `sample_${fieldName}`;
        }
      });
    }

    for (const [propName, propDef] of Object.entries(screen.data)) {
      if (propDef && typeof propDef === 'object' && !(propDef as any).__example__) {
        (propDef as any).__example__ = propName.includes('email') ? 'user@example.com' : propName.includes('name') ? 'John Doe' : `sample_${propName}`;
      }
    }
  });

  return sanitized;
}
