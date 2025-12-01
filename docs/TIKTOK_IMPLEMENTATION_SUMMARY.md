# TikTok Server-Side Event Tracking Implementation Summary

## Overview

This document summarizes the implementation of TikTok server-side event tracking using the TikTok Events API for pho.chat. This implementation provides dual-mode tracking (client-side + server-side) for better accuracy and to bypass ad blockers.

## What Was Implemented

### 1. Server-Side TikTok Events API Integration

**New Files Created:**

- `src/libs/tiktok-events-api.ts` - Core TikTok Events API service
  - Functions to send events to TikTok Events API
  - SHA-256 hashing for PII data (email, phone, user ID)
  - Event ID generation for deduplication
  - Support for test_event_code for testing

- `src/app/api/analytics/tiktok/track/route.ts` - API endpoint for server-side tracking
  - POST `/api/analytics/tiktok/track` - Send events from client to server
  - GET `/api/analytics/tiktok/track` - Health check endpoint
  - Automatic user identification from Clerk session
  - IP address and user agent capture

- `src/utils/tiktok-server-events.ts` - Client-side utilities for server-side tracking
  - `trackTikTokServerEvent()` - Send event to server endpoint
  - `trackTikTokDualEvent()` - Track both client-side and server-side
  - Convenience functions: `trackServerViewContent()`, `trackServerSubscribe()`, etc.

### 2. Environment Variables

**Added to `src/envs/analytics.ts`:**

```typescript
TIKTOK_ACCESS_TOKEN: z.string().optional(),
TIKTOK_TEST_EVENT_CODE: z.string().optional(),
```

**Required Environment Variables:**

```bash
# Already configured
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D4KRIFBC77U4IAHDO190

# New - Required for server-side tracking
TIKTOK_ACCESS_TOKEN=your_access_token_here

# Optional - For testing events
TIKTOK_TEST_EVENT_CODE=TEST10752
```

### 3. Event Tracking Implementation

**Subscription Plans Page** (`src/app/[variants]/(main)/settings/subscription/features/PlansSection.tsx`)

- ✅ Track `ViewContent` when user views a plan
- ✅ Track `InitiateCheckout` when user clicks "Choose Plan"
- ✅ Uses dual-mode tracking (client + server) for reliability

**Payment Waiting Page** (`src/app/[variants]/(main)/payment/waiting/page.tsx`)

- ✅ Track `ViewContent` when payment waiting page loads
- ✅ Track `CompletePayment` when payment succeeds (during polling)
- ✅ Track `CompletePayment` when payment succeeds (initial load)

**Sepay Webhook** (`src/app/api/payment/sepay/webhook/route.ts`)

- ✅ Track `Subscribe` event when payment webhook confirms successful payment
- ✅ Includes user ID, plan ID, amount, and billing cycle
- ✅ Non-blocking (doesn't fail webhook if tracking fails)

### 4. Events Tracked

| Event | Location | Trigger | Data Sent |
|-------|----------|---------|-----------|
| `ViewContent` | Subscription Plans | User views plan | Plan ID, name, price |
| `InitiateCheckout` | Subscription Plans | User clicks "Choose Plan" | Plan ID, name, price |
| `ViewContent` | Payment Waiting | Page loads | Order ID, amount |
| `CompletePayment` | Payment Waiting | Payment succeeds | Order ID, amount, plan |
| `Subscribe` | Sepay Webhook | Payment confirmed | User ID, plan, amount, billing cycle |

### 5. User Data Tracking

All events include privacy-compliant user identification:

- **External ID** - Clerk user ID (SHA-256 hashed)
- **Email** - User email (SHA-256 hashed) - if available
- **Phone** - User phone (SHA-256 hashed) - if available
- **IP Address** - User's IP address (from request headers)
- **User Agent** - Browser user agent (from request headers)

## How It Works

### Client-Side Flow

1. User performs action (e.g., clicks "Choose Plan")
2. Client calls `trackServerViewContent()` or `trackServerInitiateCheckout()`
3. Function sends POST request to `/api/analytics/tiktok/track`
4. Also tracks client-side event via TikTok Pixel (if loaded)

### Server-Side Flow

1. API endpoint receives event data
2. Extracts user IP and user agent from request headers
3. Gets user ID from Clerk session (if authenticated)
4. Hashes all PII data with SHA-256
5. Sends event to TikTok Events API with access token
6. Returns success/failure response

### Webhook Flow

1. Sepay sends webhook when payment succeeds
2. Webhook handler updates payment and activates subscription
3. After successful transaction, sends `Subscribe` event to TikTok
4. Includes hashed user ID, plan details, and amount

## Testing

See `docs/TIKTOK_EVENTS_TESTING.md` for detailed testing instructions.

### Quick Test

1. Add `TIKTOK_TEST_EVENT_CODE=TEST10752` to environment variables
2. Visit https://pho.chat/settings?active=subscription
3. Click "Choose Starter" button
4. Go to TikTok Events Manager → Test Events
5. Enter test code `TEST10752`
6. Verify events appear with correct data

## Benefits

### 1. Better Tracking Accuracy
- Server-side events bypass ad blockers
- Dual-mode tracking provides redundancy
- Better user attribution with IP and user agent

### 2. Privacy Compliant
- All PII data is SHA-256 hashed before sending
- Complies with TikTok's privacy requirements
- No raw email/phone data sent to TikTok

### 3. Conversion Optimization
- Track full funnel: View → Click → Checkout → Payment
- Optimize TikTok ad campaigns for conversions
- Better ROAS measurement

### 4. Deduplication
- Each event has unique event_id
- Prevents duplicate event counting
- More accurate conversion metrics

## Next Steps

1. **Get TikTok Access Token**
   - Go to TikTok Ads Manager → Events → Settings
   - Generate access token
   - Add to Vercel environment variables

2. **Test Events**
   - Use test_event_code to verify events
   - Check TikTok Events Manager for test events
   - Verify all event parameters are correct

3. **Deploy to Production**
   - Remove test_event_code
   - Monitor live events in TikTok Events Manager
   - Check event quality score

4. **Set Up Conversions**
   - Create conversion events in TikTok Ads Manager
   - Map events to conversion goals
   - Use for campaign optimization

5. **Monitor Performance**
   - Track conversion rates
   - Monitor event quality score
   - Optimize based on data

## Support

- [TikTok Events API Documentation](https://business-api.tiktok.com/portal/docs?id=1771100865818625)
- [TikTok Pixel Documentation](https://ads.tiktok.com/help/article/standard-mode-pixel-implementation)
- [TikTok Events Manager](https://ads.tiktok.com/i18n/events)

