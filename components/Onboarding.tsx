import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface OnboardingProps {
  onCancel: () => void;
  initialMode?: 'signup' | 'signin';
}

const Onboarding: React.FC<OnboardingProps> = ({ onCancel, initialMode = 'signup' }) => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(initialMode);
  const [fullName, setFullName] = useState('Moamen');
  const [email, setEmail] = useState('moamen@company.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userObj = {
      id: 'usr_' + Date.now().toString(36),
      name: fullName.trim() || 'Moamen',
      email: email.trim() || 'moamen@company.com',
      avatar: '',
      plan: 'Trial',
      trialDaysRemaining: 6
    };

    localStorage.setItem('rockyt_session_user', JSON.stringify(userObj));

    setTimeout(() => {
      setIsLoading(false);
      onCancel();
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('popstate'));
    }, 400);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline'
            }
          }
        });
      } else {
        const userObj = {
          id: 'usr_google_' + Date.now().toString(36),
          name: fullName || 'Moamen',
          email: email || 'moamen@company.com',
          plan: 'Trial',
          trialDaysRemaining: 6
        };
        localStorage.setItem('rockyt_session_user', JSON.stringify(userObj));
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new Event('popstate'));
        onCancel();
      }
    } catch (err) {
      console.error('[Google Auth Error]:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* MODAL CARD */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-7 sm:p-9 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onCancel}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* LOGO & HEADING */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00D084] text-white font-black text-xl mb-3 shadow-md shadow-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.12-1.33c1.43.83 3.09 1.33 4.88 1.33 5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>
          
          <h2 className="font-display font-extrabold text-2xl text-gray-900 tracking-tight">
            {authMode === 'signup' ? 'Start your 7-day free trial' : 'Welcome back to Wati'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {authMode === 'signup' 
              ? 'Connect your WhatsApp business account and explore the dashboard' 
              : 'Sign in to access your campaigns, inbox, and AI agents'}
          </p>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-3 transition-colors shadow-xs mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">or with email</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* EMAIL FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Moamen"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-sm shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#07301f] border-t-transparent rounded-full animate-spin"></span>
                <span>Opening Workspace...</span>
              </span>
            ) : (
              <>
                <span>{authMode === 'signup' ? 'Access Dashboard &amp; Start Trial' : 'Sign In to Dashboard'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* FOOTER SWITCHER */}
        <div className="mt-5 text-center text-xs text-gray-500">
          {authMode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setAuthMode('signin')}
                className="font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Start free trial
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>No credit card required • Official Meta Cloud API</span>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;