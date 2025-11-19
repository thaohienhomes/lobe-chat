# pho.chat Logo Assets

This directory contains all logo variants for the pho.chat brand.

## Logo Variants

### 1. `logo-full.svg`

**Full Color 3D Logo**

- Primary branding logo with full details
- Includes bowl, noodles, steam, and chopsticks
- Use for: Hero sections, main branding, marketing materials
- Minimum size: 48px

### 2. `logo-flat.svg`

**Flat Color Logo**

- Simplified flat design without gradients
- Cleaner, more modern appearance
- Use for: UI components, cards, buttons
- Minimum size: 32px

### 3. `logo-mono.svg`

**Monochrome Logo**

- Black and white version
- Use for: Print materials, grayscale contexts, watermarks
- Minimum size: 32px

### 4. `logo-text.svg`

**Text-Only Logo**

- "pho.chat" text with subtle steam accent
- Use for: Headers, footers, text-heavy layouts
- Minimum size: 24px (height)

### 5. `logo-combined.svg`

**Combined Logo + Text**

- Icon and text side by side
- Use for: Navigation bars, app headers, full branding
- Minimum size: 120px (width)

## Usage Guidelines

### Clear Space

Maintain clear space around the logo equal to 25% of the logo height on all sides.

### Minimum Sizes

- Icon only: 24px × 24px
- Text only: 24px height
- Combined: 120px width

### Color Palette

- Primary: `#FF6B6B` (Coral Red)
- Secondary: `#FF7675` (Light Coral)
- Accent: `#FFF5E6` (Cream - noodles)
- Neutral: `#000000` (Black)

### Don'ts

- ❌ Don't distort or stretch the logo
- ❌ Don't rotate the logo
- ❌ Don't add effects (shadows, glows, etc.)
- ❌ Don't change colors outside brand palette
- ❌ Don't use on backgrounds with insufficient contrast

## Integration

The logos are used in the codebase via:

```tsx
// In src/components/Branding/ProductLogo/Custom.tsx
import { BRANDING_LOGO_URL } from '@/const/branding';

// Logo URL is configured in src/config/customizations.ts
export const BRANDING_CONFIG = {
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/logo/logo-full.svg',
};
```

## File Formats

All logos are provided in SVG format for:

- ✅ Infinite scalability
- ✅ Small file size
- ✅ Sharp rendering at any size
- ✅ Easy color customization

## Regenerating Assets

To regenerate PNG assets from these SVGs, run:

```bash
bun run scripts/generate-assets.ts
```

This will create:

- PWA icons (192×192, 512×512)
- Maskable icons
- Favicons
- Apple touch icon
- Open Graph images
