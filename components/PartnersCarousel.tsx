import React, { useEffect, useState } from 'react';
import { PARTNER_LOGOS } from '../constants/index';
import { usePrefersReducedMotion } from '../hooks/index';

// Double the items for seamless infinite scroll
const carouselItems = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

const PartnersCarousel: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Start animation after a short delay to allow layout to settle
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="partners-carousel w-full" aria-label="Partner logos carousel" role="region">
       <style>{`
        .partners-carousel {
          width: 100%;
          overflow: hidden;
          padding: 20px 0;
          background: transparent;
          position: relative;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .carousel-track {
          display: flex;
          align-items: center;
          gap: 40px;
          width: fit-content;
          opacity: 0;
          transition: opacity 0.5s ease;
          /* Force GPU acceleration to prevent layout trashing during scroll */
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }

        .carousel-track.loaded {
          opacity: 1;
          /* Only animate if user doesn't prefer reduced motion */
          ${!prefersReducedMotion ? 'animation: scroll 30s linear infinite;' : ''}
        }
        
        /* If reduced motion is on, allow horizontal scrolling or wrap */
        ${prefersReducedMotion ? `
          .partners-carousel {
            overflow-x: auto;
            mask-image: none;
            -webkit-mask-image: none;
          }
          .carousel-track {
            flex-wrap: wrap;
            justify-content: center;
          }
        ` : ''}

        .carousel-track:hover {
          animation-play-state: paused;
        }

        .partner-logo {
          flex-shrink: 0;
          width: 100px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border-radius: 8px;
          padding: 8px;
          transition: transform 0.25s ease, background 0.25s ease;
        }
        
        @media (min-width: 768px) {
            .partner-logo {
                width: 120px;
                height: 80px;
                padding: 10px;
                gap: 60px;
            }
        }

        .partner-logo:hover {
          transform: translateY(-4px) scale(1.05);
          background: rgba(255,255,255,0.05);
        }

        .partner-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          /* Adjusted for dark mode: invert to make them white/light */
          filter: grayscale(100%) invert(1) brightness(1.5);
          opacity: 0.6;
          transition: filter 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
          user-drag: none; 
          -webkit-user-drag: none;
        }
        
        .partner-logo:hover img { 
            /* On hover, restore original colors roughly, but ensure visibility on dark bg */
            filter: grayscale(0%) invert(0) brightness(1.1);
            opacity: 1;
            transform: scale(1.1); 
        }

        @keyframes scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
       `}</style>
       <div className={`carousel-track ${isLoaded ? 'loaded' : ''}`} role="list">
          {carouselItems.map((item, index) => {
             // Only expose original items to screen readers to avoid duplication announcements
             const isOriginal = index < PARTNER_LOGOS.length;
             return (
                <div 
                  className="partner-logo" 
                  key={`${item.name}-${index}`} 
                  title={item.name} 
                  role={isOriginal ? 'listitem' : 'presentation'}
                  aria-hidden={!isOriginal}
                >
                  <img 
                    src={item.src} 
                    alt={isOriginal ? `${item.name} logo` : ''} 
                    loading="eager"
                    width="120"
                    height="80"
                  />
                </div>
             );
          })}
       </div>
    </div>
  );
};

export default PartnersCarousel;