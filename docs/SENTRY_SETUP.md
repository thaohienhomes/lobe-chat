# Sentry Error Tracking Setup

This document describes how Sentry is configured in pho.chat for error tracking and monitoring.

## Configuration

### Environment Variables

Add these to your `.env.local` or Vercel environment variables:

```bash
# Enable Sentry error tracking
NEXT_PUBLIC_ENABLE_SENTRY=true

# Your Sentry DSN (Data Source Name)
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id

# Optional: Sentry organization and project (for source map uploads)
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## How It Works

### Client-Side Error Tracking

- **File**: `sentry.client.config.ts`
- Captures JavaScript errors in the browser
- Includes session replay for debugging
- Tracks performance metrics

### Server-Side Error Tracking

- **File**: `sentry.server.config.ts`
- Captures errors in Next.js API routes and server components
- Tracks server-side performance

### Error Boundary

- **File**: `src/components/SentryErrorBoundary.tsx`
- Wraps the entire app to catch React component errors
- Shows user-friendly error message
- Automatically sends error to Sentry

### Analytics Integration

- **File**: `src/components/Analytics/Sentry.tsx`
- Initializes Sentry on client load
- Integrated into the Analytics component

## Usage

### Capture Exceptions

```typescript
import { captureException } from '@/utils/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, { context: 'payment_processing' });
}
```

### Capture Messages

```typescript
import { captureMessage } from '@/utils/sentry';

captureMessage('Payment completed successfully', 'info', {
  userId: user.id,
  amount: 100,
});
```

### Set User Context

```typescript
import { setSentryUser } from '@/utils/sentry';

setSentryUser(user.id, user.email, user.username);
```

### API Error Handling

```typescript
import { withSentryErrorHandler } from '@/middleware/sentry-error-handler';

export const GET = withSentryErrorHandler(async (req) => {
  // Your API logic
});
```

## Testing

### Test Sentry Integration

Visit these endpoints to test Sentry:

- **Test error**: `GET /api/test-sentry`
- **Test message**: `GET /api/test-sentry?type=message`
- **Test exception**: `GET /api/test-sentry?type=exception`

Errors should appear in your Sentry dashboard within seconds.

## Sampling Rates

- **Development**: 100% of transactions captured
- **Production**: 10% of transactions captured (configurable)

Adjust in `sentry.client.config.ts` and `sentry.server.config.ts`:

```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

## Disabling Sentry

To disable Sentry, set:

```bash
NEXT_PUBLIC_ENABLE_SENTRY=false
```

Or don't set `NEXT_PUBLIC_SENTRY_DSN`.

## Troubleshooting

### Errors not appearing in Sentry

1. Check `NEXT_PUBLIC_ENABLE_SENTRY=true`
2. Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
3. Check browser console for errors
4. Verify Sentry project is active

### Source Maps Not Uploading

1. Set `SENTRY_ORG` and `SENTRY_PROJECT`
2. Ensure Sentry CLI has authentication
3. Check build logs for upload errors

## References

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)

