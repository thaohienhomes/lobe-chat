'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { memo, useEffect, useRef } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { useUserStore } from '@/store/user';
import { LobeUser } from '@/types/user';
import { trackCompleteRegistration } from '@/utils/tiktok-events';

// update the user data into the context
const UserUpdater = memo(() => {
  const { isLoaded, user, isSignedIn } = useUser();
  const { session, openUserProfile, signOut, openSignIn } = useClerk();

  // Track if we've already tracked registration for this user
  const hasTrackedRegistration = useRef<string | null>(null);

  const useStoreUpdater = createStoreUpdater(useUserStore);

  const lobeUser = {
    avatar: user?.imageUrl,
    firstName: user?.firstName,
    fullName: user?.fullName,
    id: user?.id,
    latestName: user?.lastName,
    username: user?.username,
  } as LobeUser;

  useStoreUpdater('isLoaded', isLoaded);
  useStoreUpdater('user', lobeUser);
  useStoreUpdater('isSignedIn', isSignedIn);

  // Type assertion needed due to Clerk type version mismatch after Next.js 15.5.7 update
  useStoreUpdater('clerkUser', (user ?? undefined) as any);
  useStoreUpdater('clerkSession', (session?.status === 'active' ? session : undefined) as any);
  useStoreUpdater('clerkSignIn', openSignIn);
  useStoreUpdater('clerkOpenUserProfile', openUserProfile);
  useStoreUpdater('clerkSignOut', signOut);

  // Track user registration completion
  useEffect(() => {
    if (isLoaded && isSignedIn && user && user.id) {
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
        });
      }

      // Check if this is a new user registration (user created recently)
      const userCreatedAt = user.createdAt;
      const now = new Date();
      const timeDiff = userCreatedAt ? now.getTime() - userCreatedAt.getTime() : Infinity;
      const isNewUser = timeDiff < 5 * 60 * 1000; // 5 minutes threshold for new user

      // Track registration only once per user and only for new users
      if (isNewUser && hasTrackedRegistration.current !== user.id) {
        console.debug('Tracking TikTok CompleteRegistration for new user:', user.id);
        trackCompleteRegistration();
        hasTrackedRegistration.current = user.id;
      }
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
});

export default UserUpdater;
