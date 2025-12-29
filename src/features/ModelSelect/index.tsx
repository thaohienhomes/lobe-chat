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
      background: linear-gradient(
        135deg,
        rgba(255, 64, 129, 25%) 0%,
        rgba(156, 39, 176, 25%) 100%
      );
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
 *
 * IMPORTANT: Per SPECS_BUSINESS.md:
 * - FREE/BASIC: Tier 1 only (allowedTiers: [1])
 * - Phở Tái (vn_basic) / Standard: Tier 1 & 2 (allowedTiers: [1, 2])
 * - Phở Đặc Biệt (vn_pro) / Premium: Tier 1, 2 & 3 (allowedTiers: [1, 2, 3])
 *
 * Guest users (unauthenticated) are treated as FREE tier = Tier 1 only
 */
const useModelAccess = () => {
  // Default: Tier 1 only for guest/free users
  const [allowedTiers, setAllowedTiers] = useState<number[]>([1]);
  const [planCode, setPlanCode] = useState<string>('vn_free');
  const [planDisplayName, setPlanDisplayName] = useState<string>('Free');
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkModelAccess = async () => {
      try {
        const response = await fetch('/api/subscription/models/allowed');

        // Handle 401 (unauthenticated) - treat as free tier
        if (response.status === 401) {
          console.log('[ModelAccess] Guest user - defaulting to Tier 1 only');
          setAllowedTiers([1]);
          setPlanCode('vn_free');
          setPlanDisplayName('Free');
          setIsGuest(true);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAllowedTiers(data.data.allowedTiers || [1]);
            setPlanCode(data.data.planCode || 'vn_free');
            // Set display name based on plan code
            const displayNames: Record<string, string> = {
              gl_lifetime: 'Lifetime',
              gl_premium: 'Premium',
              gl_standard: 'Standard',
              gl_starter: 'Starter',
              vn_basic: 'Phở Tái',
              vn_free: 'Free',
              vn_pro: 'Phở Đặc Biệt',
              vn_team: 'Lẩu Phở (Team)',
            };
            setPlanDisplayName(displayNames[data.data.planCode] || 'Free');
            setIsGuest(false);
          }
        } else {
          // Other errors - default to tier 1 for safety
          console.warn('[ModelAccess] API error, defaulting to Tier 1');
          setAllowedTiers([1]);
          setIsGuest(true);
        }
      } catch (error) {
        console.error('[ModelAccess] Failed to check model access:', error);
        // On error, default to tier 1 only for safety
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
      // Auto model is special - it's available based on what the user's plan allows
      // If user has Tier 2 access, Auto model is available (it routes to appropriate model)
      if (modelId.toLowerCase().includes('auto')) {
        return allowedTiers.includes(2);
      }

      const tier = getModelTier(modelId);
      return allowedTiers.includes(tier);
    },
    [allowedTiers],
  );

  const needsUpgrade = useMemo(() => {
    // User needs upgrade if they only have Tier 1 access OR they are a guest
    return isGuest || (allowedTiers.length === 1 && allowedTiers[0] === 1);
  }, [allowedTiers, isGuest]);

  return { allowedTiers, canUseModel, isGuest, loading, needsUpgrade, planCode, planDisplayName };
};

/**
 * Upgrade Banner Component - T3.chat inspired
 */
const UpgradeBanner = memo(() => {
  const { styles } = useStyles();

  return (
    <Link className={styles.upgradeBanner} href="/subscription/upgrade">
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox gap={2}>
          <Flexbox align="center" gap={6} horizontal>
            <Sparkles size={16} style={{ color: '#ff4081' }} />
            <span className={styles.upgradeText}>Mở khóa tất cả models + giới hạn cao hơn</span>
          </Flexbox>
          <Flexbox align="baseline" gap={2} horizontal>
            <span className={styles.upgradePrice}>69K</span>
            <span className={styles.upgradePriceUnit}>/tháng</span>
          </Flexbox>
        </Flexbox>
        <button className={styles.upgradeButton} type="button">
          Nâng cấp
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
  const { t } = useTranslation('common');
  const [internalValue, setInternalValue] = useState<string | undefined>();

  const { styles } = useStyles();

  // Sync internal value with external value
  useEffect(() => {
    if (value?.provider && value?.model) {
      setInternalValue(`${value.provider}/${value.model}`);
    }
  }, [value]);

  const options = useMemo<SelectProps['options']>(() => {
    const getChatModels = (provider: EnabledProviderWithModels) =>
      provider.children.map((model) => {
        const canAccess = canUseModel(model.id);

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

  // Handle selection with proper blocking of disabled models
  const handleChange = (selectedValue: string, option: any) => {
    const opt = option as ModelOption;

    // CRITICAL: Block selection of disabled models
    if (opt?.disabled) {
      console.log('[ModelSelect] Blocked selection of disabled model:', selectedValue);
      // Don't update internal value or call onChange
      return;
    }

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
          {needsUpgrade && <UpgradeBanner />}
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
