import React, { useState } from 'react';
import Button from './Button';
import { DemoBookingProps, CaseCategory } from '../types/index';
import { CASE_STUDIES, PLATFORM_ICONS, CAL_CONFIG } from '../constants/index';

const CasesPage: React.FC<DemoBookingProps> = ({ onBookDemo, onGetStarted }) => {
  const [filter, setFilter] = useState<CaseCategory>('all');

  const filteredCases = CASE_STUDIES.filter(
    cs => filter === 'all' || cs.category === filter
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-20">

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-20 md:pb-24 flex flex-col items-center text-center relative">
        <div className="relative z-10 w-full max-w-[800px]">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            From Struggling to Scaling:<br />Real Stories. Real Results.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide max-w-2xl mx-auto mb-12">
            See how brands and agencies are using Rockyt to 10x their results while working half as hard.
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-8" role="tablist" aria-label="Case study categories">
            <button
              role="tab"
              aria-selected={filter === 'all'}
              aria-controls="case-studies-grid"
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-yellow ${filter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              All case studies
            </button>
            <button
              role="tab"
              aria-selected={filter === 'agency'}
              aria-controls="case-studies-grid"
              onClick={() => setFilter('agency')}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-yellow ${filter === 'agency' ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              Agencies
            </button>
            <button
              role="tab"
              aria-selected={filter === 'ecom'}
              aria-controls="case-studies-grid"
              onClick={() => setFilter('ecom')}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-yellow ${filter === 'ecom' ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              eCommerce
            </button>
            <button
              role="tab"
              aria-selected={filter === 'app'}
              aria-controls="case-studies-grid"
              onClick={() => setFilter('app')}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-yellow ${filter === 'app' ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              Apps
            </button>
          </div>
        </div>
      </section>

      {/* Case Studies Grid - Fixed to 2 cols for better alignment matching source */}
      <div id="case-studies-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
        {filteredCases.map((cs) => {
          if (cs.size === 'big') {
            return (
              <div key={cs.id} className={`col-span-1 md:col-span-2 rounded-[32px] overflow-hidden flex flex-col md:flex-row ${cs.bgColor || 'bg-[#F3F5F7]'} ${cs.textColor || 'text-black'} group border border-transparent transition-all hover:shadow-2xl`}>
                {/* Image Side */}
                <div className="w-full md:w-5/12 relative bg-[#e0e0e0] overflow-hidden min-h-[300px] md:min-h-full">
                  <img
                    src={cs.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Content Side */}
                <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-between relative">
                  {/* Top: Logo & Platform Icons */}
                  <div className="flex justify-between items-start mb-6">
                    <img src={cs.logo} alt="Client Logo" className="h-8 md:h-10 w-auto object-contain object-left" style={cs.logoInvert ? { filter: 'brightness(0) invert(1)' } : {}} loading="lazy" decoding="async" />
                    <div className="flex gap-2">
                      {cs.platforms.map(p => (
                        <img key={p} src={PLATFORM_ICONS[p]} alt={p} className="w-6 h-6 md:w-8 md:h-8 opacity-70" loading="lazy" decoding="async" />
                      ))}
                    </div>
                  </div>

                  {/* Middle: Title */}
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 leading-[1.1] tracking-tight">{cs.title}</h3>

                  {/* Bottom: CTA */}
                  <div>
                    <button
                      data-cal-link={CAL_CONFIG.link}
                      data-cal-namespace={CAL_CONFIG.namespace}
                      data-cal-config={JSON.stringify(CAL_CONFIG.config)}
                      className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-black/80 transition-transform hover:-translate-y-1 inline-flex items-center gap-2 text-sm md:text-base"
                    >
                      Read case study <span className="text-xl">→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <a
                href="#"
                onClick={e => e.preventDefault()}
                key={cs.id}
                className="col-span-1 bg-[#1A1A1A] rounded-[32px] overflow-hidden flex flex-col group border border-white/5 hover:border-white/20 transition-all h-full relative focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                data-cal-link={CAL_CONFIG.link}
                data-cal-namespace={CAL_CONFIG.namespace}
                data-cal-config={JSON.stringify(CAL_CONFIG.config)}
              >

                {/* Full Header Image - Widescreen aspect ratio for better 2-col layout */}
                <div className="w-full aspect-[16/9] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-80 z-10"></div>
                  <img
                    src={cs.image}
                    alt=""
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Top Elements overlay */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                      {cs.category === 'agency' ? 'Agency' : cs.category === 'ecom' ? 'eCommerce' : 'App'}
                    </span>
                  </div>

                  {/* Platforms */}
                  <div className="absolute top-4 right-4 z-20 flex gap-1.5">
                    {cs.platforms.map(p => (
                      <div key={p} className="bg-black/40 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center border border-white/10">
                        <img src={PLATFORM_ICONS[p]} alt={p} className="w-4 h-4 opacity-100" loading="lazy" decoding="async" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 md:p-8 flex flex-col flex-grow relative z-20 -mt-16">
                  {/* Logo */}
                  <div className="mb-4">
                    <div className="h-12 w-fit p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center">
                      <img src={cs.logo} alt="Client Logo" className="h-full w-auto object-contain max-w-[100px]" style={cs.logoInvert ? { filter: 'brightness(0) invert(1)' } : {}} loading="lazy" decoding="async" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-6 leading-tight">{cs.title}</h3>

                  <div className="mt-auto">
                    <div className="text-brand-yellow font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      Read case study <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>
                    </div>
                  </div>
                </div>
              </a>
            );
          }
        })}
      </div>

      {/* CTA Section */}
      <div className="bg-[#161616] text-white py-16 px-4">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">Stop Reading. Start Winning.</h2>
          <div className="text-xl md:text-2xl text-gray-400 mb-12 font-light">
            Every day you wait is another day your competitors get ahead.
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <button onClick={() => onGetStarted()} className="w-full md:w-auto bg-brand-yellow text-brand-black px-10 py-5 rounded-full text-xl font-bold hover:bg-[#fcd34d] transition-all hover:scale-105 active:scale-95 inline-flex justify-center items-center">
              Start Free Trial
            </button>
            <Button
              onClick={onBookDemo}
              asBookingButton
              variant="outline"
              className="w-full md:w-auto h-auto py-5 px-8 text-lg border-white/20 hover:border-white/40 hover:bg-white/5 flex items-center justify-center gap-3"
            >
              <span>Book Strategy Call</span>
              <img src="https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfec6_sales.png" alt="" width="24" className="rounded-full" loading="lazy" decoding="async" />
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:check-circle-bold" class="text-brand-yellow"></iconify-icon>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:check-circle-bold" class="text-brand-yellow"></iconify-icon>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <iconify-icon icon="solar:check-circle-bold" class="text-brand-yellow"></iconify-icon>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasesPage;