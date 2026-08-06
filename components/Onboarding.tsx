import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Key, UserCheck, Bot, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface OnboardingProps {
  onCancel: () => void;
  initialMode?: 'signup' | 'signin';
}

const Onboarding: React.FC<OnboardingProps> = ({ onCancel, initialMode = 'signup' }) => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(initialMode);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setIsAuthenticated(true);
          setUserEmail(data.user.email);
          if (data.apiKey) setApiKey(data.apiKey);
        }
      })
      .catch(() => {});
  }, []);

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
        window.location.href = `/api/auth/google?prompt=select_account&mode=${authMode}`;
      }
    } catch (err) {
      console.error('[Google Auth Error]:', err);
      setIsLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-white/20 shadow-2xl rounded-sm p-6 sm:p-10 flex flex-col justify-between text-center overflow-hidden">
        
        {/* Decorative Tape */}
        <div className="absolute -top-3 left-8 bg-brand text-white font-mono text-[9px] font-bold px-3 py-1 rotate-1 z-20 shadow-sm uppercase">
          {authMode === 'signup' ? 'ROCKYT DEVELOPER PORTAL' : 'ROCKYT AUTHENTICATION'}
        </div>

        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 hover:bg-brand p-2 rounded-sm transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {!isAuthenticated ? (
          /* PRE-SIGNUP / PRE-SIGNIN STATE */
          <div className="py-4 space-y-6">
            
            {/* Catchy Headline */}
            <div>
              <span className="font-mono text-[10px] text-brand tracking-widest uppercase font-bold bg-brand/10 border border-brand/30 px-3 py-1 inline-block mb-3 rounded-xs">
                ⚡ 16 CHANNELS · ONE API KEY
              </span>
              
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white uppercase tracking-tight leading-none">
                {authMode === 'signup' ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}
              </h2>
              
              <p className="font-mono text-xs text-white/70 mt-3 leading-relaxed max-w-sm mx-auto">
                {authMode === 'signup' 
                  ? 'Connect Claude, Cursor, and autonomous LLM agents to X, Instagram, WhatsApp, TikTok & Ads in 5 seconds.'
                  : 'Sign in to access your developer portal, API keys, and connected channel accounts.'
                }
              </p>
            </div>

            {/* Google Signup / Signin Button */}
            <div className="space-y-4 pt-2">
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white text-black font-mono text-xs font-bold px-6 py-4 uppercase tracking-wider hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-3 shadow-hard rounded-sm group cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.01 10.04.01 12c0 1.96.46 3.8 1.28 5.42l3.99-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                {isLoading 
                  ? 'CONNECTING TO GOOGLE...' 
                  : (authMode === 'signup' ? 'SIGN UP WITH GOOGLE' : 'SIGN IN WITH GOOGLE')
                }
              </button>

              {/* Mode Switch Hyperlink */}
              <div className="pt-2">
                {authMode === 'signup' ? (
                  <p className="font-mono text-xs text-white/60">
                    Already got an account?{' '}
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="text-brand underline hover:text-white font-bold transition-colors cursor-pointer ml-1"
                    >
                      Sign in
                    </button>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-white/60">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-brand underline hover:text-white font-bold transition-colors cursor-pointer ml-1"
                    >
                      Sign up
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Footer Trust Badges */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-4 font-mono text-[10px] text-white/40 uppercase">
              <span>✓ Free 2 Accounts</span>
              <span>•</span>
              <span>✓ Instant API Key</span>
              <span>•</span>
              <span>✓ MCP Server Ready</span>
            </div>

          </div>
        ) : (
          /* POST-AUTHENTICATION STATE — API KEY DISPLAY */
          <div className="py-4 space-y-6 text-left">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold mb-2">
                <UserCheck size={16} />
                <span>SIGNED IN AS: {userEmail}</span>
              </div>
              <h2 className="font-display font-bold text-3xl text-white uppercase tracking-tight">
                YOUR ROCKYT API KEY
              </h2>
            </div>

            <div className="bg-black border-2 border-brand p-5 rounded-sm shadow-2xl">
              <label className="font-mono text-[10px] text-brand uppercase font-bold block mb-2">PRODUCTION API KEY</label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-white/20 p-3 font-mono text-xs text-white font-bold rounded-sm">
                <Key size={16} className="text-brand shrink-0" />
                <span className="flex-1 truncate">{apiKey || 'rockyt_live_99f381a94b8e21c'}</span>
                <button 
                  onClick={copyApiKey}
                  className="bg-brand text-white px-3 py-1.5 text-[10px] hover:bg-white hover:text-ink transition-colors flex items-center gap-1 font-bold rounded-sm shrink-0 cursor-pointer"
                >
                  {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                  {copiedKey ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <p className="font-mono text-[10px] text-white/60 mt-3 leading-relaxed">
                Add <code className="text-brand font-bold">@rockyt/mcp-server</code> to your agent config or pass in HTTP header <code className="text-brand font-bold">Authorization: Bearer</code>.
              </p>
            </div>

            <button
              onClick={() => {
                onCancel();
                window.location.href = '/dashboard';
              }}
              className="w-full bg-brand text-white font-mono text-xs font-bold px-6 py-3.5 uppercase tracking-wider hover:bg-white hover:text-ink transition-all flex items-center justify-center gap-2 rounded-sm shadow-glow cursor-pointer"
            >
              LAUNCH STUDIO CONSOLE <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;