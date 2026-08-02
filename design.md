# DESIGN SYSTEM & FRONTEND UI/UX SPECIFICATION

> **Design Theme**: Cyberpunk Brutalist Zine / High-Tech WebGL 3D Hybrid  
> **Target Aesthetic**: Sleek Dark Mode with High-Contrast Paper Cards, Neon Pink Accents, Screen Distortion Glitches, Tape Strips, and Interactive 3D WebGL Tunnel Dynamics.

This specification contains the complete visual tokens, typography rules, CSS animation keyframes, Three.js 3D WebGL setup, and component layout guidelines required to recreate or generate an identical web application.

---

## 🎨 1. COLOR PALETTE & DESIGN TOKENS

### Core Palette
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#050505` | Primary application background (Deep Void Dark) |
| **Paper Card** | `#F0F0F2` | Zine contrast paper cards & high-impact containers |
| **Ink / Text / Borders** | `#111111` | Primary text, hard shadow colors, thick brutalist borders |
| **Brand Accent** | `#D35D88` | Primary brand pink, active buttons, glow highlights |
| **Brand Accent Light** | `#FF8DAA` | 3D fiber optic accent line, secondary glow |
| **Zinc Dark** | `#18181b` | Secondary dark background for code terminals & galleries |
| **Terminal Background** | `#09090b` / `#000000` | Code blocks, API payload boxes, MCP terminal screens |

### Shadow & Texture Tokens
```css
/* Hard Brutalist Shadow */
box-shadow: 8px 8px 0px 0px #111111;

/* Pink Glow Highlight */
box-shadow: 0 0 20px rgba(211, 93, 136, 0.6);

/* Tape Strip Effect */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(2px);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
border: 1px solid rgba(0, 0, 0, 0.12);

/* Pink Tape Strip Effect */
background: rgba(211, 93, 136, 0.85);
box-shadow: 0 2px 8px rgba(211, 93, 136, 0.4);
```

---

## 🔤 2. TYPOGRAPHY SYSTEM

Google Fonts declaration:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Font Role | Font Family | Usage |
| :--- | :--- | :--- |
| **Display / Headlines** | `'Oswald', sans-serif` | Big uppercase hero titles, card headers, pricing tiers, section nodes |
| **Sans / Body** | `'Inter', sans-serif` | General UI descriptions, paragraphs, buttons |
| **Mono / Code & HUD** | `'IBM Plex Mono', monospace` | Code snippets, API endpoints, badges, status indicators, HUD metadata |

### Typography Hierarchy Rules
- **Hero Title**: `font-display uppercase text-5xl sm:text-7xl lg:text-[7.5rem] leading-[0.88] tracking-tighter text-ink`
- **Section Headers**: `font-display uppercase text-5xl sm:text-7xl text-white tracking-tighter`
- **Card Headlines**: `font-display font-bold text-3xl sm:text-4xl text-white tracking-tight`
- **HUD Badges**: `font-mono text-xs uppercase tracking-widest text-brand`

---

## ⚡ 3. CUSTOM CSS ANIMATIONS & TEXT EFFECTS

### A. Screen Distortion Glitch Effect (`API` ↔ `MCP`)
Swaps text with an RGB split screen distortion animation:

```css
@keyframes glitch-skew {
  0% { transform: skew(0deg); }
  20% { transform: skew(-10deg) scaleY(1.08); }
  40% { transform: skew(10deg) scaleX(0.92); }
  60% { transform: skew(-6deg); }
  80% { transform: skew(6deg); }
  100% { transform: skew(0deg); }
}

@keyframes glitch-anim-1 {
  0% { clip-path: inset(15% 0 35% 0); transform: translate(-4px, 1px); }
  25% { clip-path: inset(55% 0 15% 0); transform: translate(4px, -3px); }
  50% { clip-path: inset(5% 0 75% 0); transform: translate(-3px, 4px); }
  75% { clip-path: inset(75% 0 5% 0); transform: translate(5px, -2px); }
  100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
}

.glitch-active {
  animation: glitch-skew 0.35s ease-in-out;
  position: relative;
  display: inline-block;
  color: #D35D88;
  text-shadow: 3px 0 #00ffff, -3px 0 #ff0055;
}

.glitch-active::before,
.glitch-active::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.85;
}

.glitch-active::before {
  color: #00ffff;
  animation: glitch-anim-1 0.35s infinite linear alternate-reverse;
  left: 3px;
  text-shadow: -2px 0 #ff0055;
  clip-path: inset(35% 0 35% 0);
}

.glitch-active::after {
  color: #ff0055;
  animation: glitch-anim-1 0.25s infinite linear alternate;
  left: -3px;
  text-shadow: 2px 0 #00ffff;
  clip-path: inset(15% 0 55% 0);
}
```

### B. Continuous 100% Infinite Marquee
Continuous scrolling without snapping or pops. Uses two identical parallel flex tracks:

```css
@keyframes continuous-marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.animate-marquee-continuous {
  animation: continuous-marquee 30s linear infinite;
}
```

