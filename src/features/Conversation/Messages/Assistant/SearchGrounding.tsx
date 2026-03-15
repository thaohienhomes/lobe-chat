'use client';

import { type CitationItem, type GroundingSearch } from '@lobechat/types';
import { Icon, Tag, Tooltip } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronRight, Globe, Search } from 'lucide-react';
import Image from 'next/image';
import { rgba } from 'polished';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import AcademicCitationCard from './AcademicCitationCard';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  citationLink: css`
    overflow: hidden;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 10px;
    border-radius: 8px;

    color: ${token.colorTextSecondary};

    text-decoration: none;

    background: ${isDarkMode ? token.colorFillQuaternary : token.colorFillTertiary};
    transition: background 0.15s;

    &:hover {
      background: ${isDarkMode ? token.colorFillTertiary : token.colorFill};
    }
  `,
  citationTitle: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-size: 12px;
    text-overflow: ellipsis;
  `,
  container: css`
    width: fit-content;
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 6px;

    color: ${token.colorTextTertiary};

    &:hover {
      background: ${isDarkMode ? token.colorFillQuaternary : token.colorFillTertiary};
    }
  `,
  expand: css`
    background: ${isDarkMode ? token.colorFillQuaternary : token.colorFillTertiary} !important;
  `,
  finishedIcon: css`
    color: ${token.colorSuccess};
  `,
  searchIcon: css`
    color: ${token.colorTextTertiary};
    flex-shrink: 0;
  `,
  stepLabel: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  timeline: css`
    position: relative;
    padding-inline-start: 16px;

    &::before {
      content: '';
      position: absolute;
      inset-block: 4px;
      inset-inline-start: 0;
      width: 2px;
      background: ${isDarkMode
        ? `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorSuccess})`
        : `linear-gradient(to bottom, ${token.colorPrimaryBorder}, ${token.colorSuccessBorder})`};
      border-radius: 1px;
    }
  `,
  timelineStep: css`
    position: relative;
    padding-block: 4px;
  `,
  title: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-size: 12px;
    text-overflow: ellipsis;
  `,
}));

