# TikTok Pixel Integration Guide

This document provides a comprehensive guide for the TikTok Pixel integration in the pho.chat application.

## Overview

The TikTok Pixel integration enables conversion tracking for TikTok Ads campaigns by automatically tracking user interactions and events throughout the application.

## Features

- **Automatic Page Tracking**: Tracks page views across the application
- **User Identification**: Securely identifies users with SHA-256 hashed PII data
- **Event Tracking**: Comprehensive tracking of user actions and conversions
- **Environment Configuration**: Configurable via environment variables
- **TypeScript Support**: Full TypeScript integration with type safety
- **Testing**: Comprehensive test coverage

## Configuration

### Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_TIKTOK_PIXEL_ID=your_pixel_id_here
```

### Example Configuration

```bash
# TikTok Pixel Configuration
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D4KRIFBC77U4IAHDO190
```

## Tracked Events

The integration automatically tracks the following TikTok Pixel events:

### 1. CompleteRegistration

- **Trigger**: When a new user completes registration
- **Location**: `src/layout/AuthProvider/Clerk/UserUpdater.tsx`
- **Parameters**: Optional plan information

### 2. Subscribe

- **Trigger**: When a user successfully completes a subscription purchase
- **Location**: `src/app/[variants]/(main)/payment/success/page.tsx`
- **Parameters**: Plan details, value, currency (VND), billing cycle

### 3. ViewContent

- **Trigger**: When a user views subscription plans
- **Location**: `src/app/[variants]/(main)/settings/subscription/features/PlansSection.tsx`
- **Parameters**: Plan ID, name, and pricing

### 4. AddPaymentInfo

- **Trigger**: When a user adds payment information during checkout
- **Location**: `src/app/[variants]/(main)/subscription/checkout/Client.tsx`
- **Parameters**: Plan information

### 5. ClickButton

- **Trigger**: For various user interactions (upgrade buttons, CTAs, navigation)
- **Parameters**: Button text and context description

### 6. Search

- **Trigger**: When users perform search actions
- **Parameters**: Search query string

## Architecture

### Core Components

1. **TikTok Pixel Component** (`src/components/Analytics/TikTok.tsx`)
   - Loads the TikTok Pixel script
   - Handles user identification
   - Manages pixel initialization

2. **TikTok Provider** (`src/components/Analytics/TikTokProvider.tsx`)
   - Provides user data to TikTok components
   - Integrates with Clerk authentication

3. **Event Utilities** (`src/utils/tiktok-events.ts`)
   - Event tracking functions
   - Type definitions
   - Pixel availability checks

4. **Crypto Utilities** (`src/utils/crypto-hash.ts`)
   - SHA-256 hashing for PII data
   - Privacy-compliant user identification

5. **Custom Hook** (`src/hooks/useTikTokTracking.ts`)
   - Convenient tracking methods
   - Reusable tracking logic

## Usage Examples

### Manual Event Tracking

```typescript
import { trackSubscribe, trackViewContent, trackClickButton } from '@/utils/tiktok-events';

// Track subscription
trackSubscribe('premium', 'Premium Plan', 129000, 'monthly');

// Track content view
trackViewContent('premium', 'Premium Plan', 129000);

// Track button click
trackClickButton('Upgrade Now', 'From pricing page');
```

### Using the Custom Hook

```typescript
import { useTikTokTracking } from '@/hooks/useTikTokTracking';

const MyComponent = () => {
  const { trackUpgradeClick, trackCTAClick } = useTikTokTracking();

  const handleUpgradeClick = () => {
    trackUpgradeClick('Premium', 'Settings page');
    // Handle upgrade logic
  };

  return (
    <button onClick={handleUpgradeClick}>
      Upgrade to Premium
    </button>
  );
};
```

## Advanced Event Tracking Implementation

### Event Parameters Structure

All TikTok events follow a consistent parameter structure:

```typescript
interface TikTokEventParams {
  contents?: TikTokContent[];
  value?: number;
  currency?: string;
  search_string?: string;
  button_text?: string;
  description?: string;
}

