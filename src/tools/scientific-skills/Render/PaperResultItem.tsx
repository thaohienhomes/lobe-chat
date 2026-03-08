import { Tag, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { BookOpenIcon, QuoteIcon } from 'lucide-react';
// Use <a> instead of next/link for external URLs (doi.org, pubmed, etc.)
// Next.js <Link> attempts to prefetch external URLs which causes
// "Cannot prefetch" errors in PostHog error tracking
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  authors: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-size: 11px;
    color: ${token.colorTextTertiary};
    text-overflow: ellipsis;
  `,
  container: css`
    cursor: pointer;

    height: 100%;
    padding: 10px 12px;
    border-radius: 8px;

    font-size: 12px;
    color: initial;

    background: ${token.colorFillQuaternary};

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  meta: css`
    font-size: 11px;
    color: ${token.colorTextQuaternary};
  `,
  title: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    color: ${token.colorText};
    text-overflow: ellipsis;
  `,
  venue: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-size: 11px;
    text-overflow: ellipsis;
  `,
}));

export interface PaperResult {
  abstract?: string;
  authors?: string[];
  citationCount?: number;
  doi?: string;
  paperId?: string;
  title: string;
  url?: string;
  venue?: string;
  year?: number;
}

const PaperResultItem = memo<PaperResult>(
  ({ title, authors, year, venue, citationCount, url, doi }) => {
    const { styles } = useStyles();

    const href = url || (doi ? `https://doi.org/${doi}` : undefined);

    const content = (
      <Flexbox className={styles.container} gap={6} justify={'space-between'}>
        <div className={styles.title}>{title}</div>
        {authors && authors.length > 0 && (
          <div className={styles.authors}>{authors.slice(0, 3).join(', ')}{authors.length > 3 ? ' et al.' : ''}</div>
        )}
        <Flexbox align={'center'} gap={6} horizontal wrap={'wrap'}>
          {venue && (
            <Flexbox align={'center'} gap={2} horizontal>
              <BookOpenIcon size={10} />
              <Text className={styles.venue} type={'secondary'}>
                {venue}
              </Text>
            </Flexbox>
          )}
          {year && <Tag size={'small'}>{year}</Tag>}
          {typeof citationCount === 'number' && (
            <Flexbox align={'center'} className={styles.meta} gap={2} horizontal>
              <QuoteIcon size={10} />
              {citationCount}
            </Flexbox>
          )}
        </Flexbox>
      </Flexbox>
    );

    if (href) {
      return (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {content}
        </a>
      );
    }

    return content;
  },
);

PaperResultItem.displayName = 'PaperResultItem';

export default PaperResultItem;
