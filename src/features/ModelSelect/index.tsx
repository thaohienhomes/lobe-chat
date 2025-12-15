import { Select, type SelectProps, Tag, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender, ProviderItemRender, TAG_CLASSNAME } from '@/components/ModelSelect';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { EnabledProviderWithModels } from '@/types/aiProvider';

const useStyles = createStyles(({ css, prefixCls }) => ({
  popup: css`
    &.${prefixCls}-select-dropdown .${prefixCls}-select-item-option-grouped {
      padding-inline-start: 12px;
    }
  `,
  select: css`
    .${prefixCls}-select-selection-item {
      .${TAG_CLASSNAME} {
        display: none;
      }
    }
  `,
}));

interface ModelOption {
  label: any;
  provider: string;
  value: string;
}

/**
 * Hook to check if user can access a specific model
 */
const useModelAccess = () => {
  const [restrictedModels, setRestrictedModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkModelAccess = async () => {
      try {
        const response = await fetch('/api/subscription/models/allowed');
        if (response.ok) {
          // const data = await response.json();
          // const allowedModels = new Set(data.models || []);

          // For now, we'll assume all models not in allowed list are restricted
          // In a real implementation, you'd fetch all available models and compare
          setRestrictedModels(new Set()); // Will be populated based on actual logic
        }
      } catch (error) {
        console.error('Failed to check model access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkModelAccess();
  }, []);

  const canUseModel = (modelId: string) => !restrictedModels.has(modelId);

  return { canUseModel, loading };
};

/**
 * Upgrade Prompt Component for restricted models
 */
const UpgradePrompt = memo<{ modelId: string }>(() => {
  const { t } = useTranslation('common');
  // modelId can be used for specific upgrade messaging in the future

  return (
    <Flexbox
      align="center"
      gap={8}
      horizontal
      style={{
        backgroundColor: '#fff7e6',
        border: '1px solid #ffd591',
        borderRadius: '6px',
        padding: '8px 12px',
      }}
    >
      <Text style={{ color: '#d46b08', fontSize: '12px' }}>
        {t('upgradeToUseModel', { defaultValue: 'Upgrade to Premium to use this model' })}
      </Text>
      <Tag color="orange" size="small">
        {t('upgrade', { defaultValue: 'Upgrade' })}
      </Tag>
    </Flexbox>
  );
});

interface ModelSelectProps {
  defaultValue?: { model: string; provider?: string };
  onChange?: (props: { model: string; provider: string }) => void;
  showAbility?: boolean;
  value?: { model: string; provider?: string };
}

const ModelSelect = memo<ModelSelectProps>(({ value, onChange, showAbility = true }) => {
  const enabledList = useEnabledChatModels();
  const { canUseModel, loading: accessLoading } = useModelAccess();
  const { t } = useTranslation('common');

  const { styles } = useStyles();

  const options = useMemo<SelectProps['options']>(() => {
    const getChatModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => {
        const canAccess = canUseModel(model.id);

        return {
          disabled: !canAccess,
          label: canAccess ? (
            <ModelItemRender {...model} {...model.abilities} showInfoTag={showAbility} />
          ) : (
            <Flexbox gap={8}>
              <div style={{ opacity: 0.6 }}>
                <ModelItemRender
                  {...model}
                  {...model.abilities}
                  showInfoTag={showAbility}
                />
              </div>
              <UpgradePrompt modelId={model.id} />
            </Flexbox>
          ),
          provider: provider.id,
          value: `${provider.id}/${model.id}`,
        };
      });

    if (enabledList.length === 1) {
      const provider = enabledList[0];

      return getChatModels(provider);
    }

    return enabledList.map((provider) => ({
      label: (
        <ProviderItemRender
          logo={provider.logo}
          name={provider.name}
          provider={provider.id}
          source={provider.source}
        />
      ),
      options: getChatModels(provider),
    }));
  }, [enabledList, canUseModel, showAbility]);

  // Show loading state while checking model access
  if (accessLoading) {
    return (
      <Select
        className={styles.select}
        disabled
        loading={true}
        placeholder={t('loading', { defaultValue: 'Loading...' })}
      />
    );
  }

  return (
    <Select
      className={styles.select}
      classNames={{
        popup: { root: styles.popup },
      }}
      defaultValue={`${value?.provider}/${value?.model}`}
      onChange={(value, option) => {
        // Prevent selection of disabled models
        if ((option as any)?.disabled) {
          return;
        }
        const model = value.split('/').slice(1).join('/');
        onChange?.({ model, provider: (option as unknown as ModelOption).provider });
      }}
      options={options}
      popupMatchSelectWidth={false}
      value={`${value?.provider}/${value?.model}`}
    />
  );
});

export default ModelSelect;
