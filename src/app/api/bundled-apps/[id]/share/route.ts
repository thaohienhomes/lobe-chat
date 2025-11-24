import { NextRequest, NextResponse } from 'next/server';

import { BundledAppModel } from '@/database/models/bundledApp';
import { getServerDB } from '@/database/server';

/**
 * Generate share link for a bundled app
 * POST /api/bundled-apps/[id]/share
 */
export const POST = async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  try {
    const params = await props.params;
    const { id } = params;

    // Get database instance
    const serverDB = await getServerDB();

    // Get bundled app
    const model = new BundledAppModel(serverDB);
    const bundledApp = await model.findById(id);

    if (!bundledApp) {
      return NextResponse.json({ error: 'Bundled app not found' }, { status: 404 });
    }

    // Check if app is public
    if (!bundledApp.isPublic) {
      return NextResponse.json({ error: 'This bundled app is not public' }, { status: 403 });
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat'}/apps/bundled/${id}`;

    // Track usage (optional - for analytics)
    await model.incrementUsageCount(id);

    return NextResponse.json({
      bundledApp: {
        avatar: bundledApp.avatar,
        backgroundColor: bundledApp.backgroundColor,
        category: bundledApp.category,
        description: bundledApp.description,
        id: bundledApp.id,
        tags: bundledApp.tags,
        title: bundledApp.title,
      },
      shareUrl,
      success: true,
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        success: false,
      },
      { status: 500 },
    );
  }
};

/**
 * Get share information for a bundled app
 * GET /api/bundled-apps/[id]/share
 */
export const GET = async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  try {
    const params = await props.params;
    const { id } = params;

    // Get database instance
    const serverDB = await getServerDB();

    // Get bundled app
    const model = new BundledAppModel(serverDB);
    const bundledApp = await model.findById(id);

    if (!bundledApp) {
      return NextResponse.json({ error: 'Bundled app not found' }, { status: 404 });
    }

    // Check if app is public
    if (!bundledApp.isPublic) {
      return NextResponse.json({ error: 'This bundled app is not public' }, { status: 403 });
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat'}/apps/bundled/${id}`;

    return NextResponse.json({
      bundledApp: {
        avatar: bundledApp.avatar,
        backgroundColor: bundledApp.backgroundColor,
        category: bundledApp.category,
        createdAt: bundledApp.createdAt,
        description: bundledApp.description,
        id: bundledApp.id,
        isFeatured: bundledApp.isFeatured,
        tags: bundledApp.tags,
        title: bundledApp.title,
        updatedAt: bundledApp.updatedAt,
        usageCount: bundledApp.usageCount,
      },
      shareUrl,
      success: true,
    });
  } catch (error) {
    console.error('Error getting share info:', error);
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
