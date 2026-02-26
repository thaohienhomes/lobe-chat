import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import type { ItemType } from 'antd/es/menu/interface';
import { ArrowUpRight, Lock, LucideArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender } from '@/components/ModelSelect';
import { getModelTier } from '@/config/pricing';
import { isDeprecatedEdition } from '@/const/version';
import ActionDropdown from '@/features/ChatInput/ActionBar/components/ActionDropdown';
import {
  MODEL_DESCRIPTIONS,
  NEW_MODEL_IDS,
  SPEED_MODELS,
  type TierGroup,
  useEnabledChatModels,
} from '@/hooks/useEnabledChatModels';
import { usePricingGeo } from '@/hooks/usePricingGeo';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/slices/chat';
import { useUserStore } from '@/store/user';

// ── Tier-aware styling ─────────────────────────────────────────────────────
const TIER_CONFIG = {
  1: { accent: '#22c55e', icon: '⚡', quotaKey: null },
  2: { accent: '#a78bfa', icon: '🔮', quotaKey: '20' },
  3: { accent: '#f59e0b', icon: '👑', quotaKey: '5' },
} as const;

const useStyles = createStyles(({ css, prefixCls, token }) => ({
  disabledItem: css`
    pointer-events: none;
    cursor: not-allowed !important;

    &:hover {
      background: transparent !important;
    }
  `,
  menu: css`
    .${prefixCls}-dropdown-menu-item {
      display: flex;
      gap: 8px;
    }
    .${prefixCls}-dropdown-menu {
      &-item-group-title {
        padding-inline: 8px;
      }

      &-item-group-list {
        margin: 0 !important;
      }
    }
  `,
  modelSub: css`
    font-size: 11px;
    line-height: 1.2;
    color: ${token.colorTextQuaternary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  `,
  newBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
    line-height: 1.5;
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    animation: pulseBadge 2s infinite;
    flex-shrink: 0;

    @keyframes pulseBadge {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: 6px;

    padding-block: 8px;
    padding-inline: 8px;

    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  `,
  sectionQuota: css`
    margin-inline-start: auto;
    font-size: 9px;
    font-weight: 400;
    text-transform: none;
    color: ${token.colorTextQuaternary};
  `,
  selectedIndicator: css`
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 4px;
    inset-block-end: 4px;
    width: 3px;
    border-radius: 0 3px 3px 0;
  `,
  speedBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    background: linear-gradient(135deg, #eab308, #f97316);
    color: #000;
    flex-shrink: 0;
  `,
  tag: css`
    cursor: pointer;
  `,
  upgradeBanner: css`
    cursor: pointer;

    display: block;

    padding-block: 12px;
    padding-inline: 14px;
    border: 1px solid rgba(255, 64, 129, 30%);
    border-radius: 10px;

    text-decoration: none;

    background: linear-gradient(135deg, rgba(255, 64, 129, 20%) 0%, rgba(156, 39, 176, 20%) 100%);

    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(255, 64, 129, 50%);
      background: linear-gradient(
        135deg,
        rgba(255, 64, 129, 30%) 0%,
        rgba(156, 39, 176, 30%) 100%
      );
    }
  `,
  upgradeButton: css`
    cursor: pointer;

    display: inline-flex;
    gap: 3px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;
    border: none;
    border-radius: 6px;

    font-size: 11px;
    font-weight: 600;
    color: white;
    white-space: nowrap;

    background: linear-gradient(135deg, #ff4081 0%, #9c27b0 100%);

    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
    }
  `,
  upgradePrice: css`
    margin-inline-end: 2px;
    font-size: 20px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  upgradePriceUnit: css`
    font-size: 12px;
    color: ${token.colorTextDescription};
  `,
  upgradeText: css`
    margin-block-end: 2px;
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

const menuKey = (provider: string, model: string) => `${provider}-${model}`;

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
        return true;
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

interface IProps {
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  updating?: boolean;
}

const ModelSwitchPanel = memo<IProps>(({ children, onOpenChange, open }) => {
  const { t } = useTranslation('components');
  const { styles, theme } = useStyles();
  const [model, provider, updateAgentConfig] = useAgentStore((s) => [
    agentSelectors.currentAgentModel(s),
    agentSelectors.currentAgentModelProvider(s),
    s.updateAgentConfig,
  ]);
  const router = useRouter();
  const enabledList = useEnabledChatModels() as TierGroup[];
  const { canUseModel, needsUpgrade } = useModelAccess();
  const { isVietnam } = usePricingGeo();
  const subscriptionPlan = useUserStore((s) => s.subscriptionPlan);

  const isFreePlan = useMemo(() => {
    const FREE_PLAN_IDS = ['vn_free', 'gl_starter', 'starter'];
    return !subscriptionPlan || FREE_PLAN_IDS.includes(subscriptionPlan);
  }, [subscriptionPlan]);

  const shouldShowUpgradeBanner = needsUpgrade && isFreePlan;

  const items = useMemo<ItemType[]>(() => {
    const result: ItemType[] = [];

    // ── Upgrade banner (for free users) ──────────────────────────────
    if (shouldShowUpgradeBanner) {
      const upgradePrice = isVietnam ? '69K' : '$9.99';
      const upgradeUnit = isVietnam ? '/tháng' : '/mo';
      const upgradeText = isVietnam ? 'Mở khóa tất cả models' : 'Unlock all models';
      const upgradeButtonText = isVietnam ? 'Nâng cấp' : 'Upgrade';

      result.push(
        {
          key: 'upgrade-banner',
          label: (
            <Link
              className={styles.upgradeBanner}
              href="/subscription/upgrade"
              onClick={(e) => e.stopPropagation()}
            >
              <Flexbox align="center" horizontal justify="space-between">
                <Flexbox gap={1}>
                  <Flexbox align="center" gap={5} horizontal>
                    <Sparkles size={14} style={{ color: '#ff4081' }} />
                    <span className={styles.upgradeText}>{upgradeText}</span>
                  </Flexbox>
                  <Flexbox align="baseline" gap={2} horizontal>
                    <span className={styles.upgradePrice}>{upgradePrice}</span>
                    <span className={styles.upgradePriceUnit}>{upgradeUnit}</span>
                  </Flexbox>
                </Flexbox>
                <button className={styles.upgradeButton} type="button">
                  {upgradeButtonText}
                  <ArrowUpRight size={12} />
                </button>
              </Flexbox>
            </Link>
          ),
          style: {
            background: 'transparent',
            cursor: 'default',
            padding: '8px 4px',
          },
        },
        {
          key: 'upgrade-divider',
          type: 'divider',
        },
      );
    }

    // ── Build model items per tier group ──────────────────────────────
    const getModelItems = (tierGroupItem: TierGroup) => {
      return tierGroupItem.children.map((modelItem) => {
        const canAccess = canUseModel(modelItem.id);
        const isNew = NEW_MODEL_IDS.has(modelItem.id);
        const speedLabel = SPEED_MODELS[modelItem.id];
        const description = MODEL_DESCRIPTIONS[modelItem.id];
        // Use originProvider for correct routing, fall back to group id
        const modelProvider = (modelItem as any).originProvider || tierGroupItem.id;
        const tierNum = tierGroupItem.tierGroup || 1;
        const tierAccent = TIER_CONFIG[tierNum as 1 | 2 | 3]?.accent || '#22c55e';

        return {
          className: canAccess ? undefined : styles.disabledItem,
          disabled: !canAccess,
          key: menuKey(modelProvider, modelItem.id),
          label: (
            <Flexbox
              align="center"
              gap={8}
              horizontal
              style={{
                filter: canAccess ? 'none' : 'grayscale(1)',
                position: 'relative',
              }}
            >
              {/* Selected indicator bar */}
              {model === modelItem.id && (
                <div
                  className={styles.selectedIndicator}
                  style={{ background: tierAccent }}
                />
              )}
              {/* Model name + info */}
              <Flexbox style={{ flex: 1, minWidth: 0 }}>
                <Flexbox align="center" gap={5} horizontal>
                  <ModelItemRender {...modelItem} {...modelItem.abilities} isLocked={!canAccess} />
                  {speedLabel && (
                    <span className={styles.speedBadge}>
                      <Zap size={8} /> {speedLabel}
                    </span>
                  )}
                  {isNew && (
                    <span className={styles.newBadge}>{t('ModelSwitchPanel.newBadge')}</span>
                  )}
                </Flexbox>
                {description && <div className={styles.modelSub}>{description}</div>}
              </Flexbox>
              {!canAccess && (
                <Lock
                  size={14}
                  style={{
                    color: theme.colorTextDisabled,
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}
                />
              )}
            </Flexbox>
          ),
          onClick: canAccess
            ? async () => {
              await updateAgentConfig({ model: modelItem.id, provider: modelProvider });
            }
            : (e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
            },
        };
      });
    };

    // ── Empty state ──────────────────────────────────────────────────
    if (enabledList.length === 0) {
      result.push({
        key: `no-provider`,
        label: (
          <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
            {t('ModelSwitchPanel.emptyProvider')}
            <Icon icon={LucideArrowRight} />
          </Flexbox>
        ),
        onClick: () => {
          router.push(isDeprecatedEdition ? '/settings?active=llm' : `/settings?active=provider`);
        },
      });
      return result;
    }

    // ── Render tier sections with headers ─────────────────────────────
    enabledList.forEach((tierGroup, index) => {
      // Divider between sections
      if (index > 0) {
        result.push({
          key: `divider-${tierGroup.id}`,
          type: 'divider' as const,
        });
      }

      const tierNum = tierGroup.tierGroup || 1;
      const tierCfg = TIER_CONFIG[tierNum as 1 | 2 | 3] || TIER_CONFIG[1];
      const tierLabel =
        tierNum === 1
          ? t('ModelSwitchPanel.tierFree')
          : tierNum === 2
            ? t('ModelSwitchPanel.tierPro')
            : t('ModelSwitchPanel.tierFlagship');

      // Section header
      result.push({
        disabled: true,
        key: `header-${tierGroup.id}`,
        label: (
          <div className={styles.sectionHeader} style={{ color: tierCfg.accent }}>
            <span>{tierCfg.icon}</span>
            <span>{tierLabel}</span>
            {tierCfg.quotaKey && (
              <span className={styles.sectionQuota}>
                {`${tierCfg.quotaKey} lượt/ngày`}
              </span>
            )}
          </div>
        ),
        style: {
          cursor: 'default',
          height: 'auto',
          minHeight: 'auto',
          padding: '2px 4px',
        },
      });

      // Model items
      const modelItems = getModelItems(tierGroup);
      if (modelItems.length === 0) {
        result.push({
          key: `${tierGroup.id}-empty`,
          label: (
            <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
              {t('ModelSwitchPanel.emptyModel')}
              <Icon icon={LucideArrowRight} />
            </Flexbox>
          ),
          onClick: () => {
            router.push(
              isDeprecatedEdition
                ? '/settings?active=llm'
                : `/settings?active=provider`,
            );
          },
        });
      } else {
        result.push(...modelItems);
      }
    });

    return result;
  }, [
    enabledList,
    canUseModel,
    model,
    needsUpgrade,
    isVietnam,
    shouldShowUpgradeBanner,
    styles,
    theme,
    t,
  ]);

  const icon = <div className={styles.tag}>{children}</div>;

  return (
    <ActionDropdown
      menu={{
        // @ts-expect-error 等待 antd 修复
        activeKey: menuKey(provider, model),
        className: styles.menu,
        items,
        style: {
          maxHeight: 550,
          overflowY: 'scroll',
        },
      }}
      onOpenChange={onOpenChange}
      open={open}
      placement={'topLeft'}
    >
      {icon}
    </ActionDropdown>
  );
});

export default ModelSwitchPanel;
