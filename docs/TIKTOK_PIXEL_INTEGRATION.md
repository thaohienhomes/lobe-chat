# TikTok Pixel Integration

This document describes how to integrate TikTok Pixel tracking into the pho.chat application for conversion measurement in TikTok Ads campaigns.

## Overview

TikTok Pixel is TikTok's conversion tracking tool that helps you measure the effectiveness of your TikTok advertising campaigns by tracking user actions on your website.

## Setup

### 1. Environment Configuration

Add your TikTok Pixel ID to your environment variables:

```bash
# .env.local or production environment
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D4KRIFBC77U4IAHDO190
```

### 2. Automatic Integration

Once the environment variable is set, the TikTok Pixel will automatically be loaded on all pages of your application. The integration:

- Loads the TikTok Pixel script in the `<head>` section
- Automatically calls `ttq.page()` on page load
- Provides access to the global `ttq` object for custom tracking

### 3. Custom Event Tracking

You can track custom events using the global `ttq` object:

```javascript
// Track a purchase event
ttq.track('Purchase', {
  value: 29.99,
  currency: 'USD',
  content_id: 'product-123'
});

// Track a sign-up event
ttq.track('CompleteRegistration');

// Track a custom event
ttq.track('ViewContent', {
  content_type: 'product',
  content_id: 'item-456'
});
```

## Implementation Details

### Files Modified

1. **`src/envs/analytics.ts`** - Added TikTok Pixel environment configuration
2. **`src/components/Analytics/TikTok.tsx`** - Created TikTok Pixel component
3. **`src/components/Analytics/index.tsx`** - Added TikTok component to analytics
4. **`.env.example`** - Added example configuration
5. **`docs/self-hosting/environment-variables/analytics.mdx`** - Updated documentation

### Component Structure

The TikTok Pixel component follows the same pattern as other analytics components:

- Conditionally renders based on environment variable presence
- Uses Next.js `Script` component with `afterInteractive` strategy
- Includes the complete TikTok Pixel initialization code
- Automatically calls page tracking on load

## Testing

Run the TikTok Pixel tests:

```bash
npm test src/components/Analytics/__tests__/TikTok.test.tsx
```

## Verification

To verify the integration is working:

1. Set the `NEXT_PUBLIC_TIKTOK_PIXEL_ID` environment variable
2. Start your application
3. Open browser developer tools
4. Check the Network tab for requests to `analytics.tiktok.com`
5. Verify the `ttq` object is available in the console

## Reference

- [TikTok Pixel Setup Guide](https://ads.tiktok.com/help/article/get-started-pixel)
- [TikTok Events API](https://ads.tiktok.com/help/article/events-api)
- [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/aelgobmabdmlfmiblddjfnjodalhidnn)
