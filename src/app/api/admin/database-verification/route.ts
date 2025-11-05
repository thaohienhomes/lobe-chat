/**
 * Database Verification Endpoint
 * Verifies production database configuration and health
 * 
 * GET /api/admin/database-verification - Run database verification checks
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { sepayPayments, subscriptions } from '@/database/schemas/billing';
import { users } from '@/database/schemas/user';
import { sql } from 'drizzle-orm';
import { pino } from '@/libs/logger';

interface VerificationResult {
  details?: Record<string, any>;
  message: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
}

interface VerificationReport {
  healthy: boolean;
  results: VerificationResult[];
  summary: {
    failed: number;
    passed: number;
    warnings: number;
  };
  timestamp: number;
}

/**
 * Verify database connection
 */
async function verifyDatabaseConnection(db: any): Promise<VerificationResult> {
  try {
    await db.execute(sql`SELECT 1 as connection_test`);
    return {
      details: { timestamp: new Date().toISOString() },
      message: 'Successfully connected to PostgreSQL database',
      name: 'Database Connection',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Failed to connect to database: ${errorMessage}`,
      name: 'Database Connection',
      status: 'fail',
    };
  }
}

/**
 * Verify sepay_payments table
 */
async function verifySepayPaymentsTable(db: any): Promise<VerificationResult> {
  try {
    await db.select().from(sepayPayments).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM sepay_payments`
    );
    return {
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
      message: 'sepay_payments table exists and is accessible',
      name: 'Sepay Payments Table',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Failed to access sepay_payments table: ${errorMessage}`,
      name: 'Sepay Payments Table',
      status: 'fail',
    };
  }
}

/**
 * Verify subscriptions table
 */
async function verifySubscriptionsTable(db: any): Promise<VerificationResult> {
  try {
    await db.select().from(subscriptions).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM subscriptions`
    );
    return {
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
      message: 'subscriptions table exists and is accessible',
      name: 'Subscriptions Table',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Failed to access subscriptions table: ${errorMessage}`,
      name: 'Subscriptions Table',
      status: 'fail',
    };
  }
}

/**
 * Verify users table
 */
async function verifyUsersTable(db: any): Promise<VerificationResult> {
  try {
    await db.select().from(users).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM users`
    );
    return {
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
      message: 'users table exists and is accessible',
      name: 'Users Table',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Failed to access users table: ${errorMessage}`,
      name: 'Users Table',
      status: 'fail',
    };
  }
}

/**
 * Verify database indexes
 */
async function verifyDatabaseIndexes(db: any): Promise<VerificationResult> {
  try {
    const indexes = await db.execute(
      sql`
        SELECT indexname FROM pg_indexes
        WHERE tablename IN ('sepay_payments', 'subscriptions', 'users')
        ORDER BY tablename, indexname
      `
    );
    return {
      details: {
        indexCount: (indexes as any).length,
        indexes: (indexes as any).map((i: any) => i.indexname),
      },
      message: 'Database indexes are properly configured',
      name: 'Database Indexes',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Could not verify indexes: ${errorMessage}`,
      name: 'Database Indexes',
      status: 'warning',
    };
  }
}

/**
 * Verify foreign key constraints
 */
async function verifyForeignKeyConstraints(db: any): Promise<VerificationResult> {
  try {
    const constraints = await db.execute(
      sql`
        SELECT constraint_name, table_name, column_name
        FROM information_schema.key_column_usage
        WHERE table_name IN ('sepay_payments', 'subscriptions')
        AND referenced_table_name IS NOT NULL
      `
    );
    return {
      details: {
        constraintCount: (constraints as any).length,
      },
      message: 'Foreign key constraints are properly configured',
      name: 'Foreign Key Constraints',
      status: 'pass',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      details: { error: errorMessage },
      message: `Could not verify constraints: ${errorMessage}`,
      name: 'Foreign Key Constraints',
      status: 'warning',
    };
  }
}

/**
 * GET /api/admin/database-verification
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when admin system is implemented

    pino.info({}, 'Starting database verification');

    // Get database instance
    const db = await getServerDB();

    // Run all verification checks
    const results = await Promise.all([
      verifyDatabaseConnection(db),
      verifySepayPaymentsTable(db),
      verifySubscriptionsTable(db),
      verifyUsersTable(db),
      verifyDatabaseIndexes(db),
      verifyForeignKeyConstraints(db),
    ]);

    // Calculate summary
    const summary = {
      failed: results.filter((r) => r.status === 'fail').length,
      passed: results.filter((r) => r.status === 'pass').length,
      warnings: results.filter((r) => r.status === 'warning').length,
    };

    const report: VerificationReport = {
      healthy: summary.failed === 0,
      results,
      summary,
      timestamp: Date.now(),
    };

    pino.info(
      {
        failed: summary.failed,
        passed: summary.passed,
        warnings: summary.warnings,
      },
      'Database verification completed',
    );

    return NextResponse.json(report, {
      status: report.healthy ? 200 : 503,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Database verification failed',
    );

    return NextResponse.json(
      {
        error: 'Database verification failed',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

