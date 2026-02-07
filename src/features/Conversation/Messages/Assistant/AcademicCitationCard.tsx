'use client';

import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { BookOpen, Calendar, Quote, User } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { CitationItem } from '@/types/search';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  author: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  card: css`
    cursor: pointer;

    width: 280px;
    padding: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    background: ${token.colorBgContainer};

    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: ${token.colorInfoHover};
      background: ${isDarkMode ? token.colorFillTertiary : token.colorFillQuaternary};
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
  doi: css`
    font-size: 11px;
    color: ${token.colorTextQuaternary};
  `,
  journal: css`
    font-size: 12px;
    font-style: italic;
    color: ${token.colorInfoText};
  `,
  title: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    text-overflow: ellipsis;
  `,
}));

interface AcademicCitationCardProps {
  citation: CitationItem;
}

const AcademicCitationCard = memo<AcademicCitationCardProps>(({ citation }) => {
  const { styles } = useStyles();

  return (
    <Flexbox
      className={styles.card}
      gap={8}
      onClick={() => {
        window.open(citation.url, '_blank');
      }}
    >
      <Flexbox align={'flex-start'} gap={4} horizontal>
        <Icon icon={BookOpen} size={'small'} />
        <div className={styles.title}>{citation.title}</div>
      </Flexbox>

      <Flexbox gap={4}>
        {citation.authors && citation.authors.length > 0 && (
          <Flexbox align={'center'} gap={4} horizontal>
            <Icon icon={User} size={'small'} />
            <div className={styles.author}>{citation.authors.join(', ')}</div>
          </Flexbox>
        )}

        <Flexbox align={'center'} distribution={'space-between'} gap={8} horizontal>
          {citation.journal && <div className={styles.journal}>{citation.journal}</div>}
          {citation.year && (
            <Flexbox align={'center'} gap={4} horizontal>
              <Icon icon={Calendar} size={'small'} />
              <div className={styles.author}>{citation.year}</div>
            </Flexbox>
          )}
        </Flexbox>

        {citation.doi && (
          <Flexbox align={'center'} gap={4} horizontal>
            <Icon icon={Quote} size={'small'} />
            <div className={styles.doi}>DOI: {citation.doi}</div>
          </Flexbox>
        )}
      </Flexbox>
    </Flexbox>
  );
});

export default AcademicCitationCard;
