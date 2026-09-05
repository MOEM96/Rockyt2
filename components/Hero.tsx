import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, Star, ShieldCheck, Play, 
  Send, Bot, Users, MessageSquare, Sparkles, CheckCheck, TrendingUp, Zap
} from 'lucide-react';

interface HeroProps {
  onStart?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [activeTab, setActiveTab] = useState<'marketing' | 'sales' | 'support'>('marketing');

  return (
    <section id="rockyt-hero" className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#f4fbf7]/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        
        {/* TOP PILL BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse"></span>
          <span>Official Meta WhatsApp Business Solution Provider</span>
        </div>

        {/* HERO TITLE */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-gray-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
          The #1{' '}
          <span className="relative inline-block text-emerald-600 px-3 py-0.5 rounded-2xl bg-emerald-100/70 border border-emerald-200/60 rotate-[-1deg]">
            WhatsApp
          </span>
          <br className="hidden sm:inline" />{' '}
          <span className="relative inline-block text-emerald-700 px-3 py-0.5 rounded-2xl bg-emerald-100/70 border border-emerald-200/60 rotate-[1deg] mt-1 sm:mt-0">
            growth
          </span>{' '}
          platform
        </h1>

        {/* SUBTITLE */}
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
          From the first marketing touchpoint through the sales cycle to ongoing customer success, 
          Rockyt drives faster ROI with an easy-to-use, scalable AI-powered customer engagement platform.
        </p>

        {/* TRUST BADGES */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-7">
          <div className="px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-[#00D084]" />
            <span>Trusted by 16,000+ businesses worldwide</span>
          </div>

          <div className="px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <div className="flex items-center text-amber-400">
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
            </div>
            <span className="font-bold text-gray-900">4.6/5</span>
            <span className="text-gray-500">on G2 Leader 2026</span>
          </div>
        </div>

        {/* CTAS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-gray-300 text-gray-800 hover:border-gray-400 bg-white hover:bg-gray-50 font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Book a Demo</span>
          </button>

          <button
            onClick={onStart}
            className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-[#00D084] text-[#07301f] hover:bg-[#00be77] font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Try for Free</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500 font-medium">
          ✓ 7-day free trial • No credit card required • 2-minute setup
        </div>

        {/* ─── INTERACTIVE TABBED SHOWCASE (Marketing, Sales, Support) ─── */}
        <div className="mt-14 sm:mt-18 max-w-5xl mx-auto" id="video-tabbed-section">
          
          {/* TABS SWITCHER */}
          <div className="inline-flex p-1.5 rounded-full bg-gray-100/90 border border-gray-200/80 mb-6 shadow-inner">
            <button
              onClick={() => setActiveTab('marketing')}
              className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'marketing'
                  ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Marketing
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Support
            </button>
          </div>

          {/* TAB CONTENT CARDS */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-4 sm:p-8 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            {/* TAB 1: MARKETING */}
            {activeTab === 'marketing' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <Send size={12} /> Broadcast Campaigns
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Drive 4x higher revenue with personalized broadcasts
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Launch segmented promotional WhatsApp campaigns to thousands of verified contacts in seconds with rich media, discount buttons, and automatic opt-out handling.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-emerald-600">98%</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Open Rate</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-emerald-600">45%</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Click-through</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-emerald-600">3.8x</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">ROAS Boost</div>
                    </div>
                  </div>

                  <button
                    onClick={onStart}
                    className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group"
                  >
                    <span>Create your first broadcast</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* VISUAL PREVIEW MOCKUP */}
                <div className="lg:col-span-7 bg-[#f0f2f5] p-4 sm:p-6 rounded-2xl border border-gray-200">
                  <div className="bg-white rounded-xl shadow-md p-4 max-w-sm mx-auto border border-gray-200/80">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                          R
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            Rockyt Official Store
                            <CheckCheck size={12} className="text-blue-500" />
                          </div>
                          <div className="text-[10px] text-emerald-600">Online • Official Business</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">10:42 AM</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-xs text-gray-800 space-y-2">
                      <div className="font-bold text-emerald-900">🎉 Exclusive VIP Flash Sale</div>
                      <p>Hey Moamen! Get 25% off all summer collections with code <strong>VIP25</strong> today only.</p>
                      <div className="pt-1 flex flex-col gap-1.5">
                        <button className="w-full py-2 bg-[#00D084] text-[#07301f] rounded-lg font-bold text-xs text-center shadow-sm">
                          🛍️ Shop Collection (25% OFF)
                        </button>
                        <button className="w-full py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] text-center">
                          Chat with Stylist
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                      <span>✓✓ Read by recipient</span>
                      <span className="text-emerald-600 font-semibold">12,450 sent • 0 failed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SALES */}
            {activeTab === 'sales' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    <Zap size={12} /> Lead Capture &amp; CTWA Ads
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Turn Meta ads clicks into qualified buyers instantly
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Connect Instagram &amp; Facebook ads straight into conversational WhatsApp funnels. Qualify leads with automated questions and assign to agents in real time.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-blue-600">&lt;30s</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Response Time</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-blue-600">+68%</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Conversion Rate</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-blue-600">100%</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">CRM Sync</div>
                    </div>
                  </div>

                  <button
                    onClick={onStart}
                    className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group"
                  >
                    <span>Launch WhatsApp ad funnel</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="lg:col-span-7 bg-[#f0f2f5] p-4 sm:p-6 rounded-2xl border border-gray-200">
                  <div className="bg-white rounded-xl shadow-md p-4 max-w-sm mx-auto border border-gray-200/80 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-gray-900">Lead Inbound from Instagram Ad #492</span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg text-xs text-gray-700">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Auto-Qualification Bot</div>
                      <p className="mt-1">"What size team do you currently have?"</p>
                      <div className="mt-1.5 inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[11px]">
                        Customer selected: "10-50 agents"
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-emerald-600" />
                        <div>
                          <div className="font-bold text-emerald-900">Assigned to Account Exec</div>
                          <div className="text-[10px] text-emerald-700">HubSpot deal created: $2,400 MRR</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900 font-bold">LIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SUPPORT */}
            {activeTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider">
                    <Bot size={12} /> Astra AI Customer Agent
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Resolve 70% of support tickets automatically 24/7
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Deploy an intelligent AI agent trained on your knowledge base. Astra answers customer inquiries instantly with perfect brand tone and escalates complex issues effortlessly.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-purple-600">3.2s</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Avg Resolution</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-purple-600">72%</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Deflection Rate</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xl font-extrabold text-purple-600">24/7</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">Availability</div>
                    </div>
                  </div>

                  <button
                    onClick={onStart}
                    className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group"
                  >
                    <span>Test your Astra AI agent</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="lg:col-span-7 bg-[#f0f2f5] p-4 sm:p-6 rounded-2xl border border-gray-200">
                  <div className="bg-white rounded-xl shadow-md p-4 max-w-sm mx-auto border border-gray-200/80 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Sparkles size={14} className="text-purple-600" />
                      <span className="text-xs font-bold text-gray-900">Astra AI Support Session</span>
                      <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Autonomous</span>
                    </div>

                    <div className="bg-gray-100 p-2.5 rounded-xl text-xs text-gray-800 ml-6">
                      <div className="text-[10px] text-gray-400">Customer</div>
                      "Where is order #WT-9481? Can I reschedule delivery for Friday?"
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-gray-900 mr-4 border border-emerald-200/70">
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <Bot size={10} /> Astra AI Agent
                      </div>
                      <p className="mt-1">
                        "Your package is out for delivery! I have updated your delivery slot to <strong>Friday, 2 PM - 5 PM</strong> with courier tracking link: rockyt.delivery/9481"
                      </p>
                    </div>

                    <div className="text-[11px] text-emerald-700 font-semibold text-center bg-emerald-50/50 py-1.5 rounded-lg">
                      ✓ Resolved in 2.8 seconds • CSAT 5/5 ⭐
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;