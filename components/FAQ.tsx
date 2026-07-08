import React, { useState } from 'react';
import { HUB_FAQ_ITEMS } from '../constants/index';
import { FAQItem } from '../types/index';

const FAQItemComponent: React.FC<{ item: FAQItem; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border border-white/10 rounded-2xl bg-[#1A1A1A] overflow-hidden transition-all duration-300 hover:border-white/20">
            <button 
                onClick={onClick}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:bg-white/5"
                aria-expanded={isOpen}
            >
                <span className="font-bold text-white text-sm md:text-base pr-4 leading-snug">{item.question}</span>
                <div className={`flex-shrink-0 text-gray-400 transition-transform duration-300 flex items-center justify-center ${isOpen ? 'rotate-180 text-brand-yellow' : 'rotate-0'}`}>
                    <iconify-icon icon="solar:alt-arrow-down-bold" width="20"></iconify-icon>
                </div>
            </button>
            <div 
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-5 pt-0 text-sm text-gray-400 leading-relaxed border-t border-white/5">
                        {item.answer}
                    </div>
                </div>
            </div>
        </div>
    )
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split items into two columns for desktop
  const midPoint = Math.ceil(HUB_FAQ_ITEMS.length / 2);
  const leftColumn = HUB_FAQ_ITEMS.slice(0, midPoint);
  const rightColumn = HUB_FAQ_ITEMS.slice(midPoint);

  return (
    <div className="w-full bg-[#161616] py-20 px-4 md:px-6 border-t border-white/5">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
           <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Frequently Asked Questions</h2>
           <p className="text-gray-400 text-lg">Everything you need to know about Rockyt.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
                {leftColumn.map((item, i) => (
                    <FAQItemComponent 
                        key={i} 
                        item={item} 
                        isOpen={openIndex === i} 
                        onClick={() => toggleFAQ(i)} 
                    />
                ))}
            </div>
            
            {/* Column 2 */}
            <div className="flex flex-col gap-4">
                {rightColumn.map((item, i) => {
                    const actualIndex = i + midPoint;
                    return (
                        <FAQItemComponent 
                            key={actualIndex} 
                            item={item} 
                            isOpen={openIndex === actualIndex} 
                            onClick={() => toggleFAQ(actualIndex)} 
                        />
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;