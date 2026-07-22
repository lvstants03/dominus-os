---
name: Executive Intelligence OS
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#d8d278'
  on-tertiary: '#343200'
  tertiary-container: '#bcb660'
  on-tertiary-container: '#4a4700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ede68a'
  tertiary-fixed-dim: '#d0ca71'
  on-tertiary-fixed: '#1e1c00'
  on-tertiary-fixed-variant: '#4c4800'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system embodies the "Executive Intelligence" of an advanced AI Operating System. It is built on a foundation of **Sovereign Minimalism** and **Technological Luxury**, blending the precision of high-end developer tools with the opulence of elite financial interfaces.

The aesthetic is characterized by a "Full-screen Immersive" philosophy where the UI feels like a single, unified organism rather than a collection of windows. We leverage **Glassmorphism** and **Sacred Geometry**—inspired by the golden ratio and circuitry—to create an atmosphere that is professional, powerful, and mysterious. The goal is to evoke a sense of absolute control and sophisticated orchestration.

## Colors
The palette is centered on the contrast between **Deep Obsidian Black** and **Lustrous Gold**.

- **Primary:** Lustrous Gold (#D4AF37) used for critical actions, branding accents, and focal points.
- **Secondary:** Charcoal/Obsidian (#1A1A1A) for surface containers and depth layering.
- **Accent:** Metallic Gold (#F9F295) used sparingly for high-intensity glows and "active" status indicators.
- **Neutrals:** A range of deep greys (e.g., #0A0A0A, #121212) to maintain a high-contrast dark environment without pure-black fatigue.

Gradients should simulate a metallic sheen, transitioning from #D4AF37 to #C5A028 with a subtle center highlight of #F9F295.

## Typography
The typography strategy balances futuristic geometry with technical precision. 

- **Display/Headlines:** Uses **Space Grotesk** to provide a cutting-edge, geometric feel that mirrors the "sacred geometry" of the brand.
- **Body UI:** Uses **Geist** for its ultra-clean, legible, and developer-centric aesthetic, ensuring complex data remains readable.
- **Technical Labels:** Uses **JetBrains Mono** for status codes, metadata, and orbital menu labels, reinforcing the "Operating System" narrative.

Tight tracking (letter-spacing) is applied to large headings for a prestigious look, while wide tracking is applied to labels for clarity.

## Layout & Spacing
The layout follows a **Fixed Grid** model within a full-screen canvas. The orchestration theme requires a "Command Center" feel where elements are pinned to edges or orbit around a central focal point.

- **Desktop:** 12-column grid with 24px gutters. Margins are generous (40px) to allow the "Obsidian" background to breathe.
- **Mobile:** 4-column grid with 16px gutters and margins.
- **Immersive Reflow:** In full-screen modes, the UI uses 0px margins to bleed the glassmorphic panels to the edge of the display, creating a seamless HUD (Heads-Up Display) effect.

## Elevation & Depth
Depth is achieved through **Luminous Stratification** rather than traditional shadows.

1.  **Backdrop:** Deep Obsidian (#0A0A0A) base layer.
2.  **Panels:** Semi-transparent Charcoal glass (opacity 40-60%) with a 20px Backdrop Blur.
3.  **Outlines:** Ultra-thin (0.5px or 1px) borders in Lustrous Gold at 20% opacity.
4.  **Glows:** Active elements emit a soft, diffused radial gradient (Gold, 10% opacity) that "blooms" onto the background, simulating a physical light source from the screen.

## Shapes
The shape language is **Precise & Architectural**. We use "Soft" roundedness (4px - 12px) to maintain a modern, professional feel while avoiding the "bubble" look of consumer apps. 

Elements related to the AI core or "sacred geometry" may utilize 45-degree chamfered corners or perfect circles for status nodes to contrast with the rectangular grid of the OS.

## Components
- **Primary Buttons:** High-contrast Lustrous Gold background with dark text. Apply a subtle metallic gradient and a 1px solid gold border. On hover, increase the intensity of the "Gold Glow" effect.
- **Glass Cards:** Surfaces using the elevation rules above. Headers within cards should have a 1px gold bottom-divider at low opacity.
- **Status Indicators:** Small, circular nodes. "Active" state features a high-intensity gold glow with a rhythmic pulsing animation (the "Heartbeat of the OS").
- **Inputs:** Darker than the container background, with a "Gold Underline" or "Gold Border" that illuminates only when the field is focused.
- **Navigation:** Vertical "Orbital" sidebars or pinned top-bars using ultra-thin icons and JetBrains Mono labels.
- **Data Visualizations:** Use gold for primary data series, charcoal for background grids, and white/grey for secondary metrics. No rounded caps on bars—keep all data edges crisp.