import React from 'react';
import { Check, X } from 'lucide-react';

const WhyRockyt: React.FC = () => {
  return (
    <section id="why" className="scroll-mt-32 pt-16 pb-12 relative z-10">
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="font-mono text-sm font-bold text-brand uppercase tracking-wider">Why Rockyt?</span>
          <h2 className="max-w-2xl text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white">
            Everything between you and your first message, handled.
          </h2>
        </div>

        {/* 2-COLUMN COMPARISON */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* LEFT: ROCKYT API */}
          <div className="flex flex-col rounded-[24px] border border-brand/40 bg-zinc-900/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-5 mb-6">
              <p className="text-lg font-bold text-brand uppercase tracking-wider">Rockyt API</p>
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-black text-sm">
                R
              </div>
            </div>

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-white">One API key</p>
                  <p className="text-sm font-medium text-zinc-400">No Meta Business verification process. Start sending in 30 seconds</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-white">No Meta App Review</p>
                  <p className="text-sm font-medium text-zinc-400">Embedded Signup handles it</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-white">Reliable webhook delivery with built-in retry logic</p>
                  <p className="text-sm font-medium text-zinc-400">Same JSON format across every platform</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-brand" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-white">Limits handled</p>
                  <p className="text-sm font-medium text-zinc-400">The 24h window, rate limits, messaging tiers. You just call POST</p>
                </div>
              </li>
            </ul>
          </div>

          {/* RIGHT: BUILDING IT YOURSELF */}
          <div className="flex flex-col rounded-[24px] border border-zinc-800 bg-zinc-950/60 backdrop-blur-md p-6 sm:p-8">
            <div className="flex items-center justify-between gap-5 mb-6">
              <p className="text-lg font-bold text-zinc-400">Building it yourself (WhatsApp Cloud API)</p>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                M
              </div>
            </div>

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-zinc-300">Five Meta products to navigate</p>
                  <p className="text-sm font-medium text-zinc-500">Business Manager, App Dashboard, WABA, phone setup, verification before your first message</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-zinc-300">App Review can take weeks</p>
                  <p className="text-sm font-medium text-zinc-500">Sometimes with no clear reason for denial</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-zinc-300">No built-in webhook replay or retry logic</p>
                  <p className="text-sm font-medium text-zinc-500">Yours to build and maintain</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-zinc-300">Tier management</p>
                  <p className="text-sm font-medium text-zinc-500">New accounts start at 250 messages a day. Upgrades are on you</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhyRockyt;
