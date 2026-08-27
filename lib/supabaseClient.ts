import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const isCustomSupabase = !!(env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.includes('srqpicqpadqfxjbtghky'));
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://srqpicqpadqfxjbtghky.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isCustomSupabase,
    autoRefreshToken: isCustomSupabase,
    detectSessionInUrl: isCustomSupabase
  }
});