interface TikTokContent {
  content_id: string;
  content_type: 'product' | 'product_group';
  content_name: string;
  price?: number;
}
```

### User Identification

User identification is handled automatically when user data is available:

```typescript
// Automatic identification in TikTok component
const hashedUserData = await hashUserPII({
  email: userEmail,
  phone: userPhone,
  userId: userId,
});

identifyTikTokUser(hashedUserData);
```

### Custom Event Implementation

To add new event tracking:

1. **Define the event in utilities**:

```typescript
export const trackCustomEvent = (eventName: TikTokEventName, params?: TikTokEventParams): void => {
  trackTikTokEvent(eventName, params);
};
```

2. **Add to custom hook**:

```typescript
const trackCustomAction = useCallback((actionData: any) => {
  trackCustomEvent('CustomEvent', actionData);
}, []);
```

3. **Implement in component**:

```typescript
const { trackCustomAction } = useTikTokTracking();

const handleCustomAction = () => {
  trackCustomAction({ custom_parameter: 'value' });
};
```

## Privacy & Security

### PII Data Hashing

All personally identifiable information (PII) is hashed using SHA-256 before being sent to TikTok:

- **Email addresses**: Normalized (lowercase, trimmed) and hashed
- **Phone numbers**: Digits only, normalized and hashed
- **User IDs**: Hashed for privacy protection

### Data Processing

```typescript
import { hashUserPII } from '@/utils/crypto-hash';

const userData = {
  email: 'user@example.com',
  phone: '+1-234-567-8900',
  userId: 'user123'
};

const hashedData = await hashUserPII(userData);
// Result: { email: 'hashed_email', phone_number: 'hashed_phone', external_id: 'hashed_id' }
```

### Security Best Practices

1. **Client-side hashing**: All PII is hashed in the browser before transmission
2. **Error handling**: Failed hashing operations are logged but don't break functionality
3. **Graceful degradation**: Tracking continues even if user identification fails
4. **No sensitive data**: Only hashed values are sent to TikTok servers

## Testing

### Running Tests

```bash
# Run all TikTok-related tests
npm test -- src/utils/__tests__/tiktok-events.test.ts
npm test -- src/utils/__tests__/crypto-hash.test.ts
npm test -- src/components/Analytics/__tests__/TikTok.test.tsx
npm test -- src/hooks/__tests__/useTikTokTracking.test.ts

