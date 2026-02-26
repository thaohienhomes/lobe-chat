import { Select, type SelectProps } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender, ProviderItemRender, TAG_CLASSNAME } from '@/components/ModelSelect';
import { getModelTier } from '@/config/pricing';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { usePricingGeo } from '@/hooks/usePricingGeo';
import { useUserStore } from '@/store/user';
import { EnabledProviderWithModels } from '@/types/aiProvider';

const useStyles = createStyles(({ css, prefixCls }) => ({
  popup: css`
    &.${prefixCls}-select-dropdown {
      .${prefixCls}-select-item-option-grouped {
        padding-inline-start: 12px;
      }

      /* CRITICAL: Force disabled styling for locked models */
      .${prefixCls}-select-item-option-disabled {
        pointer-events: none !important;
        cursor: not-allowed !important;

        &::after {
          pointer-events: all;
          cursor: not-allowed;
          content: '';

          position: absolute;
          inset: 0;

          background: transparent;
        }

        &:hover {
          background: transparent !important;
        }
      }
    }
  `,
  select: css`
    .${prefixCls}-select-selection-item {
      .${TAG_CLASSNAME} {
        display: none;
      }
    }
  `,
  upgradeBanner: css`
    cursor: pointer;

    display: block;

    margin-block: 8px 12px;
    margin-inline: 12px;
    padding-block: 14px;
    padding-inline: 16px;
    border: 1px solid rgba(255, 64, 129, 30%);
    border-radius: 10px;

    text-decoration: none;

    background: linear-gradient(135deg, rgba(255, 64, 129, 15%) 0%, rgba(156, 39, 176, 15%) 100%);

    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 64, 129, 50%);
      background: linear-gradient(135deg, rgba(255, 64, 129, 25%) 0%, rgba(156, 39, 176, 25%) 100%);
    }
  `,
  upgradeButton: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    padding-block: 8px;
    padding-inline: 16px;
    border: none;
    border-radius: 6px;

    font-size: 12px;
    font-weight: 600;
    color: white;
    white-space: nowrap;

    background: linear-gradient(135deg, #ff4081 0%, #9c27b0 100%);

    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(255, 64, 129, 40%);
    }
  `,
  upgradePrice: css`
    margin-inline-end: 2px;
    font-size: 22px;
    font-weight: 700;
    color: #ff4081;
  `,
  upgradePriceUnit: css`
    font-size: 12px;
    color: rgba(255, 255, 255, 60%);
  `,
  upgradeText: css`
    margin-block-end: 4px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 95%);
  `,
}));

interface ModelOption {
  disabled?: boolean;
  label: any;
  provider: string;
  value: string;
}

/**
 * Hook to check if user can access a specific model based on subscription tier
 */
const useModelAccess = () => {
  const [allowedTiers, setAllowedTiers] = useState<number[]>([1]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkModelAccess = async () => {
      try {
        const response = await fetch('/api/subscription/models/allowed');

        if (response.status === 401) {
          setAllowedTiers([1]);
          setIsGuest(true);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAllowedTiers(data.data.allowedTiers || [1]);
            setIsGuest(false);
          }
        } else {
          setAllowedTiers([1]);
          setIsGuest(true);
        }
      } catch {
        setAllowedTiers([1]);
        setIsGuest(true);
      } finally {
        setLoading(false);
      }
    };

    checkModelAccess();
  }, []);

  const canUseModel = useCallback(
    (modelId: string) => {
      if (modelId.toLowerCase().includes('auto')) {
        return allowedTiers.includes(2);
      }
      const tier = getModelTier(modelId);
      return allowedTiers.includes(tier);
    },
    [allowedTiers],
  );

  const needsUpgrade = useMemo(() => {
    return isGuest || (allowedTiers.length === 1 && allowedTiers[0] === 1);
  }, [allowedTiers, isGuest]);

  return { allowedTiers, canUseModel, isGuest, loading, needsUpgrade };
};

/**
 * Upgrade Banner Component
 */
const UpgradeBanner = memo(() => {
  const { styles } = useStyles();
  const { isVietnam } = usePricingGeo();

  const upgradePrice = isVietnam ? '69K' : '$9.99';
  const upgradeUnit = isVietnam ? '/tháng' : '/mo';
  const upgradeText = isVietnam
    ? 'Mở khóa tất cả models + giới hạn cao hơn'
    : 'Unlock all models + higher limits';
  const upgradeButtonText = isVietnam ? 'Nâng cấp' : 'Upgrade';

  return (
    <Link className={styles.upgradeBanner} href="/subscription/upgrade">
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox gap={2}>
          <Flexbox align="center" gap={6} horizontal>
            <Sparkles size={16} style={{ color: '#ff4081' }} />
            <span className={styles.upgradeText}>{upgradeText}</span>
          </Flexbox>
          <Flexbox align="baseline" gap={2} horizontal>
            <span className={styles.upgradePrice}>{upgradePrice}</span>
            <span className={styles.upgradePriceUnit}>{upgradeUnit}</span>
          </Flexbox>
        </Flexbox>
        <button className={styles.upgradeButton} type="button">
          {upgradeButtonText}
          <ArrowUpRight size={14} />
        </button>
      </Flexbox>
    </Link>
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
  const { canUseModel, loading: accessLoading, needsUpgrade } = useModelAccess();
  const subscriptionPlan = useUserStore((s) => s.subscriptionPlan);

  const isFreePlan = useMemo(() => {
    const FREE_PLAN_IDS = ['vn_free', 'gl_starter', 'starter'];
    return !subscriptionPlan || FREE_PLAN_IDS.includes(subscriptionPlan);
  }, [subscriptionPlan]);

  const shouldShowUpgradeBanner = needsUpgrade && isFreePlan;

  const { t } = useTranslation('common');
  const [internalValue, setInternalValue] = useState<string | undefined>();

  const { styles } = useStyles();

  useEffect(() => {
    if (value?.provider && value?.model) {
      setInternalValue(`${value.provider}/${value.model}`);
    }
  }, [value]);

  const options = useMemo<SelectProps['options']>(() => {
    const getChatModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => {
        const canAccess = canUseModel(model.id);
        // Use originProvider if available (tier-grouped data), else fall back to provider.id
        const modelProvider = (model as any).originProvider || provider.id;

        return {
          disabled: !canAccess,
          label: (
            <ModelItemRender
              {...model}
              {...model.abilities}
              isLocked={!canAccess}
              showInfoTag={showAbility}
            />
          ),
          provider: modelProvider,
          value: `${modelProvider}/${model.id}`,
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

  const handleChange = (selectedValue: string, option: any) => {
    const opt = option as ModelOption;
    if (opt?.disabled) return;

    setInternalValue(selectedValue);
    const model = selectedValue.split('/').slice(1).join('/');
    onChange?.({ model, provider: opt.provider });
  };

  return (
    <Select
      className={styles.select}
      classNames={{
        popup: { root: styles.popup },
      }}
      defaultValue={`${value?.provider}/${value?.model}`}
      dropdownRender={(menu) => (
        <>
          {shouldShowUpgradeBanner && <UpgradeBanner />}
          {menu}
        </>
      )}
      onChange={handleChange}
      options={options}
      popupMatchSelectWidth={false}
      value={internalValue || `${value?.provider}/${value?.model}`}
    />
  );
});

export default ModelSelect;
