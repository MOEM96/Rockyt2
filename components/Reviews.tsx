import React, { useState } from 'react';
import { Plus, X, Star, Quote, Award, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    quote: "Rockyt transformed our customer engagement. Our WhatsApp broadcast open rates consistently hit 98%, and our lead-to-sale velocity improved by 3.5x within the first month.",
    author: "Karim Mansour",
    role: "Head of Growth, RetailHub",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
    rating: 5,
    metric: "+340% Revenue"
  },
  {
    quote: "Astra AI agent answers 72% of inbound inquiries instantly without needing an agent. Our customer support CSAT jumped from 3.8 to 4.9 on G2.",
    author: "Elena Rostova",
    role: "VP of Customer Experience, EduTech Global",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    rating: 5,
    metric: "3.2s Response Time"
  },
  {
    quote: "Setting up Meta WhatsApp Business Account took literally 3 minutes with Rockyt's embedded signup. Zero waiting for approval, and our entire sales team was onboarded the same day.",
    author: "Marcus Chen",
    role: "Founder, OmniCommerce",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
    rating: 5,
    metric: "12,000+ Chats/mo"
  }
];

const faqData = [
  {
    question: "Do I need technical expertise or coding skills to use Rockyt?",
    answer: "Not at all! Rockyt provides an intuitive no-code interface for broadcasts, team inbox, chatbots, and contact management. You can connect your WhatsApp number and launch campaigns in minutes."
  },
  {
    question: "Does Rockyt connect to the official WhatsApp Business Cloud API?",
    answer: "Yes. Rockyt is an official Meta Business Solution Provider (BSP). All messaging uses official WhatsApp Cloud infrastructure, ensuring 100% compliance, maximum delivery rates, and green tick verification support."
  },
  {
    question: "Can multiple team members use the same WhatsApp phone number?",
    answer: "Yes! Rockyt's multi-agent shared inbox allows dozens or hundreds of team members to chat with customers simultaneously from one verified WhatsApp Business number, with automatic round-robin routing."
  },
  {
    question: "How does the Astra AI agent work with our existing business data?",
    answer: "You simply paste your website URL or upload your product catalog and support docs (PDF, Word, CSV). Astra uses advanced LLMs to answer customer queries with grounded accuracy and escalates to human agents when needed."
  },
  {
    question: "Can I connect Rockyt to Shopify, HubSpot, or our CRM?",
    answer: "Yes. Rockyt has native integrations with HubSpot, Salesforce, Shopify, WooCommerce, Zoho, Zapier, Make, and full REST API webhooks for seamless customer data synchronization."
  }
];

const Reviews: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section id="reviews" className="py-24 bg-white border-b border-gray-100 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Award size={13} /> Customer Reviews &amp; Recognition
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight">
            Loved by 16,000+ businesses in 190+ countries
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            See how high-performing commerce and support teams accelerate growth with Rockyt.
          </p>
        </div>

        {/* TESTIMONIALS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="p-7 rounded-3xl bg-[#fafbfc] border border-gray-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {t.metric}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200/60">
                <img 
                  src={t.avatar} 
                  alt={t.author} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <div className="font-bold text-gray-900 text-xs">{t.author}</div>
                  <div className="text-[11px] text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="rounded-3xl border border-gray-200 bg-gray-50/60 p-6 sm:p-12 max-w-4xl mx-auto shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Everything you need to know about getting started with Rockyt.
            </p>
          </div>

          <div className="divide-y divide-gray-200/80 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors hover:bg-gray-50/50">
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                      {isOpen ? <X className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-gray-600 border-t border-gray-50">
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
