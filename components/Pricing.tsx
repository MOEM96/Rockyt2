import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface PricingProps {
  onStartOnboarding?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onStartOnboarding }) => {
  const priceRows = [
    {
      price: "$3",
      countries: ["United States", "United Kingdom", "Germany", "France", "Spain", "Canada", "Italy", "Ireland"]
    },
    {
      price: "$4",
      countries: ["Brazil", "Estonia", "Croatia", "Puerto Rico", "Netherlands"]
    },
    {
      price: "$6",
      countries: ["Mexico", "Singapore", "Cyprus"]
    },
    {
      price: "$7",
      countries: ["Australia", "Iceland"]
    },
    {
      price: "$11",
      countries: ["Poland", "Sweden", "South Africa", "Panama"]
    },
    {
      price: "$16–$21",
      countries: ["Georgia", "Thailand", "Colombia", "Indonesia"]
    }
  ];

  return (
    <section id="pricing" className="scroll-mt-32 py-20 relative z-10">
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col items-center gap-4 text-center max-w-3xl mx-auto mb-12">
          <span className="font-mono text-sm font-bold text-brand uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Meta's rates, zero markup
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            You pay Rockyt only for connected accounts and the number itself. Everything the API does is free. Meta bills the message directly, at their rate.
          </p>
        </div>

        {/* 2 MAIN PRICING PILLS */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-14 max-w-2xl mx-auto">
          <div className="flex-1 rounded-2xl p-6 bg-brand/10 border border-brand/30 text-brand text-center flex flex-col justify-center">
            <p className="text-2xl font-black mb-1">$0 /account</p>
            <p className="text-sm font-medium text-brand/90">first 2, then graduated</p>
          </div>

          <div className="flex-1 rounded-2xl p-6 bg-zinc-900/90 border border-zinc-800 text-white text-center flex flex-col justify-center">
            <p className="text-2xl font-black mb-1">$3 /number</p>
            <p className="text-sm font-medium text-zinc-400">optional, if bought here</p>
          </div>
        </div>

        {/* NUMBER PRICING BY COUNTRY TABLE */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8">
          <p className="text-center text-base font-bold text-white mb-6">
            Example number pricing by country
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider pb-2 border-b border-zinc-800">
              <span className="w-24 sm:w-36">Monthly Price</span>
              <span className="flex-1">Example Countries</span>
            </div>

            {priceRows.map((row, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between gap-4 py-3 border-b border-zinc-800/60 last:border-0"
              >
                <span className="w-24 sm:w-36 font-mono font-bold text-brand text-sm sm:text-base">
                  {row.price}
                </span>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {row.countries.map((c, i) => (
                    <span 
                      key={i} 
                      className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA BUTTON */}
        <div className="flex justify-center mt-10">
          <button
            onClick={onStartOnboarding}
            className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-base px-8 py-4 transition-all shadow-xl shadow-brand/25"
          >
            Connect my WhatsApp account <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Pricing;