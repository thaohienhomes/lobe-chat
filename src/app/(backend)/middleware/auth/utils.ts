import { type AuthObject } from '@clerk/backend';
import { AgentRuntimeError } from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { AUTH_CONFIG } from '@/config/customizations';
import { getAppConfig } from '@/envs/app';

interface CheckAuthParams {
  accessCode?: string;
  apiKey?: string;
  clerkAuth?: AuthObject;
  /** Fallback userId from XOR-encoded client token, used when Clerk session expires */
  fallbackUserId?: string;
  nextAuthAuthorized?: boolean;
}
/**
 * Check if the provided access code is valid, a user API key should be used or the OAuth 2 header is provided.
 *
 * @param {string} accessCode - The access code to check.
 * @param {string} apiKey - The user API key.
 * @param {boolean} oauthAuthorized - Whether the OAuth 2 header is provided.
 * @throws {AgentRuntimeError} If the access code is invalid and no user API key is provided.
 */
export const checkAuthMethod = ({
  apiKey,
  nextAuthAuthorized,
  accessCode,
  clerkAuth,
  fallbackUserId,
}: CheckAuthParams) => {
  // clerk auth handler
  if (AUTH_CONFIG.clerk.enabled) {
    if ((clerkAuth as any)?.userId) {
      // Clerk session is valid — proceed
      return;
    }

    // Clerk session expired or missing — check for fallback userId from client token
    // This prevents false "not logged in" errors during multi-round tool calling chains
    // where Clerk session cookies may expire between rounds
    if (fallbackUserId) {
      console.warn(
        `[Auth] Clerk session expired but XOR token has userId=${fallbackUserId}. Allowing request.`,
      );
      return;
    }

    // No Clerk auth AND no fallback — user truly not logged in
    throw AgentRuntimeError.createError(ChatErrorType.InvalidClerkUser);
  }

  // if next auth handler is provided
  if (AUTH_CONFIG.nextAuth.enabled && nextAuthAuthorized) return;

  // if apiKey exist
  if (apiKey) return;

  const { ACCESS_CODES } = getAppConfig();

  // if accessCode doesn't exist
  if (!ACCESS_CODES.length) return;

  if (!accessCode || !ACCESS_CODES.includes(accessCode)) {
    console.warn('tracked an invalid access code, 检查到输入的错误密码：', accessCode);
    throw AgentRuntimeError.createError(ChatErrorType.InvalidAccessCode);
  }
};
