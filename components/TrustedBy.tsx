import React, { useState, useEffect } from 'react';

const TrustedBy: React.FC = () => {
  const [postsCount, setPostsCount] = useState(386965);
  const [accountsCount, setAccountsCount] = useState(15977);

  // Live metric ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPostsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.6) {
        setAccountsCount(prev => prev + 1);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const builderLogos = [
    { name: "ClickUp", badge: null },
    { name: "HeyMark", badge: "CASE STUDY" },
    { name: "RE/MAX", badge: null },
    { name: "Vibiz", badge: "CASE STUDY" },
    { name: "WARNER MUSIC GROUP", badge: null },
    { name: "Holo", badge: null },
  ];

  return (
    <section className="py-14 bg-zinc-950/75 backdrop-blur-md text-white relative z-20 border-y border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-mono text-xs text-brand uppercase tracking-widest font-semibold">// BUILDER ECOSYSTEM</span>
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wide mt-1">
            Trusted by builders at
          </h3>
        </div>

        {/* Builder Logo Strip */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mb-14">
          {builderLogos.map((logo, idx) => (
            <div key={idx} className="flex items-center gap-2 group cursor-pointer">
              <span className="font-display font-bold text-xl sm:text-2xl tracking-tighter text-white/80 group-hover:text-brand transition-colors uppercase">
                {logo.name}
              </span>
              {logo.badge && (
                <span className="font-mono text-[9px] bg-brand/20 text-brand border border-brand/40 px-1.5 py-0.5 rounded-xs font-bold tracking-widest">
                  {logo.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 2 Animated Live Metric Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Counter 1: Posts this week */}
          <div className="bg-zinc-900/80 border border-white/20 p-5 shadow-2xl backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <div>
                <span className="font-mono text-xs text-white/60 block">LIVE DISPATCHES</span>
                <span className="font-mono font-bold text-lg sm:text-xl text-white">
                  {postsCount.toLocaleString()} <span className="text-xs font-normal text-white/60">posts this week</span>
                </span>
              </div>
            </div>

            {/* Sparkline Graphic (Green) */}
            <div className="w-36 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 140 40">
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,30 Q35,25 70,18 T140,8 L140,40 L0,40 Z" fill="url(#greenGrad)" />
                <path d="M0,30 Q35,25 70,18 T140,8" fill="none" stroke="#10B981" strokeWidth="2.5" />
                <circle cx="140" cy="8" r="4" fill="#10B981" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Counter 2: Accounts connected this week */}
          <div className="bg-zinc-900/80 border border-white/20 p-5 shadow-2xl backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-brand animate-ping shrink-0" />
              <div>
                <span className="font-mono text-xs text-white/60 block">ACTIVE CHANNELS</span>
                <span className="font-mono font-bold text-lg sm:text-xl text-white">
                  {accountsCount.toLocaleString()} <span className="text-xs font-normal text-white/60">accounts connected this week</span>
                </span>
              </div>
            </div>

            {/* Sparkline Graphic (Purple/Pink) */}
            <div className="w-36 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 140 40">
                <defs>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D35D88" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#D35D88" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,32 Q35,28 70,12 T140,15 L140,40 L0,40 Z" fill="url(#pinkGrad)" />
                <path d="M0,32 Q35,28 70,12 T140,15" fill="none" stroke="#D35D88" strokeWidth="2.5" />
                <circle cx="140" cy="15" r="4" fill="#D35D88" className="animate-pulse" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