Structure:
```tsx
<div className="bg-brand text-white overflow-hidden flex whitespace-nowrap">
  <div className="animate-marquee-continuous flex shrink-0 items-center gap-10 pr-10">
    <span>TWITTER / X</span> <span>///</span> <span>INSTAGRAM</span> <span>///</span>
  </div>
  <div className="animate-marquee-continuous flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
    <span>TWITTER / X</span> <span>///</span> <span>INSTAGRAM</span> <span>///</span>
  </div>
</div>
```

---

## 🔮 4. 3D WEBGL TUNNEL BACKGROUND (Three.js & GSAP)

A fixed 3D canvas background rendering a CatmullRom wireframe tunnel, glowing fiber optic tubes, particle starfield, and scroll progress tracking:

```typescript
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 1. Scene & Fog Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

// 2. 3D Path Curve Generation
const points: THREE.Vector3[] = [];
for (let i = 0; i < 60; i++) {
  points.push(new THREE.Vector3(
    Math.sin(i * 0.2) * 12 + (Math.random() - 0.5) * 4,
    Math.cos(i * 0.3) * 6 + (Math.random() - 0.5) * 4,
    i * -12
  ));
}
const curve = new THREE.CatmullRomCurve3(points);

// 3. Tunnel Wireframe Mesh
const geometry = new THREE.TubeGeometry(curve, 120, 3.5, 10, false);
const material = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.35 });
const tunnel = new THREE.Mesh(geometry, material);
scene.add(tunnel);

// 4. Pink Fiber Optic Tubes
const fiberGeo = new THREE.TubeGeometry(curve, 120, 0.12, 6, false);
const fiberMat = new THREE.MeshBasicMaterial({ color: 0xD35D88, transparent: true, opacity: 0.85 });
const fiber = new THREE.Mesh(fiberGeo, fiberMat);
fiber.position.x = 0.6;
scene.add(fiber);

// 5. Scroll Progress & Mouse Parallax Animation Loop
const cameraState = { val: 0 };
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => {
    gsap.to(cameraState, { val: self.progress, duration: 0.8, ease: "power2.out", overwrite: "auto" });
  }
});

const animate = () => {
  requestAnimationFrame(animate);
  const loopTime = Math.max(0.001, Math.min(0.97, 0.95 * cameraState.val + 0.005));
  const pos = curve.getPointAt(loopTime);
  const lookAtPos = curve.getPointAt(Math.min(loopTime + 0.03, 0.999));
  
  camera.position.set(pos.x + mouseX * 0.8, pos.y - mouseY * 0.8, pos.z);
  camera.lookAt(lookAtPos.x + mouseX * 0.4, lookAtPos.y - mouseY * 0.4, lookAtPos.z);
  renderer.render(scene, camera);
};
```

---

## 📦 5. COMPONENT LAYOUT SPECS

### 1. Paper Zine Card Component
- Background: `#F0F0F2`
- Border: `2px solid #111111`
- Shadow: `shadow-hard` (`8px 8px 0px 0px #111111`)
- Clip-path: `torn-paper` (`polygon(0% 0%, 100% 0.5%, 99.5% 100%, 0.5% 99.2%)`)
- Rotation: `rotate-1` or `-rotate-1`
- Accent: Tape strip (`.tape` / `.tape-pink`) positioned across corners (`-top-3 left-1/4`).

### 2. Dark Code Terminal Component
- Background: `#09090b` / `zinc-950`
- Border: `2px solid rgba(255, 255, 255, 0.2)`
- Header bar: `bg-zinc-900 border-b border-white/15` with red/yellow/green traffic dots
- Text: `font-mono text-xs text-white/90` with syntax highlighting in brand pink `#D35D88`.

### 3. 3D Step Modal Component
- Perspective wrapper: `perspective-2000 transform-style-3d`
- Active card: `rotate-y-0 translate-z-0 opacity-100 pointer-events-auto`
- Prev card: `-translate-x-full -rotate-y-12 -translate-z-500 opacity-0`
- Next card: `translate-x-full rotate-y-12 translate-z-500 opacity-0`

---

## 🤖 6. PROMPT TEMPLATE FOR AI RECREATION

Copy and paste the prompt below into any AI coding assistant (Gemini, Claude, GPT-4o) to generate a new website with this exact design system:

```text
Build a modern website using React, TypeScript, and TailwindCSS adhering strictly to this design specification:

DESIGN THEME: Cyberpunk Brutalist Zine / High-Tech WebGL Hybrid
COLOR PALETTE:
- Background: #050505
- Paper Cards: #F0F0F2
- Ink/Borders: #111111
- Brand Accent: #D35D88
- Terminal Dark: #18181b / #09090b

TYPOGRAPHY:
- Display Headers: 'Oswald', sans-serif (Uppercase, tracking-tighter)
- Body UI: 'Inter', sans-serif
- Code & Badges: 'IBM Plex Mono', monospace

KEY VISUAL EFFECTS:
1. Paper Zine cards with thick 2px #111 borders, hard shadows (8px 8px 0px 0px #111), paper clip-paths, and blurred tape strip accents (.tape-pink).
2. Screen Distortion glitch text effect on main headline cycling keywords every 2 seconds with cyan/pink RGB split layers.
3. 100% continuous dual-track infinite scrolling marquee.
4. Three.js wireframe 3D tunnel background with glowing pink fiber optic tubes and GSAP ScrollTrigger progress integration.
5. Dark code terminal cards with language tab switchers.
```
