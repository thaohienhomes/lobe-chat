# pho.chat Public Assets

This directory contains all public-facing assets for the pho.chat application.

## Directory Structure

```
public/
├── logo/              # SVG logo variants (5 files)
├── icons/             # PWA icons and sources
├── og/                # Social media Open Graph images
├── screenshots/       # PWA installation screenshots
├── images/            # UI images and illustrations
├── videos/            # UI videos and animations
├── favicon.ico        # Browser favicon (multi-resolution)
├── favicon-32x32.ico  # 32×32 favicon
├── apple-touch-icon.png # iOS home screen icon
└── asset-preview.html # Visual preview of all assets
```

## Quick Links

- **Logo Guidelines:** [logo/README.md](./logo/README.md)
- **Asset Preview:** [/asset-preview.html](/asset-preview.html)
- **Generation Guide:** [../docs/ASSET_GENERATION_GUIDE.md](../docs/ASSET_GENERATION_GUIDE.md)

## Brand Assets

### Logos (SVG)

- `logo/logo-full.svg` - Full color 3D logo
- `logo/logo-flat.svg` - Flat design
- `logo/logo-mono.svg` - Monochrome
- `logo/logo-text.svg` - Text only
- `logo/logo-combined.svg` - Logo + text

### Icons (PNG)

- `icons/icon-192x192.png` - PWA icon
- `icons/icon-512x512.png` - High-res PWA icon
- `icons/icon-192x192.maskable.png` - Maskable PWA icon
- `icons/icon-512x512.maskable.png` - High-res maskable icon

### Favicons

- `favicon.ico` - Multi-resolution (16, 32, 48px)
- `favicon-32x32.ico` - Standard 32×32
- `apple-touch-icon.png` - iOS icon (180×180)

### Social Media

- `og/cover.png` - Open Graph (1200×630)
- `og/twitter-card.png` - Twitter/X (1200×600)
- `og/square.png` - Square posts (1200×1200)

## Usage

### In HTML

```html
<!-- Favicon -->
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- Open Graph -->
<meta property="og:image" content="/og/cover.png" />

<!-- Logo -->
<img src="/logo/logo-full.svg" alt="pho.chat" width="64" height="64" />
```

### In Next.js

```tsx
import Image from 'next/image';

<Image src="/logo/logo-full.svg" alt="pho.chat" width={64} height={64} />;
```

### In CSS

```css
.logo {
  background-image: url('/logo/logo-full.svg');
  background-size: contain;
  background-repeat: no-repeat;
}
```

## Brand Colors

```css
--brand-primary: #ff6b6b; /* Coral Red */
--brand-secondary: #ff7675; /* Light Coral */
--brand-accent: #fff5e6; /* Cream */
--brand-neutral: #000000; /* Black */
```

## File Sizes

Target sizes for optimal performance:

- SVG files: < 5KB each
- PNG icons: < 50KB each
- OG images: < 200KB each
- Screenshots: < 500KB each

## Caching

All assets are cached with long-term headers:

```
Cache-Control: public, max-age=31536000, immutable
```

## Regenerating Assets

To regenerate PNG assets from SVG sources:

```bash
bun run generate:assets
```

See [Asset Generation Guide](../docs/ASSET_GENERATION_GUIDE.md) for details.

## Support

For questions or issues:

- Email: <support@pho.chat>
- Docs: [../docs/](../docs/)
- Preview: [/asset-preview.html](/asset-preview.html)
