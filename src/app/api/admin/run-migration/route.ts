import { migrate as neonMigrate } from 'drizzle-orm/neon-serverless/migrator';
import { migrate as nodeMigrate } from 'drizzle-orm/node-postgres/migrator';
import { NextResponse } from 'next/server';
import { join } from 'node:path';

import { requireAdmin } from '../_shared/auth';

export const GET = async () => {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { serverDB } = await import('@/database/server');

    const migrationsFolder = join(process.cwd(), 'packages/database/migrations');

    if (process.env.DATABASE_DRIVER === 'node') {
      await nodeMigrate(serverDB, { migrationsFolder });
    } else {
      await neonMigrate(serverDB, { migrationsFolder });
    }

    return NextResponse.json({
      message: 'Database migration completed successfully',
      migrationsFolder,
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
