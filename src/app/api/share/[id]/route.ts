import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_CHAT_URL } from '@/const/url';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { lambdaRouter } from '@/server/routers/lambda';

const createCaller = createCallerFactory(lambdaRouter);

/**
 * Handle shared template links
 * Same as bundled apps but for user-created templates
 */
export const GET = async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params;
  const { id } = params;

  // Get bundled app data (shared templates are stored as bundled apps)
  const caller = createCaller({});
  const sharedApp = await caller.bundledApp.getAppById({ id });

  if (!sharedApp) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Get user auth
  const auth = await getUserAuth();

  if (!auth) {
    // If not authenticated, redirect to login with return URL
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', `/api/share/${id}`);
    return NextResponse.redirect(loginUrl);
  }

  // Create session with shared template config
  const authedCaller = createCaller({ userId: auth.userId });

  const sessionId = await authedCaller.session.createSession({
    config: {
      chatConfig: sharedApp.chatConfig,
      model: sharedApp.config?.model,
      openingMessage: sharedApp.openingMessage,
      openingQuestions: sharedApp.openingQuestions,
      params: sharedApp.config?.params,
      provider: sharedApp.config?.provider,
      systemRole: sharedApp.systemRole,
      tags: sharedApp.tags as string[],
    } as any,
    session: {
      avatar: sharedApp.avatar,
      backgroundColor: sharedApp.backgroundColor,
      description: sharedApp.description,
      title: sharedApp.title,
    },
    type: 'agent',
  });

  // Track usage
  await caller.bundledApp.trackUsage({ id });

  // Redirect to chat
  const chatUrl = new URL(SESSION_CHAT_URL(sessionId, false), req.url);
  return NextResponse.redirect(chatUrl);
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

