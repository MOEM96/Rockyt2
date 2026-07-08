
import { PartnerLogo, Platform, CaseStudy, PerformanceSection, FAQItem, PricingTier, CompanyStat, CustomerLogo } from '../types/index';

export const CAL_CONFIG = {
  link: 'rock-yt-admanager/15min',
  namespace: '15min',
  config: {
    layout: 'month_view',
    useSlotsViewOnSmallScreen: 'true',
    theme: 'dark',
  },
} as const;

export const EXTERNAL_LINKS = {
  signup: 'https://app.bir.ch/signup',
  signupHub: 'https://app.bir.ch/signup?gateway=true',
  supportEmail: 'support@rockyt.io',
};

export const WEBINAR_BENEFITS = [
  { icon: 'solar:microphone-3-bold', text: 'Discuss latest updates & new features' },
  { icon: 'solar:user-speak-bold', text: 'Meet the founder — ask anything' },
  { icon: 'solar:chat-round-dots-bold', text: 'Live Q&A — get your questions answered' },
  { icon: 'solar:lightbulb-bolt-bold', text: 'Request features & shape the roadmap' },
];

export const ONBOARDING_PLANS = [
  {
    name: 'Growth',
    price: 49,
    description: 'Multi-channel scaling for growing teams.',
    features: [
      '1 Brand/Workspace',
      '1 Ad Platform (Meta)',
      'Creative Hub Access (AI Images, Reels, UGC)',
      'Template Library (1000+ Winning Ads)',
      'Analytics & Insights',
      'AI Optimization (Creative & Audience)',
      'Budget Optimizer (Campaign Level)',
      'No Server-Side Tracking',
    ],
    color: 'brand-blue',
    accent: '#4450F2',
    cta: 'Start with Growth',
    popular: false,
  },
  {
    name: 'Scale',
    price: 99,
    description: 'Total dominance for high-volume brands.',
    features: [
      'Everything in Growth +',
      'Up to 10 Brands/Workspaces',
      'All 11+ Ad Platforms',
      'Budget Optimizer (Platform & Campaign Level)',
      '100K Events Server-Side Tracking',
    ],
    color: 'brand-pink',
    accent: '#FF21A6',
    cta: 'Start with Scale',
    popular: true,
  },
  {
    name: 'Custom',
    price: null,
    description: 'White-label solution for agencies & enterprises.',
    features: [
      'White-label Dashboard (Your Domain)',
      'Full API Access',
      'Custom Payment Gateways',
      'Custom Integrations & SLA Support',
      'Dedicated Account Manager',
    ],
    color: 'white',
    accent: '#FFFFFF',
    cta: 'Contact Us',
    popular: false,
    isCustom: true,
  },
];

