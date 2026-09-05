import React from 'react';

const PartnerLogos: React.FC = () => {
  const brands = [
    { name: "TikTok", category: "Social Tech" },
    { name: "L'Oréal", category: "Beauty Global" },
    { name: "Oppo", category: "Smartphones" },
    { name: "Gojek", category: "SuperApp" },
    { name: "Dukaan", category: "E-Commerce" },
    { name: "Delivery Hero", category: "Logistics" },
    { name: "Xiaomi", category: "Electronics" },
    { name: "Sephora", category: "Retail" }
  ];

  return (
    <section id="partners" className="py-12 border-y border-gray-100 bg-white relative z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
          Trusted by 16,000+ high-growth brands in 190+ countries
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-75 hover:opacity-100 transition-opacity">
          {brands.map((b, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-2 text-gray-700 hover:text-[#00D084] transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight">
                {b.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerLogos;
