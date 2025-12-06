'use client';

import { Alert, Card } from 'antd';
import { Flexbox } from 'react-layout-kit';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function CostMonitoringPage() {
  return (
    <Flexbox padding={24}>
      <Card>
        <Alert
          description="This feature is temporarily disabled during deployment. It will be available soon."
          message="Cost Monitoring Dashboard"
          showIcon
          type="info"
        />
      </Card>
    </Flexbox>
  );
}
