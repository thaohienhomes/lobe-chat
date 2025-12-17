import { Select, type SelectProps, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Lock } from 'lucide-react';
import { memo, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender, ProviderItemRender, TAG_CLASSNAME } from '@/components/ModelSelect';
import { getModelTier } from '@/config/pricing';
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
 * Hook to check if user can access a specific model based on subscription tier
 *
 * IMPORTANT: Per SPECS_BUSINESS.md:
 * - FREE/BASIC: Tier 1 only (allowedTiers: [1])
 * - PRO/LIFETIME: Tier 1 & 2 (allowedTiers: [1, 2])
 *
 * Guest users (unauthenticated) are treated as FREE tier = Tier 1 only
 */
const useModelAccess = () => {
  // Default: Tier 1 only for guest/free users
  const [allowedTiers, setAllowedTiers] = useState<number[]>([1]);
  const [planCode, setPlanCode] = useState<string>('vn_free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkModelAccess = async () => {
      try {
        const response = await fetch('/api/subscription/models/allowed');

        // Handle 401 (unauthenticated) - treat as free tier
        if (response.status === 401) {
          console.log('[ModelAccess] Guest user - defaulting to Tier 1 only');
          setAllowedTiers([1]);
          setPlanCode('vn_free');
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAllowedTiers(data.data.allowedTiers || [1]);
            setPlanCode(data.data.planCode || 'vn_free');
          }
        } else {
          // Other errors - default to tier 1 for safety
          console.warn('[ModelAccess] API error, defaulting to Tier 1');
          setAllowedTiers([1]);
        }
      } catch (error) {
        console.error('[ModelAccess] Failed to check model access:', error);
        // On error, default to tier 1 only for safety
        setAllowedTiers([1]);
      } finally {
        setLoading(false);
      }
    };

    checkModelAccess();
  }, []);

  const canUseModel = (modelId: string) => {
    const tier = getModelTier(modelId);
    return allowedTiers.includes(tier);
  };

  const getModelRestrictionReason = (modelId: string): string | null => {
    const tier = getModelTier(modelId);
    if (allowedTiers.includes(tier)) return null;

    if (tier === 2) {
      return 'Nâng cấp lên gói PRO để sử dụng model này';
    }
    if (tier === 3) {
      return 'Nâng cấp lên gói TEAM để sử dụng model cao cấp này';
    }
    return 'Nâng cấp để sử dụng model này';
  };

  return { allowedTiers, canUseModel, getModelRestrictionReason, loading, planCode };
};

/**
 * Locked Model Indicator for restricted models
 */
interface LockedModelIndicatorProps {
  reason: string;
}

const LockedModelIndicator = memo<LockedModelIndicatorProps>(({ reason }) => {
  return (
    <Flexbox
      align="center"
      gap={4}
      horizontal
      style={{
        color: '#d46b08',
        fontSize: '11px',
        marginTop: '4px',
      }}
    >
      <Lock size={12} />
      <Text style={{ color: '#d46b08', fontSize: '11px' }}>
        {reason}
      </Text>
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
  const { canUseModel, getModelRestrictionReason, loading: accessLoading } = useModelAccess();
  const { t } = useTranslation('common');

  const { styles } = useStyles();

  const options = useMemo<SelectProps['options']>(() => {
    const getChatModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => {
        const canAccess = canUseModel(model.id);
        const restrictionReason = getModelRestrictionReason(model.id);

        return {
          disabled: !canAccess,
          label: canAccess ? (
            <ModelItemRender {...model} {...model.abilities} showInfoTag={showAbility} />
          ) : (
            <Flexbox gap={2}>
              <div style={{ filter: 'grayscale(0.5)', opacity: 0.5 }}>
                <ModelItemRender
                  {...model}
                  {...model.abilities}
                  showInfoTag={showAbility}
                />
              </div>
              {restrictionReason && <LockedModelIndicator reason={restrictionReason} />}
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
  }, [enabledList, canUseModel, getModelRestrictionReason, showAbility]);

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
