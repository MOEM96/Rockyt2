import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverSupabaseInstance: SupabaseClient | null = null;

export function getBackendSupabaseClient(): SupabaseClient {
  if (!serverSupabaseInstance) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://srqpicqpadqfxjbtghky.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.SUPABASE_ANON_KEY || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        'sb_publishable_FCRt810ouCz9jKti1niwyA_yN6jKTij';
    
    serverSupabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return serverSupabaseInstance;
}
