import crypto from 'node:crypto';
import { POST as webhookPOST } from '../../src/app/api/payment/sepay/webhook/route';

function genSignature(data: Record<string, any>, secret: string) {
  const sortedKeys = Object.keys(data).sort();
  const signString = sortedKeys.map((k) => `${k}=${data[k]}`).join('&');
  const stringToSign = `${signString}&key=${secret}`;
  return crypto.createHash('md5').update(stringToSign).digest('hex').toUpperCase();
}

async function main() {
  const secret = process.env.SEPAY_SECRET_KEY || '';
  const base = {
    amount: 100000,
    currency: 'VND',
    orderId: 'TEST_ORDER_123',
    status: 'success',
    timestamp: Date.now().toString(),
    transactionId: 'TX123',
  } as const;

  const signature = genSignature(base as any, secret);
  const goodPayload = { ...base, signature };

  const req = new Request('http://localhost/api/payment/sepay/webhook', {
    method: 'POST',
    body: JSON.stringify(goodPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await webhookPOST(req as any);
  console.log('Valid signature status:', (res as any).status);
  console.log('Valid signature body:', await (res as any).json());

  const badPayload = { ...base, signature: 'BAD' };
  const badReq = new Request('http://localhost/api/payment/sepay/webhook', {
    method: 'POST',
    body: JSON.stringify(badPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  const badRes = await webhookPOST(badReq as any);
  console.log('Invalid signature status:', (badRes as any).status);
  console.log('Invalid signature body:', await (badRes as any).json());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

