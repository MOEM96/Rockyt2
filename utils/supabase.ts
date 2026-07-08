import { createClient } from '@supabase/supabase-js';

const isRealSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_URL !== '' && 
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

let supabaseInstance: any;

if (isRealSupabaseConfigured) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (typeof window !== 'undefined') {
    console.warn('WARNING: Supabase environment variables are missing! Falling back to simulated local state mode.');
  }

  const getStoredSession = () => {
    try {
      const s = localStorage.getItem('rockyt:mock-session');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  };

  const getStoredProfiles = () => {
    try {
      const p = localStorage.getItem('rockyt:mock-profiles');
      return p ? JSON.parse(p) : {};
    } catch {
      return {};
    }
  };

  const saveStoredProfiles = (profiles: any) => {
    try {
      localStorage.setItem('rockyt:mock-profiles', JSON.stringify(profiles));
    } catch {
      // ignore
    }
  };

  const listeners: Array<any> = [];

  supabaseInstance = {
    auth: {
      getSession: async () => {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },
      onAuthStateChange: (callback: any) => {
        const session = getStoredSession();
        // Invoke callback on next tick to simulate async supabase behavior
        setTimeout(() => {
          callback('SIGNED_IN', session);
        }, 0);
        
        listeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                  listeners.splice(index, 1);
                }
              }
            }
          }
        };
      },
      signInWithOAuth: async (options: any) => {
        const mockSession = {
          access_token: 'mock-token-' + Math.random().toString(36).substring(2),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-' + Math.random().toString(36).substring(2),
          user: {
            id: 'mock-user-id-123',
            email: 'demo-user@rockyt.io',
            user_metadata: {
              full_name: 'Demo User'
            }
          }
        };
        try {
          localStorage.setItem('rockyt:mock-session', JSON.stringify(mockSession));
        } catch {
          // ignore
        }
        
        // Notify listeners
        listeners.forEach(l => l('SIGNED_IN', mockSession));
        
        // Return success
        return { data: { provider: options.provider, url: window.location.origin }, error: null };
      },
      signOut: async () => {
        try {
          localStorage.removeItem('rockyt:mock-session');
        } catch {
          // ignore
        }
        listeners.forEach(l => l('SIGNED_OUT', null));
        return { error: null };
      }
    },
    from: (table: string) => {
      let queryId: string | null = null;
      let updatePayload: any = null;

      const chain = {
        select: (_fields?: string) => chain,
        eq: (col: string, val: string) => {
          if (col === 'id') {
            queryId = val;
          }
          return chain;
        },
        single: async () => {
          if (table === 'profiles' && queryId) {
            const profiles = getStoredProfiles();
            const profile = profiles[queryId];
            if (profile) {
              return { data: profile, error: null };
            } else {
              // Return PGRST116 (Postgrest single row not found)
              return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
            }
          }
          return { data: null, error: null };
        },
        upsert: async (rows: any[]) => {
          if (table === 'profiles') {
            const profiles = getStoredProfiles();
            rows.forEach((row: any) => {
              if (row.id) {
                profiles[row.id] = { ...profiles[row.id], ...row };
              }
            });
            saveStoredProfiles(profiles);
          }
          return { data: rows, error: null };
        },
        update: (payload: any) => {
          updatePayload = payload;
          return {
            eq: async (col: string, val: string) => {
              if (table === 'profiles' && col === 'id') {
                const profiles = getStoredProfiles();
                if (profiles[val]) {
                  profiles[val] = { ...profiles[val], ...updatePayload };
                  saveStoredProfiles(profiles);
                }
              }
              return { error: null };
            }
          };
        }
      };

      return chain;
    }
  };
}

export const supabase = supabaseInstance;
