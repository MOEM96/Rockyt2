import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Bot, Zap, Calculator, HelpCircle, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface PricingProps {
  onStartOnboarding?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onStartOnboarding }) => {
  // Interactive Calculator State
  const [accountCount, setAccountCount] = useState<number>(12);
  const [activeDays, setActiveDays] = useState<number>(30);

  // Billing Math Engine matching rebrand.md specs exactly
  const totalAccountDays = accountCount * activeDays;
  const billableUnits = totalAccountDays / 30;

  let grossTotal = 0;
  let tier1Cost = 0;
  let tier2Cost = 0;
  let tier3Cost = 0;

  if (billableUnits <= 10) {
    tier1Cost = billableUnits * 6;
    grossTotal = tier1Cost;
  } else if (billableUnits <= 100) {
    tier1Cost = 10 * 6; // $60
    tier2Cost = (billableUnits - 10) * 3;
    grossTotal = tier1Cost + tier2Cost;
  } else {
    tier1Cost = 10 * 6; // $60
    tier2Cost = 90 * 3; // $270
    tier3Cost = (billableUnits - 100) * 1;
    grossTotal = tier1Cost + tier2Cost + tier3Cost;
  }

  const freeCredit = 12.0;
  const netInvoice = Math.max(0, grossTotal - freeCredit);

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 bg-paper text-ink relative z-10">
      {/* Sawtooth Top Border */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgPHBhdGggZD0iTTAgMjAgTDEwIDAgTDIwIDIwIFoiIGZpbGw9IiMxMTExMTEiLz4KPC9zdmc+')] repeat-x opacity-15"></div>

      <div className="max-w-6xl mx-auto pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 border-b-2 border-ink pb-6">
          <div>
            <span className="font-mono text-xs text-brand font-bold tracking-widest uppercase">// GRADUATED METERED PRICING</span>
            <h2 className="font-display font-bold text-5xl sm:text-6xl uppercase tracking-tight">
              PRICING &amp; <span className="text-brand">USAGE MATH</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/80 max-w-sm mt-3 md:mt-0 leading-relaxed">
            Pay only for active account-days with automatic graduated volume discounts and $12/mo free credits.
          </p>
        </div>

        {/* Tier Ladder Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tier 1 */}
          <div className="bg-white border-2 border-ink p-6 relative hover:shadow-hard transition-all">
            <span className="font-mono text-[10px] bg-ink text-white px-2 py-0.5 font-bold uppercase tracking-wider">
              TIER 1 (1 - 10 ACCOUNTS)
            </span>
            <div className="mt-4 mb-2">
              <span className="font-display font-bold text-4xl text-ink">$6.00</span>
              <span className="font-mono text-xs text-ink/70"> / account / mo</span>
            </div>
            <p className="font-mono text-xs text-ink/80 leading-relaxed mb-4">
              Includes $12.00 free monthly credit (covers your first 2 connected accounts completely free).
            </p>
            <ul className="font-mono text-xs space-y-2 text-ink/90 border-t border-ink/10 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Daily proration meter</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> 16 Platforms REST API &amp; MCP</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Zero setup or lock-in fees</li>
            </ul>
          </div>

          {/* Tier 2 */}
          <div className="bg-white border-2 border-ink p-6 relative hover:shadow-hard transition-all">
            <div className="tape tape-pink w-24 -top-3 left-1/2 -translate-x-1/2 rotate-2"></div>
            <span className="font-mono text-[10px] bg-brand text-white px-2 py-0.5 font-bold uppercase tracking-wider">
              TIER 2 (11 - 100 ACCOUNTS)
            </span>
            <div className="mt-4 mb-2">
              <span className="font-display font-bold text-4xl text-brand">$3.00</span>
              <span className="font-mono text-xs text-ink/70"> / account / mo</span>
            </div>
            <p className="font-mono text-xs text-ink/80 leading-relaxed mb-4">
              50% volume discount applied automatically to all account units above 10.
            </p>
            <ul className="font-mono text-xs space-y-2 text-ink/90 border-t border-ink/10 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Priority Webhook Queue</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Native WhatsApp &amp; Ad Workflows</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Advanced Multi-Agent Workspaces</li>
            </ul>
          </div>

          {/* Tier 3 */}
          <div className="bg-zinc-950 text-white border-2 border-ink p-6 relative hover:shadow-hard transition-all">
            <span className="font-mono text-[10px] bg-white text-ink px-2 py-0.5 font-bold uppercase tracking-wider">
              TIER 3 (101+ ACCOUNTS)
            </span>
            <div className="mt-4 mb-2">
              <span className="font-display font-bold text-4xl text-white">$1.00</span>
              <span className="font-mono text-xs text-white/70"> / account / mo</span>
            </div>
            <p className="font-mono text-xs text-white/80 leading-relaxed mb-4">
              Maximum scale tier. Uncapped volume discount for enterprise agent networks.
            </p>
            <ul className="font-mono text-xs space-y-2 text-white/90 border-t border-white/10 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Dedicated MCP Infrastructure</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> Custom SLA &amp; VPC Peering</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /> 24/7 Priority Support</li>
            </ul>
          </div>
        </div>

        {/* Interactive Proration & Invoice Calculator */}
        <div className="bg-white border-2 border-ink p-6 sm:p-8 shadow-hard mb-12">
          <div className="flex items-center gap-3 border-b-2 border-ink pb-4 mb-6">
            <div className="p-2 bg-brand text-white border border-ink">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl uppercase">INTERACTIVE INVOICE CALCULATOR</h3>
              <p className="font-mono text-xs text-ink/70">Calculate exact billable units, daily proration &amp; monthly net total</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-xs font-bold uppercase text-ink">
                    Connected Accounts: <span className="text-brand font-display text-lg">{accountCount}</span>
                  </label>
                  <span className="font-mono text-[10px] text-ink/60">1 - 250 Accounts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="250"
                  value={accountCount}
                  onChange={(e) => setAccountCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 accent-brand rounded-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-xs font-bold uppercase text-ink">
                    Active Days per Month: <span className="text-brand font-display text-lg">{activeDays} days</span>
                  </label>
                  <span className="font-mono text-[10px] text-ink/60">1 - 30 Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={activeDays}
                  onChange={(e) => setActiveDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 accent-brand rounded-none cursor-pointer"
                />
              </div>

              {/* Math Formula Card */}
              <div className="bg-zinc-100 p-4 border border-ink/20 font-mono text-xs space-y-1.5">
                <div className="text-brand font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} /> Proration Formula Mechanics
                </div>
                <div>Account Days = {accountCount} accounts × {activeDays} days = <strong className="text-ink">{totalAccountDays} account-days</strong></div>
                <div>Billable Units = {totalAccountDays} ÷ 30 = <strong className="text-ink">{billableUnits.toFixed(2)} units</strong></div>
              </div>
            </div>

            {/* Invoice Computation Summary */}
            <div className="lg:col-span-5 bg-zinc-950 text-white p-6 border-2 border-ink space-y-4">
              <span className="font-mono text-[10px] text-brand font-bold tracking-widest uppercase">// ITEMIZED INVOICE BREAKDOWN</span>

              <div className="space-y-2 font-mono text-xs border-b border-white/10 pb-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Tier 1 (First 10 @ $6):</span>
                  <span>${tier1Cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Tier 2 (Next 90 @ $3):</span>
                  <span>${tier2Cost.toFixed(2)}</span>
                </div>
                {tier3Cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Tier 3 (100+ @ $1):</span>
                    <span>${tier3Cost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand pt-1 font-bold">
                  <span>Gross Monthly Total:</span>
                  <span>${grossTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Free Tier Credit:</span>
                  <span>-${freeCredit.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="font-mono text-[10px] text-white/60 uppercase block">Estimated Net Invoice</span>
                  <span className="font-display font-bold text-4xl text-white">${netInvoice.toFixed(2)}</span>
                </div>
                <span className="font-mono text-[11px] text-brand bg-brand/10 border border-brand/40 px-2 py-1">
                  / MONTH
                </span>
              </div>

              <button
                onClick={onStartOnboarding}
                className="w-full mt-4 bg-brand text-white font-mono text-xs py-3 uppercase tracking-wider font-bold hover:bg-white hover:text-ink transition-colors flex items-center justify-center gap-2 border border-brand"
              >
                Start Free &amp; Connect Accounts <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Common Questions & Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-100 p-6 border-2 border-ink font-mono text-xs">
          <div>
            <h4 className="font-display font-bold text-lg text-ink uppercase mb-2">HOW DAILY PRORATION WORKS</h4>
            <p className="text-ink/80 leading-relaxed">
              Every day, Rockyt meters active accounts. An account connected for 15 days out of a 30-day month incurs exactly 0.5 billable units. You are never billed for full monthly snapshots if you disconnect mid-month.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold text-lg text-ink uppercase mb-2">AUTOMATIC FRAUD PROTECTION &amp; STRIPE</h4>
            <p className="text-ink/80 leading-relaxed">
              Invoicing is processed automatically via Stripe. New accounts start with a small threshold charge ($10) that doubles as payment history is established, reducing billing friction and ensuring instant API access.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;