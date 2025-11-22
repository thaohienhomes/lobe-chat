import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_CHAT_URL } from '@/const/url';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { lambdaRouter } from '@/server/routers/lambda';

const createCaller = createCallerFactory(lambdaRouter);

export const GET = async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params;
  const { id } = params;

  // Get bundled app data
  const caller = createCaller({});
  const bundledApp = await caller.bundledApp.getAppById({ id });

  if (!bundledApp) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Get user auth
  const auth = await getUserAuth();

  if (!auth) {
    // If not authenticated, redirect to login with return URL
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', `/apps/bundled/${id}`);
    return NextResponse.redirect(loginUrl);
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
  const chatUrl = new URL(SESSION_CHAT_URL(sessionId, false), req.url);
  return NextResponse.redirect(chatUrl);
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
