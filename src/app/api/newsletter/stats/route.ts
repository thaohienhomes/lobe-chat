import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

/**
 * GET /api/newsletter/stats
 * Get newsletter subscriber statistics
 */
export async function GET() {
  try {
    const serverDB = await getServerDB();

    // Count all users with email
    const users = await serverDB.query.users.findMany({
      columns: {
        email: true,
      },
      where: (users, { isNotNull }) => isNotNull(users.email),
    });

    const subscriberCount = users.filter((u) => u.email).length;

    // TODO: Track actual open rates and last sent date
    // For now, return placeholder stats
    return NextResponse.json({
      lastSent: null,
      openRate: null,
      subscriberCount,
    });
  } catch (error) {
    console.error('Failed to get newsletter stats:', error);
    return NextResponse.json({ error: 'Failed to get stats', subscriberCount: 0 }, { status: 500 });
  }
}
