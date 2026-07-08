import React, { useState, useEffect } from 'react';

// Middle East Profiles (70% target)
const ME_PROFILES = [
  { name: "Ahmed", location: "Dubai, UAE" },
  { name: "Sarah", location: "Riyadh, KSA" },
  { name: "Omar", location: "Cairo, Egypt" },
  { name: "Layla", location: "Doha, Qatar" },
  { name: "Hassan", location: "Kuwait City" },
  { name: "Fatima", location: "Abu Dhabi, UAE" },
  { name: "Youssef", location: "Jeddah, KSA" },
  { name: "Nour", location: "Beirut, Lebanon" },
  { name: "Karim", location: "Amman, Jordan" },
  { name: "Zainab", location: "Manama, Bahrain" },
  { name: "Mehmet", location: "Istanbul, Turkey" },
  { name: "Yasmin", location: "Muscat, Oman" },
  { name: "Tarek", location: "Alexandria, Egypt" },
  { name: "Dana", location: "Dubai, UAE" }
];

// Europe Profiles (30% target)
const EU_PROFILES = [
  { name: "James", location: "London, UK" },
  { name: "Sophie", location: "Berlin, Germany" },
  { name: "Lucas", location: "Paris, France" },
  { name: "Emma", location: "Amsterdam, NL" },
  { name: "Thomas", location: "Stockholm, Sweden" },
  { name: "Anna", location: "Dublin, Ireland" },
  { name: "David", location: "Zurich, Switzerland" },
  { name: "Maria", location: "Madrid, Spain" },
  { name: "Oliver", location: "Copenhagen, Denmark" },
  { name: "Isabella", location: "Rome, Italy" }
];

const SocialProofWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [info, setInfo] = useState({ name: 'Ahmed', location: 'Dubai, UAE' });
  const [userGeo, setUserGeo] = useState<{city: string, country: string} | null>(null);

  // Attempt to get user location via IP
  useEffect(() => {
    const fetchGeo = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.city && data.country_name) {
                setUserGeo({ city: data.city, country: data.country_name });
            }
        } catch (e) {
            // Fail silently and use default lists
        }
    };
    fetchGeo();
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let hideTimeoutId: ReturnType<typeof setTimeout>;

    const getNextProfile = () => {
        const rand = Math.random();
        // 70% chance Middle East, 30% Europe
        if (rand < 0.7) {
            return ME_PROFILES[Math.floor(Math.random() * ME_PROFILES.length)];
        } else {
            return EU_PROFILES[Math.floor(Math.random() * EU_PROFILES.length)];
        }
    };

    const scheduleNext = () => {
      // Random delay between 15s and 40s
      const delay = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000;
      
      timeoutId = setTimeout(() => {
        setInfo(getNextProfile());
        setIsVisible(true);

        hideTimeoutId = setTimeout(() => {
          setIsVisible(false);
          scheduleNext(); 
        }, 2000);
      }, delay);
    };

    // Initial Trigger (10s after landing)
    const initialTimeout = setTimeout(() => {
        if (userGeo) {
            // Personalize the first one if we have geo data
            const localNames = ["Alex", "Sam", "Chris", "Sarah", "Mike", "Anna"];
            const name = localNames[Math.floor(Math.random() * localNames.length)];
            setInfo({ name, location: `${userGeo.city}, ${userGeo.country}` });
        } else {
            setInfo(getNextProfile());
        }
        
        setIsVisible(true);
        
        hideTimeoutId = setTimeout(() => {
            setIsVisible(false);
            scheduleNext();
        }, 2000);
    }, 10000);

    return () => {
        clearTimeout(initialTimeout);
        clearTimeout(timeoutId);
        clearTimeout(hideTimeoutId);
    };
  }, [userGeo]); // Re-schedule if geo loads (improves personalization)

  return (
    <div 
      className={`fixed bottom-6 left-4 md:bottom-8 md:left-8 z-[60] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform will-change-transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-95 pointer-events-none'}`}
    >
      <div className="flex items-center gap-3 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 px-3 py-2.5 md:px-4 md:py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-brand-yellow/30 transition-colors cursor-default select-none max-w-[280px] md:max-w-none">
          {/* Avatar Stack */}
          <div className="flex -space-x-2 shrink-0">
             <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-brand-yellow to-[#FFAE00] flex items-center justify-center text-[10px] md:text-xs font-black text-black border-2 border-[#1A1A1A] shadow-lg relative z-10 uppercase">
                {info.name.charAt(0)}
             </div>
             <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-[#2A2A2A] flex items-center justify-center text-gray-400 border-2 border-[#1A1A1A] relative z-0">
                <iconify-icon icon="solar:user-check-bold" width="14"></iconify-icon>
             </div>
          </div>
          
          {/* Text Info */}
          <div className="flex flex-col pr-2 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-white leading-tight mb-0.5 truncate w-full">
                  <span className="text-brand-yellow">{info.name}</span> from {info.location}
              </span>
              <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[9px] md:text-[10px] text-gray-400 font-medium leading-tight whitespace-nowrap">
                      Booked a trial
                  </span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default SocialProofWidget;