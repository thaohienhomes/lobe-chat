import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { SharedConversationModel } from '@/database/models/sharedConversation';
import { NewSharedConversation } from '@/database/schemas';
import { serverDB } from '@/database/server';

export const POST = async (req: NextRequest) => {
  try {
    // Get user auth
    const auth = await getUserAuth();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { config, meta, messages } = body;

    // Generate unique ID for the shared conversation
    const shareId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Create shared conversation
    const model = new SharedConversationModel(serverDB);

    const sharedConversation: NewSharedConversation = {
      id: shareId,
      userId: auth.userId,

      // Metadata
      title: meta?.title || 'Shared Conversation',
      description: meta?.description || '',
      avatar: meta?.avatar || '💬',
      backgroundColor: meta?.backgroundColor || '#6366f1',
      tags: meta?.tags || [],

      // Agent configuration
      systemRole: config?.systemRole || '',
      model: config?.model || 'gpt-4o-mini',
      provider: config?.provider || 'openai',
      params: config?.params || {},
      chatConfig: config?.chatConfig || {},

      // Messages (full conversation history)
      messages: messages || [],

      // Stats
      isPublic: true,
      viewCount: 0,
      forkCount: 0,
    };

    await model.create(sharedConversation);

    return NextResponse.json({
      id: shareId,
      success: true,
      url: `/share/${shareId}`,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
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

