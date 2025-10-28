import { authEnv } from '@/envs/auth';
import { AUTH_CONFIG } from '@/config/customizations';

// Use centralized config as source of truth
export const enableClerk = AUTH_CONFIG.clerk.enabled;
export const enableNextAuth = AUTH_CONFIG.nextAuth.enabled;
export const enableAuth = enableClerk || enableNextAuth || false;

export const LOBE_CHAT_AUTH_HEADER = 'X-lobe-chat-auth';
export const LOBE_CHAT_OIDC_AUTH_HEADER = 'Oidc-Auth';

export const OAUTH_AUTHORIZED = 'X-oauth-authorized';

export const SECRET_XOR_KEY = 'LobeHub · LobeHub';
