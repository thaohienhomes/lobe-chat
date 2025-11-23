import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { SharedConversationModel } from '@/database/models/sharedConversation';
import { serverDB } from '@/database/server';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { lambdaRouter } from '@/server/routers/lambda';

const createCaller = createCallerFactory(lambdaRouter);

/**
 * Fork a shared conversation
 * Creates a new session with the same config and messages
 */
export const POST = async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  try {
    const params = await props.params;
    const { id } = params;

    // Get user auth
    const auth = await getUserAuth();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shared conversation
    const model = new SharedConversationModel(serverDB);
    const sharedConversation = await model.getPublicById(id);

    if (!sharedConversation) {
      return NextResponse.json({ error: 'Shared conversation not found' }, { status: 404 });
    }

    // Create session with shared conversation config
    const authedCaller = createCaller({ userId: auth.userId });

    const sessionId = await authedCaller.session.createSession({
      config: {
        chatConfig: sharedConversation.chatConfig,
        model: sharedConversation.model,
        params: sharedConversation.params,
        provider: sharedConversation.provider,
        systemRole: sharedConversation.systemRole,
        tags: sharedConversation.tags as string[],
      } as any,
      session: {
        avatar: sharedConversation.avatar,
        backgroundColor: sharedConversation.backgroundColor,
        description: sharedConversation.description,
        title: `${sharedConversation.title} (Forked)`,
      },
      type: 'agent',
    });

    // TODO: Copy messages to new session
    // This requires creating messages in the new session
    // For now, we just create an empty session with the same config

    // Increment fork count
    await model.incrementForkCount(id);

    return NextResponse.json({
      sessionId,
      success: true,
    });
  } catch (error) {
    console.error('Error forking conversation:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        success: false,
      },
      { status: 500 },
    );
  }
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

