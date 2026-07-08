import React, { useEffect, useState } from 'react';
import { cn } from '../utils/helpers';
import { ONBOARDING_PLANS } from '../constants/index';

interface OnboardingFlowProps {
  onComplete: (plan: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Single-step trial activation screen shown right after sign-up, before the
 * Supabase profile row exists.
 *
 * NOTE: This used to also ask for ad spend + platforms, which duplicated the
 * 3-step intake form shown inside the Dashboard (the one whose answers are
 * actually persisted to Supabase via `saveFormAnswers` / the `profiles`
 * table). That duplication has been removed — spend/platform questions now
 * live in exactly one place: Dashboard.tsx's intake form.
 */
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, isLoading }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-pink/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="p-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow flex items-center justify-center shadow-[0_0_15px_rgba(255,226,65,0.4)]">
            <iconify-icon icon="solar:bolt-bold" class="text-black text-lg"></iconify-icon>
          </div>
          <span className="text-lg font-black uppercase tracking-tighter">Rockyt</span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className={cn(
          "w-full max-w-[480px] bg-white/[0.02] border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-2xl shadow-2xl transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-2 tracking-tight">Unlock <span className="text-brand-yellow">Full Access</span></h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-[10px] font-black uppercase tracking-widest mt-2">
                14-Day Free Trial
              </div>
              <p className="text-gray-500 text-xs font-medium mt-4 leading-relaxed">
                Start your journey today with zero risk. No credit card required. Full feature access included.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {ONBOARDING_PLANS.filter(p => !p.name.includes('Custom')).map((plan) => (
                <button
                  key={plan.name}
                  onClick={() => onComplete(plan.name)}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 group text-left relative overflow-hidden",
                    plan.popular
                      ? "bg-white/[0.05] border-brand-pink/30 hover:border-brand-pink/60"
                      : "bg-white/[0.03] border-white/5 hover:border-white/20"
                  )}
                >
                  {plan.popular && (
                     <div className="absolute top-0 right-0 px-3 py-1 bg-brand-pink text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                       Recommended
                     </div>
                  )}
                  <div>
                    <h3 className={cn(
                      "text-lg font-black uppercase tracking-tight mb-1",
                      plan.name === 'Growth' ? 'text-brand-blue' : 'text-brand-pink'
                    )}>{plan.name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">{plan.name === 'Growth' ? 'Up to $25k monthly spend' : 'Unlimited scaling & channels'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">$0</span>
                    <p className="text-[8px] text-brand-yellow font-black uppercase tracking-widest">Free Trial</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">
              No Commitment. Cancel Anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center relative z-10">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Powered by Rockyt AI Core v2.4</p>
      </div>
    </div>
  );
};

export default OnboardingFlow;
