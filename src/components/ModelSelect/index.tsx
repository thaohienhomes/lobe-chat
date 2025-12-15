import { ChatModelCard } from '@lobechat/types';
import { IconAvatarProps, ModelIcon, ProviderIcon } from '@lobehub/icons';
import { Avatar, Icon, Tag, Text, Tooltip } from '@lobehub/ui';
import { createStyles, useResponsive } from 'antd-style';
import {
  Infinity,
  AtomIcon,
  LucideEye,
  LucideGlobe,
  LucideImage,
  LucidePaperclip,
  ToyBrick,
  Video,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { ModelAbilities } from 'model-bank';
import numeral from 'numeral';
import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { getModelTier } from '@/config/pricing';
import { AiProviderSourceType } from '@/types/aiProvider';
import { formatTokenNumber } from '@/utils/format';

export const TAG_CLASSNAME = 'lobe-model-info-tags';

/**
 * Get tier icon and color for model tier
 */
const getTierInfo = (tier: number) => {
  switch (tier) {
    case 1: {
      return { color: '#52c41a', icon: Zap, label: 'Tier 1' };
    } // Green for budget models
    case 2: {
      return { color: '#1890ff', icon: Star, label: 'Tier 2' };
    } // Blue for standard models
    case 3: {
      return { color: '#faad14', icon: Crown, label: 'Tier 3' };
    } // Gold for premium models
    default: {
      return { color: '#52c41a', icon: Zap, label: 'Tier 1' };
    }
  }
};

/**
 * Model Tier Badge Component
 */
interface ModelTierBadgeProps {
  modelId: string;
  size?: 'small' | 'default';
}

const ModelTierBadge = memo<ModelTierBadgeProps>(({ modelId, size = 'small' }) => {
  const tier = getModelTier(modelId);
  const { icon: TierIcon, color, label } = getTierInfo(tier);

  return (
    <Tooltip title={`${label} - ${tier === 1 ? 'Budget' : tier === 2 ? 'Standard' : 'Premium'} model`}>
      <Tag
        color={color}
        icon={<TierIcon size={12} />}
        style={{
          alignItems: 'center',
          display: 'inline-flex',
          fontSize: size === 'small' ? '10px' : '12px',
          gap: '2px',
          height: size === 'small' ? '18px' : '22px',
          lineHeight: size === 'small' ? '16px' : '20px',
          padding: size === 'small' ? '0 4px' : '2px 6px',
        }}
      >
        T{tier}
      </Tag>
    </Tooltip>
  );
});

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

interface ModelInfoTagsProps extends ModelAbilities {
  contextWindowTokens?: number | null;
  directionReverse?: boolean;
  isCustom?: boolean;
  placement?: 'top' | 'right';
}

export const ModelInfoTags = memo<ModelInfoTagsProps>(
  ({ directionReverse, placement = 'right', ...model }) => {
    const { t } = useTranslation('components');
    const { styles } = useStyles();

    return (
      <Flexbox
        className={TAG_CLASSNAME}
        direction={directionReverse ? 'horizontal-reverse' : 'horizontal'}
        gap={4}
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
  showInfoTag?: boolean;
  showTierBadge?: boolean;
}

export const ModelItemRender = memo<ModelItemRenderProps>(({
  showInfoTag = true,
  showTierBadge = true,
  ...model
}) => {
  const { mobile } = useResponsive();
  return (
    <Flexbox
      align={'center'}
      gap={32}
      horizontal
      justify={'space-between'}
      style={{
        minWidth: mobile ? '100%' : undefined,
        overflow: 'hidden',
        position: 'relative',
        width: mobile ? '80vw' : 'auto',
      }}
    >
      <Flexbox
        align={'center'}
        gap={8}
        horizontal
        style={{ flexShrink: 1, minWidth: 0, overflow: 'hidden' }}
      >
        <ModelIcon model={model.id} size={20} />
        <Text style={mobile ? { maxWidth: '60vw', overflowX: 'auto', whiteSpace: 'nowrap' } : {}}>
          {model.displayName || model.id}
        </Text>
        {showTierBadge && <ModelTierBadge modelId={model.id} />}
      </Flexbox>
      {showInfoTag && <ModelInfoTags {...model} />}
    </Flexbox>
  );
});

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
