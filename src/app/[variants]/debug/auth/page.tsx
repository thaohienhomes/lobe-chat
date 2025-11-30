'use client';

// Force dynamic rendering to avoid static generation issues with Clerk hooks
export const dynamic = 'force-dynamic';

import { useUser } from '@clerk/nextjs';
import { Card } from 'antd';
import Link from 'next/link';
import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

// Helper Components
interface StatusRowProps {
  bad?: boolean;
  good?: boolean;
  label: string;
  neutral?: boolean;
  value: any;
}

const StatusRow: FC<StatusRowProps> = ({ label, value, good, bad, neutral }) => {
  const getColor = () => {
    if (good) return '#52c41a';
    if (bad) return '#ff4d4f';
    if (neutral) return '#faad14';
    return '#666';
  };

  const getIcon = () => {
    if (good) return '✅';
    if (bad) return '❌';
    if (neutral) return '⚠️';
    return '•';
  };

  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 500 }}>{label}:</span>
      <span style={{ alignItems: 'center', color: getColor(), display: 'flex', gap: '8px' }}>
        <span>{getIcon()}</span>
        <span>{String(value)}</span>
      </span>
    </div>
  );
};

interface AlertProps {
  children: ReactNode;
  type: 'error' | 'info' | 'success' | 'warning';
}

const Alert: FC<AlertProps> = ({ type, children }) => {
  const colors = {
    error: { bg: '#fff2f0', border: '#ffccc7', text: '#ff4d4f' },
    info: { bg: '#e6f7ff', border: '#91d5ff', text: '#1890ff' },
    success: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a' },
    warning: { bg: '#fffbe6', border: '#ffe58f', text: '#faad14' },
  };

  const color = colors[type];

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: '4px',
        color: color.text,
        padding: '16px',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Debug page to diagnose authentication issues
 * Access at: /debug/auth
 *
 * This page shows:
 * - Clerk configuration status
 * - User authentication state
 * - Environment variables (public only)
 * - Helpful diagnostics
 */
export default function AuthDebugPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [clientConfig, setClientConfig] = useState<any>(null);

  useEffect(() => {
    // Get client-side configuration
    setClientConfig({
      brandName: process.env.NEXT_PUBLIC_BRAND_NAME,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 10),
      serviceMode: process.env.NEXT_PUBLIC_SERVICE_MODE,
      websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL,
    });
  }, []);

  return (
    <div style={{ margin: '0 auto', maxWidth: '1200px', padding: '40px' }}>
      <h1>🔍 Authentication Debug Page</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        This page helps diagnose authentication issues in production.
      </p>

      {/* Clerk Status */}
      <Card style={{ marginBottom: '24px' }} title="📊 Clerk Status">
        <div style={{ display: 'grid', gap: '12px' }}>
          <StatusRow bad={!isLoaded} good={isLoaded} label="Clerk Loaded" value={isLoaded} />
          <StatusRow
            good={isSignedIn}
            label="User Signed In"
            neutral={!isSignedIn}
            value={isSignedIn}
          />
          <StatusRow good={!!user?.id} label="User ID" value={user?.id || 'Not available'} />
          <StatusRow
            good={!!user?.primaryEmailAddress}
            label="User Email"
            value={user?.primaryEmailAddress?.emailAddress || 'Not available'}
          />
        </div>
      </Card>

      {/* Client Configuration */}
      <Card style={{ marginBottom: '24px' }} title="⚙️ Client Configuration">
        <div style={{ display: 'grid', gap: '12px' }}>
          <StatusRow
            bad={!clientConfig?.hasPublishableKey}
            good={clientConfig?.hasPublishableKey}
            label="Has Publishable Key"
            value={clientConfig?.hasPublishableKey ? 'Yes' : 'No'}
          />
          <StatusRow
            bad={!clientConfig?.publishableKeyPrefix}
            good={clientConfig?.publishableKeyPrefix?.startsWith('pk_live_')}
            label="Key Prefix"
            neutral={clientConfig?.publishableKeyPrefix?.startsWith('pk_test_')}
            value={clientConfig?.publishableKeyPrefix || 'Not set'}
          />
          <StatusRow
            good={clientConfig?.serviceMode === 'server'}
            label="Service Mode"
            value={clientConfig?.serviceMode || 'Not set'}
          />
          <StatusRow
            good={!!clientConfig?.websiteUrl}
            label="Website URL"
            value={clientConfig?.websiteUrl || 'Not set'}
          />
          <StatusRow
            good={!!clientConfig?.brandName}
            label="Brand Name"
            value={clientConfig?.brandName || 'Not set'}
          />
        </div>
      </Card>

      {/* User Details */}
      {user && (
        <Card style={{ marginBottom: '24px' }} title="👤 User Details">
          <pre
            style={{
              background: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              padding: '16px',
            }}
          >
            {JSON.stringify(
              {
                createdAt: user.createdAt,
                email: user.primaryEmailAddress?.emailAddress,
                firstName: user.firstName,
                id: user.id,
                imageUrl: user.imageUrl,
                lastName: user.lastName,
                username: user.username,
              },
              null,
              2,
            )}
          </pre>
        </Card>
      )}

      {/* Diagnostics */}
      <Card style={{ marginBottom: '24px' }} title="🔧 Diagnostics">
        <div style={{ display: 'grid', gap: '16px' }}>
          {!isLoaded && (
            <Alert type="error">
              <strong>Clerk Not Loaded</strong>
              <p>Possible causes:</p>
              <ul>
                <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set in Vercel</li>
                <li>Using wrong key format (should start with pk_live_ or pk_test_)</li>
                <li>Network issues preventing Clerk from loading</li>
              </ul>
              <p>
                <strong>Fix:</strong> Check Vercel environment variables and redeploy
              </p>
            </Alert>
          )}

          {isLoaded && !isSignedIn && (
            <Alert type="info">
              <strong>Not Signed In</strong>
              <p>This is normal if you haven&apos;t logged in yet.</p>
              <p>
                <strong>Action:</strong> Try signing in at <Link href="/login">/login</Link>
              </p>
            </Alert>
          )}

          {isLoaded && isSignedIn && (
            <Alert type="success">
              <strong>✅ Authentication Working!</strong>
              <p>Clerk is properly configured and you are signed in.</p>
            </Alert>
          )}

          {clientConfig?.publishableKeyPrefix?.startsWith('pk_test_') && (
            <Alert type="warning">
              <strong>⚠️ Using Test Keys</strong>
              <p>You&apos;re using Clerk test keys in production. This may cause issues.</p>
              <p>
                <strong>Fix:</strong> Use production keys (pk_live_) from Clerk Dashboard
              </p>
            </Alert>
          )}
        </div>
      </Card>

      {/* Helpful Links */}
      <Card title="📚 Helpful Links">
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            <a href="https://dashboard.clerk.com" rel="noopener noreferrer" target="_blank">
              Clerk Dashboard
            </a>
          </li>
          <li>
            <a href="https://vercel.com/dashboard" rel="noopener noreferrer" target="_blank">
              Vercel Dashboard
            </a>
          </li>
          <li>
            <Link href="/login">Login Page</Link>
          </li>
          <li>
            <Link href="/">Home Page</Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
