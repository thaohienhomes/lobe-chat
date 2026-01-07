import { ChatModelCard } from '@lobechat/types';
import { IconAvatarProps, ModelIcon, ProviderIcon } from '@lobehub/icons';
import { Avatar, Icon, Tag, Text, Tooltip } from '@lobehub/ui';
import { createStyles, useResponsive } from 'antd-style';
import {
  Infinity,
  AtomIcon,
  Crown,
  Lock,
  LucideEye,
  LucideGlobe,
  LucideImage,
  LucidePaperclip,
  Sparkles,
  ToyBrick,
  Video,
} from 'lucide-react';
import { ModelAbilities } from 'model-bank';
import numeral from 'numeral';
import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { getModelTier } from '@/config/pricing';
import { usePricingGeo } from '@/hooks/usePricingGeo';
import { AiProviderSourceType } from '@/types/aiProvider';
import { formatTokenNumber } from '@/utils/format';

export const TAG_CLASSNAME = 'lobe-model-info-tags';

/**
 * Get tier info with T3.chat-inspired styling
 * - Tier 1 (Free): Green - available to all
 * - Tier 2 (Pro): Gradient pink/purple - requires Phở Tái
 * - Tier 3 (Premium): Gold gradient - requires Phở Đặc Biệt
 */
const getTierInfo = (tier: number) => {
  switch (tier) {
    case 1: {
      return {
        bgColor: 'rgba(82, 196, 26, 0.15)',
        borderColor: 'transparent',
        color: '#52c41a',
        icon: Sparkles,
        label: 'Free',
        textColor: '#52c41a',
      };
    }
    case 2: {
      return {
        bgColor:
          'linear-gradient(135deg, rgba(255, 64, 129, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
        borderColor: 'rgba(255, 64, 129, 0.3)',
        color: '#ff4081',
        icon: Sparkles,
        label: 'PRO',
        textColor: '#ff4081',
      };
    }
    case 3: {
      return {
        bgColor: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%)',
        borderColor: 'rgba(255, 193, 7, 0.3)',
        color: '#ffc107',
        icon: Crown,
        label: 'MAX',
        textColor: '#ffc107',
      };
    }
    default: {
      return {
        bgColor: 'rgba(82, 196, 26, 0.15)',
        borderColor: 'transparent',
        color: '#52c41a',
        icon: Sparkles,
        label: 'Free',
        textColor: '#52c41a',
      };
    }
  }
};

/**
 * Model Tier Badge Component - T3.chat inspired
 */
interface ModelTierBadgeProps {
  modelId: string;
  size?: 'small' | 'default';
}

export const ModelTierBadge = memo<ModelTierBadgeProps>(({ modelId, size = 'small' }) => {
  const tier = getModelTier(modelId);
  const { icon: TierIcon, label, bgColor, borderColor, textColor } = getTierInfo(tier);
  const { isVietnam } = usePricingGeo();

  // Don't show badge for Tier 1 (free) models to reduce visual clutter
  if (tier === 1) {
    return null;
  }

  const tierDescriptions: Record<number, string> = isVietnam
    ? {
        1: 'Miễn phí - Có sẵn cho tất cả',
        2: 'PRO - Yêu cầu gói Phở Tái',
        3: 'MAX - Yêu cầu gói Phở Đặc Biệt',
      }
    : {
        1: 'Free - Available to all',
        2: 'PRO - Requires Starter plan',
        3: 'MAX - Requires Premium plan',
      };

  return (
    <Tooltip title={tierDescriptions[tier] || ''}>
      <div
        style={{
          alignItems: 'center',
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
          color: textColor,
          display: 'inline-flex',
          fontSize: size === 'small' ? '10px' : '11px',
          fontWeight: 600,
          gap: '3px',
          height: size === 'small' ? '18px' : '20px',
          padding: size === 'small' ? '0 5px' : '0 6px',
        }}
      >
        <TierIcon size={size === 'small' ? 10 : 12} />
        {label}
      </div>
    </Tooltip>
  );
});

/**
 * Locked Badge for disabled models
 */
const useStyles = createStyles(({ css, token }) => ({
  tag: css`
    cursor: default;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 20px !important;
    height: 20px;
    border-radius: 4px;
  `,
  token: css`
    width: 36px !important;
    height: 20px;
    border-radius: 4px;

    font-family: ${token.fontFamilyCode};
    font-size: 11px;
    color: ${token.colorTextSecondary};

    background: ${token.colorFillTertiary};
  `,
}));

export const LockedBadge = memo(() => {
  const { theme } = useStyles();

  return (
    <div
      style={{
        alignItems: 'center',
        background: theme.colorFillTertiary,
        border: `1px solid ${theme.colorBorderSecondary}`,
        borderRadius: '4px',
        color: theme.colorTextQuaternary,
        display: 'inline-flex',
        fontSize: '10px',
        fontWeight: 500,
        gap: '2px',
        height: '18px',
        padding: '0 5px',
      }}
    >
      <Lock size={10} />
    </div>
  );
});

interface ModelInfoTagsProps extends ModelAbilities {
  contextWindowTokens?: number | null;
  directionReverse?: boolean;
  isCustom?: boolean;
  isLocked?: boolean;
  placement?: 'top' | 'right';
}

