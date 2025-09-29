import { sepayGateway } from '../../src/libs/sepay';

function buildPayload() {
  return {
    amount: 100000,
    currency: 'VND',
    orderId: 'TEST_ORDER_123',
    status: 'success' as const,
    timestamp: Date.now().toString(),
    transactionId: 'TX123',
  };
}

async function main() {
  const data = buildPayload();
  // @ts-ignore - access private for test via any
  const signature = (sepayGateway as any).generateSignature(data);
  const good = { ...data, signature };
  const bad = { ...data, signature: 'BAD' };

  console.log('Valid signature ->', sepayGateway.verifyWebhookSignature(good));
  console.log('Invalid signature ->', sepayGateway.verifyWebhookSignature(bad));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

