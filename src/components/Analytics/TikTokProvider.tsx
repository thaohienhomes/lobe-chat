'use client';

import { PropsWithChildren, ReactElement, memo } from 'react';

/**
 * TikTokProvider component that provides user data to TikTok Pixel component
 *
 * Note: This component is rendered outside of ClerkProvider in the layout,
 * so we cannot use useUser() hook here. User identification for TikTok Pixel
 * is handled separately in components that are inside the ClerkProvider context
 * (e.g., UserUpdater for registration tracking, payment pages for subscription tracking).
 *
 * This provider is kept for future extensibility and to maintain the component structure.
 */
const TikTokProvider = memo<PropsWithChildren>(({ children }) => {
  // Note: We cannot use useUser() here because this component is rendered
  // outside of ClerkProvider in the Analytics component.
  // User identification is handled in individual tracking calls where
  // user data is available from the Clerk context.

  // Simply return children as-is - this provider is a passthrough for now
  return children as ReactElement;
});

TikTokProvider.displayName = 'TikTokProvider';

export default TikTokProvider;
