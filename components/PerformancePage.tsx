import React, { useEffect, useState } from 'react';
import Button from './Button';
import { WistiaEmbed } from './WistiaEmbed';
import { DemoBookingProps } from '../types/index';

const STAGES = [
  {
    id: 'ai-model',
    number: '01',
    label: 'AI Intelligence',
    title: 'The 24/7 Super-Analyst',
    description: 'Take the guesswork out of ad management. Our advanced ML model monitors your ad account 24/7—optimizing bids, budgets, and targeting with precision humans can\'t match.',
    benefits: ['24/7 Account Monitoring', 'Automated Bid & Budget Management', 'Superhuman Precision'],
    color: 'text-brand-yellow',
    bgColor: 'bg-brand-yellow/10',
    borderColor: 'border-brand-yellow/20',
    shadow: 'shadow-[0_0_30px_rgba(255,226,65,0.15)]',
    gradient: 'from-brand-yellow/40',
    glow: 'bg-brand-yellow/10',
    icon: 'solar:graph-up-bold',
    videoId: 'd8tpjtnnmu',
    aspectRatio: 1.7777777777777777
  },
  {
    id: 'brand-identity',
    number: '02',
    label: 'Brand Identity',
    title: 'On-Brand Everywhere',
    description: 'Set up your unique brand identity once. Every ad, copy, and creative is automatically generated in your brand tone, allowing you to launch campaigns across all platforms in minutes.',
    benefits: ['Unified Brand Voice', 'Cross-Platform Consistency', 'Instant Campaign Launch'],
    color: 'text-brand-blue',
    bgColor: 'bg-brand-blue/10',
    borderColor: 'border-brand-blue/20',
    shadow: 'shadow-[0_0_30px_rgba(68,80,242,0.15)]',
    gradient: 'from-brand-blue/40',
    glow: 'bg-brand-blue/10',
    icon: 'solar:shield-star-bold',
    videoId: '80oyr5r11i',
    aspectRatio: 1.7777777777777777
  },
  {
    id: 'creative-engine',
    number: '03',
    label: 'Creative Engine',
    title: 'Creative Team in a Box',
    description: 'Beat creative fatigue instantly. Access 5+ AI tools and winning templates to generate high-converting assets. Replace full creative teams and keep your ads fresh.',
    benefits: ['5+ AI Creative Tools', 'Winning Templates Library', 'Combat Creative Fatigue'],
    color: 'text-brand-pink',
    bgColor: 'bg-brand-pink/10',
    borderColor: 'border-brand-pink/20',
    shadow: 'shadow-[0_0_30px_rgba(255,33,166,0.15)]',
    gradient: 'from-brand-pink/40',
    glow: 'bg-brand-pink/10',
    icon: 'solar:magic-stick-3-bold',
    videoId: 'w8ye24d0c9',
    aspectRatio: 1.7777777777777777
  },
  {
    id: 'analytics',
    number: '04',
    label: 'Unified Analytics',
    title: 'Total Visibility & Control',
    description: 'Stop tab-switching. Get a single, unified dashboard for clear, real-time visibility into all your campaigns. Make data-driven decisions with complete control over your spend.',
    benefits: ['Unified Dashboard', 'Real-time Reporting', 'Centralized Control'],
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
    borderColor: 'border-brand-purple/20',
    shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    gradient: 'from-brand-purple/40',
    glow: 'bg-brand-purple/10',
    icon: 'solar:pie-chart-2-bold',
    videoId: 'lfzqnlnfep',
    aspectRatio: 1.8823529411764706 // 53.13% padding top
  }
];

