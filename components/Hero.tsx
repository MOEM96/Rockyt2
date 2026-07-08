import React, { useState } from 'react';
import PartnersCarousel from './PartnersCarousel';
import Modal from './Modal';
import Button from './Button';
import { WistiaEmbed } from './WistiaEmbed';
import { DemoBookingProps } from '../types/index';


const Hero: React.FC<DemoBookingProps> = ({ onGetStarted }) => {
    const [showCalculatorModal, setShowCalculatorModal] = useState(false);

    const handleCalculate = () => {
        // We open the modal to show "how it works"
        setShowCalculatorModal(true);
    };

    const handleModalClose = () => {
        setShowCalculatorModal(false);
    };

    const handleFixItNow = () => {
        handleModalClose();
        onGetStarted();
    };

    return (
        <div className="w-full relative pt-4 pb-12 md:pt-10 md:pb-20 px-4 overflow-hidden flex flex-col items-center justify-center min-h-[80vh] bg-[#161616]">

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-brand-blue/10 rounded-full blur-[60px] md:blur-[120px] -z-10 pointer-events-none mix-blend-screen transform-gpu translate-z-0"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-pink/5 rounded-full blur-[50px] md:blur-[100px] -z-10 pointer-events-none mix-blend-screen transform-gpu translate-z-0"></div>

            <div className="max-w-6xl w-full mx-auto text-center z-10 flex flex-col items-center">

                {/* Y-Combinator Badge */}
                <div className="mb-8 flex justify-center items-center">
                    <div className="inline-flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-black/40 border border-[#F26625]/20 backdrop-blur-md shadow-[0_0_20px_rgba(242,102,37,0.1)]">
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-[#F26625] flex items-center justify-center">
                            <span className="text-white text-[10px] md:text-xs font-bold leading-none mt-[1px]">Y</span>
                        </div>
                        <span className="font-mono text-[10px] md:text-xs tracking-wider uppercase text-gray-400">
                            Backed by <span className="text-[#F26625] font-semibold">Y-Combinator</span>
                        </span>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white mb-6 md:mb-8 leading-[0.95] md:leading-[0.9]">
                    out-perform{' '}
                    <span className="inline-block relative group">
                        <span className="relative z-10 animate-gradient-text bg-gradient-to-r from-white via-red-500 to-white bg-[length:200%_auto] bg-clip-text text-transparent pb-1">human</span>
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                    {' '}ad experts
                </h1>

                {/* Subheadline */}
                <p className="text-sm md:text-2xl text-gray-400 font-medium md:font-light max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed px-4">
                    Humans react after performance drops. Rockyt's AI reacts <span className="text-white font-medium">while it's happening</span>, because every $ counts
                </p>

                {/* CTA Section */}
                <div className="w-full flex flex-col items-center mb-6 md:mb-8 relative z-10">
                    <button
                        onClick={handleCalculate}
                        className="relative h-12 md:h-16 px-8 md:px-12 bg-white text-black rounded-full flex items-center justify-center gap-2 md:gap-3 font-bold text-xs md:text-base tracking-widest uppercase transition-all duration-300 overflow-hidden group/btn hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95 shadow-xl"
                    >
                        <span className="relative z-10 transition-colors duration-300">How it works</span>
                        <iconify-icon icon="solar:arrow-right-linear" class="relative z-10 text-xl transition-transform duration-300 group-hover/btn:translate-x-1"></iconify-icon>
                        <div className="absolute inset-0 bg-brand-yellow transform -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
                    </button>
                </div>

                {/* Social Proof */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12 md:mb-16 animate-fade-in opacity-90">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                            {[12, 25, 43].map((i) => (
                                <img key={i} src={`https://i.pravatar.cc/64?img=${i}`} alt="Customer" className="w-6 h-6 rounded-full border border-[#161616]" loading="lazy" />
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-0.5 text-[#FFE241] text-[10px] mb-0.5">
                                {[1, 2, 3, 4, 5].map(s => <iconify-icon key={s} icon="solar:star-bold"></iconify-icon>)}
                                <span className="text-gray-400 font-bold ml-1.5 text-xs">4.6</span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                <span className="text-white font-bold">15,000+</span> advertisers
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block w-px h-6 bg-white/10"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                            <iconify-icon icon="solar:chart-2-bold" class="text-xs"></iconify-icon>
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] md:text-xs text-white font-bold">$2B+ Ad Spend</div>
                            <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Managed Annually</div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-5xl opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <PartnersCarousel />
                </div>

            </div>

            {/* Ultra-Compact Results Modal */}
            <Modal isOpen={showCalculatorModal} onClose={handleModalClose} size="lg">
                <div className="p-3 md:p-5 flex flex-col items-center max-h-[90vh] overflow-y-auto hide-scrollbar">
                    <div className="mb-2 w-full text-center">
                        <h3 className="text-lg md:text-xl font-black text-white tracking-[0.2em] uppercase">beat the algorithm</h3>
                    </div>

                    {/* Wistia Video Embed - Ultra Compact */}
                    <div className="w-full max-w-[380px] bg-black rounded-lg overflow-hidden shadow-xl border border-white/10 mb-3 aspect-video relative">
                        <WistiaEmbed mediaId="okb9j6qvf5" aspect={1.7777777777777777} />
                    </div>

                    {/* Steps - Super Compact */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mb-4">
                        {[
                            { step: '01', title: 'Import', desc: 'connect and import running campaigns', icon: 'solar:import-bold', color: 'text-brand-blue' },
                            { step: '02', title: 'Optimize', desc: 'turn on optimizations for the selected campaigns', icon: 'solar:magic-stick-3-bold', color: 'text-brand-yellow' },
                            { step: '03', title: 'Scale', desc: 'AI stops losers and scale winners & generate more winners', icon: 'solar:fire-bold', color: 'text-red-500' }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-row md:flex-col items-center gap-3 md:gap-1 bg-white/[0.03] border border-white/5 p-2 rounded-lg text-left md:text-center transition-all">
                                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/5 ${s.color}`}>
                                    <iconify-icon icon={s.icon} class="text-lg md:text-xl"></iconify-icon>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[12px] md:text-xs font-black text-white leading-none mb-0.5 uppercase tracking-wide">{s.title}</h4>
                                    <p className="text-[9px] md:text-[10px] text-gray-500 leading-tight font-medium">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-full flex flex-col items-center">
                        <Button
                            onClick={handleFixItNow}
                            fullWidth
                            variant="ghost"
                            className="h-12 md:h-14 text-sm font-black uppercase tracking-widest group shadow-2xl bg-brand-blue border border-brand-blue hover:bg-[#5c69ff] shadow-[0_4px_0_0_#3340D1] hover:shadow-[0_6px_0_0_#3340D1] active:translate-y-1 active:shadow-none transition-all duration-200"
                        >
                            <div className="relative h-5 overflow-hidden flex items-center justify-center w-full">
                                <span className="absolute transition-transform duration-300 group-hover:-translate-y-8">spend smarter</span>
                                <span className="absolute translate-y-8 transition-transform duration-300 group-hover:translate-y-0 text-white">scale faster</span>
                            </div>
                            <iconify-icon icon="solar:arrow-right-linear" class="text-xl group-hover:translate-x-1 transition-transform ml-2"></iconify-icon>
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                @keyframes gradient-text {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes pop-in {
                    0% { transform: translateY(10px) scale(0.8); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-gradient-text {
                    animation: gradient-text 3s linear infinite;
                }
                .animate-pop-in {
                    animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default Hero;