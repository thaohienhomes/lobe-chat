'use client';

import { useUser } from '@clerk/nextjs';
import { PropsWithChildren, cloneElement, isValidElement, memo } from 'react';

import { enableClerk } from '@/const/auth';

/**
 * TikTokProvider component that provides user data to TikTok Pixel component
 * This component wraps the TikTok component and passes user information for identification
 */
const TikTokProvider = memo<PropsWithChildren>(({ children }) => {
  // Get user data from Clerk if enabled
  const { user, isSignedIn } = enableClerk ? useUser() : { user: null, isSignedIn: false };

  // Extract user information for TikTok identification
  const userEmail = isSignedIn && user?.emailAddresses?.[0]?.emailAddress;
  const userId = isSignedIn && user?.id;
  const userPhone = isSignedIn && user?.phoneNumbers?.[0]?.phoneNumber;

  // Clone children and pass user data to TikTok components
  const enhancedChildren = isValidElement(children)
    ? cloneElement(children, {
        ...(children.props || {}),
        userEmail: userEmail || undefined,
        userId: userId || undefined,
        userPhone: userPhone || undefined,
      } as any)
    : children;

  return <>{enhancedChildren}</>;
});

TikTokProvider.displayName = 'TikTokProvider';

export default TikTokProvider;
