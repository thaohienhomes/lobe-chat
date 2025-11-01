# Payment & Subscription System - Comprehensive Fix Plan

## FIX #1: Webhook Double Parsing Bug (CRITICAL)

**File**: `src/app/api/payment/sepay/webhook/route.ts`

**Current Code (Lines 109-147)**:
```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();  // First parse
    // ... manual verification check ...
    const webhookData: SepayWebhookData = await request.json();  // SECOND PARSE - FAILS!
```

**Fix**: Remove duplicate parsing
```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Check if this is a manual verification request
    if (body.action === 'manual_verify') {
      // ... handle manual verification ...
    }
    
    // Use body directly, don't parse again
    const webhookData: SepayWebhookData = body;
    
    // Continue with webhook processing...
```

**Impact**: Fixes webhook processing for all payment types

---

## FIX #2: Create /subscription/manage Route (CRITICAL)

**File**: Create `src/app/[variants]/(main)/subscription/manage/page.tsx`

**Implementation**:
```typescript
import { Metadata } from 'next';
import ServerLayout from '@/components/server/ServerLayout';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import ManageContent from './features/ManageContent';

export const generateMetadata = async (props: DynamicLayoutProps): Promise<Metadata> => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('setting', locale);

  return metadataModule.generate({
    description: t('subscription.manage.title'),
    locale,
    title: t('subscription.manage.title'),
    url: '/subscription/manage',
  });
};

const Layout = ServerLayout({ Desktop, Mobile });

const SubscriptionManagePage = async (props: DynamicLayoutProps) => {
  return (
    <Layout {...props}>
      <ManageContent />
    </Layout>
  );
};

export default SubscriptionManagePage;
```

**Create**: `src/app/[variants]/(main)/subscription/manage/features/ManageContent.tsx`
- Display current subscription status
- Show renewal date
- Provide cancel/upgrade options
- Display payment history

---

## FIX #3: Route Credit Card to Sepay (CRITICAL)

**File**: `src/app/[variants]/(main)/subscription/checkout/Client.tsx`

**Current Code (Line 306)**:
```typescript
const response = await fetch('/api/payment/polar/create', {
```

**Fix**:
```typescript
const response = await fetch('/api/payment/sepay/create-credit-card', {
  body: JSON.stringify({
    amount: vndAmount,
    billingCycle,
    cardCvv: values.cardCvv,
    cardExpiryMonth: values.cardExpiryMonth,
    cardExpiryYear: values.cardExpiryYear,
    cardHolderName: values.cardHolderName,
    cardNumber: values.cardNumber,
    currency: 'VND',
    customerInfo: { email: values.email, name: values.name, phone: values.phone },
    planId,
  }),
  headers: { 'Content-Type': 'application/json' },
  method: 'POST',
});
```

---

## FIX #4: Implement Real Usage Data Fetching (HIGH)

**File**: `src/app/[variants]/(main)/settings/usage/features/UsageOverview.tsx`

**Create tRPC endpoint**: `src/server/routers/lambda/usage.ts`
```typescript
export const usageRouter = router({
  getUsageSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getServerDB();
      const summary = await db
        .select()
        .from(monthlySummary)
        .where(eq(monthlySummary.userId, ctx.userId))
        .orderBy(desc(monthlySummary.month))
        .limit(1);
      
      return summary[0] || null;
    }),
});
```

**Update UsageOverview.tsx**:
```typescript
const { data: usageData } = useSWR(
  'usage-summary',
  () => trpc.usage.getUsageSummary.query(),
);
```

---

## FIX #5: Fix Sepay Transaction Query (HIGH)

**File**: `src/libs/sepay/index.ts` (Lines 531-575)

**Improvements**:
1. Better null checking for transactions array
2. Improved order ID matching (handle variations)
3. Better amount matching (handle currency formats)
4. Add detailed logging

```typescript
if (result.status !== 200 || !result.messages?.success) {
  console.error('❌ Sepay API returned error:', result.error);
  return { error: result.error, message: 'Unable to check payment status', orderId, success: false };
}

if (!result.transactions || !Array.isArray(result.transactions)) {
  console.log('⏳ No transactions found yet');
  return { message: 'Payment not found yet', orderId, success: false };
}

// Improved matching logic
const matchingTransaction = result.transactions.find((transaction) => {
  const content = transaction.transaction_content?.toLowerCase() || '';
  const orderIdLower = orderId.toLowerCase();
  
  // Check multiple order ID formats
  const hasOrderId = content.includes(orderIdLower) || 
                     content.includes(orderId) ||
                     content.includes(orderId.replace(/_/g, ''));
  
  // Better amount matching
  const txAmount = parseFloat(transaction.amount_in || '0');
  const amountMatches = !expectedAmount || 
                        txAmount === expectedAmount ||
                        txAmount === expectedAmount / 100 ||
                        txAmount === expectedAmount / 1000;
  
  return hasOrderId && amountMatches && txAmount > 0;
});
```

---

## FIX #6: Complete Credit Card Endpoint (HIGH)

**File**: `src/app/api/payment/sepay/create-credit-card/route.ts`

Complete the implementation with proper:
- Card validation
- Sepay API integration
- Error handling
- Response formatting

---

## FIX #7: Create /subscription/payment Route (MEDIUM)

**File**: Create `src/app/[variants]/(main)/subscription/payment/page.tsx`

Display payment method management interface

---

## TESTING CHECKLIST

- [ ] Webhook receives and processes payments correctly
- [ ] QR code payment redirects on success
- [ ] Credit card payment works end-to-end
- [ ] Subscription management page loads
- [ ] Usage data displays real values
- [ ] Payment history shows transactions
- [ ] Subscription renewal dates are correct
- [ ] Database records are saved properly

---

## DEPLOYMENT STEPS

1. Fix webhook double parsing
2. Create missing routes
3. Route credit card to Sepay
4. Implement usage data fetching
5. Test all payment flows
6. Deploy to production
7. Monitor webhook processing
8. Verify subscription activations

