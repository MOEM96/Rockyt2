import React from 'react';
import { Plus, Hash, Check, Sparkles, Send, ArrowRight, ShieldCheck, Phone } from 'lucide-react';

interface ServicesProps {
  onStartOnboarding?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onStartOnboarding }) => {
  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-gray-100 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col gap-3 max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
            Easy Onboarding
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight">
            Go live with WhatsApp Business in 3 simple steps
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            No complex developer setups or lengthy wait times. Connect your phone number and start chatting in minutes.
          </p>
        </div>

        {/* 3-STEP GRID */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* STEP 1 */}
          <div className="flex flex-col bg-gray-50/70 rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center justify-center font-bold text-base h-11 w-11 rounded-2xl bg-[#00D084] text-[#08301f] shadow-md shadow-emerald-500/20">
                1
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                Step 01
              </span>
            </div>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Connect Phone Number</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use your existing business number or generate a dedicated virtual SIM.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Meta WABA Verified</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Embedded Signup takes care of verification and tier limit provisioning.</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Connect in 2 Minutes</h3>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                Connect your Meta WhatsApp Business Account with zero friction and unlock full broadcast &amp; API access.
              </p>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="flex flex-col bg-gray-50/70 rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center justify-center font-bold text-base h-11 w-11 rounded-2xl bg-[#00D084] text-[#08301f] shadow-md shadow-emerald-500/20">
                2
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                Step 02
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  <span className="text-sm font-bold text-gray-900">Configure Astra AI</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload company FAQs and website URL so your AI agent speaks your tone.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Add Sales &amp; Support Team</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Invite agents to the shared inbox with custom roles and department tags.</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Automate Inbound Leads</h3>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                Set up automated greetings, away messages, and intelligent AI auto-resolvers that work 24/7.
              </p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="flex flex-col bg-gray-50/70 rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center justify-center font-bold text-base h-11 w-11 rounded-2xl bg-[#00D084] text-[#08301f] shadow-md shadow-emerald-500/20">
                3
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                Step 03
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Broadcast Campaigns</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Import contacts from CSV or CRM and launch interactive template messages.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Track ROAS &amp; Conversions</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Real-time delivery, read receipts, replies, and revenue attribution.</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Broadcast &amp; Convert</h3>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                Send targeted campaigns that drive immediate engagement, repeat purchases, and higher customer lifetime value.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM CTA BANNER */}
        <div className="mt-16 p-8 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h4 className="text-xl sm:text-2xl font-bold text-emerald-950">
              Ready to explore your Rockyt workspace?
            </h4>
            <p className="text-sm text-emerald-800 mt-1">
              Join over 16,000 growing companies worldwide. No credit card required.
            </p>
          </div>

          <button
            onClick={onStartOnboarding}
            className="px-8 py-3.5 rounded-full bg-[#00D084] text-[#07301f] hover:bg-[#00be77] font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all shrink-0 flex items-center gap-2"
          >
            <span>Start 7-Day Free Trial</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Services;