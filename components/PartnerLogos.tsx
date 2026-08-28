import React from 'react';

const PartnerLogos: React.FC = () => {
  const partners = [
    { name: "Warner Music Group", domain: "warnermusic.com" },
    { name: "ClickUp", domain: "clickup.com" },
    { name: "Vibiz", domain: "vibiz.com" },
    { name: "RE/MAX", domain: "remax.com" },
    { name: "Heymark", domain: "heymark.com" },
    { name: "Holo", domain: "holo.host" }
  ];

  return (
    <section className="py-10 border-y border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md relative z-20">
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-8">
          <p className="shrink-0 text-center text-sm font-medium tracking-[-0.03em] text-zinc-400 lg:text-left">
            Trusted by developers at
          </p>
          <div className="grid w-full grid-cols-2 items-center justify-items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:flex lg:flex-1 lg:justify-between">
            {partners.map((p, idx) => (
              <span 
                key={idx} 
                className="font-display font-black text-sm sm:text-base tracking-wider text-zinc-500 hover:text-white transition-colors uppercase"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerLogos;
