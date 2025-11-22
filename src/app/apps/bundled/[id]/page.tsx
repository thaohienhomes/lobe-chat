import { getUserAuth } from '@lobechat/utils/server';
import { notFound, redirect } from 'next/navigation';

import { SESSION_CHAT_URL } from '@/const/url';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { lambdaRouter } from '@/server/routers/lambda';
import { PagePropsWithId } from '@/types/next';

const createCaller = createCallerFactory(lambdaRouter);

/**
 * Bundled App Page
 *
 * This page handles bundled app links like /apps/bundled/artifact-creator
 * It creates a new session with the bundled app's configuration and redirects to chat
 */
export default async function BundledAppPage(props: PagePropsWithId) {
  const params = await props.params;
  const { id } = params;

  // Get bundled app data
  const caller = createCaller({});
  const bundledApp = await caller.bundledApp.getAppById({ id });

  if (!bundledApp) {
    return notFound();
  }

  // Get user auth
  const auth = await getUserAuth();

  if (!auth) {
    // If not authenticated, redirect to login with return URL
    return redirect(`/login?callbackUrl=${encodeURIComponent(`/apps/bundled/${id}`)}`);
  }

  // Create session with bundled app config
  const authedCaller = createCaller({ userId: auth.userId });

  const sessionId = await authedCaller.session.createSession({
    config: {
      chatConfig: bundledApp.chatConfig,
      model: bundledApp.config?.model,
      openingMessage: bundledApp.openingMessage,
      openingQuestions: bundledApp.openingQuestions,
      params: bundledApp.config?.params,
      provider: bundledApp.config?.provider,
      systemRole: bundledApp.systemRole,
      tags: bundledApp.tags as string[],
    } as any,
    session: {
      avatar: bundledApp.avatar,
      backgroundColor: bundledApp.backgroundColor,
      description: bundledApp.description,
      title: bundledApp.title,
    },
    type: 'agent',
  });

  // Track usage
  await caller.bundledApp.trackUsage({ id });

  // Redirect to chat
  return redirect(SESSION_CHAT_URL(sessionId, false));
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
