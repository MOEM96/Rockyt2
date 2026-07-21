import React from 'react';

import { DemoBookingProps } from '../types/index';
import { COMPANY_STATS, CUSTOMER_LOGOS, CASE_STUDIES, CAL_CONFIG } from '../constants/index';
import { WistiaEmbed } from './WistiaEmbed';


const BentoGrid: React.FC<DemoBookingProps> = ({ onGetStarted }) => {

    // Prepare case studies for marquee (duplicate for seamless loop)
    // We use specific case studies from the design: Keiki, Loop, AdParlor
    const showcaseStudies = CASE_STUDIES.filter(c => ['keiki', 'loop', 'adparlor'].includes(c.id));
    const marqueeStudies = [...showcaseStudies, ...showcaseStudies, ...showcaseStudies]; // Triple for smoothness

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-min relative z-10 font-poppins pb-20">

            {/* 1. Social Proof / Video (Full Width) - KEPT AS IS */}
            <div className="col-span-1 md:col-span-12 bg-[#161616] border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="w-full md:w-5/12 relative z-10 flex flex-col items-start text-left">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-8 leading-tight tracking-tight">
                        This is what it looks like when your ads are managed by something that <span className="text-brand-yellow underline decoration-brand-yellow/30 underline-offset-8">never sleeps</span>, never misses a signal, and never charges a retainer.
                    </h3>
                </div>

                <div className="w-full md:w-7/12 relative z-10">
                    <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/5 w-full bg-black relative aspect-video transform group-hover:scale-[1.02] transition-transform duration-500">
                        <WistiaEmbed mediaId="kwbq8jkoy8" aspect={1.7777777777777777} />
                    </div>
                </div>
            </div>

            {/* 2. THE PAIN SECTION - UPDATED TO MATCH REFERENCE IMAGE */}
            <div className="col-span-1 md:col-span-12 flex flex-col items-center text-center mt-12 md:mt-20 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 border border-red-500/20">
                    <iconify-icon icon="solar:danger-bold"></iconify-icon> Sound familiar?
                </div>
                <h2 className="text-3xl md:text-6xl font-black text-white px-4 mb-6 tracking-tighter">
                    Ads shouldn't be <span className="text-red-500">this frustrating</span>
                </h2>
                <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto px-6 font-medium leading-relaxed">
                    You're not alone. These are the exact problems killing ROAS for thousands of direct response advertisers.
                </p>
            </div>

            {/* Pain Cards Grid - 6 Items */}
            <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                {[
                    { title: 'Burning ad spend on bad targeting', desc: 'Broad audiences eating your budget while your ideal customers never see your ads.', icon: 'solar:dollar-bold', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { title: 'Hours in Ads Manager', desc: 'Endless campaign setup, A/B testing confusion, and waiting for data that never makes sense.', icon: 'solar:clock-circle-bold', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { title: 'Analysis paralysis', desc: '300+ targeting options. 50 placements. 12 objectives. Which one actually drives sales?', icon: 'solar:tuning-bold', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { title: 'CPMs through the roof', desc: 'Costs keep climbing while ROAS keeps dropping. The algorithm seems to hate you.', icon: 'solar:graph-down-bold', color: 'text-red-400', bg: 'bg-red-400/10' },
                    { title: 'Fear of account bans', desc: 'One wrong move and your ad account is restricted. Rebuilding trust takes months.', icon: 'solar:shield-warning-bold', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    { title: 'Creative fatigue', desc: 'Your best performing ad dies after 2 weeks. Now you\'re back to square one.', icon: 'solar:gallery-remove-bold', color: 'text-red-500', bg: 'bg-red-500/10' }
                ].map((pain, i) => (
                    <div key={i} className="bg-[#0F0F0F] rounded-[24px] md:rounded-[28px] p-6 md:p-8 border border-white/5 hover:border-white/10 transition-all duration-300 group shadow-lg flex flex-col items-start gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${pain.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <iconify-icon icon={pain.icon} class={`${pain.color} text-xl md:text-2xl`}></iconify-icon>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base md:text-lg font-bold text-white leading-tight">{pain.title}</h3>
                            <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-medium">
                                {pain.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="col-span-1 md:col-span-12 text-center mb-16 md:mb-24">
                <p className="text-white text-lg md:text-xl font-black tracking-tight">There's a better way to run direct response ads.</p>
            </div>

            {/* === END 2 END SOLUTION SECTION (CLEAN & PREMIUM) === */}
            <div className="col-span-1 md:col-span-12 bg-white rounded-[40px] p-6 md:p-16 mb-12 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24 border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden group">

                <div className="w-full md:w-1/2 flex flex-col items-start text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4450F2]/10 text-[#4450F2] text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 md:mb-8 border border-[#4450F2]/20">
                        <iconify-icon icon="solar:stars-bold" class="text-sm"></iconify-icon> The Rockyt Standard
                    </div>

                    <h2 className="text-2xl md:text-7xl font-black text-[#161616] mb-8 tracking-tighter leading-[0.9]">
                        End 2 End<br /><span className="text-[#4450F2] whitespace-nowrap">Ad Management</span>
                    </h2>

                    <p className="text-gray-500 text-sm md:text-xl font-medium leading-relaxed mb-10 max-w-lg">
                        Run winning ads like experts but without the headache. Stop doing ads the hard old way
                        You've seen what top media buyers do. Now get the same results without the $5k/month agency fee.
                    </p>

                    <button
                        onClick={() => onGetStarted()}
                        className="group relative px-8 md:px-10 py-4 md:py-5 bg-[#4450F2] text-white rounded-full font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-[#3340D1] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(68,80,242,0.3)] flex items-center gap-3 overflow-hidden shadow-xl"
                    >
                        <span>Launch Campaign Now</span>
                        <iconify-icon icon="solar:arrow-right-bold" class="text-xl group-hover:translate-x-1 transition-transform"></iconify-icon>
                    </button>
                </div>

                <div className="w-full md:w-1/2 relative flex items-center justify-center py-6 md:py-12">
                    <div className="relative w-full max-w-[260px] md:max-w-[400px] aspect-square flex items-center justify-center scale-95 md:scale-105">

                        {/* Orbital Decor - Shrunk for compactness */}
                        <div className="absolute inset-4 border border-gray-100 rounded-full"></div>
                        <div className="absolute inset-20 md:inset-24 border border-dashed border-gray-200 rounded-full animate-[spin_60s_linear_infinite] opacity-50"></div>

                        {/* Central Hub - Rockyt Logo */}
                        <div className="relative z-50 w-20 h-20 md:w-40 md:h-40 bg-white rounded-[28px] md:rounded-[44px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center p-2.5 md:p-5">
                            <div className="w-full h-full bg-[#4450F2] rounded-[20px] md:rounded-[36px] flex items-center justify-center text-white shadow-[0_15px_30px_rgba(68,80,242,0.3)]">
                                <iconify-icon icon="solar:rocket-bold" class="text-3xl md:text-6xl text-white"></iconify-icon>
                            </div>
                        </div>

                        {/* Network Nodes (Platforms) - Tighter Radius */}
                        {[
                            { icon: 'logos:facebook', pos: 'top-[0%] left-1/2 -translate-x-1/2 -translate-y-1/2' },
                            { icon: 'logos:google-icon', pos: 'bottom-[12%] left-[12%] -translate-x-1/2' },
                            { icon: 'logos:tiktok-icon', pos: 'bottom-[12%] right-[12%] translate-x-1/2' },
                            { icon: 'logos:youtube-icon', pos: 'top-[20%] left-[5%] -translate-x-1/2' },
                            { icon: 'logos:linkedin-icon', pos: 'top-[20%] right-[5%] translate-x-1/2' },
                            { icon: 'logos:spotify-icon', pos: 'bottom-[45%] left-[-5%] -translate-x-1/2' },
                            { icon: 'fa-brands:snapchat-ghost', pos: 'bottom-[45%] right-[-5%] translate-x-1/2', color: 'text-yellow-400' }
                        ].map((node, i) => (
                            <div key={i} className={`absolute ${node.pos} w-10 h-10 md:w-16 md:h-16 bg-white rounded-[12px] md:rounded-[20px] shadow-xl border border-gray-50 flex items-center justify-center p-2 md:p-4 hover:scale-110 transition-all cursor-default z-40`}>
                                <iconify-icon icon={node.icon} class={node.color || ''} width="100%"></iconify-icon>
                            </div>
                        ))}

                        {/* Floating Status Cards - Recalibrated for mobile */}
                        <div className="absolute top-[18%] md:top-[20%] right-[-5%] md:right-[-10%] bg-[#22C55E] text-white text-[7px] md:text-xs font-black px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl shadow-lg flex items-center gap-1 md:gap-1.5 animate-bounce z-[60]">
                            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white animate-pulse"></div>
                            Waste-free Scaling
                        </div>

                        <div className="absolute bottom-[30%] md:bottom-[35%] left-[-8%] md:left-[-12%] bg-[#121212] text-white text-[7px] md:text-xs font-black px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl shadow-xl flex flex-col gap-0.5 z-[60] border border-white/10">
                            <div className="text-[#FFE241] flex items-center gap-1 uppercase tracking-widest text-[5px] md:text-[6px]">Status</div>
                            <div className="text-[10px] md:text-base">6.2x ROAS</div>
                        </div>

                        <div className="absolute top-[32%] left-[2%] bg-red-500 text-white text-[7px] md:text-[10px] font-black px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg shadow-lg flex items-center gap-1 md:gap-1.5 z-[60] animate-pulse">
                            <iconify-icon icon="solar:shield-cross-bold"></iconify-icon>
                            Auto-stop losers
                        </div>

                        <div className="absolute bottom-[2%] right-[10%] bg-[#121212] text-[#22C55E] text-[7px] md:text-xs font-black px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-xl flex items-center gap-1 md:gap-1.5 z-[60] border border-white/10 uppercase tracking-tight">
                            <iconify-icon icon="solar:wallet-bold" class="text-xs md:text-base"></iconify-icon>
                            40% AD-SPEND SAVED
                        </div>

                        {/* Additional Status Boxes - Integrated into the cluster - OFFSET POSITIONS TO AVOID OVERLAP */}
                        <div className="absolute top-[5%] left-[18%] bg-white text-gray-900 text-[6px] md:text-[9px] font-bold px-2 py-0.5 md:py-1 rounded-full shadow-md border border-gray-100 flex items-center gap-1 md:gap-1.5 z-[60] transform -rotate-2">
                            <iconify-icon icon="solar:magic-stick-3-bold" class="text-[#4450F2]"></iconify-icon>
                            generate images & videos with AI
                        </div>

                        <div className="absolute top-[55%] right-[-8%] md:right-[-10%] bg-[#4450F2] text-white text-[6px] md:text-[9px] font-bold px-2 py-0.5 md:py-1 rounded-full shadow-md flex items-center gap-1 md:gap-1.5 z-[60] transform rotate-2">
                            <iconify-icon icon="solar:chart-2-bold"></iconify-icon>
                            track website analytics
                        </div>

                        <div className="absolute bottom-[25%] right-[-15%] md:right-[-18%] bg-[#FFE241] text-black text-[6px] md:text-[9px] font-bold px-2 py-0.5 md:py-1 rounded-full shadow-md flex items-center gap-1 md:gap-1.5 z-[60] transform rotate-3">
                            <iconify-icon icon="solar:lightbulb-bold"></iconify-icon>
                            get AI recommendations
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SOLUTION: CREATIVES (Full Width) */}
            <div className="col-span-1 md:col-span-12 bg-[#FFE241] rounded-[24px] md:rounded-[32px] p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16 group overflow-hidden relative hover:-translate-y-2 transition-transform duration-500 shadow-lg text-black">
                <div className="w-full md:w-1/2 relative z-10 flex flex-col justify-center text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-black text-[10px] font-bold uppercase tracking-wider mb-4 border border-black/10 w-fit">
                        <iconify-icon icon="solar:magic-stick-3-bold"></iconify-icon> AI Creative Studio
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                        Generate Evergreen Winning Creatives in Mins
                    </h3>
                    <p className="text-black/70 font-medium leading-relaxed text-sm md:text-base">
                        Access Shutterstock Library, 5+ AI tools, and a built-in editor. Create AI UGC, Product Images, Voice overs, Reels, Hooks, Ad Copy, and Memes in minutes.
                    </p>
                </div>
                <div className="w-full md:w-1/2 relative z-10">
                    <div className="w-full bg-black rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform md:rotate-1 hover:rotate-0 transition-transform duration-500 group/studio aspect-video relative">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src="/assets/videos/creative-studio-v2.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
            </div>

            {/* 4. SOLUTION: ANALYTICS (Full Width) - Redesigned Dashboard Image Style */}
            <div className="col-span-1 md:col-span-12 bg-[#161616] border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16 group overflow-hidden relative hover:-translate-y-2 transition-transform duration-500 shadow-lg">
                <div className="w-full md:w-5/12 relative z-10 flex flex-col justify-center text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider mb-4 border border-brand-blue/20 w-fit">
                        <iconify-icon icon="solar:chart-2-bold"></iconify-icon> Performance Dashboard
                    </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
                        Analytics That Bring Customers, Not Confusion
                    </h3>
                    <p className="text-gray-400 font-medium leading-relaxed text-sm md:text-base mb-8">
                        Stop bouncing between spreadsheets. Get the same clean, actionable dashboard our internal team uses to scale multi-million dollar brands.
                    </p>
                    <div className="space-y-3">
                        {['Real-time cross-platform tracking', 'AI-predicted scaling opportunities', 'One-click creative performance audits'].map(item => (
                            <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                                <iconify-icon icon="solar:check-circle-bold" class="text-green-400"></iconify-icon>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full md:w-7/12 relative z-10">
                    {/* Compact Stacked Images Visual */}
                    <div className="flex flex-col gap-3 md:gap-4 p-2 bg-[#F0F2F5]/50 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:scale-[1.01] transition-transform duration-700">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-white max-h-[160px] md:max-h-[220px]">
                            <img
                                src="/assets/images/dashboard_recommendations.png"
                                className="w-full h-full object-cover object-top"
                                alt="Dashboard Recommendations"
                                loading="lazy"
                            />
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-white">
                            <img
                                src="/assets/images/website_performance.png"
                                className="w-full h-auto object-contain"
                                alt="Website Performance"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none"></div>
            </div >


            {/* 5. SOLUTION: OPTIMIZATION (Full Width) - Restructured Layout */}
            < div className="col-span-1 md:col-span-12 bg-[#1D2E5C] text-white rounded-[24px] md:rounded-[32px] p-6 md:p-12 overflow-hidden relative group border border-white/10 shadow-2xl flex flex-col gap-8 md:gap-10" >

                {/* Header Section */}
                < div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto" >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-4 md:mb-6 border border-blue-400/30">
                        <iconify-icon icon="solar:shield-check-bold"></iconify-icon> 24/7 Budget Protection
                    </div>
                    <h3 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">Cut Wasted Ad Spend by 90%</h3>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-4">
                        {[
                            { text: 'Faster Testing', icon: 'solar:bolt-bold', color: 'text-blue-300' },
                            { text: 'Smarter Spending', icon: 'solar:wallet-bold', color: 'text-green-300' },
                            { text: 'Profitable Scaling', icon: 'solar:chart-2-bold', color: 'text-brand-yellow' }
                        ].map((point, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                <iconify-icon icon={point.icon} class={`${point.color} text-sm md:text-base`}></iconify-icon>
                                <span className="text-xs md:text-sm font-bold tracking-wide uppercase">{point.text}</span>
                            </div>
                        ))}
                    </div>
                </div >

                {/* Optimizations Horizontal Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
                    <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-colors backdrop-blur-sm flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-0 md:mb-4 border border-blue-400/20 shrink-0">
                            <iconify-icon icon="solar:users-group-rounded-bold" class="text-blue-300 text-xl md:text-2xl"></iconify-icon>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-base md:text-lg mb-1 md:mb-2">Audience</h4>
                            <p className="text-xs md:text-sm text-blue-100/70 leading-relaxed">Adjusts targeting (audiences, interests, locations) for best results.</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-colors backdrop-blur-sm flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-0 md:mb-4 border border-blue-400/20 shrink-0">
                            <iconify-icon icon="solar:magic-stick-3-bold" class="text-blue-300 text-xl md:text-2xl"></iconify-icon>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-base md:text-lg mb-1 md:mb-2">Creative</h4>
                            <p className="text-xs md:text-sm text-blue-100/70 leading-relaxed">Pauses fatigue creatives and scales winning variations based on ROAS.</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-colors backdrop-blur-sm flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-0 md:mb-4 border border-blue-400/20 shrink-0">
                            <iconify-icon icon="solar:chart-square-bold" class="text-blue-300 text-xl md:text-2xl"></iconify-icon>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-base md:text-lg mb-1 md:mb-2">Campaign</h4>
                            <p className="text-xs md:text-sm text-blue-100/70 leading-relaxed">Audits your campaigns in real-time and allocate budget to the best performing ad-sets</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-colors backdrop-blur-sm flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-0 md:mb-4 border border-blue-400/20 shrink-0">
                            <iconify-icon icon="solar:globus-bold" class="text-blue-300 text-xl md:text-2xl"></iconify-icon>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-base md:text-lg mb-1 md:mb-2">Platform</h4>
                            <p className="text-xs md:text-sm text-blue-100/70 leading-relaxed">Shift spend instantly between Meta, Google, TikTok, and Snapchat.</p>
                        </div>
                    </div>
                </div>

                {/* Full Width Visual */}
                < div className="relative z-10 w-full h-[250px] md:h-[500px] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl mt-0 md:mt-2 group-hover:scale-[1.01] transition-transform duration-700" >
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="https://cdn.prod.website-files.com/6798ff28c64131df111e57cc%2F68856e2581a36b66731c485a_OptimizationFolder-transcode.mp4" type="video/mp4" />
                    </video>
                    {/* Overlay Gradient for integration */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D2E5C]/50 to-transparent pointer-events-none"></div>
                </div >

                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-0"></div>
            </div >

            {/* 6. NEW: MULTI-PLATFORM (Full Width) - Interactive Visualization */}
            < div className="col-span-1 md:col-span-12 bg-[#161616] border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-12 overflow-hidden relative group hover:border-white/20 transition-all duration-500 shadow-2xl" >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-[10px] font-bold uppercase tracking-wider mb-4 md:mb-6 border border-brand-purple/20">
                            <iconify-icon icon="solar:layers-minimalistic-bold"></iconify-icon> Unified Management
                        </div>
                        <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 leading-tight">
                            Manage 11+ Platforms in One View
                        </h3>
                        <p className="text-gray-400 text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
                            Total control and visibility. Easily understand your data and scale across all major advertising channels like experts without the headache of switching between multiple dashboards.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['Meta', 'Google', 'TikTok', 'Snapchat', 'LinkedIn', 'Spotify', 'Bing', 'Pinterest'].map((p) => (
                                <span key={p} className="px-2 py-1 md:px-3 md:py-1 bg-white/5 rounded-lg text-[10px] md:text-xs text-gray-400 border border-white/5 hover:bg-white/10 transition-colors cursor-default">{p}</span>
                            ))}
                            <span className="px-2 py-1 md:px-3 md:py-1 bg-white/5 rounded-lg text-[10px] md:text-xs text-brand-yellow border border-white/5">+3 more</span>
                        </div>
                    </div>

                    {/* Interactive Network Graph Visual */}
                    <div className="relative h-[280px] md:h-[400px] w-full flex items-center justify-center bg-white/5 rounded-xl md:rounded-2xl border border-white/5 overflow-hidden group-hover:border-white/10 transition-colors">
                        <style>{`
                        @keyframes float-1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-5px, -10px); } }
                        @keyframes float-2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, 8px); } }
                        @keyframes float-3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-8px, 5px); } }
                        .animate-float-1 { animation: float-1 4s ease-in-out infinite; }
                        .animate-float-2 { animation: float-2 5s ease-in-out infinite; }
                        .animate-float-3 { animation: float-3 4.5s ease-in-out infinite; }
                    `}</style>

                        {/* Background Grid */}
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #ffffff10 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        {/* Connecting Lines SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                            <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="50%" y1="50%" x2="80%" y2="75%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="50%" y1="50%" x2="15%" y2="50%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
                        </svg>

                        {/* Central Hub Node */}
                        <div className="relative z-20 w-16 h-16 md:w-24 md:h-24 bg-[#161616] rounded-full border-2 border-brand-purple shadow-[0_0_50px_rgba(139,92,246,0.3)] flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border border-brand-purple/50 animate-ping opacity-20"></div>
                            <span className="font-black text-white text-base md:text-xl tracking-tight">Rockyt</span>
                        </div>

                        {/* Orbiting Platform Icons */}
                        <div className="absolute top-[20%] left-[20%] p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-1">
                            <iconify-icon icon="logos:meta-icon" width="16" class="md:w-6"></iconify-icon>
                        </div>
                        <div className="absolute top-[20%] right-[20%] p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-2">
                            <iconify-icon icon="logos:google-icon" width="16" class="md:w-6"></iconify-icon>
                        </div>
                        <div className="absolute bottom-[20%] left-[20%] p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-3">
                            <iconify-icon icon="logos:tiktok-icon" width="16" class="md:w-6"></iconify-icon>
                        </div>
                        <div className="absolute bottom-[20%] right-[20%] p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-1">
                            <iconify-icon icon="logos:linkedin-icon" width="16" class="md:w-6"></iconify-icon>
                        </div>
                        <div className="absolute top-[50%] right-[10%] transform -translate-y-1/2 p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-2">
                            <iconify-icon icon="fa-brands:snapchat-ghost" class="text-yellow-400 text-lg md:text-2xl"></iconify-icon>
                        </div>
                        <div className="absolute top-[50%] left-[10%] transform -translate-y-1/2 p-2 md:p-3 bg-[#1A1A1A] rounded-lg md:rounded-xl border border-white/10 shadow-xl animate-float-3">
                            <iconify-icon icon="logos:pinterest" width="16" class="md:w-6"></iconify-icon>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            </div >

            {/* 7. SETUP (Col 12) - Redesigned to Dark Theme */}
            < div className="col-span-1 md:col-span-12 bg-[#161616] border border-white/10 rounded-[24px] md:rounded-[32px] p-8 md:p-16 text-center text-white flex flex-col items-center justify-center relative overflow-hidden" >
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Get Started
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-12 md:mb-16 tracking-tight max-w-3xl">
                    1 Min Set-up. 2x ROAS.<br />3 Simple Steps.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-4xl relative z-10">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-white/10 -z-10"></div>

                    <div className="flex flex-col items-center group relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1A1A1A] border-2 border-white/10 flex items-center justify-center text-xl md:text-2xl font-black mb-4 md:mb-6 group-hover:border-brand-yellow group-hover:text-brand-yellow transition-all duration-300 shadow-xl z-10">
                            1
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Connect</h3>
                        <p className="text-gray-500 text-sm md:text-base font-medium">Connect your ad accounts in one click.</p>
                    </div>

                    <div className="flex flex-col items-center group relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1A1A1A] border-2 border-white/10 flex items-center justify-center text-xl md:text-2xl font-black mb-4 md:mb-6 group-hover:border-brand-yellow group-hover:text-brand-yellow transition-all duration-300 shadow-xl z-10">
                            2
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Import</h3>
                        <p className="text-gray-500 text-sm md:text-base font-medium">Import your running campaigns from any ad platform.</p>
                    </div>

                    <div className="flex flex-col items-center group relative">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1A1A1A] border-2 border-white/10 flex items-center justify-center text-xl md:text-2xl font-black mb-4 md:mb-6 group-hover:border-brand-yellow group-hover:text-brand-yellow transition-all duration-300 shadow-xl z-10">
                            3
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Scale</h3>
                        <p className="text-gray-500 text-sm md:text-base font-medium">Let Rockyt protect your budget & scale profitably.</p>
                    </div>
                </div>
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-brand-blue/5 blur-[100px] rounded-full pointer-events-none -z-0"></div>
            </div >

            {/* 8. CASE STUDIES - Animated Auto Scroll */}
            < div className="col-span-1 md:col-span-12 text-center mt-6 md:mt-8 mb-2 md:mb-4" >
                <h2 className="text-xl md:text-3xl font-bold text-white">They know how it works</h2>
                <p className="text-gray-500 text-sm md:text-base mt-2">Who can explain it better than our users?</p>
            </div >

            <div className="col-span-1 md:col-span-12 overflow-hidden w-full relative -mx-4 md:mx-0 mask-gradient-x">
                <style>{`
            .mask-gradient-x {
               mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
               -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
            @keyframes marquee {
               0% { transform: translateX(0); }
               100% { transform: translateX(-33.33%); } /* Move 1/3 of the width (original set) */
            }
            .animate-marquee {
               animation: marquee 40s linear infinite;
            }
            .animate-marquee:hover {
               animation-play-state: paused;
            }
         `}</style>

                <div className="flex gap-4 md:gap-6 w-max animate-marquee py-4 px-4 md:px-0">
                    {marqueeStudies.map((cs, idx) => {
                        // Render logic based on original design but mapped for marquee
                        // We force a consistent 'small' card style for the marquee to ensure alignment

                        // Customize card based on type
                        let bgColor = 'bg-[#1D2E5C]'; // Default AdParlor style
                        let textColor = 'text-white';

                        if (cs.id === 'keiki') {
                            bgColor = 'bg-[#8B5CF6]';
                        } else if (cs.id === 'loop') {
                            bgColor = 'bg-white';
                            textColor = 'text-black';
                        }

                        return (
                            <div
                                key={`${cs.id}-${idx}`}
                                className={`w-[280px] md:w-[400px] rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col flex-shrink-0 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-white/5 ${bgColor} ${textColor}`}
                            >
                                <div className="mb-4 md:mb-6 relative z-10 h-6 md:h-8">
                                    <img
                                        src={cs.logo}
                                        alt={`${cs.title} logo`}
                                        className={`h-full w-auto object-contain ${cs.id === 'loop' ? '' : 'brightness-0 invert'}`}
                                        loading="lazy"
                                    />
                                </div>

                                <div className="rounded-xl overflow-hidden mb-4 md:mb-6 aspect-video shadow-lg group-hover:scale-[1.03] transition-transform duration-500 bg-black/10">
                                    <img
                                        src={cs.image}
                                        alt={`${cs.title} case study preview`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <p className="text-base md:text-lg font-medium leading-tight mb-4">
                                        {cs.title}
                                    </p>
                                    <button
                                        className={`px-4 py-2 md:px-5 md:py-2 rounded-full font-bold text-xs md:text-sm transition-colors ${cs.id === 'loop' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`}
                                        data-cal-link={CAL_CONFIG.link}
                                        data-cal-namespace={CAL_CONFIG.namespace}
                                        data-cal-config={JSON.stringify(CAL_CONFIG.config)}
                                    >
                                        Read Case Study
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* 9. Stats Row */}
            {
                COMPANY_STATS.map((stat, index) => (
                    <div key={index} className="col-span-1 md:col-span-4 bg-[#161616] rounded-[24px] md:rounded-[32px] p-6 md:p-8 aspect-square md:aspect-square flex flex-col items-center justify-center text-center border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 group">
                        <div className={`text-4xl md:text-6xl font-semibold tracking-tighter mb-2 md:mb-4 text-brand-${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                            {stat.value}
                        </div>
                        <div className="text-lg md:text-2xl font-bold text-white leading-tight">
                            {stat.label.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}<br />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ))
            }

            {/* 10. Customers */}
            <div className="col-span-1 md:col-span-12 bg-white rounded-[24px] md:rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="text-lg md:text-xl font-bold text-black mb-6 md:mb-8 relative z-10 text-center">Trusted by over 15,000 businesses</div>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-5xl relative z-10">
                    {CUSTOMER_LOGOS.map((logo, index) => (
                        <img
                            key={index}
                            src={logo.src}
                            className={`h-6 md:h-12 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110 ${logo.name === 'AdParlor' ? 'brightness-0' : ''}`}
                            alt={logo.alt}
                            loading="lazy"
                            decoding="async"
                        />
                    ))}
                </div>
            </div>

            {/* 11. Bottom CTA */}
            <div
                className="col-span-1 md:col-span-4 border-2 border-dashed border-white/20 rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex items-center justify-center hover:border-white/50 hover:bg-white/5 transition-all duration-300 cursor-pointer group min-h-[140px] md:min-h-[180px]"
                data-cal-link={CAL_CONFIG.link}
                data-cal-namespace={CAL_CONFIG.namespace}
                data-cal-config={JSON.stringify(CAL_CONFIG.config)}
            >
                <h3 className="text-xl md:text-3xl font-bold text-white group-hover:scale-105 transition-transform text-center">
                    Stop Burning Money.<br />Book a Demo.
                </h3>
            </div>

            <div className="col-span-1 md:col-span-4 bg-[#161616] rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col items-center justify-center min-h-[140px] md:min-h-[180px] border border-white/5 hover:border-white/20 transition-colors">
                <div className="text-4xl md:text-5xl font-bold text-[#FFE241] mb-2">7</div>
                <div className="text-white font-medium text-base md:text-lg mb-3 md:mb-4">Days Free Trial</div>
                <div className="flex gap-2">
                    <span className="bg-white/10 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs text-white">Full Access</span>
                    <span className="bg-white/10 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs text-white">No Commitments</span>
                </div>
            </div>

            <div className="col-span-1 md:col-span-4 bg-[#FFE241] rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex items-center justify-center hover:bg-[#fcd34d] hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[140px] md:min-h-[180px] shadow-lg hover:shadow-yellow-400/30" onClick={() => onGetStarted()}>
                <h3 className="text-xl md:text-3xl font-bold text-black flex items-center gap-2">
                    Start Free Trial <iconify-icon icon="solar:arrow-right-linear" class="text-lg md:text-xl"></iconify-icon>
                </h3>
            </div>

        </div >
    );
};

export default BentoGrid;