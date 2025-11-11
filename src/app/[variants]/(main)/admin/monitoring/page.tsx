'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Tag } from 'antd';
import { useEffect, useState } from 'react';

import { MetricsSnapshot } from '@/libs/monitoring/payment-metrics';

interface HealthStatus {
  alerts: string[];
  healthy: boolean;
  timestamp: number;
  warnings: string[];
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
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div
        style={{ alignItems: 'center', display: 'flex', height: '100vh', justifyContent: 'center' }}
      >
        <Spin size="large" tip="Loading metrics..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h1>Payment System Monitoring</h1>
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchMetrics} type="primary">
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
          closable
          description={error}
          message="Error"
          showIcon
          style={{ marginBottom: '24px' }}
          type="error"
        />
      )}

      {health && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
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
                description={health.warnings.join(', ')}
                message={`${health.warnings.length} Warning(s)`}
                style={{ flex: 1 }}
                type="warning"
              />
            )}
            {health.alerts.length > 0 && (
              <Alert
                description={health.alerts.join(', ')}
                message={`${health.alerts.length} Alert(s)`}
                style={{ flex: 1 }}
                type="error"
              />
            )}
          </div>
        </Card>
      )}

      {metrics && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col lg={6} sm={12} xs={24}>
              <Card>
                <Statistic
                  precision={2}
                  suffix="%"
                  title="Webhook Success Rate"
                  value={metrics.webhookSuccessRate}
                  valueStyle={{
                    color: metrics.webhookSuccessRate >= 95 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                  Target: &gt;95%
                </div>
              </Card>
            </Col>

            <Col lg={6} sm={12} xs={24}>
              <Card>
                <Statistic
                  precision={2}
                  suffix="s"
                  title="Payment Detection Latency"
                  value={metrics.paymentDetectionLatency / 1000}
                  valueStyle={{
                    color: metrics.paymentDetectionLatency <= 30_000 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                  Target: &lt;30s
                </div>
              </Card>
            </Col>

            <Col lg={6} sm={12} xs={24}>
              <Card>
                <Statistic
                  precision={2}
                  suffix="%"
                  title="Error Rate"
                  value={metrics.errorRate}
                  valueStyle={{
                    color: metrics.errorRate <= 1 ? '#52c41a' : '#faad14',
                  }}
                />
                <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                  Target: &lt;1%
                </div>
              </Card>
            </Col>

            <Col lg={6} sm={12} xs={24}>
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
            <Col sm={12} xs={24}>
              <Card title="Webhook Processing">
                <Statistic
                  style={{ marginBottom: '16px' }}
                  title="Total Webhooks"
                  value={metrics.totalWebhooks}
                />
                <Statistic
                  style={{ marginBottom: '16px' }}
                  title="Successful"
                  value={metrics.successfulWebhooks}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Failed"
                  value={metrics.failedWebhooks}
                  valueStyle={{ color: metrics.failedWebhooks === 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>

            <Col sm={12} xs={24}>
              <Card title="Payment Detection">
                <Statistic
                  style={{ marginBottom: '16px' }}
                  title="Total Detections"
                  value={metrics.totalPaymentDetections}
                />
                <Statistic
                  precision={2}
                  suffix="s"
                  title="Average Latency"
                  value={metrics.averageDetectionTime / 1000}
                  valueStyle={{
                    color: metrics.averageDetectionTime <= 30_000 ? '#52c41a' : '#faad14',
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
          <li>
            <strong>Webhook Success Rate:</strong> Percentage of webhooks processed successfully
            (target: &gt;95%)
          </li>
          <li>
            <strong>Payment Detection Latency:</strong> Average time to detect payment completion
            (target: &lt;30 seconds)
          </li>
          <li>
            <strong>Error Rate:</strong> Percentage of operations that resulted in errors (target:
            &lt;1%)
          </li>
          <li>
            <strong>Auto-refresh:</strong> Metrics update every 30 seconds
          </li>
        </ul>
      </Card>
    </div>
  );
}
