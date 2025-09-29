'use client';

import { Card, Alert } from 'antd';
import { Flexbox } from 'react-layout-kit';

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

