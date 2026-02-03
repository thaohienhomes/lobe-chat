'use client';

import { Button } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { PROFESSION_CATEGORIES, type ProfessionId } from './professions';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    cursor: pointer;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding-block: 16px;
    padding-inline: 12px;
    border: 2px solid ${token.colorBorderSecondary};
    border-radius: 12px;

    font-size: 13px;
    text-align: center;

    background: ${token.colorBgContainer};

    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  cardSelected: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  container: css`
    padding: 24px;
  `,
  footer: css`
    display: flex;
    gap: 12px;
    justify-content: center;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-block-end: 24px;

    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
  `,
  icon: css`
    margin-block-end: 8px;
    font-size: 28px;
  `,
  label: css`
    font-weight: 500;
    line-height: 1.3;
  `,
  subtitle: css`
    margin-block: 0 32px;
    margin-inline: 0;

    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
  title: css`
    margin-block: 0 8px;
    margin-inline: 0;

    font-size: 24px;
    font-weight: 600;
    text-align: center;
  `,
}));

interface ProfessionSelectProps {
  loading?: boolean;
  onComplete: (profession: string) => void;
  onSkip: () => void;
}

const ProfessionSelect = memo<ProfessionSelectProps>(({ loading, onComplete, onSkip }) => {
  const { styles, cx } = useStyles();
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState<ProfessionId | null>(null);

  const lang = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  const handleContinue = () => {
    if (selected) {
      onComplete(selected);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {lang === 'vi' ? '🎉 Chào mừng đến với Phở Chat!' : '🎉 Welcome to Phở Chat!'}
      </h2>
      <p className={styles.subtitle}>
        {lang === 'vi'
          ? 'Hãy cho chúng tôi biết về bạn để được gợi ý tốt hơn'
          : 'Tell us about yourself for personalized recommendations'}
      </p>

      <div className={styles.grid}>
        {PROFESSION_CATEGORIES.map((profession) => (
          <div
            className={cx(styles.card, selected === profession.id && styles.cardSelected)}
            key={profession.id}
            onClick={() => setSelected(profession.id)}
            style={{
              borderColor: selected === profession.id ? profession.color : undefined,
            }}
          >
            <span className={styles.icon}>{profession.icon}</span>
            <span className={styles.label}>{profession.label[lang]}</span>
          </div>
        ))}
      </div>

      <Flexbox className={styles.footer}>
        <Button disabled={loading} onClick={onSkip} type="text">
          {lang === 'vi' ? 'Bỏ qua' : 'Skip'}
        </Button>
        <Button disabled={!selected} loading={loading} onClick={handleContinue} type="primary">
          {lang === 'vi' ? 'Tiếp tục' : 'Continue'}
        </Button>
      </Flexbox>
    </div>
  );
});

ProfessionSelect.displayName = 'ProfessionSelect';

export default ProfessionSelect;
