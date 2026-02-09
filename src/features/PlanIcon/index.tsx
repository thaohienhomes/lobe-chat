import { Icon } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStyles } from 'antd-style';
import { Atom, Box, CircleSlash, Crown, Heart, Sparkle, Star, Zap } from 'lucide-react';
import { CSSProperties, MouseEvent, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { getPlanByCode } from '@/config/pricing';

// Theme configuration for plan display
interface PlanTheme {
  icon: typeof CircleSlash;
  theme: {
    background?: string;
    color?: string;
  };
}

// Plan themes (alphabetically sorted for lint compliance)
export const themes: Record<string, PlanTheme> = {
  free: {
    icon: CircleSlash,
    theme: { background: undefined, color: undefined },
  },
  gl_lifetime: {
    icon: Crown,
    theme: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#FFFACD' },
  },
  gl_premium: {
    icon: Atom,
    theme: { background: 'linear-gradient(45deg, #F7A82F, #BB7227)', color: '#FCFA6E' },
  },
  gl_standard: {
    icon: Zap,
    theme: { background: 'linear-gradient(45deg, #A5B4C2, #606E7B)', color: '#FCFDFF' },
  },
  gl_starter: {
    icon: Sparkle,
    theme: { background: 'linear-gradient(45deg, #C57948, #803718)', color: '#FFC385' },
  },
  hobby: {
    icon: Box,
    theme: { background: 'linear-gradient(45deg, #21B2EE, #2271ED)', color: '#E5F8FF' },
  },
  lifetime_early_bird: {
    icon: Crown,
    theme: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#FFFACD' },
  },
  lifetime_last_call: {
    icon: Crown,
    theme: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#FFFACD' },
  },
  lifetime_standard: {
    icon: Crown,
    theme: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#FFFACD' },
  },
  // Medical Beta — premium teal-green medical theme
  medical_beta: {
    icon: Heart,
    theme: { background: 'linear-gradient(135deg, #00C9A7, #0891B2)', color: '#ECFDF5' },
  },
  premium: {
    icon: Zap,
    theme: { background: 'linear-gradient(45deg, #A5B4C2, #606E7B)', color: '#FCFDFF' },
  },
  starter: {
    icon: Sparkle,
    theme: { background: 'linear-gradient(45deg, #C57948, #803718)', color: '#FFC385' },
  },
  ultimate: {
    icon: Atom,
    theme: { background: 'linear-gradient(45deg, #F7A82F, #BB7227)', color: '#FCFA6E' },
  },
  vn_basic: {
    icon: Box,
    theme: { background: 'linear-gradient(45deg, #21B2EE, #2271ED)', color: '#E5F8FF' },
  },
  vn_free: {
    icon: CircleSlash,
    theme: { background: undefined, color: undefined },
  },
  vn_pro: {
    icon: Zap,
    theme: { background: 'linear-gradient(45deg, #A5B4C2, #606E7B)', color: '#FCFDFF' },
  },
  vn_team: {
    icon: Star,
    theme: { background: 'linear-gradient(45deg, #F7A82F, #BB7227)', color: '#FCFA6E' },
  },
  // Ultimate tier
  vn_ultimate: {
    icon: Crown,
    theme: { background: 'linear-gradient(135deg, #FFD700, #F59E0B)', color: '#FFFBEB' },
  },
};

// Get theme for a plan code, with fallback to free tier
const getThemeForPlan = (planCode: string): PlanTheme => {
  return themes[planCode] || themes['free'];
};

const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    flex: none;
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: 0 0 0 1px ${token.colorFillSecondary};
  `,
}));

interface PlanIconProps {
  className?: string;
  mono?: boolean;
  onClick?: (e: MouseEvent) => void;
  /**
   * Plan code (e.g., 'vn_free', 'vn_pro', 'gl_lifetime')
   */
  plan: string;
  size?: number;
  style?: CSSProperties;
  type?: 'icon' | 'tag' | 'combine';
}

const PlanIcon = memo<PlanIconProps>(
  ({ type = 'icon', plan, size = 36, mono, style, className, onClick }) => {
    const planConfig = getPlanByCode(plan);
    const { icon, theme } = getThemeForPlan(plan);
    const { cx, styles, theme: token } = useStyles();
    const { t } = useTranslation('subscription');
    const isTag = type === 'tag';
    const isCombine = type === 'combine';
    const isFree = plan === 'free' || plan === 'vn_free';

    // Use displayName from pricing config, fallback to translation
    const displayName = planConfig?.displayName || t(`plans.plan.${plan}.title`, plan);

    if (isTag) {
      return (
        <Tag
          bordered={false}
          className={className}
          onClick={onClick}
          style={{
            ...(theme || { background: token.colorFillSecondary, color: token.colorText }),
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            flex: 'none',
            margin: 0,
            ...style,
          }}
        >
          {displayName}
        </Tag>
      );
    }

    const iconContent = (
      <Center
        className={cx(styles.icon, className)}
        height={size}
        onClick={onClick}
        style={
          mono
            ? style
            : { ...theme, border: isFree ? undefined : `2px solid ${theme.color}`, ...style }
        }
        width={size}
      >
        <Icon color={mono ? undefined : theme.color} icon={icon} size={size / 2} />
      </Center>
    );

    if (isCombine) {
      return (
        <Flexbox align={'center'} gap={8} horizontal>
          {iconContent}
          <span>{displayName}</span>
        </Flexbox>
      );
    }

    return iconContent;
  },
);

export default PlanIcon;
