'use client';

import { Alert, Card, Typography } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;

const DebugSubscriptionPage = memo(() => {
  const { t, i18n } = useTranslation('setting');

  const debugInfo = {
    currentLanguage: i18n.language,
    subscriptionPlansTitle: t('subscription.plans.title', { defaultValue: 'MISSING: subscription.plans.title' }),
    subscriptionTitle: t('subscription.title', { defaultValue: 'MISSING: subscription.title' }),
    translationNamespace: 'setting',
  };

  return (
    <Flexbox gap={24} style={{ margin: '0 auto', maxWidth: '800px', padding: '24px' }}>
      <Title level={2}>🔍 Subscription Plans Debug Page</Title>
      
      <Alert
        description="This page helps diagnose subscription plans display issues"
        message="Debug Information"
        showIcon
        type="info"
      />

      <Card title="Translation Debug">
        <Flexbox gap={16}>
          <Text><strong>Current Language:</strong> {debugInfo.currentLanguage}</Text>
          <Text><strong>Translation Namespace:</strong> {debugInfo.translationNamespace}</Text>
          <Text><strong>Subscription Title:</strong> {debugInfo.subscriptionTitle}</Text>
          <Text><strong>Subscription Plans Title:</strong> {debugInfo.subscriptionPlansTitle}</Text>
        </Flexbox>
      </Card>

      <Card title="Static Plans Test">
        <Flexbox gap={16}>
          <Title level={4}>Test Plans Display</Title>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {[
              { id: 'starter', name: 'Starter', price: '$9.9' },
              { id: 'premium', name: 'Premium', price: '$19.9' },
              { id: 'ultimate', name: 'Ultimate', price: '$39.9' }
            ].map((plan) => (
              <Card key={plan.id} style={{ border: '1px solid #d9d9d9' }}>
                <Title level={5}>{plan.name}</Title>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{plan.price}</Text>
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      console.log(`Clicked ${plan.name} plan`);
                      alert(`${plan.name} plan clicked! Check console for details.`);
                    }}
                    style={{ 
                      backgroundColor: '#1890ff', 
                      border: 'none', 
                      borderRadius: '4px', 
                      color: 'white', 
                      cursor: 'pointer', 
                      padding: '8px 16px',
                      width: '100%'
                    }}
                    type="button"
                  >
                    Upgrade to {plan.name}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </Flexbox>
      </Card>

      <Alert
        description={
          <div>
            <p>1. Check if the plans display correctly above</p>
            <p>2. Verify translation keys are working</p>
            <p>3. Test the upgrade buttons</p>
            <p>4. Check browser console for any errors</p>
          </div>
        }
        message="Next Steps"
        showIcon
        type="warning"
      />
    </Flexbox>
  );
});

DebugSubscriptionPage.displayName = 'DebugSubscriptionPage';

export default DebugSubscriptionPage;
