'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Copy, GraduationCap, Link2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { CitationItem } from '@/types/search';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  container: css`
    margin-block-start: 16px;
    padding-block-start: 12px;
    border-block-start: 1px solid ${token.colorBorderSecondary};
  `,
  item: css`
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: ${isDarkMode ? token.colorFillQuaternary : token.colorFillTertiary};
    }
  `,
  reference: css`
    font-size: 13px;
    line-height: 1.6;
    color: ${token.colorTextSecondary};
  `,
  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
}));

const formatIEEE = (c: CitationItem) => {
  const authors = c.authors?.join(', ') || 'Anon.';
  const title = c.title || 'Untitled';
  const journal = c.journal ? `*${c.journal}*, ` : '';
  const year = c.year ? `${c.year}. ` : '';
  const doi = c.doi ? `DOI: ${c.doi}` : '';
  return `${authors}, "${title}," ${journal}${year}${doi}`;
};

interface BibliographySectionProps {
  citations?: CitationItem[];
}

const BibliographySection = memo<BibliographySectionProps>(({ citations }) => {
  const { t } = useTranslation('chat');
  const { styles } = useStyles();

  const academicCitations = citations?.filter((c) => c.citationType === 'academic');

  if (!academicCitations || academicCitations.length === 0) return null;

  const copyAll = () => {
    const text = academicCitations.map((c, i) => `[${i + 1}] ${formatIEEE(c)}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <Flexbox className={styles.container} gap={12}>
      <Flexbox align={'center'} distribution={'space-between'} horizontal>
        <Flexbox align={'center'} gap={8} horizontal>
          <Icon icon={GraduationCap} />
          <div className={styles.title}>
            {t('search.academic.references', { defaultValue: 'References' })}
          </div>
        </Flexbox>
        <ActionIcon icon={Copy} onClick={copyAll} size={'small'} title={t('copyAll')} />
      </Flexbox>

      <Flexbox gap={4}>
        {academicCitations.map((citation, index) => (
          <Flexbox align={'flex-start'} className={styles.item} gap={8} horizontal key={index}>
            <div className={styles.reference}>[{index + 1}]</div>
            <Flexbox flex={1} gap={4}>
              <div className={styles.reference}>{formatIEEE(citation)}</div>
              <Flexbox align={'center'} gap={4} horizontal>
                <ActionIcon
                  icon={Link2}
                  onClick={() => window.open(citation.url, '_blank')}
                  size={'small'}
                />
              </Flexbox>
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

export default BibliographySection;
