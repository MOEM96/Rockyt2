import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://srqpicqpadqfxjbtghky.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycXBpY3FwYWRxZnhqYnRnaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzgyMDMsImV4cCI6MjA5MzA1NDIwM30.RnjV_aZ5J6t-przdaFzj2TD7ajWILve0_J1sjfUEeyM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
