import React from 'react';
import { 
  Check, X, Zap, ShieldCheck, Send, MessageSquare, Bot, 
  ArrowRight, BarChart3, Database, Globe2
} from 'lucide-react';

const WhyRockyt: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-[#fafbfc] border-b border-gray-200/80 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap size={13} /> WhatsApp at the Core
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight">
            Designed for revenue teams who demand scale and speed
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Wati replaces fragmented chat tools with a unified customer engagement engine built on the official Meta WhatsApp Business Cloud infrastructure.
          </p>
        </div>

        {/* 4 FEATURE PILLARS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* PILLAR 1 */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Send size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              High-Velocity Broadcasts
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Reach millions of opted-in customers with rich media, interactive CTA buttons, and 98% guaranteed deliverability.
            </p>
            <div className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>98% open rates</span>
            </div>
          </div>

          {/* PILLAR 2 */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Multi-Agent Team Inbox
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Shared team inbox with round-robin assignments, agent permissions, canned responses, and internal notes.
            </p>
            <div className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
              <span>Zero dropped tickets</span>
            </div>
          </div>

          {/* PILLAR 3 */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Bot size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Astra AI Copilot
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Autonomous AI agent answering customer FAQs, qualifying high-value leads, and booking appointments 24/7.
            </p>
            <div className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
              <span>70% auto-resolution</span>
            </div>
          </div>

          {/* PILLAR 4 */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Database size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Deep CRM &amp; App Sync
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Native bidirectional sync with HubSpot, Salesforce, Shopify, Zoho, and Webhooks for event-driven automation.
            </p>
            <div className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1">
              <span>2,000+ integrations</span>
            </div>
          </div>

        </div>

        {/* 2-COLUMN COMPARISON (WATI VS LEGACY / IN-HOUSE) */}
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          
          {/* LEFT: WATI */}
          <div className="rounded-3xl border-2 border-[#00D084] bg-white p-7 sm:p-9 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-2xl tracking-tight text-gray-900">wati</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">RECOMMENDED</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Turnkey AI Customer Engagement Platform</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#00D084] flex items-center justify-center text-white shadow-md">
                <ShieldCheck size={22} />
              </div>
            </div>

            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                </div>
                <div>
                  <strong className="text-gray-900">Instant Meta Cloud Onboarding:</strong> Go live in under 2 minutes with embedded signup without lengthy app reviews.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                </div>
                <div>
                  <strong className="text-gray-900">Official BSP Verification:</strong> Direct partnership with Meta ensures highest tier limits and green tick badge eligibility.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                </div>
                <div>
                  <strong className="text-gray-900">All-in-one Growth Suite:</strong> Broadcasts, collaborative inbox, Astra AI bot, WhatsApp catalog, and ad tracking included.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                </div>
                <div>
                  <strong className="text-gray-900">Dedicated Enterprise Support:</strong> 24/7 priority SLAs, onboarding specialists, and customer success management.
                </div>
              </li>
            </ul>
          </div>

          {/* RIGHT: MANUAL / LEGACY TOOLS */}
          <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-7 sm:p-9 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
              <div>
                <span className="font-bold text-xl text-gray-700">Generic APIs &amp; Legacy CRMs</span>
                <p className="text-xs text-gray-500 mt-0.5">Disjointed custom builds and rigid tools</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600">
                <X size={22} />
              </div>
            </div>

            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-gray-800">Weeks of Developer Engineering:</strong> Requiring custom servers, webhook endpoints, UI builders, and state machines.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-gray-800">No Multi-Agent Team UI:</strong> Agents are forced to use raw APIs or clunky third-party plugins with frequent disconnects.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-gray-800">Strict Meta App Approvals:</strong> High risk of account suspensions, missing 24h compliance windows, and complex policy reviews.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-gray-800">Hidden Markups &amp; Fees:</strong> Unpredictable egress charges, licensing markups, and zero proactive deliverability monitoring.
                </div>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WhyRockyt;
