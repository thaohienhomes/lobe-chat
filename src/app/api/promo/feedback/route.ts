import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Medical Beta Feedback API
 *
 * Persists feedback from Medical Beta users.
 * Works alongside PostHog survey events for redundancy.
 */

interface FeedbackEntry {
    category: string;
    message: string;
    rating: number;
    timestamp: string;
    userId: string;
}

// In-memory store for MVP — move to DB in production
const feedbackEntries: FeedbackEntry[] = [];

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { category, message, rating } = body as {
            category: string;
            message: string;
            rating: number;
        };

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Feedback message is required' },
                { status: 400 },
            );
        }

        const entry: FeedbackEntry = {
            category: category || 'general',
            message: message.trim().slice(0, 2000), // Limit length
            rating: Math.min(5, Math.max(0, rating || 0)),
            timestamp: new Date().toISOString(),
            userId,
        };

        feedbackEntries.push(entry);

        // Log for server-side monitoring
        console.log(
            `🏥 Medical Beta Feedback [${entry.category}] ⭐${entry.rating}: ${entry.message.slice(0, 100)}...`,
        );

        return NextResponse.json({
            message: 'Cảm ơn phản hồi!',
            success: true,
        });
    } catch (error) {
        console.error('Feedback API error:', error);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 },
        );
    }
}

// GET endpoint for admin to retrieve feedback
export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, check admin role
    return NextResponse.json({
        count: feedbackEntries.length,
        entries: feedbackEntries.slice(-50), // Last 50
    });
}
