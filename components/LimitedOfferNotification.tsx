import React from 'react';

const LimitedOfferNotification: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full px-4 pointer-events-none flex justify-center">
       <div className="bg-[#121212]/90 border border-brand-yellow/30 p-1.5 pr-4 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-fade-in-up backdrop-blur-md pointer-events-auto w-auto max-w-full">
            {/* Icon */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand-yellow to-[#FFAE00] flex items-center justify-center text-black shadow-lg shrink-0">
                <iconify-icon icon="solar:gift-bold" width="18" class="text-sm md:text-base"></iconify-icon>
            </div>
            
            {/* Text */}
            <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Limited Offer</span>
                <span className="text-xs md:text-sm font-bold text-white leading-none whitespace-nowrap">
                    Book & Get <span className="text-brand-yellow">$100 Ad Credit</span>
                </span>
            </div>

            {/* Checkmark (Visual confirmation) */}
            <div className="ml-1 md:ml-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 flex items-center justify-center text-green-400 border border-white/5">
                 <iconify-icon icon="solar:check-circle-bold" class="text-xs md:text-sm"></iconify-icon>
            </div>
       </div>
    </div>
  );
};

export default LimitedOfferNotification;