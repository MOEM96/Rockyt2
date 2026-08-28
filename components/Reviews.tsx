import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const faqData = [
  {
    question: "Do I need to pass Meta's App Review?",
    answer: "No. Embedded Signup handles Meta's verification flow seamlessly in the background so you can start sending messages immediately without waiting weeks for app review approval."
  },
  {
    question: "Does Rockyt use the official WhatsApp Business API?",
    answer: "Yes. Rockyt connects directly to the official Meta WhatsApp Cloud API infrastructure, ensuring 100% compliance, maximum delivery rates, and official WABA verification."
  },
  {
    question: "How much does the WhatsApp Business API cost?",
    answer: "You pay Rockyt only for connected accounts and phone numbers ($0 for the first 2 accounts). Meta bills conversation categories directly at their standard rates with zero markup."
  },
  {
    question: "Can I connect multiple WhatsApp numbers?",
    answer: "Yes. You can connect and manage multiple WhatsApp Business phone numbers across different brands, countries, or departments under one unified API key."
  },
  {
    question: "How does Rockyt handle the 24-hour messaging window?",
    answer: "Within 24 hours of a customer's inbound message, you can send free-form text, media, interactive buttons, or voice notes. Outside the 24-hour window, you can send pre-approved WhatsApp templates."
  },
  {
    question: "How does pricing compare to Twilio?",
    answer: "Unlike Twilio which adds substantial per-message markup fees on top of Meta's rates, Rockyt charges zero per-message markup. You get full WhatsApp Business Cloud API access at direct Meta costs."
  }
];

const Reviews: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="scroll-mt-32 py-20 relative z-10">
      <div className="mx-auto w-full max-w-[1080px] px-6 lg:px-8">
        
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          
          {/* LEFT TITLE */}
          <div className="p-8 lg:p-12 lg:w-1/3 lg:border-r border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-brand uppercase tracking-wider block mb-2">
                Knowledge Base
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-6 lg:mt-0 font-medium">
              Everything you need to know about the WhatsApp Business API integration.
            </p>
          </div>

          {/* RIGHT ACCORDION */}
          <div className="flex-1 divide-y divide-zinc-800/80">
            {faqData.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className="transition-colors hover:bg-zinc-800/30">
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="text-base font-semibold text-white">
                      {faq.question}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                      {isOpen ? <X className="w-4 h-4 text-brand" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm leading-relaxed text-zinc-400">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default Reviews;
