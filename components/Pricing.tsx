import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface PricingProps {
  onStartOnboarding?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onStartOnboarding }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  return (
    <section id="pricing" className="py-24 bg-[#fafbfc] border-b border-gray-100 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HEADER */}
        <div className="flex flex-col items-center gap-4 text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-gray-900">
            Simple plans that grow with your business
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            All plans include access to official WhatsApp Cloud API, shared team inbox, and broadcast automation.
          </p>

          {/* BILLING TOGGLE */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full bg-gray-200/70 border border-gray-300/60 mt-2">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">20% OFF</span>
            </button>
          </div>
        </div>

        {/* 3 PRICING TIERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* TIER 1: GROWTH */}
          <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">Growth</div>
              <p className="text-xs text-gray-500 mt-1">For startups and small businesses getting started with WhatsApp.</p>
              
              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 font-display">
                    {billingPeriod === 'annual' ? '$39' : '$49'}
                  </span>
                  <span className="text-xs text-gray-500">/month</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Includes 1,000 active contacts</div>
              </div>

              <div className="space-y-3 text-xs text-gray-700 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>5 Multi-Agent Team Inbox seats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Unlimited Broadcasts &amp; Templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Standard Chatbot Rule Builder</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Click-to-WhatsApp Ads tracking</span>
                </div>
              </div>
            </div>

            <button
              onClick={onStartOnboarding}
              className="mt-8 w-full py-3 rounded-full border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm shadow-xs transition-all"
            >
              Start Free Trial
            </button>
          </div>

          {/* TIER 2: PRO (POPULAR) */}
          <div className="rounded-3xl bg-white border-2 border-[#00D084] p-8 shadow-xl relative flex flex-col justify-between hover:scale-[1.02] transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#00D084] text-[#07301f] text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles size={12} /> MOST POPULAR
            </div>

            <div>
              <div className="text-lg font-bold text-gray-900">Pro</div>
              <p className="text-xs text-gray-500 mt-1">For growing teams requiring autonomous AI agents &amp; CRM integrations.</p>
              
              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 font-display">
                    {billingPeriod === 'annual' ? '$79' : '$99'}
                  </span>
                  <span className="text-xs text-gray-500">/month</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Includes 5,000 active contacts</div>
              </div>

              <div className="space-y-3 text-xs text-gray-700 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span><strong>Astra AI Copilot</strong> with custom knowledge base</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>10 Multi-Agent Team Inbox seats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Meta Conversions API (CAPI) sync</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>HubSpot, Shopify &amp; Zapier connectors</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Green Tick Official Verification assistance</span>
                </div>
              </div>
            </div>

            <button
              onClick={onStartOnboarding}
              className="mt-8 w-full py-3 rounded-full bg-[#00D084] text-[#07301f] hover:bg-[#00be77] font-bold text-sm shadow-md shadow-emerald-500/25 transition-all"
            >
              Start 7-Day Free Trial
            </button>
          </div>

          {/* TIER 3: BUSINESS */}
          <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">Business</div>
              <p className="text-xs text-gray-500 mt-1">For scale-ups and high-volume messaging enterprises.</p>
              
              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 font-display">
                    {billingPeriod === 'annual' ? '$239' : '$299'}
                  </span>
                  <span className="text-xs text-gray-500">/month</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Includes 25,000 active contacts</div>
              </div>

              <div className="space-y-3 text-xs text-gray-700 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Unlimited Team Inbox seats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>High-throughput WhatsApp Cloud API rate limits</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Dedicated Customer Success Manager</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Custom IP whitelisting &amp; SLA guarantee</span>
                </div>
              </div>
            </div>

            <button
              onClick={onStartOnboarding}
              className="mt-8 w-full py-3 rounded-full border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm shadow-xs transition-all"
            >
              Talk to Enterprise Sales
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Pricing;