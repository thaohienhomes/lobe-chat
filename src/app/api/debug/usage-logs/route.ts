/**
 * Debug endpoint to check usage logs
 * GET /api/debug/usage-logs
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { usageLogs } from '@/database/schemas/usage';
import { eq, desc } from 'drizzle-orm';

export async function GET(): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database instance
    const db = await getServerDB();

    // Get recent usage logs for this user
    const logs = await db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.createdAt))
      .limit(10);

    // Get total count
    const totalCount = await db
      .select({ count: 'COUNT(*)' })
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId));

    return NextResponse.json({
      userId,
      totalLogs: totalCount[0]?.count || 0,
      recentLogs: logs,
      message: logs.length > 0 ? 'Usage logs found' : 'No usage logs found for this user'
    });
  } catch (error) {
    console.error('Debug usage logs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage logs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Create a test usage log entry
 * POST /api/debug/usage-logs
 */
export async function POST(): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database instance
    const db = await getServerDB();

    // Create a test usage log entry
    const testLog = {
      userId,
      model: 'meta-llama/llama-3.1-8b-instruct',
      provider: 'openrouter',
      inputTokens: 50,
      outputTokens: 100,
      totalTokens: 150,
      costUSD: 0.001,
      costVND: 24.167,
      queryComplexity: 'simple',
      sessionId: 'debug-test-session',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(usageLogs).values(testLog);

    return NextResponse.json({
      message: 'Test usage log created successfully',
      testLog
    });
  } catch (error) {
    console.error('Debug create usage log error:', error);
    return NextResponse.json(
      { error: 'Failed to create test usage log', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
