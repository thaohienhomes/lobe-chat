# Sentry Setup Verification Checklist

## ✅ Installation & Configuration

- [x] `@sentry/nextjs` package installed
- [x] `sentry.client.config.ts` created
- [x] `sentry.server.config.ts` created
- [x] `next.config.ts` wrapped with `withSentryConfig`

## ✅ Components & Utilities

- [x] `src/components/Analytics/Sentry.tsx` created
- [x] `src/components/SentryErrorBoundary.tsx` created
- [x] `src/utils/sentry.ts` created (utility functions)
- [x] `src/middleware/sentry-error-handler.ts` created

## ✅ Integration

- [x] Sentry added to Analytics component
- [x] SentryErrorBoundary wrapped around app layout
- [x] Error boundary in `src/app/[variants]/layout.tsx`

## ✅ Testing

- [x] Test endpoint created: `/api/test-sentry`
- [x] Documentation created: `docs/SENTRY_SETUP.md`

## 🔧 Environment Setup (Required)

Before deploying, add these to Vercel environment variables:

```bash
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## 🧪 Testing Steps

1. **Local Testing**:
   ```bash
   # Start dev server
   bun run dev
   
   # Test error capture
   curl http://localhost:3000/api/test-sentry
   
   # Test message capture
   curl http://localhost:3000/api/test-sentry?type=message
   ```

2. **Verify in Sentry Dashboard**:
   - Go to https://sentry.io
   - Check your project
   - Look for "Test error from pho.chat" or "Test message from pho.chat"

3. **Production Testing**:
   - Deploy to Vercel
   - Visit `/api/test-sentry` endpoint
   - Verify errors appear in Sentry dashboard

## 📊 What Gets Tracked

- ✅ JavaScript errors (client-side)
- ✅ React component errors (error boundary)
- ✅ API errors (server-side)
- ✅ Performance metrics
- ✅ Session replays (10% of sessions)
- ✅ Custom messages and exceptions

## 🚀 Next Steps

1. Get Sentry DSN from https://sentry.io
2. Add environment variables to Vercel
3. Deploy to production
4. Test with `/api/test-sentry`
5. Monitor errors in Sentry dashboard

## 📝 Notes

- Sentry is disabled if `NEXT_PUBLIC_ENABLE_SENTRY` is not set to `true`
- Production uses 10% sampling rate (adjust as needed)
- Session replays are captured for 10% of sessions + 100% of error sessions
- All errors are automatically captured and sent to Sentry

