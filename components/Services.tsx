import React from 'react';
import { Plus, Hash, Check } from 'lucide-react';

interface ServicesProps {
  onStartOnboarding?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onStartOnboarding }) => {
  return (
    <section id="how-it-works" className="scroll-mt-32 py-16 relative z-10">
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col gap-3 px-6 py-10 items-center text-center">
          <span className="font-mono text-sm font-bold text-brand uppercase tracking-wider">How It Works</span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">
            <span className="text-white">From zero to first message</span>
            <span className="text-zinc-500"> in three minutes</span>
          </h2>
        </div>

        {/* 3-STEP GRID */}
        <div className="grid grid-cols-1 gap-6 sm:px-4 lg:grid-cols-3">
          
          {/* STEP 1 */}
          <div className="flex flex-col">
            <div className="relative h-[310px] overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col justify-between shadow-xl">
              <span className="flex shrink-0 items-center justify-center self-start font-mono h-10 w-10 rounded-2xl bg-white text-sm font-bold text-zinc-900 shadow-md">
                1
              </span>
              
              <div className="flex flex-col gap-2.5">
                <div className="relative flex w-full items-start gap-2.5 rounded-xl bg-zinc-950 border border-zinc-800 p-3">
                  <div className="p-1 text-zinc-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white">Get a number</p>
                      <span className="rounded-[4px] bg-brand/20 px-1.5 py-0.5 text-[8px] font-bold text-brand">recommended</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">From $2/mo. Pick a country, we handle setup.</p>
                  </div>
                </div>

                <div className="relative flex w-full items-start gap-2.5 rounded-xl bg-zinc-950 border border-zinc-800 p-3">
                  <div className="p-1 text-zinc-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">Use my own number</p>
                    <p className="text-xs text-zinc-400 font-medium">Bring your existing phone number. Requires verification during setup.</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-base font-semibold leading-5 text-white">Connect in one click</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Bring a number you already have or buy one in Rockyt. Embedded Signup verifies it, and you're set with full API access.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="flex flex-col">
            <div className="relative h-[310px] overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col justify-between shadow-xl">
              <span className="flex shrink-0 items-center justify-center self-start font-mono h-10 w-10 rounded-2xl bg-white text-sm font-bold text-zinc-900 shadow-md">
                2
              </span>

              <div className="flex flex-col gap-2.5">
                <div className="flex justify-end">
                  <div className="bg-emerald-950/80 border border-emerald-800/60 rounded-xl px-3 py-2 text-white text-xs max-w-[140px]">
                    <p>Hi</p>
                    <div className="flex items-center justify-end gap-1 text-[8px] text-zinc-400 mt-1">
                      <span>12:00</span>
                      <Check className="w-2.5 h-2.5 text-brand" />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white max-w-[220px]">
                  <div className="border-l-2 border-brand pl-2 mb-1.5">
                    <p className="text-[10px] font-bold text-brand">Rockyt Bot</p>
                    <p className="text-[9px] text-zinc-400">Hi</p>
                  </div>
                  <p className="font-semibold text-zinc-100">Hello!</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">This is a test message to try your flow.</p>
                  <span className="text-[8px] text-zinc-500 float-right mt-1">12:00</span>
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-base font-semibold leading-5 text-white">Send your first message</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              One POST request sends templates, media, voice notes, or interactive messages the same simple way every time.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="flex flex-col">
            <div className="relative h-[310px] overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col justify-between shadow-xl">
              <span className="flex shrink-0 items-center justify-center self-start font-mono h-10 w-10 rounded-2xl bg-white text-sm font-bold text-zinc-900 shadow-md">
                3
              </span>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Conversations</p>
                
                <div className="flex items-center gap-2 bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">Ò</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white">Òscar</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">All works!</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">W</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-300">WhatsApp Bus...</p>
                    <p className="text-[10px] text-zinc-500 truncate">Hey, I have a question...</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-base font-semibold leading-5 text-white">Every reply in one inbox</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Replies land in a shared inbox for your team, and every message tracks sent, delivered, and read status automatically.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Services;