# Run specific test suites
npx vitest run src/utils/__tests__/tiktok-events.test.ts
```

### Test Coverage

- ✅ Event tracking functions (18 tests)
- ✅ User identification and PII hashing (22 tests)
- ✅ Component rendering and user identification (7 tests)
- ✅ Custom hook functionality (8 tests)
- ✅ Error handling and edge cases
- ✅ Environment configuration

### Test Structure

```typescript
// Example test structure
describe('TikTok Events Utils', () => {
  describe('trackCompleteRegistration', () => {
    it('should track registration without plan info', () => {
      trackCompleteRegistration();
      expect(mockTtq.track).toHaveBeenCalledWith('CompleteRegistration', {
        currency: 'VND',
      });
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Pixel not loading**
   - Verify `NEXT_PUBLIC_TIKTOK_PIXEL_ID` is set correctly
   - Check browser console for script loading errors
   - Ensure environment variable starts with `NEXT_PUBLIC_`

2. **Events not tracking**
   - Ensure TikTok Pixel is loaded (`window.ttq` exists)
   - Check console for debug messages
   - Verify event parameters are correct
   - Test in browser developer tools

3. **User identification failing**
   - Check if user data is available from Clerk
   - Verify crypto.subtle is supported in browser
   - Review hashing errors in console
   - Test with different user data combinations

4. **TypeScript errors**
   - Ensure all imports are correct
   - Check type definitions match usage
   - Verify environment variable types

### Debug Mode

Enable debug logging by checking browser console for TikTok Pixel messages:

```javascript
// Check if pixel is loaded
console.log('TikTok Pixel loaded:', !!window.ttq);

// Check pixel ID configuration
console.log('Pixel ID:', process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);

// Test event tracking
window.ttq?.track('ViewContent', { test: true });
```

### Development Tools

Use browser developer tools to monitor TikTok Pixel:

1. **Network tab**: Monitor requests to `analytics.tiktok.com`
2. **Console**: Check for TikTok Pixel debug messages
3. **Application tab**: Verify pixel script loading
4. **TikTok Pixel Helper**: Browser extension for debugging

## Performance Considerations

- **Script Loading**: TikTok Pixel script loads with `afterInteractive` strategy
- **Event Batching**: Events are sent immediately when triggered
- **Error Handling**: Failed events don't block application functionality
- **Memory Usage**: Minimal impact with efficient event tracking
- **Async Operations**: User identification is handled asynchronously

### Performance Monitoring

```typescript
// Monitor pixel loading performance
const pixelLoadStart = performance.now();
// ... pixel loading logic
const pixelLoadEnd = performance.now();
console.log(`TikTok Pixel loaded in ${pixelLoadEnd - pixelLoadStart}ms`);
```

## Deployment

### Production Checklist

- [ ] Set `NEXT_PUBLIC_TIKTOK_PIXEL_ID` in production environment
- [ ] Verify TikTok Pixel is loading correctly
- [ ] Test key conversion events (registration, subscription)
- [ ] Monitor browser console for errors
- [ ] Validate events in TikTok Events Manager
- [ ] Test user identification with real user data
- [ ] Verify event parameters are correct
- [ ] Check cross-browser compatibility

### Environment Variables

```bash
# Production
NEXT_PUBLIC_TIKTOK_PIXEL_ID=your_production_pixel_id

# Development
NEXT_PUBLIC_TIKTOK_PIXEL_ID=your_development_pixel_id

# Testing (optional)
NEXT_PUBLIC_TIKTOK_PIXEL_ID=test_pixel_id
```

### Deployment Verification

After deployment, verify:

1. **Pixel Loading**: Check network requests for TikTok scripts
2. **Event Tracking**: Test key user flows and verify events
3. **User Identification**: Confirm user data is being hashed and sent
4. **Error Handling**: Ensure graceful degradation on failures

## Monitoring & Analytics

### TikTok Events Manager

Monitor your pixel performance in TikTok Events Manager:

1. **Event Volume**: Track number of events received
2. **Event Quality**: Monitor event parameter completeness
3. **Conversion Tracking**: Analyze conversion rates and attribution
4. **Audience Building**: Use pixel data for custom audiences

### Key Metrics to Monitor

- **CompleteRegistration**: New user acquisition
- **Subscribe**: Conversion rate and revenue
- **ViewContent**: Engagement with pricing pages
- **AddPaymentInfo**: Checkout funnel progression
- **ClickButton**: User interaction patterns

## Support

For issues related to TikTok Pixel integration:

1. Check browser console for error messages
2. Verify environment configuration
3. Review TikTok Events Manager for event data
4. Test in different browsers and devices
5. Check network requests in developer tools

### Common Support Scenarios

- **Events not appearing**: Check pixel ID and network connectivity
- **User identification issues**: Verify Clerk integration and data availability
- **Performance concerns**: Monitor script loading and event frequency
- **Privacy compliance**: Review PII hashing implementation

## References

- [TikTok Pixel Documentation](https://ads.tiktok.com/help/article/get-started-pixel)
- [TikTok Events API](https://ads.tiktok.com/help/article/standard-events-parameters)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Next.js Script Component](https://nextjs.org/docs/api-reference/next/script)
- [Clerk Authentication](https://clerk.com/docs)
