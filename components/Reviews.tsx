import React from 'react';
import { CheckCircle2, Star, Quote } from 'lucide-react';

const reviewsData = [
  {
    id: 1,
    quote: "I integrated Rockyt's API and MCP into my Claude Copilot and Claude Code setup, and it filled a gap I'd been working around for a while.",
    name: "Elena Zarino",
    role: "Web Developer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 2,
    quote: "We're integrating Rockyt into our coaching app's WhatsApp inbox and love how clean the SDK is. Thank you for that.",
    name: "Leon",
    role: "Founder, Moving Monkey",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 3,
    quote: "We'd been using the HighLevel API for social posting, every post stuck in draft, a lot of hassle. Rockyt has been a breeze to work with.",
    name: "Justin",
    role: "Founder, StandoutResults",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 4,
    quote: "It works flawlessly now. Superb, as always. You and the team rock, keep up the amazing work.",
    name: "Marko",
    role: "Developer, Meta Ads API",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 5,
    quote: "I use Rockyt for my SaaS purplepalm.ai. Integration was incredibly easy - had everything up and running in less than an hour. The API is super straightforward.",
    name: "Razvan Ghetiu",
    role: "Founder, purplepalm.ai",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 6,
    quote: "I love the speed and quality here, the API is awesome. I've never seen anyone ship integrations this fast.",
    name: "Dev Singh",
    role: "Founder, ad-attribution SaaS",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 7,
    quote: "Rockyt makes programmatic multi-platform posting as simple as I've ever seen it. The API is straightforward, well-documented, and it just works.",
    name: "Jim",
    role: "Developer",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 8,
    quote: "I'm building captureflow.ai on Rockyt and I love the platform. Super happy to be using you guys.",
    name: "Chris",
    role: "Founder, captureflow.ai",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80"
  },
  {
    id: 9,
    quote: "I spent a long time looking for a simple way to integrate a self-hosted stack. Rockyt was just perfect, and I highly recommend it.",
    name: "Zahareus",
    role: "Developer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80"
  }
];

const Reviews: React.FC = () => {
  return (
    <section id="reviews" className="py-28 px-4 sm:px-6 bg-zinc-950/75 backdrop-blur-md text-white relative z-10 border-y border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-xs text-brand tracking-widest uppercase font-semibold">// VERIFIED BUILDER FEEDBACK</span>
          <h2 className="font-display font-semibold text-5xl sm:text-6xl uppercase tracking-tight mt-1 text-white">
            DEVELOPER <span className="text-brand">REVIEWS</span>
          </h2>
          <p className="font-mono text-xs text-white/70 max-w-lg mx-auto mt-3">
            Here is what founders, AI engineers, and SaaS builders say about shipping with Rockyt API &amp; MCP.
          </p>
        </div>

        {/* 3x3 Review Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewsData.map((rev) => (
            <div 
              key={rev.id}
              className="bg-zinc-900/80 border border-white/20 p-6 shadow-2xl backdrop-blur-sm hover:-translate-y-1 hover:border-brand/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="mb-6">
                <Quote className="w-6 h-6 text-brand/40 mb-3 group-hover:text-brand transition-colors" />
                <p className="font-mono text-xs text-white/80 leading-relaxed">
                  "{rev.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-white/10 pt-4 mt-auto">
                <img 
                  src={rev.avatar} 
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/20 grayscale group-hover:grayscale-0 transition-all"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="font-mono font-bold text-xs text-white">{rev.name}</h4>
                    <span className="w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm" title="Verified Builder">
                      ✓
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/60">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
