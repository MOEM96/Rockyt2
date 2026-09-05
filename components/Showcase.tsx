import React from 'react';
import { MessageSquare, Phone, Inbox, Bot, Users, Megaphone, Terminal, Zap, Check, ArrowRight } from 'lucide-react';

interface ShowcaseProps {
  onStartOnboarding?: () => void;
}

const Showcase: React.FC<ShowcaseProps> = ({ onStartOnboarding }) => {
  const featureList = [
    {
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      title: "Messaging & Broadcasts",
      description: "Send to one person, a segmented group, or broadcast to thousands. Schedule delivery, track reads per recipient, and auto-manage opt-outs."
    },
    {
      icon: <Phone className="w-5 h-5 text-emerald-600" />,
      title: "Voice & Calling",
      description: "Take and place calls on verified WhatsApp Business. Route to human support lines, SIP trunks, or AI voice agents."
    },
    {
      icon: <Inbox className="w-5 h-5 text-emerald-600" />,
      title: "Shared Team Inbox",
      description: "Every customer reply in one organized workspace. Multi-agent routing, collision detection, internal mentions, and canned responses."
    },
    {
      icon: <Bot className="w-5 h-5 text-emerald-600" />,
      title: "Astra AI Agents",
      description: "Build autonomous chatbots that understand full context. Grounded in your knowledge base with seamless handoff to human staff."
    },
    {
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      title: "Smart Contacts CRM",
      description: "Maintain rich user profiles with custom attributes, behavioral tags, purchase histories, and verified opt-in tracking."
    },
    {
      icon: <Megaphone className="w-5 h-5 text-emerald-600" />,
      title: "Click-to-WhatsApp Ads",
      description: "Turn Meta ad clicks into active WhatsApp conversations. Send purchase events back to Meta CAPI for optimal ad attribution."
    }
  ];

  return (
    <div className="space-y-20 py-16 bg-[#fafbfc] relative z-10 border-b border-gray-100">
      
      {/* ─── SECTION: FULL API & PLATFORM SURFACE (#features) ─── */}
      <section className="scroll-mt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="flex flex-col gap-3 px-6 pb-12 items-center text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
              Comprehensive Platform
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-gray-900">
              Everything you need to scale on WhatsApp
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Enterprise-grade reliability, compliance, and intuitive tools built for high-growth teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((f, idx) => (
              <div 
                key={idx}
                className="flex flex-col p-7 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── SECTION: DEVELOPER & AI AGENT APIS ─── */}
      <section className="scroll-mt-32 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                  Developer &amp; AI Friendly
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">
                  Integrate via REST API, Webhooks, or MCP Server
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Power your internal workflows with robust webhooks, pre-built client SDKs, or directly connect Claude, Cursor, and autonomous AI agents using our native Model Context Protocol (MCP) server.
                </p>
                <div className="pt-2">
                  <button
                    onClick={onStartOnboarding}
                    className="inline-flex items-center gap-2 rounded-full bg-[#00D084] hover:bg-[#00be77] text-[#07301f] font-bold text-sm px-6 py-3 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <span>Get API Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#0f172a] rounded-2xl p-6 text-gray-200 font-mono text-xs shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-gray-400 text-[11px]">
                  <span>bash — cURL</span>
                  <span className="text-emerald-400">POST /api/whatsapp/messages/send</span>
                </div>
                <div className="text-gray-400"># Send high-speed WhatsApp template message</div>
                <div className="text-emerald-400">curl -X POST https://api.rockyt.io/v1/messages \</div>
                <div className="pl-4 text-gray-300">-H "Authorization: Bearer rockyt_key_live" \</div>
                <div className="pl-4 text-gray-300">-H "Content-Type: application/json" \</div>
                <div className="pl-4 text-amber-300">-d '&#123; "to": "+12029087457", "template": "order_confirmed" &#125;'</div>
                <div className="text-gray-500 pt-2 border-t border-gray-800">
                  Response: &#123; "status": "sent", "message_id": "wamid.HBgL...", "delivered": true &#125;
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Showcase;