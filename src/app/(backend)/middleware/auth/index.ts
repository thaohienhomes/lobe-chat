import { AuthObject } from '@clerk/backend';
import {
  AgentRuntimeError,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType, ClientSecretPayload } from '@lobechat/types';
import { getXorPayload } from '@lobechat/utils/server';
import { NextRequest } from 'next/server';

import {
  LOBE_CHAT_AUTH_HEADER,
  LOBE_CHAT_OIDC_AUTH_HEADER,
  OAUTH_AUTHORIZED,
  enableClerk,
} from '@/const/auth';
import { ClerkAuth } from '@/libs/clerk-auth';
import { validateOIDCJWT } from '@/libs/oidc-provider/jwt';
import { createErrorResponse } from '@/utils/errorResponse';

import { checkAuthMethod } from './utils';

// NOTE: Database imports are done dynamically inside the function to avoid
// bundling Node.js modules for edge runtime routes that use this middleware

type CreateRuntime = (jwtPayload: ClientSecretPayload) => ModelRuntime;
type RequestOptions = { createRuntime?: CreateRuntime; params: Promise<{ provider: string }> };

export type RequestHandler = (
  req: Request,
  options: RequestOptions & {
    createRuntime?: CreateRuntime;
    jwtPayload: ClientSecretPayload;
  },
) => Promise<Response>;

export const checkAuth =
  (handler: RequestHandler) => async (req: Request, options: RequestOptions) => {
    // we have a special header to debug the api endpoint in development mode
    const isDebugApi = req.headers.get('lobe-auth-dev-backend-api') === '1';
    if (process.env.NODE_ENV === 'development' && isDebugApi) {
      return handler(req, { ...options, jwtPayload: { userId: 'DEV_USER' } });
    }

    let jwtPayload: ClientSecretPayload;

    try {
      // get Authorization from header
      const authorization = req.headers.get(LOBE_CHAT_AUTH_HEADER);
      const oauthAuthorized = !!req.headers.get(OAUTH_AUTHORIZED);

      if (!authorization) throw AgentRuntimeError.createError(ChatErrorType.Unauthorized);

      // check the Auth With payload and clerk auth
      let clerkAuth = {} as AuthObject;

      // TODO: V2 完整移除 client 模式下的 clerk 集成代码
      if (enableClerk) {
        const auth = new ClerkAuth();
        const data = auth.getAuthFromRequest(req as NextRequest);
        clerkAuth = data.clerkAuth;
      }

      jwtPayload = getXorPayload(authorization);

      const oidcAuthorization = req.headers.get(LOBE_CHAT_OIDC_AUTH_HEADER);
      let isUseOidcAuth = false;
      if (!!oidcAuthorization) {
        const oidc = await validateOIDCJWT(oidcAuthorization);

        isUseOidcAuth = true;

        jwtPayload = {
          ...jwtPayload,
          userId: oidc.userId,
        };
      }

      if (!isUseOidcAuth)
        checkAuthMethod({
          accessCode: jwtPayload.accessCode,
          apiKey: jwtPayload.apiKey,
          clerkAuth,
          nextAuthAuthorized: oauthAuthorized,
        });
    } catch (e) {
      const params = await options.params;

      // if the error is not a ChatCompletionErrorPayload, it means the application error
      if (!(e as ChatCompletionErrorPayload).errorType) {
        if ((e as any).code === 'ERR_JWT_EXPIRED')
          return createErrorResponse(ChatErrorType.SystemTimeNotMatchError, e);

        // other issue will be internal server error
        console.error(e);
        return createErrorResponse(ChatErrorType.InternalServerError, {
          error: e,
          provider: params?.provider,
        });
      }

      const {
        errorType = ChatErrorType.InternalServerError,
        error: errorContent,
        ...res
      } = e as ChatCompletionErrorPayload;

      const error = errorContent || e;

      return createErrorResponse(errorType, { error, ...res, provider: params?.provider });
    }

    // ============  Subscription Validation   ============ //
    // Check if user has a paid subscription before allowing AI model access
    // NOTE: Using dynamic imports to avoid bundling Node.js modules for edge runtime
    if (jwtPayload.userId) {
      try {
        // Dynamic import to avoid edge runtime bundling issues
        const { getServerDB } = await import('@/database/server');
        const { SubscriptionService } = await import('@/server/services/subscription');

        const db = await getServerDB();
        const subscriptionService = new SubscriptionService(db);
        const canAccess = await subscriptionService.canAccessAIModels(jwtPayload.userId);

        if (!canAccess) {
          const plan = await subscriptionService.getSubscriptionPlan(jwtPayload.userId);
          console.warn(
            '[Subscription Auth] User attempted to access AI models without paid subscription:',
            {
              planId: plan.planId,
              status: plan.status,
              userId: jwtPayload.userId,
            },
          );

          return createErrorResponse(ChatErrorType.Unauthorized, {
            error: new Error(
              'AI model access requires a paid subscription. Please upgrade your plan.',
            ),
            message:
              'AI model access requires a paid subscription. Please upgrade your plan at /settings/subscription',
            planId: plan.planId,
            upgradeUrl: '/settings/subscription',
          });
        }

        console.log(
          '[Subscription Auth] ✅ Subscription validation passed for user:',
          jwtPayload.userId,
        );
      } catch (error) {
        console.error('[Subscription Auth] Error validating subscription:', error);
        // Don't block the request if subscription check fails - log and continue
        // This prevents service disruption if the subscription service has issues
      }
    }

    return handler(req, { ...options, jwtPayload });
  };
