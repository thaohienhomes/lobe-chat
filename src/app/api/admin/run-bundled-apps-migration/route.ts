import { NextResponse } from 'next/server';

import { requireAdmin } from '../_shared/auth';

export const GET = async () => {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { serverDB } = await import('@/database/server');

    // Read the SQL file content directly
    const fs = await import('node:fs');
    const path = await import('node:path');

    const migrationPath = path.join(
      process.cwd(),
      'packages/database/migrations/0038_add_bundled_apps.sql',
    );

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement breakpoint
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    const results = {
      executed: 0,
      failed: 0,
      statements: statements.length,
    };

    // Execute each statement
    for (const statement of statements) {
      try {
        await serverDB.execute(statement);
        results.executed++;
      } catch (error) {
        const errorMessage = (error as Error).message;
        // Ignore "already exists" errors
        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate key value')
        ) {
          results.executed++;
          continue;
        }
        results.failed++;
        console.error('Statement failed:', errorMessage);
      }
    }

    return NextResponse.json({
      message: 'Bundled apps migration completed',
      migrationPath,
      results,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
        stack: (error as Error).stack,
        success: false,
      },
      { status: 500 },
    );
  }
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