export const ModelInfoTags = memo<ModelInfoTagsProps>(
  ({ directionReverse, placement = 'right', isLocked = false, ...model }) => {
    const { t } = useTranslation('components');
    const { styles } = useStyles();

    // Reduce opacity for locked models
    const style = isLocked ? { opacity: 0.4 } : {};

    return (
      <Flexbox
        className={TAG_CLASSNAME}
        direction={directionReverse ? 'horizontal-reverse' : 'horizontal'}
        gap={4}
        style={style}
        width={'fit-content'}
      >
        {model.files && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.file')}
          >
            <Tag className={styles.tag} color={'success'} size={'small'}>
              <Icon icon={LucidePaperclip} />
            </Tag>
          </Tooltip>
        )}
        {model.imageOutput && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.imageOutput')}
          >
            <Tag className={styles.tag} color={'success'} size={'small'}>
              <Icon icon={LucideImage} />
            </Tag>
          </Tooltip>
        )}
        {model.vision && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.vision')}
          >
            <Tag className={styles.tag} color={'success'} size={'small'}>
              <Icon icon={LucideEye} />
            </Tag>
          </Tooltip>
        )}
        {model.video && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.video')}
          >
            <Tag className={styles.tag} color={'magenta'} size={'small'}>
              <Icon icon={Video} />
            </Tag>
          </Tooltip>
        )}
        {model.functionCall && (
          <Tooltip
            placement={placement}
            styles={{
              root: { maxWidth: 'unset', pointerEvents: 'none' },
            }}
            title={t('ModelSelect.featureTag.functionCall')}
          >
            <Tag className={styles.tag} color={'info'} size={'small'}>
              <Icon icon={ToyBrick} />
            </Tag>
          </Tooltip>
        )}
        {model.reasoning && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.reasoning')}
          >
            <Tag className={styles.tag} color={'purple'} size={'small'}>
              <Icon icon={AtomIcon} />
            </Tag>
          </Tooltip>
        )}
        {model.search && (
          <Tooltip
            placement={placement}
            styles={{ root: { pointerEvents: 'none' } }}
            title={t('ModelSelect.featureTag.search')}
          >
            <Tag className={styles.tag} color={'cyan'} size={'small'}>
              <Icon icon={LucideGlobe} />
            </Tag>
          </Tooltip>
        )}
        {typeof model.contextWindowTokens === 'number' && (
          <Tooltip
            placement={placement}
            styles={{
              root: { maxWidth: 'unset', pointerEvents: 'none' },
            }}
            title={t('ModelSelect.featureTag.tokens', {
              tokens:
                model.contextWindowTokens === 0
                  ? '∞'
                  : numeral(model.contextWindowTokens).format('0,0'),
            })}
          >
            <Tag className={styles.token} size={'small'}>
              {model.contextWindowTokens === 0 ? (
                <Infinity size={17} strokeWidth={1.6} />
              ) : (
                formatTokenNumber(model.contextWindowTokens as number)
              )}
            </Tag>
          </Tooltip>
        )}
      </Flexbox>
    );
  },
);

interface ModelItemRenderProps extends ChatModelCard {
  isLocked?: boolean;
  showInfoTag?: boolean;
  showTierBadge?: boolean;
}

export const ModelItemRender = memo<ModelItemRenderProps>(
  ({ showInfoTag = true, showTierBadge = true, isLocked = false, ...model }) => {
    const { mobile } = useResponsive();
    const { theme } = useStyles();

    return (
      <Flexbox
        align={'center'}
        gap={32}
        horizontal
        justify={'space-between'}
        style={{
          cursor: isLocked ? 'not-allowed' : 'pointer',
          minWidth: mobile ? '100%' : undefined,
          // Parent controls opacity for disabled items to avoid double dimming
          opacity: 1,
          overflow: 'hidden',
          position: 'relative',
          width: mobile ? '80vw' : 'auto',
        }}
      >
        <Flexbox
          align={'center'}
          gap={8}
          horizontal
          style={{
            // Parent controls filter for disabled items
            filter: 'none',
            flexShrink: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <ModelIcon model={model.id} size={20} />
          <Text
            style={{
              color: isLocked ? theme.colorTextDisabled : 'inherit',
              fontWeight: isLocked ? 400 : 500,
              ...(mobile ? { maxWidth: '60vw', overflowX: 'auto', whiteSpace: 'nowrap' } : {}),
            }}
          >
            {model.displayName || model.id}
          </Text>
          {showTierBadge && <ModelTierBadge modelId={model.id} />}
          {isLocked && <LockedBadge />}
        </Flexbox>
        {showInfoTag && <ModelInfoTags {...model} isLocked={isLocked} />}
      </Flexbox>
    );
  },
);

interface ProviderItemRenderProps {
  logo?: string;
  name: string;
  provider: string;
  source?: AiProviderSourceType;
}

export const ProviderItemRender = memo<ProviderItemRenderProps>(
  ({ provider, name, source, logo }) => {
    return (
      <Flexbox align={'center'} gap={4} horizontal>
        {source === 'custom' && !!logo ? (
          <Avatar avatar={logo} size={20} style={{ filter: 'grayscale(1)' }} title={name} />
        ) : (
          <ProviderIcon provider={provider} size={20} type={'mono'} />
        )}
        {name}
      </Flexbox>
    );
  },
);

interface LabelRendererProps {
  Icon: FC<IconAvatarProps>;
  label: string;
}

export const LabelRenderer = memo<LabelRendererProps>(({ Icon, label }) => (
  <Flexbox align={'center'} gap={8} horizontal>
    <Icon size={20} />
    <span>{label}</span>
  </Flexbox>
));
