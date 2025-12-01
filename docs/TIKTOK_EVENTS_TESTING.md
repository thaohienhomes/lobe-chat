# TikTok Events API Testing Guide

This guide explains how to test and verify TikTok Pixel events (both client-side and server-side) for the pho.chat application.

## Overview

pho.chat implements **dual-mode TikTok event tracking**:

1. **Client-Side Tracking** - TikTok Pixel (JavaScript)
   - Loaded on all pages via `<script>` tag
   - Tracks user interactions in real-time
   - Can be blocked by ad blockers

2. **Server-Side Tracking** - TikTok Events API
   - Sends events from the server to TikTok
   - Bypasses ad blockers for better accuracy
   - Includes user IP and user agent for better attribution

## Environment Variables

### Required for Production

Add these to your Vercel environment variables:

```bash
# TikTok Pixel ID (already configured)
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D4KRIFBC77U4IAHDO190

# TikTok Events API Access Token (required for server-side tracking)
TIKTOK_ACCESS_TOKEN=your_access_token_here
```

### Optional for Testing

```bash
# Test Event Code for testing in TikTok Events Manager
# Use this to test events without affecting production data
TIKTOK_TEST_EVENT_CODE=TEST10752
```

## Getting Your TikTok Access Token

1. Go to [TikTok Ads Manager](https://ads.tiktok.com/)
2. Navigate to **Tools** → **Events** → **Web Events**
3. Select your Pixel (D4KRIFBC77U4IAHDO190)
4. Click **Settings** → **Generate Access Token**
5. Copy the access token and add it to Vercel environment variables

## Testing with Test Event Code

### Step 1: Enable Test Mode

Add the test event code to your environment variables:

```bash
TIKTOK_TEST_EVENT_CODE=TEST10752
```

Or pass it directly in the API request:

```typescript
await trackTikTokServerEvent({
  event: 'Subscribe',
  properties: { value: 99000, currency: 'VND' },
  test_event_code: 'TEST10752', // Override env var
});
```

### Step 2: Trigger Test Events

Visit these pages and perform actions:

1. **Subscription Plans Page** - https://pho.chat/settings?active=subscription
   - Click "Choose Starter" button
   - Expected events: `ViewContent`, `InitiateCheckout`

2. **Payment Waiting Page** - https://pho.chat/payment/waiting?orderId=TEST_ORDER
   - Load the page
   - Expected event: `ViewContent`

3. **Complete a Test Payment**
   - Use Sepay test credentials
   - Expected events: `Subscribe`, `CompletePayment`

### Step 3: Verify in TikTok Events Manager

1. Go to [TikTok Events Manager](https://ads.tiktok.com/i18n/events)
2. Select your Pixel (D4KRIFBC77U4IAHDO190)
3. Click **Test Events** tab
4. Enter your test event code: `TEST10752`
5. You should see events appearing in real-time with:
   - Event name (e.g., `Subscribe`, `ViewContent`)
   - Event time
   - Event parameters (value, currency, contents)
   - User data (hashed email, external_id, IP, user agent)

### Step 4: Verify Event Parameters

Check that each event includes the correct data:

**ViewContent Event:**
```json
{
  "event": "ViewContent",
  "properties": {
    "contents": [{
      "content_id": "starter",
      "content_name": "Starter Plan",
      "price": 99000
    }],
    "value": 99000,
    "currency": "VND"
  }
}
```

**Subscribe Event:**
```json
{
  "event": "Subscribe",
  "properties": {
    "contents": [{
      "content_id": "starter",
      "content_name": "Starter (monthly)",
      "price": 99000
    }],
    "value": 99000,
    "currency": "VND"
  }
}
```

## Production Testing (Without Test Event Code)

### Step 1: Remove Test Event Code

Remove or comment out the `TIKTOK_TEST_EVENT_CODE` environment variable in Vercel.

### Step 2: Trigger Real Events

Perform the same actions as in test mode, but events will now appear in the **Live Events** tab instead of **Test Events**.

### Step 3: Verify in TikTok Events Manager

1. Go to [TikTok Events Manager](https://ads.tiktok.com/i18n/events)
2. Select your Pixel (D4KRIFBC77U4IAHDO190)
3. Click **Live Events** tab (not Test Events)
4. You should see events appearing in real-time

### Step 4: Check Event Quality Score

TikTok assigns a quality score to each event based on:
- Event match quality (how well user data matches TikTok users)
- Event parameters completeness
- Event frequency and consistency

Aim for a quality score of **Good** or **Excellent**.

## Event Tracking Checklist

Use this checklist to verify all events are working:

### Client-Side Events (TikTok Pixel)

- [ ] **Page Load** - TikTok Pixel script loads on all pages
- [ ] **ViewContent** - Fires when viewing subscription plans
- [ ] **ClickButton** - Fires when clicking "Choose Plan" buttons
- [ ] **InitiateCheckout** - Fires when starting checkout process

### Server-Side Events (TikTok Events API)

- [ ] **ViewContent** - Tracked when payment waiting page loads
- [ ] **InitiateCheckout** - Tracked when user clicks "Choose Plan"
- [ ] **Subscribe** - Tracked when payment succeeds (webhook)
- [ ] **CompletePayment** - Tracked when payment completes

### Event Parameters

- [ ] All events include `value` and `currency` (VND)
- [ ] All events include `contents` array with product details
- [ ] User data is hashed with SHA-256 (email, phone, external_id)
- [ ] Events include IP address and user agent

## Troubleshooting

### Events Not Appearing in TikTok Events Manager

1. **Check Access Token** - Verify `TIKTOK_ACCESS_TOKEN` is set correctly
2. **Check Pixel ID** - Verify `NEXT_PUBLIC_TIKTOK_PIXEL_ID` matches your pixel
3. **Check Test Event Code** - Make sure it matches what you entered in Events Manager
4. **Check Server Logs** - Look for TikTok API errors in Vercel logs
5. **Check Network Tab** - Verify API requests to `/api/analytics/tiktok/track` succeed

### Events Tracked But Not Attributed

1. **User Data Quality** - Ensure email/phone are hashed correctly
2. **IP Address** - Verify user IP is being captured correctly
3. **User Agent** - Verify browser user agent is being sent
4. **Event Deduplication** - Check that `event_id` is unique for each event

### Ad Blockers Blocking Client-Side Events

This is expected! That's why we implemented server-side tracking. Server-side events will still be tracked even if client-side pixel is blocked.

## Next Steps

Once testing is complete and events are verified:

1. **Remove Test Event Code** - Set `TIKTOK_TEST_EVENT_CODE` to empty or remove it
2. **Monitor Live Events** - Check TikTok Events Manager daily for the first week
3. **Set Up Conversions** - Create conversion events in TikTok Ads Manager
4. **Create Campaigns** - Use conversion events to optimize ad campaigns
5. **Monitor Performance** - Track conversion rates and ROAS in TikTok Ads Manager

## Support

For issues with TikTok Events API:
- [TikTok Events API Documentation](https://business-api.tiktok.com/portal/docs?id=1771100865818625)
- [TikTok Ads Help Center](https://ads.tiktok.com/help/)