const WebCitationItem = memo<{ citation: CitationItem; styles: ReturnType<typeof useStyles>['styles'] }>(
  ({ citation, styles }) => {
    const domain = new URL(citation.url).host;
    return (
      <a
        className={styles.citationLink}
        href={citation.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image
          alt={citation.title || domain}
          height={14}
          src={citation.favicon || `https://icons.duckduckgo.com/ip3/${domain}.ico`}
          style={{ borderRadius: 3, flexShrink: 0 }}
          unoptimized
          width={14}
        />
        <span className={styles.citationTitle}>{citation.title || domain}</span>
      </a>
    );
  },
);

const SearchGrounding = memo<GroundingSearch>(({ searchQueries, citations }) => {
  const { t } = useTranslation('chat');
  const { styles, cx, theme } = useStyles();

  const [showDetail, setShowDetail] = useState(false);

  const academicCitations = citations?.filter((c: CitationItem) => c.citationType === 'academic');
  const webCitations = citations?.filter((c: CitationItem) => c.citationType !== 'academic');
  const isAllAcademic = academicCitations?.length === citations?.length && !!citations?.length;
  const citationCount = citations?.length || 0;

  return (
    <Flexbox
      className={cx(styles.container, showDetail && styles.expand)}
      gap={16}
      style={{ width: showDetail ? '100%' : undefined }}
    >
      {/* Clickable header */}
      <Flexbox
        distribution={'space-between'}
        flex={1}
        gap={8}
        horizontal
        onClick={() => {
          setShowDetail(!showDetail);
        }}
        style={{ cursor: 'pointer' }}
      >
        <Flexbox align={'center'} gap={8} horizontal>
          <Icon icon={Globe} />
          <Flexbox horizontal>
            {isAllAcademic
              ? t('search.grounding.academicTitle')
              : t('search.grounding.title', { count: citationCount })}
          </Flexbox>
          {!showDetail && (
            <Flexbox horizontal>
              {citations?.slice(0, 8).map((item: CitationItem, index: number) => {
                const domain = new URL(item.url).host;
                return (
                  <Tooltip
                    key={`${item.url}-${index}`}
                    title={
                      <Flexbox gap={4} style={{ maxWidth: 280 }}>
                        <div className={styles.title} style={{ fontWeight: 500 }}>
                          {item.title || domain}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                          {domain}
                        </div>
                      </Flexbox>
                    }
                  >
                    <Image
                      alt={item.title || item.url}
                      height={16}
                      src={item.favicon || `https://icons.duckduckgo.com/ip3/${domain}.ico`}
                      style={{
                        background: theme.colorBgContainer,
                        borderRadius: 8,
                        cursor: 'pointer',
                        marginInline: -2,
                        padding: 2,
                        zIndex: 100 - index,
                      }}
                      unoptimized
                      width={16}
                    />
                  </Tooltip>
                );
              })}
            </Flexbox>
          )}
        </Flexbox>

        <Flexbox gap={4} horizontal>
          <Icon icon={showDetail ? ChevronDown : ChevronRight} />
        </Flexbox>
      </Flexbox>

      {/* Expanded detail with left-border timeline */}
      <AnimatePresence initial={false}>
        {showDetail && (
          <motion.div
            animate="open"
            exit="collapsed"
            initial="collapsed"
            style={{ overflow: 'hidden', width: '100%' }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            variants={{
              collapsed: { height: 0, opacity: 0, width: 'auto' },
              open: { height: 'auto', opacity: 1, width: 'auto' },
            }}
          >
            {/* Left-border timeline showing search flow */}
            <div className={styles.timeline}>
              {/* Step 1: Searching queries */}
              {searchQueries && searchQueries.length > 0 && (
                <div className={styles.timelineStep}>
                  <Flexbox align={'center'} gap={6} horizontal>
                    <Icon className={styles.searchIcon} icon={Search} size={12} />
                    <span className={styles.stepLabel}>
                      {t('search.grounding.searching')}
                    </span>
                  </Flexbox>
                  <Flexbox gap={4} horizontal style={{ flexWrap: 'wrap', marginBlockStart: 4 }}>
                    {searchQueries.map((query: string, index: number) => (
                      <Tag key={index}>{query}</Tag>
                    ))}
                  </Flexbox>
                </div>
              )}

              {/* Step 2: Sources found */}
              {citationCount > 0 && (
                <div className={styles.timelineStep} style={{ marginBlockStart: 8 }}>
                  <Flexbox align={'center'} gap={6} horizontal>
                    <Icon className={styles.searchIcon} icon={Globe} size={12} />
                    <span className={styles.stepLabel}>
                      {t('search.grounding.sourcesFound', { count: citationCount })}
                    </span>
                  </Flexbox>
                  <Flexbox gap={8} style={{ marginBlockStart: 8 }}>
                    {/* Academic citations */}
                    {academicCitations && academicCitations.length > 0 && (
                      <Flexbox gap={8} horizontal wrap={'wrap'}>
                        {academicCitations.map((citation: CitationItem, index: number) => (
                          <AcademicCitationCard citation={citation} key={index} />
                        ))}
                      </Flexbox>
                    )}
                    {/* Web citations */}
                    {webCitations && webCitations.length > 0 && (
                      <Flexbox gap={6} style={{ maxWidth: 480 }}>
                        {webCitations.map((citation: CitationItem, index: number) => (
                          <WebCitationItem citation={citation} key={index} styles={styles} />
                        ))}
                      </Flexbox>
                    )}
                  </Flexbox>
                </div>
              )}

              {/* Step 3: Finished */}
              <div className={styles.timelineStep} style={{ marginBlockStart: 8 }}>
                <Flexbox align={'center'} gap={6} horizontal>
                  <Icon className={styles.finishedIcon} icon={CheckCircle2} size={12} />
                  <span className={styles.stepLabel} style={{ color: theme.colorSuccess }}>
                    {t('search.grounding.finished')}
                  </span>
                </Flexbox>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Flexbox>
  );
});

export default SearchGrounding;
