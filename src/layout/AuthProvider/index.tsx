import { PropsWithChildren } from 'react';

import { AUTH_CONFIG } from '@/config/customizations';

import Clerk from './Clerk';
import NextAuth from './NextAuth';
import NoAuth from './NoAuth';

const AuthProvider = ({ children }: PropsWithChildren) => {
  if (AUTH_CONFIG.clerk.enabled) return <Clerk>{children}</Clerk>;

  if (AUTH_CONFIG.nextAuth.enabled) return <NextAuth>{children}</NextAuth>;

  return <NoAuth>{children}</NoAuth>;
};

export default AuthProvider;
