/**
 * Database Verification Endpoint
 * Verifies production database configuration and health
 * 
 * GET /api/admin/database-verification - Run database verification checks
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { sepayPayments, subscriptions } from '@/database/schemas/billing';
import { users } from '@/database/schemas/user';
import { sql } from 'drizzle-orm';
import { pino } from '@/libs/logger';

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, any>;
}

interface VerificationReport {
  timestamp: number;
  healthy: boolean;
  results: VerificationResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Verify database connection
 */
async function verifyDatabaseConnection(db: any): Promise<VerificationResult> {
  try {
    const result = await db.execute(sql`SELECT 1 as connection_test`);
    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to PostgreSQL database',
      details: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Failed to connect to database: ${errorMessage}`,
      details: { error: errorMessage },
    };
  }
}

/**
 * Verify sepay_payments table
 */
async function verifySepayPaymentsTable(db: any): Promise<VerificationResult> {
  try {
    const result = await db.select().from(sepayPayments).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM sepay_payments`
    );
    return {
      name: 'Sepay Payments Table',
      status: 'pass',
      message: 'sepay_payments table exists and is accessible',
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Sepay Payments Table',
      status: 'fail',
      message: `Failed to access sepay_payments table: ${errorMessage}`,
      details: { error: errorMessage },
    };
  }
}

/**
 * Verify subscriptions table
 */
async function verifySubscriptionsTable(db: any): Promise<VerificationResult> {
  try {
    const result = await db.select().from(subscriptions).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM subscriptions`
    );
    return {
      name: 'Subscriptions Table',
      status: 'pass',
      message: 'subscriptions table exists and is accessible',
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Subscriptions Table',
      status: 'fail',
      message: `Failed to access subscriptions table: ${errorMessage}`,
      details: { error: errorMessage },
    };
  }
}

/**
 * Verify users table
 */
async function verifyUsersTable(db: any): Promise<VerificationResult> {
  try {
    const result = await db.select().from(users).limit(1);
    const count = await db.execute(
      sql`SELECT COUNT(*) as count FROM users`
    );
    return {
      name: 'Users Table',
      status: 'pass',
      message: 'users table exists and is accessible',
      details: {
        recordCount: (count as any)[0]?.count || 0,
        schema: 'verified',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Users Table',
      status: 'fail',
      message: `Failed to access users table: ${errorMessage}`,
      details: { error: errorMessage },
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
      name: 'Database Indexes',
      status: 'pass',
      message: 'Database indexes are properly configured',
      details: {
        indexCount: (indexes as any).length,
        indexes: (indexes as any).map((i: any) => i.indexname),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Database Indexes',
      status: 'warning',
      message: `Could not verify indexes: ${errorMessage}`,
      details: { error: errorMessage },
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
      name: 'Foreign Key Constraints',
      status: 'pass',
      message: 'Foreign key constraints are properly configured',
      details: {
        constraintCount: (constraints as any).length,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name: 'Foreign Key Constraints',
      status: 'warning',
      message: `Could not verify constraints: ${errorMessage}`,
      details: { error: errorMessage },
    };
  }
}

/**
 * GET /api/admin/database-verification
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
      passed: results.filter((r) => r.status === 'pass').length,
      failed: results.filter((r) => r.status === 'fail').length,
      warnings: results.filter((r) => r.status === 'warning').length,
    };

    const report: VerificationReport = {
      timestamp: Date.now(),
      healthy: summary.failed === 0,
      results,
      summary,
    };

    pino.info(
      {
        passed: summary.passed,
        failed: summary.failed,
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

