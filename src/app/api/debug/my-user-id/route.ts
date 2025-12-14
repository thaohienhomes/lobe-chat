/**
 * Temporary Debug Endpoint - Get Current User ID
 *
 * GET /api/debug/my-user-id
 *
 * Returns the current authenticated user's Clerk ID.
 * Use this to get your User ID for ADMIN_USER_ID env var.
 *
 * ⚠️ DELETE THIS FILE AFTER GETTING YOUR USER ID!
 */
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          message: 'Please login first to get your User ID',
        },
        { status: 401 },
      );
    }

    const user = await currentUser();

    return NextResponse.json({
      createdAt: user?.createdAt,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      message: 'Copy the userId above and add it to ADMIN_USER_ID in Vercel env vars',
      userId: userId,
      warning: 'DELETE this API endpoint after getting your User ID!',
    });
  } catch (error) {
    console.error('Debug user ID error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
