import { Icon } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { createStyles } from 'antd-style';
import {
  BeakerIcon,
  BookOpenIcon,
  DatabaseIcon,
  DnaIcon,
  FlaskConicalIcon,
  StethoscopeIcon,
} from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { ScientificApiNames } from '../apis';
import PaperResultItem, { PaperResult } from './PaperResultItem';

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  label: css`
    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
  `,
  resultCount: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
  `,
}));

const ITEM_HEIGHT = 100;
const ITEM_WIDTH = 200;

const API_ICONS: Record<string, any> = {
  [ScientificApiNames.checkAlphaFold]: BeakerIcon,
  [ScientificApiNames.fetchUniProt]: DatabaseIcon,
  [ScientificApiNames.queryChEMBL]: FlaskConicalIcon,
  [ScientificApiNames.queryGene]: DnaIcon,
  [ScientificApiNames.searchClinicalTrials]: StethoscopeIcon,
  [ScientificApiNames.searchPubMed]: BookOpenIcon,
};

const API_LABELS: Record<string, string> = {
  [ScientificApiNames.checkAlphaFold]: 'AlphaFold',
  [ScientificApiNames.fetchUniProt]: 'UniProt',
  [ScientificApiNames.queryChEMBL]: 'ChEMBL',
  [ScientificApiNames.queryGene]: 'Gene',
  [ScientificApiNames.searchClinicalTrials]: 'Clinical Trials',
  [ScientificApiNames.searchPubMed]: 'PubMed',
};

interface ScientificResultsProps {
  apiName?: string;
  loading?: boolean;
  papers?: PaperResult[];
  query?: string;
  totalResults?: number;
}

const ScientificResults = memo<ScientificResultsProps>(
  ({ papers, loading, query, totalResults, apiName }) => {
    const { styles } = useStyles();
    const icon = API_ICONS[apiName || ''] || BookOpenIcon;
    const label = API_LABELS[apiName || ''] || 'Search';

    if (loading || !papers) {
      return (
        <Flexbox gap={12}>
          <Flexbox align={'center'} gap={8} horizontal>
            <Icon icon={icon} size={'small'} />
            <span className={styles.label}>{label}</span>
          </Flexbox>
          <Flexbox gap={12} horizontal>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton.Button
                active
                key={i}
                style={{ borderRadius: 8, height: ITEM_HEIGHT, width: ITEM_WIDTH }}
              />
            ))}
          </Flexbox>
        </Flexbox>
      );
    }

    if (papers.length === 0) {
      return (
        <Flexbox align={'center'} gap={8} horizontal>
          <Icon icon={icon} size={'small'} />
          <span className={styles.label}>{label}</span>
          <span className={styles.resultCount}>No results found{query ? ` for "${query}"` : ''}</span>
        </Flexbox>
      );
    }

    return (
      <Flexbox gap={8}>
        <Flexbox align={'center'} gap={8} horizontal>
          <Icon icon={icon} size={'small'} />
          <span className={styles.label}>{label}</span>
          {query && <span className={styles.resultCount}>&quot;{query}&quot;</span>}
          {typeof totalResults === 'number' && (
            <span className={styles.resultCount}>
              {totalResults.toLocaleString()} results
            </span>
          )}
        </Flexbox>
        <Flexbox
          gap={12}
          horizontal
          style={{ minHeight: ITEM_HEIGHT, overflowX: 'auto', width: '100%' }}
        >
          {papers.slice(0, 8).map((paper, idx) => (
            <div key={paper.paperId || paper.doi || idx} style={{ minWidth: ITEM_WIDTH, width: ITEM_WIDTH }}>
              <PaperResultItem {...paper} />
            </div>
          ))}
        </Flexbox>
      </Flexbox>
    );
  },
);

ScientificResults.displayName = 'ScientificResults';

export default ScientificResults;
