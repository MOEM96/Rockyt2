import React from 'react';
import { ChevronDown, Check, Video, Phone, SignalHigh, Wifi, BatteryFull } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <section className="relative overflow-x-clip pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center z-10">
      <div className="mx-auto w-full max-w-[1080px] flex flex-col items-center">
        
        {/* HERO INTERACTIVE UI MOCKUP CONTAINER */}
        <div className="relative w-full flex justify-center mb-8">
          <div className="relative h-[290px] sm:h-[416px] w-[340px] sm:w-[565px] shrink-0 origin-top">
            
            {/* LEFT FLOATING BROADCAST CARD */}
            <div className="absolute left-2 sm:left-[29px] top-4 sm:top-[40px] h-[260px] sm:h-[350px] w-[180px] sm:w-[241px] z-10 drop-shadow-2xl">
              <div className="flex h-full w-full flex-col gap-2.5 sm:gap-[14px] rounded-2xl sm:rounded-tl-[25px] border-2 border-white/20 bg-zinc-950/90 backdrop-blur-xl p-3.5 sm:p-[19px]">
                <p className="text-xs sm:text-[16px] font-bold text-white">New Broadcast</p>
                
                <div className="flex w-full flex-col gap-1 sm:gap-[5px]">
                  <p className="text-[10px] sm:text-[12px] font-semibold text-zinc-400">Channel</p>
                  <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 sm:p-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#25D366] flex items-center justify-center text-black font-black text-[9px]">W</div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-white">WhatsApp</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </div>
                </div>

                <div className="flex w-full flex-col gap-1 sm:gap-[5px]">
                  <p className="text-[10px] sm:text-[12px] font-semibold text-zinc-400">Template</p>
                  <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 sm:p-[10px]">
                    <span className="text-[10px] sm:text-[11px] font-medium text-zinc-200 truncate">Winter sale · 50% off</span>
                    <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:gap-[5px]">
                  <p className="text-[10px] sm:text-[12px] font-semibold text-zinc-400">Recipients</p>
                  <div className="flex flex-wrap gap-1">
                    {['Ryan', 'Laura', 'James', 'Mike', 'Joe'].map((name, i) => (
                      <span key={i} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-200">{name}</span>
                    ))}
                    <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-[9px] font-medium text-zinc-400">+1.236</span>
                  </div>
                </div>

                <button 
                  onClick={onStart}
                  className="mt-auto flex w-full items-center justify-center rounded-xl bg-brand hover:bg-brand-hover p-2.5 transition-all shadow-lg shadow-brand/20"
                >
                  <span className="text-[11px] sm:text-[12px] font-bold text-white">Send broadcast</span>
                </button>
              </div>
            </div>

            {/* RIGHT IPHONE SCREEN MOCKUP */}
            <div className="absolute right-2 sm:left-[240px] top-0 w-[200px] sm:w-[280px] h-[280px] sm:h-[390px] rounded-[32px] border-4 border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl z-0">
              {/* STATUS BAR */}
              <div className="flex items-center justify-between px-4 pt-2 pb-1 text-white text-[10px] font-semibold">
                <span>09:41</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <SignalHigh className="w-2.5 h-2.5" />
                  <Wifi className="w-2.5 h-2.5" />
                  <BatteryFull className="w-3 h-3" />
                </div>
              </div>

              {/* WHATSAPP CHAT HEADER */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-bold text-[10px]">R</div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-tight">Rockyt Brand</p>
                    <p className="text-[8px] text-emerald-400 font-medium leading-tight">Official Business</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Video className="w-3.5 h-3.5" />
                  <Phone className="w-3 h-3" />
                </div>
              </div>

              {/* CHAT MESSAGES BODY */}
              <div className="p-3 space-y-2.5 text-[10px]">
                <div className="flex justify-center">
                  <span className="bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5 text-[8px] text-zinc-400">Sending to 2,847 recipients</span>
                </div>

                <div className="ml-auto max-w-[85%] bg-emerald-950/70 border border-emerald-800/50 rounded-2xl rounded-tr-none p-2.5 text-zinc-100 shadow-md">
                  <p className="font-bold text-emerald-400 text-[10px] mb-1">Don't miss out!</p>
                  <p className="text-zinc-300 leading-snug">Hi Marc, for the next 24 hours only, all winter jackets are 50% off.</p>
                  <p className="text-brand font-medium mt-1">🛒 Shop: rockyt.io/sale</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-zinc-400">
                    <span>08:21</span>
                    <Check className="w-2.5 h-2.5 text-brand" />
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING WHATSAPP LOGO BADGE */}
            <div className="absolute left-[170px] sm:left-[215px] top-[240px] sm:top-[310px] z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand p-3 shadow-2xl flex items-center justify-center border border-brand/50">
              <svg className="h-full w-full text-white fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
              </svg>
            </div>

          </div>
        </div>

        {/* HERO COPY - EXACT ZERNIO WORDING */}
        <div className="w-full text-center max-w-3xl">
          <h1 className="font-semibold text-white text-[clamp(1.85rem,6vw,3.75rem)] leading-[1.08] tracking-[-0.035em] mb-5">
            Ship WhatsApp integration<br className="hidden sm:block" /> in minutes, not months
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed font-medium text-zinc-400 mb-8">
            One REST API for WhatsApp Business. Messaging, broadcasts, calling, and ads through one bearer token.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl font-bold px-6 py-3.5 text-base bg-brand text-white hover:bg-brand-hover transition-all shadow-lg shadow-brand/25"
            >
              Start for free
            </button>
            <a
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-xl font-bold px-6 py-3.5 text-base border border-zinc-800 bg-zinc-900/80 text-white hover:bg-zinc-800 transition-colors"
            >
              Read the docs
            </a>
          </div>

          {/* COMPLIANCE & PERFORMANCE PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {['SOC 2', 'GDPR compliant', '99.97% uptime', 'Under 50ms response'].map((badge, idx) => (
              <span 
                key={idx} 
                className="whitespace-nowrap rounded-full bg-brand/10 border border-brand/20 px-3 py-1 font-mono text-xs font-semibold text-brand"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* META BUSINESS PARTNER BADGE */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Official Meta Business Partner &amp; WhatsApp Cloud API</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;