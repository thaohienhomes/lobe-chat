import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log('📥 Polar Webhook Event:', {
      data: event.data,
      type: event.type,
    });

    // TODO: Implement user activation logic
    // For now, just log the event and return success
    // User will need to manually activate users or implement this later

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
