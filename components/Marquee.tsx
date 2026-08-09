import React from 'react';

const Marquee: React.FC = () => {
  const channels = [
    "TWITTER / X",
    "INSTAGRAM",
    "WHATSAPP BUSINESS",
    "TIKTOK",
    "LINKEDIN",
    "DISCORD",
    "TELEGRAM",
    "THREADS",
    "META ADS API",
    "GOOGLE ADS API",
    "BLUESKY",
    "REDDIT",
    "MCP AGENT PROTOCOL",
  ];

  return (
    <div className="bg-brand text-white font-display font-bold text-3xl sm:text-4xl py-3 border-y-4 border-ink overflow-hidden whitespace-nowrap relative z-20 -rotate-1 origin-left scale-105 shadow-xl select-none flex">
      {/* Track 1 */}
      <div className="animate-marquee-continuous flex shrink-0 items-center gap-10 pr-10">
        {channels.map((channel, idx) => (
          <React.Fragment key={`c1-${idx}`}>
            <span>{channel}</span>
            <span className="text-black/50 font-mono text-xl">///</span>
          </React.Fragment>
        ))}
      </div>

      {/* Track 2 (Duplicate for infinite seamless loop) */}
      <div className="animate-marquee-continuous flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
        {channels.map((channel, idx) => (
          <React.Fragment key={`c2-${idx}`}>
            <span>{channel}</span>
            <span className="text-black/50 font-mono text-xl">///</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Marquee;