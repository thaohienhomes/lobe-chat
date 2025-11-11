# Clear Service Worker - Production Deployment

## Problem
After deploying new code to production, users may still see old cached JavaScript due to Service Worker caching.

## Solution

### For Users (Manual Clear)

1. **Open DevTools**
   - Press `F12` or `Ctrl + Shift + I`

2. **Go to Application Tab**
   - Click "Application" tab in DevTools

3. **Unregister Service Worker**
   - Click "Service Workers" in left sidebar
   - Click "Unregister" button next to the service worker

4. **Clear Storage**
   - Click "Storage" in left sidebar
   - Click "Clear site data" button

5. **Hard Reload**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Press `Cmd + Shift + R` (Mac)

### For Developers (Force Update)

Add version bump to service worker to force update:

```typescript
// src/app/sw.ts
const SW_VERSION = 'v2'; // Increment this on each deployment

const serwist = new Serwist({
  // ... existing config
});
```

### Automated Solution

Add to deployment script:

```bash
# .github/workflows/deploy.yml
- name: Bump SW version
  run: |
    sed -i "s/SW_VERSION = 'v[0-9]*'/SW_VERSION = 'v${{ github.run_number }}'/" src/app/sw.ts
```

## Verification

After clearing, verify in Console:

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations.length);
});
```

Should return `0` after unregistering.

