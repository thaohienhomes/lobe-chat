import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import type { ItemType } from 'antd/es/menu/interface';
import { ArrowUpRight, Lock, LucideArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender } from '@/components/ModelSelect';
import { getModelTier } from '@/config/pricing';
import { isDeprecatedEdition } from '@/const/version';
import ActionDropdown from '@/features/ChatInput/ActionBar/components/ActionDropdown';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/slices/chat';
import { EnabledProviderWithModels } from '@/types/aiProvider';

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
      background: linear-gradient(135deg, rgba(255, 64, 129, 30%) 0%, rgba(156, 39, 176, 30%) 100%);
    }
  `,
  upgradeBannerWrapper: css`
    padding-block: 8px;
    padding-inline: 12px;
    border-block-end: 1px solid rgba(255, 255, 255, 10%);
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
      // Auto selection should be available for everyone
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
  const enabledList = useEnabledChatModels();
  const { canUseModel, needsUpgrade } = useModelAccess();

  const items = useMemo<ItemType[]>(() => {
    const result: ItemType[] = [];

    // Add upgrade banner as first item if user needs upgrade
    if (needsUpgrade) {
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
                    <span className={styles.upgradeText}>Mở khóa tất cả models</span>
                  </Flexbox>
                  <Flexbox align="baseline" gap={2} horizontal>
                    <span className={styles.upgradePrice}>69K</span>
                    <span className={styles.upgradePriceUnit}>/tháng</span>
                  </Flexbox>
                </Flexbox>
                <button className={styles.upgradeButton} type="button">
                  Nâng cấp
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

    const getModelItems = (providerItem: EnabledProviderWithModels) => {
      const items = providerItem.children.map((modelItem) => {
        const canAccess = canUseModel(modelItem.id);

        return {
          className: canAccess ? undefined : styles.disabledItem,
          disabled: !canAccess,
          key: menuKey(providerItem.id, modelItem.id),
          label: (
            <Flexbox
              align="center"
              gap={8}
              horizontal
              style={{
                filter: canAccess ? 'none' : 'grayscale(1)',
              }}
            >
              <ModelItemRender {...modelItem} {...modelItem.abilities} isLocked={!canAccess} />
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
                await updateAgentConfig({ model: modelItem.id, provider: providerItem.id });
              }
            : (e: any) => {
                // Block click for disabled items
                e?.preventDefault?.();
                e?.stopPropagation?.();
              },
        };
      });

      // if there is empty items, add a placeholder guide
      if (items.length === 0)
        return [
          {
            key: `${providerItem.id}-empty`,
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
                  : `/settings?active=provider&provider=${providerItem.id}`,
              );
            },
          },
        ];

      return items;
    };

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

    // Add items directly without provider groups header
    enabledList.forEach((providerItem) => {
      result.push(...getModelItems(providerItem));
    });

    return result;
  }, [
    enabledList,
    canUseModel,
    needsUpgrade,
    styles.disabledItem,
    styles.upgradeBanner,
    styles.upgradeText,
    styles.upgradePrice,
    styles.upgradePriceUnit,
    styles.upgradeButton,
  ]);

  const icon = <div className={styles.tag}>{children}</div>;

  return (
    <ActionDropdown
      menu={{
        // @ts-expect-error 等待 antd 修复
        activeKey: menuKey(provider, model),
        className: styles.menu,
        items,
        // 不加限高就会导致面板超长，顶部的内容会被隐藏
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
