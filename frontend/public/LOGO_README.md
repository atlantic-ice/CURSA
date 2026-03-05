# CURSA Logo - Design Specification

## Concept

The CURSA logo embodies **celestial navigation** — a timeless method of finding one's way using the stars. The design features a four-pointed star that represents precision, guidance, and technological sophistication.

## Design Elements

### Star Symbol

- **Four-pointed star** with clean geometric lines
- **Elongated bottom ray** resembling a compass needle pointing down
- Represents navigation, direction, and accuracy
- Inspired by real celestial observations through telescopes

### Visual Effects

- **Cool white-blue glow** (#e0f2fe to #0ea5e9) emanating from center
- **Subtle lens flare** effect creating a telescope-like aesthetic
- **Pure black background** (#000000) emphasizing the celestial theme
- **Minimalist approach** — no unnecessary elements

### Typography

- **"CURSA" text** in thin, modern uppercase sans-serif
- **Wide letter-spacing** for premium, tech-brand feel
- **Pure white with subtle blue tint** (#f0f9ff)
- **No gradients** on text for maximum readability

### Technical Specifications

- **Format**: SVG (vector, infinitely scalable)
- **Style**: Flat design with minimal glow effects
- **Color palette**:
  - Background: `#000000` (pure black)
  - Star rays: `#e0f2fe` (sky blue 100), `#bae6fd` (sky blue 200)
  - Center: `#ffffff` (white)
  - Text: `#f0f9ff` (sky blue 50)

## Files

### Full Logo

- **`logo.svg`** (300×400px) - Full logo with text, primary use
- Location: `frontend/public/logo.svg`
- Use: Landing pages, splash screens, login/register

### Icon Variant

- **`logo-icon.svg`** (200×200px) - Star only, no text
- Location: `frontend/src/assets/logo-icon.svg`
- Use: App headers, small spaces, loading indicators

### Favicon

- **`favicon.svg`** (512×512px) - Optimized for browser tabs
- Location: `frontend/public/favicon.svg`
- Features rounded corners for modern browsers

## Usage Guidelines

### DO ✅

- Use on pure black or very dark backgrounds
- Maintain aspect ratio when scaling
- Preserve the glow effects
- Keep adequate spacing around logo
- Use for tech/premium contexts

### DON'T ❌

- Place on light backgrounds (loses impact)
- Add borders, circles, or frames
- Change colors (destroys brand identity)
- Add gradients to text
- Compress/distort proportions
- Remove or modify the lens flare effects

## Component Integration

```tsx
import Logo from './components/Logo';

// Full logo with text
<Logo variant="full" width={180} height={240} />

// Icon only
<Logo variant="icon" width={60} height={60} />
```

## Brand Essence

**Precision** • **Navigation** • **Technology** • **Premium Quality**

The logo communicates that CURSA is a sophisticated, reliable tool for navigating the complexities of document validation — much like ancient mariners used stars to navigate uncharted waters.