const PerformancePage: React.FC<DemoBookingProps> = ({ onBookDemo: _onBookDemo, onGetStarted }) => {
  const [activeSection, setActiveSection] = useState<string>(STAGES[0].id);
  const [progressHeight, setProgressHeight] = useState(0);

  // Optimized Scroll Logic: "Closest to Center"
  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const viewportCenter = window.scrollY + (viewportHeight / 2);

      let bestCandidateId = activeSection;
      let minDistance = Infinity;

      STAGES.forEach((stage) => {
        const element = document.getElementById(stage.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const offsetTop = rect.top + window.scrollY;
          const offsetHeight = rect.height;
          const elementCenter = offsetTop + (offsetHeight / 2);
          const distance = Math.abs(viewportCenter - elementCenter);

          if (distance < minDistance) {
            minDistance = distance;
            bestCandidateId = stage.id;
          }
        }
      });

      if (bestCandidateId !== activeSection) {
        setActiveSection(bestCandidateId);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeSection]);

  // Calculate progress bar height
  useEffect(() => {
    const activeIndex = STAGES.findIndex(s => s.id === activeSection);
    if (activeIndex !== -1) {
        const newHeight = ((activeIndex + 1) / STAGES.length) * 100;
        setProgressHeight(Math.max(10, newHeight));
    }
  }, [activeSection]);

  return (
    <div className="bg-[#161616] min-h-screen">
      
      {/* 1. Header Section */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-20 pb-20 md:pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">The Rockyt Workflow</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            One Platform.<br/>Complete Control.
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop stitching together 5 different tools. Rockyt unifies your entire advertising stack into one intelligent workflow.
        </p>
      </div>

      {/* 2. The Learning Journey (Sticky Scroll Layout) */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-32">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-24 relative">
            
            {/* LEFT COLUMN: Scrolling Text Content */}
            <div className="w-full lg:w-1/2 flex flex-col relative z-10">
                {/* Vertical Progress Line Container (Desktop Only) */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/5 hidden lg:block -z-10">
                    <div 
                        className="w-full bg-gradient-to-b from-brand-yellow via-brand-blue to-brand-pink transition-all duration-1000 ease-in-out"
                        style={{ height: `${progressHeight}%` }}
                    >
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                    </div>
                </div>

                {STAGES.map((stage) => {
                    const isActive = activeSection === stage.id;
                    
                    return (
                        <div 
                            key={stage.id} 
                            id={stage.id} 
                            className={`flex flex-col justify-center gap-6 py-24 lg:py-32 min-h-[50vh] transition-all duration-1000 ease-out ${isActive ? 'opacity-100 translate-x-0 blur-0' : 'lg:opacity-30 lg:blur-[2px] opacity-100'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${isActive ? `${stage.bgColor} ${stage.borderColor} ${stage.color} ${stage.shadow} border scale-110` : 'bg-white/5 border border-white/10 text-gray-500 scale-100'}`}>
                                <iconify-icon icon={stage.icon} width="32"></iconify-icon>
                            </div>
                            <div>
                                <div className={`text-sm font-bold uppercase tracking-widest mb-2 transition-colors duration-500 ${isActive ? stage.color : 'text-gray-500'}`}>
                                    {stage.number}. {stage.label}
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-500">{stage.title}</h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                    {stage.description}
                                </p>
                                <ul className="space-y-3 text-gray-300">
                                    {stage.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <iconify-icon icon="solar:check-circle-bold" class={isActive ? stage.color : 'text-gray-600'}></iconify-icon>
                                            <span className={isActive ? 'text-gray-200' : 'text-gray-500'}>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Mobile Visual (Visible only on small screens) */}
                            <div className="lg:hidden w-full mt-8">
                                <div
                                    className="w-full bg-black rounded-2xl border border-white/10 relative overflow-hidden"
                                    style={{ aspectRatio: stage.aspectRatio }}
                                >
                                    <WistiaEmbed mediaId={stage.videoId} aspect={stage.aspectRatio} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* RIGHT COLUMN: Sticky Visuals (Desktop Only) */}
            <div className="hidden lg:block w-1/2 relative">
                <div className="sticky top-[20vh] h-[600px] w-full flex items-center justify-center">
                    
                    {/* Shared Ambient Glow */}
                    {STAGES.map((stage) => (
                        <div 
                            key={`glow-${stage.id}`}
                            className={`absolute inset-0 blur-[120px] transition-opacity duration-1000 ease-in-out ${stage.glow} ${activeSection === stage.id ? 'opacity-100' : 'opacity-0'}`}
                        ></div>
                    ))}

                    <div className="relative w-full aspect-square max-h-[600px] z-10">
                        {STAGES.map((stage) => {
                            const isActive = activeSection === stage.id;
                            
                            return (
                                <div 
                                    key={`video-${stage.id}`}
                                    className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] origin-center ${
                                        isActive 
                                            ? 'opacity-100 scale-100 translate-y-0 z-20 blur-0' 
                                            : 'opacity-0 scale-90 translate-y-12 z-10 blur-sm pointer-events-none'
                                    }`}
                                >
                                    {/* Wistia Player Integration with Vignette Fade */}
                                    <div className="w-full h-full relative rounded-3xl overflow-hidden">
                                        {/* Inset Shadow to create fade effect around edges */}
                                        <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(22,22,22,1)] rounded-3xl"></div>
                                        <WistiaEmbed mediaId={stage.videoId} aspect={stage.aspectRatio} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* 3. Bottom CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-32 text-center">
         <div className="bg-[#1A1A1A] border border-white/5 rounded-[40px] p-12 md:p-16 relative overflow-hidden group">
             {/* Hover Glow */}
             <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 via-brand-purple/20 to-brand-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl"></div>
             
             <div className="relative z-10">
                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to automate your growth?</h2>
                 <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                     Join 15,000+ marketers using Rockyt to scale faster with less manual work.
                 </p>
                 <Button 
                    onClick={() => onGetStarted()} 
                   size="lg"
                   className="shadow-2xl shadow-brand-yellow/20"
                  >
                    <span>Start Your Journey</span>
                 </Button>
             </div>
         </div>
      </div>

    </div>
  );
};

export default PerformancePage;