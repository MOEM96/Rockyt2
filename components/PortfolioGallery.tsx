import React, { useRef, useState } from 'react';
import { ArrowUpRight, Bot } from 'lucide-react';

export interface PortfolioGalleryProps {
  onNavigateToPath?: (path: string) => void;
}

const platformChannels = [
  { 
    id: 1, 
    name: "TWITTER / X", 
    slug: "/x", 
    category: "SOCIAL", 
    type: "POST & REPLY", 
    desc: "Publish posts, threads, media, & analyze metrics.", 
    badge: "OAUTH 2.0",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  { 
    id: 2, 
    name: "INSTAGRAM", 
    slug: "/instagram", 
    category: "SOCIAL", 
    type: "REELS & DMS", 
    desc: "Reels, feed photos, stories, & DM auto-responders.", 
    badge: "META PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    )
  },
  { 
    id: 3, 
    name: "WHATSAPP", 
    slug: "/whatsapp", 
    category: "MESSAGING", 
    type: "VIRTUAL NUMBERS", 
    desc: "Send WhatsApp DMs, purchase US numbers, & webhooks.", 
    badge: "BUSINESS API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.67-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.84L0 24l6.328-1.503C8.01 23.447 9.957 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.802 0-3.551-.476-5.09-1.378l-.365-.213-3.757.892.909-3.663-.236-.375C2.49 15.706 2 13.9 2 12 2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    )
  },
  { 
    id: 4, 
    name: "TIKTOK", 
    slug: "/tiktok", 
    category: "SOCIAL", 
    type: "SHORT VIDEO", 
    desc: "Direct video publishing & AI caption generation.", 
    badge: "TIKTOK PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    )
  },
  { 
    id: 5, 
    name: "LINKEDIN", 
    slug: "/linkedin", 
    category: "SOCIAL", 
    type: "B2B POSTS", 
    desc: "Company updates, carousels, & article publishing.", 
    badge: "LINKEDIN PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
      </svg>
    )
  },
  { 
    id: 6, 
    name: "TELEGRAM", 
    slug: "/telegram", 
    category: "MESSAGING", 
    type: "BROADCASTS", 
    desc: "Bot dispatches, channel updates, & group messages.", 
    badge: "BOT API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.05 9.67c-.15.68-.56.84-1.13.53l-3.14-2.31-1.52 1.46c-.17.17-.31.31-.63.31l.23-3.23 5.87-5.3c.25-.23-.06-.35-.4-.13l-7.26 4.57-3.13-.98c-.68-.21-.69-.68.14-1l12.24-4.72c.57-.21 1.07.13.88.93z"/>
      </svg>
    )
  },
  { 
    id: 7, 
    name: "DISCORD", 
    slug: "/discord", 
    category: "MESSAGING", 
    type: "BOT DISPATCH", 
    desc: "Channel broadcasts, embeds, & community bots.", 
    badge: "WEBHOOK API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
  { 
    id: 8, 
    name: "SLACK", 
    slug: "/slack", 
    category: "MESSAGING", 
    type: "WORKFLOW BOTS", 
    desc: "Workspace bot messages, block kit cards, & webhooks.", 
    badge: "SLACK API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.523v-2.521h2.52zM15.165 17.685a2.527 2.527 0 0 1-2.52-2.52 2.527 2.527 0 0 1 2.52-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52h-6.313z"/>
      </svg>
    )
  },
  { 
    id: 9, 
    name: "META ADS", 
    slug: "/meta-ads", 
    category: "ADS", 
    type: "CAMPAIGNS", 
    desc: "Programmatic ad creation, budgets, & lead forms.", 
    badge: "META PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303z"/>
      </svg>
    )
  },
  { 
    id: 10, 
    name: "GOOGLE ADS", 
    slug: "/google-ads", 
    category: "ADS", 
    type: "SEARCH & DISPLAY", 
    desc: "AI campaign management & keyword bidding API.", 
    badge: "GOOGLE PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.782 0 9.601-4.068 9.601-9.761 0-.665-.061-1.312-.172-1.999h-9.429z"/>
      </svg>
    )
  },
  { 
    id: 11, 
    name: "THREADS", 
    slug: "/threads", 
    category: "SOCIAL", 
    type: "TEXT THREADS", 
    desc: "Multi-post text threads & engagement webhooks.", 
    badge: "META API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24c-3.149 0-5.753-1.011-7.531-2.924C2.85 19.136 2 16.29 2 12.673c0-3.666.866-6.529 2.644-8.47C6.42 2.26 9.027 1.25 12.176 1.25c3.159 0 5.772 1.01 7.545 2.953 1.777 1.941 2.644 4.804 2.644 8.47 0 .44-.017.915-.05 1.424h-3.41c.026-.411.04-.799.04-1.164 0-2.811-.606-4.945-1.802-6.342-1.196-1.397-2.966-2.106-5.26-2.106-2.28 0-4.048.709-5.253 2.106-1.205 1.397-1.816 3.531-1.816 6.342 0 2.812.611 4.946 1.816 6.343 1.205 1.397 2.973 2.106 5.253 2.106 1.77 0 3.23-.424 4.34-1.26.85-.64 1.45-1.54 1.78-2.68l3.28.78c-.5 1.77-1.46 3.19-2.86 4.22-1.78 1.31-4.04 1.97-6.73 1.97z"/>
      </svg>
    )
  },
  { 
    id: 12, 
    name: "BLUESKY", 
    slug: "/bluesky", 
    category: "SOCIAL", 
    type: "AT PROTOCOL", 
    desc: "Decentralized posts & custom feed algorithms.", 
    badge: "AT PROTOCOL",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566 1.009.8 1.82.24 3.328c-.56 1.51.15 4.417 2.25 6.942 2.1 2.525 5.51 3.532 5.51 3.532s-4.024-.51-6.85 1.02c-2.826 1.53-2.164 4.7.45 4.7 2.614 0 7.39-1.25 9.4-4.72 2.01 3.47 6.786 4.72 9.4 4.72 2.614 0 3.276-3.17.45-4.7-2.826-1.53-6.85-1.02-6.85-1.02s3.41-1.007 5.51-3.532c2.1-2.525 2.81-5.432 2.25-6.942-.56-1.508-2.326-2.32-4.962-.533C16.046 4.747 13.087 8.686 12 10.8z"/>
      </svg>
    )
  },
  { 
    id: 13, 
    name: "REDDIT", 
    slug: "/reddit", 
    category: "SOCIAL", 
    type: "COMMUNITY", 
    desc: "Subreddit posts, comments, & karma analytics.", 
    badge: "REDDIT API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.344 6.315 3.516 8.484l-1.347 4.041 4.253-1.276C8.5 23.82 10.207 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.362.766-.593 1.282-.593.952 0 1.726.773 1.726 1.725 0 .684-.4 1.272-.977 1.545.025.22.039.444.039.67 0 3.385-3.95 6.13-8.823 6.13-4.872 0-8.822-2.745-8.822-6.13 0-.22.013-.44.037-.655a1.725 1.725 0 0 1-.977-1.56c0-.952.774-1.725 1.726-1.725.513 0 .969.23 1.277.589 1.189-.854 2.835-1.417 4.653-1.489l.913-4.28 3.197.674a1.246 1.246 0 0 1 1.096-.632z"/>
      </svg>
    )
  },
  { 
    id: 14, 
    name: "PINTEREST", 
    slug: "/pinterest", 
    category: "SOCIAL", 
    type: "PINS & BOARDS", 
    desc: "Pin creation, board analytics, & visual shopping API.", 
    badge: "PINTEREST PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
      </svg>
    )
  },
  { 
    id: 15, 
    name: "SNAPCHAT", 
    slug: "/snapchat", 
    category: "SOCIAL", 
    type: "STORY ADS", 
    desc: "Publish story clips, filter overlays, & snap ads.", 
    badge: "SNAP PARTNER",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.025 0C5.9 0 4.673 3.966 4.673 5.485c0 2.225 1.547 3.328 1.547 4.17 0 .546-.628 1.091-1.398 1.091-.86 0-2.308-.687-3.033-2.222-.162-.345-.444-.396-.647-.396-.347 0-.749.208-.749.614 0 1.25 1.624 3.864 3.738 4.492.215.064.385.253.332.484-.236 1.02-1.611 1.764-2.825 2.247-.417.166-.638.455-.638.749 0 .848 1.706.993 3.011 1.107 1.484.13 2.92.518 4.06 1.343.882.639 2.339.639 3.22 0 1.141-.825 2.577-1.213 4.06-1.343 1.306-.114 3.012-.259 3.012-1.107 0-.294-.221-.583-.638-.749-1.214-.483-2.589-1.227-2.825-2.247-.053-.231.117-.42.332-.484 2.114-.628 3.738-3.242 3.738-4.492 0-.406-.402-.614-.749-.614-.203 0-.485.051-.647.396-.725 1.535-2.173 2.222-3.033 2.222-.77 0-1.398-.545-1.398-1.091 0-.842 1.547-1.945 1.547-4.17C19.377 3.966 18.15 0 12.025 0z"/>
      </svg>
    )
  },
  { 
    id: 16, 
    name: "GOOGLE BUSINESS", 
    slug: "/googlebusiness", 
    category: "SOCIAL", 
    type: "LOCAL POSTS", 
    desc: "Local business posts, review replies, & location updates.", 
    badge: "GOOGLE API",
    icon: (
      <svg className="w-6 h-6 shrink-0 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 5.25 7 13 9 13s9-7.75 9-13c0-4.97-4.03-9-9-9zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    )
  }
];

