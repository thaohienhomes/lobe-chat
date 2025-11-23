import { getUserAuth } from '@lobechat/utils/server';
import { NextRequest, NextResponse } from 'next/server';

import { SharedConversationModel } from '@/database/models/sharedConversation';
import { NewSharedConversation } from '@/database/schemas';
import { serverDB } from '@/database/server';

// Auto-run migration if table doesn't exist
const ensureTableExists = async () => {
  try {
    // Try to query the table
    await serverDB.execute('SELECT 1 FROM shared_conversations LIMIT 1');
  } catch {
    // Table doesn't exist, run migration
    console.log('shared_conversations table not found, running migration...');

    const fs = await import('node:fs');
    const path = await import('node:path');

    const migrationPath = path.join(
      process.cwd(),
      'packages/database/migrations/0039_add_shared_conversations.sql',
    );

    const sql = fs.readFileSync(migrationPath, 'utf8');

    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await serverDB.execute(statement);
      } catch (err) {
        const errorMessage = (err as Error).message;
        if (!errorMessage.includes('already exists')) {
          throw err;
        }
      }
    }

    console.log('Migration completed successfully');
  }
};

export const POST = async (req: NextRequest) => {
  try {
    // Ensure table exists before proceeding
    await ensureTableExists();

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
      avatar: meta?.avatar || '💬',
      backgroundColor: meta?.backgroundColor || '#6366f1',
      chatConfig: config?.chatConfig || {},
      description: meta?.description || '',
      forkCount: 0,
      id: shareId,
      isPublic: true,
      messages: messages || [],
      model: config?.model || 'gpt-4o-mini',
      params: config?.params || {},
      provider: config?.provider || 'openai',
      systemRole: config?.systemRole || '',
      tags: meta?.tags || [],
      title: meta?.title || 'Shared Conversation',
      userId: auth.userId,
      viewCount: 0,
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
