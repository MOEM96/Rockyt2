# Hyperframes Composition Brief: Zernio — Introducing Claude For Marketing

## Objective
Create a high-energy, 3D-enhanced launch brag video for Zernio — Introducing Claude for Marketing.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 24 seconds (`data-duration="24"`)

## Creative Direction
- Tone preset: `cinematic`
- Hook: "INTRODUCING CLAUDE FOR MARKETING" (0s-5s)
- Value proposition: Why Zernio API & MCP Server (5s-10.5s)
- Use Cases: 3 Real-world AI agent marketing use cases (10.5s-16.5s)
- Scale: 16 Platforms & Live Dispatches Ticker (16.5s-20s)
- Outro: Zernio 3D Logo Slam & CTA (20s-24s)

## Visual & 3D Identity
- 3D perspective transforms (`perspective(1000px)`, `rotateY`, `rotateX`, `translateZ`)
- Floating 3D glass cards with neon pink `#D35D88` borders and backdrops
- Interactive cyber grid background with animated radial glow orbs
- High contrast typography: `Oswald`, `IBM Plex Mono`, `Inter`

## Storyboard
1. Scene 1 (0s-5s): "INTRODUCING CLAUDE FOR MARKETING" + 3D MCP Terminal
2. Scene 2 (5s-10.5s): Value of API & MCP (Before vs With Zernio)
3. Scene 3 (10.5s-16.5s): 3 Real-World Marketing Use Cases (AI Newsbot, Comment to DM, Programmatic Ads)
4. Scene 4 (16.5s-20s): 16 Supported Channels & Live Scale Ticker
5. Scene 5 (20s-24s): 3D Logo Outro & CTA ("GET FREE API KEY & MCP DOCS")

## Hyperframes Requirements
- Single `index.html` composition inside `brag-output/composition/`.
- Must pass `npx hyperframes check` with 0 errors.
- Ensure WCAG AA contrast compliance and readable text holds.
