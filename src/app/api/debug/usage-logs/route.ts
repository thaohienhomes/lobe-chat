/**
 * Debug endpoint to check usage logs
 * GET /api/debug/usage-logs
 */
import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { usageLogs } from '@/database/schemas/usage';
import { getServerDB } from '@/database/server';

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

    return NextResponse.json({
      message: logs.length > 0 ? 'Usage logs found' : 'No usage logs found for this user',
      recentLogs: logs,
      totalLogs: logs.length,
      userId,
    });
  } catch (error) {
    console.error('Debug usage logs error:', error);
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : String(error),
        error: 'Failed to retrieve usage logs',
      },
      { status: 500 },
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
      costUSD: 0.001,
      costVND: 24.167,
      createdAt: new Date(),
      inputTokens: 50,
      model: 'meta-llama/llama-3.1-8b-instruct',
      outputTokens: 100,
      provider: 'openrouter',
      queryComplexity: 'simple',
      sessionId: 'debug-test-session',
      totalTokens: 150,
      updatedAt: new Date(),
      userId,
    };

    await db.insert(usageLogs).values(testLog);

    return NextResponse.json({
      message: 'Test usage log created successfully',
      testLog,
    });
  } catch (error) {
    console.error('Debug create usage log error:', error);
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : String(error),
        error: 'Failed to create test usage log',
      },
      { status: 500 },
    );
  }
}
