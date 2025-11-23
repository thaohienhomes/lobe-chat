import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { BundledAppModel } from '@/database/models/bundledApp';
import { NewBundledApp } from '@/database/schemas';
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
    const { config, meta, sessionId } = body;

    // Generate unique ID for the shared template
    const shareId = `shared-${auth.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create a bundled app entry for this shared template
    const model = new BundledAppModel(serverDB);

    const sharedApp: NewBundledApp = {
      avatar: meta?.avatar || '🔗',
      backgroundColor: meta?.backgroundColor || '#6366f1',
      category: 'shared',
      chatConfig: config?.chatConfig || {},
      config: {
        model: config?.model || 'gpt-4o-mini',
        params: config?.params || {},
        provider: config?.provider || 'openai',
      },
      description: meta?.description || 'Shared conversation template',
      id: shareId,
      isFeatured: false,
      isPublic: true,
      openingMessage: config?.openingMessage,
      openingQuestions: config?.openingQuestions || [],
      systemRole: config?.systemRole || '',
      tags: meta?.tags || ['shared'],
      title: meta?.title || 'Shared Template',
    };

    await model.create(sharedApp);

    return NextResponse.json({
      id: shareId,
      success: true,
      url: `/api/share/${shareId}`,
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

