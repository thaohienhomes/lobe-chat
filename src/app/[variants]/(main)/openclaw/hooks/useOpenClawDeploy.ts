'use client';

import { message } from 'antd';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DeployResult {
  botId: string;
  botName: string;
  botUsername: string;
  error?: string;
  success: boolean;
}

export const useOpenClawDeploy = () => {
  const { t } = useTranslation('openclaw');
  const [token, setToken] = useState('');
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = useCallback(async () => {
    if (!token.trim()) {
      message.warning(t('hero.tokenRequired'));
      return;
    }

    setDeploying(true);
    try {
      const res = await fetch('/api/openclaw/deploy', {
        body: JSON.stringify({ token }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data: DeployResult = await res.json();

      if (data.success) {
        message.success(`Bot @${data.botUsername} deployed! ${t('hero.deploySuccess')}`);
        setToken('');
      } else {
        message.error(data.error || 'Deploy failed');
      }
    } catch {
      message.error('Network error. Please try again.');
    } finally {
      setDeploying(false);
    }
  }, [token, t]);

  return { deploying, handleDeploy, setToken, token };
};
