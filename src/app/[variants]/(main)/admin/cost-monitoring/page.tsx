'use client';

import { Card, Alert } from 'antd';
import { Flexbox } from 'react-layout-kit';

export default function CostMonitoringPage() {
  return (
    <Flexbox padding={24}>
      <Card>
        <Alert
          message="Cost Monitoring Dashboard"
          description="This feature is temporarily disabled during deployment. It will be available soon."
          type="info"
          showIcon
        />
      </Card>
    </Flexbox>
  );
}

