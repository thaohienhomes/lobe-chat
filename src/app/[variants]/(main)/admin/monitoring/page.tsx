'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, Alert, Button, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import { MetricsSnapshot } from '@/libs/monitoring/payment-metrics';

interface HealthStatus {
  healthy: boolean;
  warnings: string[];
  alerts: string[];
  timestamp: number;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metrics
      const metricsResponse = await fetch('/api/monitoring/payment-metrics');
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch health status
      const healthResponse = await fetch('/api/monitoring/payment-metrics?health=true');
      if (!healthResponse.ok) {
        throw new Error('Failed to fetch health status');
      }
      const healthData = await healthResponse.json();
      setHealth(healthData);

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading metrics..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Payment System Monitoring</h1>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchMetrics}
            loading={loading}
          >
            Refresh
          </Button>
          {lastUpdated && (
            <span style={{ color: '#999', fontSize: '12px' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </Space>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {health && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <h3>System Health</h3>
              {health.healthy ? (
                <Tag color="green">✓ Healthy</Tag>
              ) : (
                <Tag color="red">✗ Unhealthy</Tag>
              )}
            </div>
            {health.warnings.length > 0 && (
              <Alert
                message={`${health.warnings.length} Warning(s)`}
                description={health.warnings.join(', ')}
                type="warning"
                style={{ flex: 1 }}
              />
            )}
            {health.alerts.length > 0 && (
              <Alert
                message={`${health.alerts.length} Alert(s)`}
                description={health.alerts.join(', ')}
                type="error"
                style={{ flex: 1 }}
              />
            )}
          </div>
        </Card>
      )}

      {metrics && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Webhook Success Rate"
                  value={metrics.webhookSuccessRate}
                  precision={2}
                  suffix="%"
                  valueStyle={{
                    color: metrics.webhookSuccessRate >= 95 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Target: &gt;95%
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Payment Detection Latency"
                  value={metrics.paymentDetectionLatency / 1000}
                  precision={2}
                  suffix="s"
                  valueStyle={{
                    color: metrics.paymentDetectionLatency <= 30000 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Target: &lt;30s
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Error Rate"
                  value={metrics.errorRate}
                  precision={2}
                  suffix="%"
                  valueStyle={{
                    color: metrics.errorRate <= 1 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Target: &lt;1%
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Errors"
                  value={metrics.totalErrors}
                  valueStyle={{ color: metrics.totalErrors === 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card title="Webhook Processing">
                <Statistic
                  title="Total Webhooks"
                  value={metrics.totalWebhooks}
                  style={{ marginBottom: '16px' }}
                />
                <Statistic
                  title="Successful"
                  value={metrics.successfulWebhooks}
                  valueStyle={{ color: '#52c41a' }}
                  style={{ marginBottom: '16px' }}
                />
                <Statistic
                  title="Failed"
                  value={metrics.failedWebhooks}
                  valueStyle={{ color: metrics.failedWebhooks === 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card title="Payment Detection">
                <Statistic
                  title="Total Detections"
                  value={metrics.totalPaymentDetections}
                  style={{ marginBottom: '16px' }}
                />
                <Statistic
                  title="Average Latency"
                  value={metrics.averageDetectionTime / 1000}
                  precision={2}
                  suffix="s"
                  valueStyle={{
                    color: metrics.averageDetectionTime <= 30000 ? '#52c41a' : '#faad14',
                  }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Card style={{ marginTop: '24px' }}>
        <h3>Monitoring Information</h3>
        <ul>
          <li><strong>Webhook Success Rate:</strong> Percentage of webhooks processed successfully (target: &gt;95%)</li>
          <li><strong>Payment Detection Latency:</strong> Average time to detect payment completion (target: &lt;30 seconds)</li>
          <li><strong>Error Rate:</strong> Percentage of operations that resulted in errors (target: &lt;1%)</li>
          <li><strong>Auto-refresh:</strong> Metrics update every 30 seconds</li>
        </ul>
      </Card>
    </div>
  );
}

