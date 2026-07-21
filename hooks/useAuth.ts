import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
  subscription_status: string | null;
  trial_end_date: string | null;
  is_trial: boolean;
  /* ── dashboard intake form ─────────────────────────────────── */
  dashboard_form_completed: boolean;
  running_ads: boolean | null;
  ad_spend: string | null;
  ad_platforms: string[] | null;
}

export interface FormAnswers {
  running_ads: boolean | null;
  ad_spend: string;
  ad_platforms: string[];
}

export const useAuth = () => {
  const [user, setUser]           = useState<User | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Tracks the in-flight profile fetch so a stale result can be discarded if
  // the auth state changes again before it returns.
  const profileFetchTokenRef = useRef(0);

  // Per-session marker: indicates that the current authenticated browser
  // session originated from an OAuth signup that hasn't yet been provisioned
  // with a profile row. The Dashboard reads this to decide whether the
  // first iframe render should point at the workspace-creation URL.
  //
  // Scoping it to sessionStorage (NOT localStorage) means:
  //   - A second OAuth sign-in from the same browser (returning user) starts
  //     with a clean slate and goes straight to the regular subdomain.
  //   - A single OAuth round-trip (Google -> back to app -> signup render)
  //     uses the workspace-creation URL exactly once.
  //   - The flag is cleared by Dashboard.tsx immediately after the iframe
  //     has rendered with that URL.
  const SIGNUP_RENDER_KEY = 'rockyt:showSignupFrame';

  const markSignupFramePending = () => {
    try { sessionStorage.setItem(SIGNUP_RENDER_KEY, '1'); } catch { /* ignore */ }
  };
  const consumeSignupFramePending = (): boolean => {
    try {
      const v = sessionStorage.getItem(SIGNUP_RENDER_KEY);
      if (v === '1') { sessionStorage.removeItem(SIGNUP_RENDER_KEY); return true; }
    } catch { /* ignore */ }
    return false;
  };

  const fetchProfile = async (userId: string) => {
    const token = ++profileFetchTokenRef.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // A newer request superseded us — drop this result.
      if (token !== profileFetchTokenRef.current) return;

      if (error && error.code === 'PGRST116') {
        setIsFirstLogin(true);
        markSignupFramePending();
      } else if (data) {
        setProfile(data as UserProfile);
        setIsFirstLogin(false);
      }
    } catch (err) {
      if (token !== profileFetchTokenRef.current) return;
      console.error('Error fetching profile:', err);
      throw err;
    } finally {
      if (token === profileFetchTokenRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Safety timeout — prevent infinite loading if Supabase doesn't respond
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out.');
        setLoading(false);
      }
    }, 5000);

    let isMounted = true;

    const applySession = (session: Session | null) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsFirstLogin(false);
        setLoading(false);
      }
    };

    // Drive both initial-load and subsequent updates through a single funnel.
    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        clearTimeout(timeoutId);
        applySession(session);
      })
      .catch((err: any) => {
        console.error('Auth error:', err);
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      applySession(session);
    });

    const handleSubUpdated = () => {
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user) fetchProfile(session.user.id);
      });
    };
    window.addEventListener('rockyt:subscriptionUpdated', handleSubUpdated);

    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('rockyt:subscriptionUpdated', handleSubUpdated);
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = window.location.origin;
    console.log('Rockyt: Initiating Google OAuth with redirect to:', redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const completeProfile = async (plan: string) => {
    if (!user) return;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const { error } = await supabase.from('profiles').upsert([{
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      plan,
      trial_end_date: trialEndDate.toISOString(),
      subscription_status: 'trialing',
      is_trial: true,
      dashboard_form_completed: false,
    }]);

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
    setIsFirstLogin(false);
    await fetchProfile(user.id);
  };

  /**
   * Saves the 3-step intake form answers to Supabase and marks the form
   * as completed so it never shows again for this user.
   */
  const saveFormAnswers = async (answers: FormAnswers) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        dashboard_form_completed: true,
        running_ads:   answers.running_ads,
        ad_spend:      answers.ad_spend,
        ad_platforms:  answers.ad_platforms,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving form answers:', error);
    } else {
      // Keep local profile in sync without a full network round-trip
      setProfile(prev => prev
        ? {
            ...prev,
            dashboard_form_completed: true,
            running_ads:  answers.running_ads,
            ad_spend:     answers.ad_spend,
            ad_platforms: answers.ad_platforms,
          }
        : prev
      );
    }
  };

  const isAccessGranted = () => {
    if (!profile) return false;
    if (profile.subscription_status === 'active') return true;
    if (profile.trial_end_date) {
      return new Date() < new Date(profile.trial_end_date);
    }
    return false;
  };

  return {
    user,
    session,
    profile,
    loading,
    isFirstLogin,
    isAccessGranted,
    signInWithGoogle,
    signOut,
    completeProfile,
    saveFormAnswers,
    consumeSignupFramePending,
  };
};