const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ onNavigateToPath }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'SOCIAL' | 'MESSAGING' | 'ADS'>('ALL');

  const filteredChannels = filter === 'ALL' 
    ? platformChannels 
    : platformChannels.filter(c => c.category === filter);

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.8;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleChannelClick = (slug: string) => {
    if (onNavigateToPath) {
      onNavigateToPath(slug);
    } else {
      window.history.pushState({}, '', slug);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <section id="channels" className="bg-zinc-900/80 backdrop-blur-md border-t border-b border-white/10 relative z-20 py-14 overflow-hidden">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="font-mono text-xs text-brand tracking-widest uppercase font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand rounded-full animate-pulse"></span>
            16 PLATFORMS // DEDICATED API PAGES
          </span>
          <h3 className="font-display font-semibold text-3xl sm:text-5xl text-white uppercase tracking-tight mt-1">
            SUPPORTED <span className="text-brand">CHANNELS</span>
          </h3>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          {(['ALL', 'SOCIAL', 'MESSAGING', 'ADS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 border transition-all font-semibold rounded-sm ${filter === cat ? 'bg-brand text-white border-brand shadow-glow' : 'bg-black/40 text-white/60 border-white/20 hover:border-white hover:text-white'}`}
            >
              {cat === 'ALL' ? 'ALL 16 CHANNELS' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Strip with Mouse Drag Support */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto pb-6 px-6 gap-5 no-scrollbar select-none ${isDragging ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'}`}
      >
        {filteredChannels.map((c) => (
          <div 
            key={c.id} 
            onClick={() => handleChannelClick(c.slug)}
            className="flex-none w-[260px] sm:w-[300px] aspect-[4/5] relative group border border-white/15 overflow-hidden bg-black/80 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-1.5 p-6 flex flex-col justify-between cursor-pointer"
          >
            {/* Background Accent Grid */}
            <div className="absolute inset-0 bg-zinc-950/90 group-hover:bg-zinc-900/90 transition-colors" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            {/* Top Bar */}
            <div className="relative z-10 flex justify-between items-start border-b border-white/15 pb-3">
              <span className="font-mono text-[10px] bg-brand/20 text-brand border border-brand/40 px-2 py-0.5 font-bold uppercase tracking-wider">
                {c.badge}
              </span>
              <span className="font-mono text-[10px] text-white/50">{c.slug}</span>
            </div>

            {/* Middle Content with Platform Logo Icon */}
            <div className="relative z-10 my-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-md bg-white/5 border border-white/15 group-hover:border-brand/50 group-hover:bg-brand/10 transition-all">
                  {c.icon}
                </div>
                <div>
                  <span className="font-mono text-[9px] text-brand tracking-widest uppercase font-semibold block">
                    {c.category} // {c.type}
                  </span>
                  <h4 className="font-display font-bold text-2xl text-white tracking-tight leading-none mt-0.5">
                    {c.name}
                  </h4>
                </div>
              </div>
              <p className="font-mono text-xs text-white/70 leading-relaxed">
                {c.desc}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 flex justify-between items-center border-t border-white/15 pt-3">
              <span className="font-mono text-[10px] text-white/60">ENDPOINT: /v1{c.slug}</span>
              <span className="flex items-center gap-1 text-brand font-mono text-[10px] font-bold group-hover:translate-x-1 transition-transform">
                VIEW SPEC <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Hover Frame Accent */}
            <div className="absolute inset-0 border-2 border-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}

        {/* View All Capstone */}
        <div 
          onClick={() => handleChannelClick('/agent-quickstart')}
          className="flex-none w-[180px] flex flex-col items-center justify-center border border-white/20 bg-white/5 hover:bg-brand/20 hover:border-brand transition-all cursor-pointer group rounded-sm p-6 text-center"
        >
           <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center mb-3 group-hover:border-brand group-hover:scale-110 group-hover:bg-brand transition-all">
             <Bot className="text-white w-6 h-6" />
           </div>
           <span className="text-white/80 group-hover:text-white font-mono text-xs tracking-widest font-bold">
            AGENT QUICKSTART<br/>&amp; MCP DOCS
           </span>
           <span className="font-mono text-[10px] text-brand mt-2 underline">/agent-quickstart</span>
        </div>
      </div>
    </section>
  );
};

export default PortfolioGallery;