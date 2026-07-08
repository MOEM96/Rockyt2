import React from 'react';
import { RockytLogo } from './Logo';
import { NavigationProps, PageType } from '../types/index';
import { scrollToTop } from '../utils/helpers';

const Footer: React.FC<NavigationProps> = ({ onNavigate }) => {
    const handleNavigate = (page: PageType) => {
        onNavigate(page);
        scrollToTop();
    };

    return (
        <footer className="bg-[#0A0A0A] text-white pt-16 pb-8 border-t border-white/5 mt-auto" role="contentinfo">
            <div className="max-w-[1200px] mx-auto px-6">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="md:col-span-5 flex flex-col items-start">
                        <button
                            onClick={() => handleNavigate('home')}
                            className="flex items-center gap-3 mb-6 group"
                            aria-label="Go to homepage"
                        >
                            <div className="w-8 h-8 flex items-center justify-center text-brand-blue group-hover:text-white transition-colors">
                                <RockytLogo className="w-full h-full" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Rockyt</span>
                        </button>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">
                            Automate your advertising strategy. Scale faster with less manual work and better results using our AI-powered platform.
                        </p>

                        {/* Socials */}
                        <div className="flex items-center gap-4">
                            <a href="https://www.facebook.com/smartadmanager" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all duration-300" aria-label="Facebook">
                                <iconify-icon icon="simple-icons:facebook" width="18"></iconify-icon>
                            </a>
                            <a href="https://www.instagram.com/rockyt_admanager/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-[#E1306C] hover:text-white transition-all duration-300" aria-label="Instagram">
                                <iconify-icon icon="simple-icons:instagram" width="18"></iconify-icon>
                            </a>
                            <a href="https://www.tiktok.com/@smart_adsmanager" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all duration-300" aria-label="TikTok">
                                <iconify-icon icon="simple-icons:tiktok" width="18"></iconify-icon>
                            </a>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 cursor-default" title="G2">
                                <iconify-icon icon="simple-icons:g2" width="18"></iconify-icon>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 cursor-default" title="Trustpilot">
                                <iconify-icon icon="simple-icons:trustpilot" width="18"></iconify-icon>
                            </div>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="md:col-span-3"></div>

                    {/* Product Links */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Product</h4>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => handleNavigate('performance')} className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Performance</button>
                            <button onClick={() => handleNavigate('cases')} className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Case Studies</button>
                            <button onClick={() => handleNavigate('pricing')} className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Pricing</button>
                            <a href="https://aiads.tawk.help/" target="_blank" rel="noopener noreferrer" className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Help Center</a>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Legal</h4>
                        <div className="flex flex-col gap-4">
                            <a href="https://privacy.rockyt.io" target="_blank" rel="noopener noreferrer" className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Privacy Policy</a>
                            <a href="https://privacy.rockyt.io" target="_blank" rel="noopener noreferrer" className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Terms of Use</a>
                            <a href="#" className="text-left text-gray-400 hover:text-brand-yellow transition-colors text-sm">Cookie Policy</a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-gray-600 font-medium">
                        © {new Date().getFullYear()} Rockyt Inc. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">All systems operational</span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;