export const PARTNER_LOGOS: PartnerLogo[] = [
  { name: 'Meta', src: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
  { name: 'Bing', src: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Bing_Fluent_Logo.svg' },
  { name: 'Google', src: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' },
  { name: 'TikTok', src: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg' },
  { name: 'Snapchat', src: 'https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6980db70963c92fb17931ed0_2c4fefd121a16278851bed297cb08aa6_CS-platfrom-Snapchat.svg' },
  { name: 'Spotify', src: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' },
  { name: 'LinkedIn', src: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
];

export const PLATFORM_ICONS: Record<Platform, string> = {
  meta: 'https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/693994f4ba4c11ad5e156975_CS-platfrom-meta.svg',
  tiktok: 'https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/693995dde1b01dbf7d5fccf6_CS-platfrom-tt.svg',
  snapchat: 'https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6980db70963c92fb17931ed0_2c4fefd121a16278851bed297cb08aa6_CS-platfrom-Snapchat.svg',
};

export const VIDEO_URLS = {
  budgetOptimization: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc%2F68856e2581a36b66731c485a_OptimizationFolder-transcode.mp4",
  budgetOptimizationWebm: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc%2F68856e2581a36b66731c485a_OptimizationFolder-transcode.webm",
  budgetOptimizationPoster: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc%2F68856e2581a36b66731c485a_OptimizationFolder-poster-00001.jpg"
};

export const LOTTIE_URLS = {
  hero: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68ece6c98328b7f07810b227_Blow%20up%20Desktop.json"
};

// Updated 4 Stages for the Learning Journey
export const PERFORMANCE_SECTIONS: PerformanceSection[] = [
  { id: 'centralize', label: 'Centralize' },
  { id: 'create', label: 'Create' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'verify', label: 'Verify' },
];

export const HUB_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is 1st party data and 3rd party data?",
    answer: "First-party data = You collect it directly from your customers. Third-party data = Someone else collected it and sold it to you. Apple killed third-party cookies. Google is next. If you're still relying on third-party data, you're building your business on quicksand. First-party data (collected server-side) is the ONLY future-proof solution."
  },
  {
    question: "Why are marketers switching to server-side tracking?",
    answer: "Because their ads stopped working after iOS 14.5. When Apple blocked browser tracking, Meta lost 60% visibility into conversions. The algorithm couldn't optimize properly. CPAs went up. ROAS went down. Advertisers panicked. Server-side tracking bypasses these blocks. You get 100% data again. Your ads work again. It's not optional—it's survival."
  },
  {
    question: "How Signals Gateway helps make advertising more effective?",
    answer: "Perfect data → Perfect optimization → Perfect results. Here's the chain reaction: 1. Signal Gateways capture 100% of conversion data. 2. We send it to Meta/Google's algorithms. 3. AI algorithms see complete picture. 4. They optimize for actual conversions (not guesses). 5. They show ads to people who actually buy. 6. Your ROAS goes up, CPA goes down. It's not magic. It's just giving AI the data it needs to work properly."
  },
  {
    question: "What results can I expect?",
    answer: "Average results across all clients: +40% improvement in event tracking, -22% decrease in CPA, +25% increase in ROAS, <24 hour setup time. Your results may vary based on how broken your current tracking is. The worse your tracking now, the bigger the improvement when you fix it. Book a free audit and we'll show you exactly what you're missing."
  },
  {
    question: "Is it GDPR compliant?",
    answer: "Signals Gateway and first-party data help with compliance by reducing reliance on third-party cookies, ensuring user consent, and giving businesses full control over their data."
  },
  {
    question: "Do I need technical skills to set this up?",
    answer: "Not at all. Rockyt is designed for marketers, not developers. Our one-click setup connects your ad accounts instantly. For the advanced tracking features (Signals Gateway), our team handles the technical implementation for you during onboarding."
  }
];

export const HUB_CAROUSEL_IMAGES = [
  { src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68d147354dd1b9d4d833dc44_2dc4c4ced51c6adaa954a52032b58d06_hub-01.jpg" },
  { src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68d147354cb4d49080511413_90fcd60e808c00e064c86c7c5efbc757_02_2.jpg" },
  { src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68d147351a3fa852ba291630_a8a36591f13a1d245bd2f7747921fe7f_03_2.jpg" }
];

export const HUB_PRICING_TIERS: PricingTier[] = [
  { events: "10,000", price: "Free", highlighted: true },
  { events: "500,000", price: "$10" },
  { events: "5,000,000", price: "$49" },
  { events: "20,000,000", price: "$149" },
  { events: "50,000,000", price: "$249" },
  { events: "150,000,000", price: "$499" },
];

export const COMPANY_STATS: CompanyStat[] = [
  { value: "$2B", label: "Managed\nad spend", color: 'yellow' },
  { value: "$240M", label: "Saved annually", color: 'pink' },
  { value: "15,000+", label: "Active accounts", color: 'blue' },
];

export const CUSTOMER_LOGOS: CustomerLogo[] = [
  { name: "Liven", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67c5beaa4c7fbfef848beced_6720e123b0ca4231f3a00bc7_Logo%202%202.png", alt: "Liven" },
  { name: "Scentbird", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67c5beaa4c7fbfef848bece7_scentbird.png", alt: "Scentbird" },
  { name: "Loop", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68e630347ae261f1cba047d3_loop-earplugs-svg.svg", alt: "Loop" },
  { name: "Plantin", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67c5bea94c7fbfef848becd9_plantin.avif", alt: "Plantin" },
  { name: "AdParlor", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68e51ce0ac361e304aab6dd1_adparlor_new_logo_white_text.svg", alt: "AdParlor" },
  { name: "Partner", src: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67c5beaa4c7fbfef848becf1_Design%20290x292.png", alt: "Partner" },
  { name: "Customer 8", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852442e820f97f798a9352e_Plai%20Customers.png", alt: "Customer Logo" },
  { name: "Customer 9", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852d790d8fdbaa07646c663_4.png", alt: "Customer Logo" },
  { name: "Customer 10", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852df2bcf90e788987ff6ad_Plai%20Customers%20(5).png", alt: "Customer Logo" },
  { name: "Customer 11", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852d78e89b3b2b8d9c47800_3.png", alt: "Customer Logo" },
  { name: "Customer 12", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852dc1222513658079c43cb_Plai%20Customers%20(2).png", alt: "Customer Logo" },
  { name: "Customer 13", src: "https://cdn.prod.website-files.com/6798ff28c64131df111e57cc/6852d78e4b43b0dbb0cdafd6_2.png", alt: "Customer Logo" },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cricksydog',
    size: 'big',
    category: 'ecom',
    title: "CricksyDog's CPA drops 30% after switching to Bïrch Signal Gateways",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/682ef087944cd4eb082f4dde_f55e8fca892d32417f975093cb8313d5_CricksyDog-for-main-cases-page.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/682eef7f89d00ecb83853bbc_a870021f1d8128b91c23f6b4b9ac8726_CricksyDog_logo%20for%20main.png",
    platforms: ['meta'],
    bgColor: "bg-[#F3F5F7]",
    textColor: "text-black"
  },
  {
    id: 'fabulous',
    size: 'small',
    category: 'app',
    title: "From Manual to Automated: Scaling 50% More While Maintaining Target CPA",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6981fee63f350af65871c684_e1c44fadef4fdbf83f527f7052580769_the_fabulous-cs-gallery.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6980e060a1565ce1f098d476_Fabulous_Logo_white_background_2.png",
    platforms: ['tiktok', 'snapchat', 'meta'],
    logoInvert: false
  },
  {
    id: 'adparlor',
    size: 'small',
    category: 'agency',
    title: "AdParlor eliminated manual work in TikTok Ads management using Bïrch",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/69399d07b708063c77035dbb_sidharth-sharma-cs-main_s%20(1).jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/682c768b41d8916da356af4d_svg-ap-a-fluent-company-2x-1.png",
    platforms: ['tiktok'],
    logoInvert: true
  },
  {
    id: 'loop',
    size: 'big',
    category: 'ecom',
    title: "Loop Earplugs scale 200% faster with Bïrch automation",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67f77ac7b93f9783c8f899ae_ac6b6bbf988cff9a1d064e689b38e789_alex-loop-for-cases-page.jpeg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67e5347e3a4e93c87276fd1e_loop%20logo_Avantt_FINAL%20-%20black.png",
    platforms: ['meta'],
    bgColor: "bg-[#F3F5F7]",
    textColor: "text-black"
  },
  {
    id: 'pawz',
    size: 'small',
    category: 'ecom',
    title: "How Accurate Tracking Helps Pawz.rs Scale Cold Campaigns Profitably",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68e3b37354530907f6ab9bfd_cat_400w.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/68e3ad96284718eb55d52c4c_Pawz_logo.svg",
    platforms: ['meta']
  },
  {
    id: 'cocosolis',
    size: 'small',
    category: 'ecom',
    title: "How Cocosolis streamlined multi-account ad management while improving ROAS",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6888b0696dda7159a0b78f57_plamen%20photo%20(1).jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/686cfb4487f2067ea15234a8_logo-COCOSOLIS-png.png",
    platforms: ['meta']
  },
  {
    id: 'adquantum',
    size: 'big',
    category: 'agency',
    title: "AdQuantum was able to spend 30% less time managing ad campaigns",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd93_cs-artem.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd15_adquantum-01.png",
    platforms: ['meta'],
    bgColor: "bg-[#F3F5F7]",
    textColor: "text-black"
  },
  {
    id: 'ecomhouse',
    size: 'small',
    category: 'agency',
    title: "ECOM HOUSE uses various rules to reduce CPA for their clients",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd79_cs-ecomhouse.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfc79_Ecom_House_Logo_Black%20-%20Emanuele%20Maragno.png",
    platforms: ['meta'],
    logoInvert: true
  },
  {
    id: 'webtopia',
    size: 'small',
    category: 'agency',
    title: "Webtopia scaled ad accounts from $1,000/day to $30,000/day with Bïrch",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67b6fbaa96fae701fd1578bc_6716718ea408f53194adfdab_cs-ecomdept.png",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/67b6f8af5e2974f894ade66d_W_Icon.png",
    platforms: ['meta'],
    logoInvert: true
  },
  {
    id: 'scentbird',
    size: 'big',
    category: 'ecom',
    title: "Scentbird does 80% more ad creative testing to find winning angles faster",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd8a_cs-oleg.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adf9b3_black-scentbird.svg",
    platforms: ['meta'],
    bgColor: "bg-[#F3F5F7]",
    textColor: "text-black"
  },
  {
    id: 'ignite',
    size: 'small',
    category: 'agency',
    title: "Ignite Your Brand helped a client reach $3.9M in sales in one month",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd84_cs-lalo.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd87_ignite.png",
    platforms: ['meta']
  },
  {
    id: 'marco',
    size: 'small',
    category: 'agency',
    title: "Marco Battaglia helped his client decrease CPA by 25.87% in 6 months",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfdac_cs-marco.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfdb4_marco-logo.png",
    platforms: ['meta'],
    logoInvert: true
  },
  {
    id: 'keiki',
    size: 'big',
    category: 'app',
    title: "Keiki's ad spend has increased by 2.76 times",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6720e7b4575fd83783e88d8b_cs-keiki.png",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6720e123b0ca4231f3a00bc7_Logo%202.svg",
    platforms: ['meta'],
    bgColor: "bg-[#F3F5F7]",
    textColor: "text-black"
  },
  {
    id: 'voy',
    size: 'small',
    category: 'agency',
    title: "Voy Media can take on more clients per account manager allowing the agency to scale faster",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd89_kevin.png",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfcce_voy_media_logo.png",
    platforms: ['meta']
  },
  {
    id: 'alessandro',
    size: 'small',
    category: 'agency',
    title: "Alessandro can take on more clients and host more coaching events",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfd88_cs-ag.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfdb0_garguilo-logobl.png",
    platforms: ['meta'],
    logoInvert: true
  },
  {
    id: 'ecomdept',
    size: 'small',
    category: 'agency',
    title: "ECOM DEPT eliminates $10k+ in wasted monthly ad spend for their clients",
    image: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfdab_cs-ecomdept.jpg",
    logo: "https://cdn.prod.website-files.com/6716718ea408f53194adf9a9/6716718ea408f53194adfc06_ecom_logo%201.png",
    platforms: ['meta'],
    logoInvert: true
  }
];
