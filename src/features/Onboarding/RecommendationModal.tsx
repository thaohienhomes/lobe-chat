'use client';

import { Icon } from '@lobehub/ui';
import { Checkbox, Divider, Radio, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { Bot, Cpu, Puzzle, Sparkles } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { type RecommendationSelections, getAggregatedRecommendations } from './professions';

// Helper function to toggle item in array
const toggleItem = <T extends string>(
  item: T,
  selected: T[],
  setSelected: React.Dispatch<React.SetStateAction<T[]>>,
) => {
  if (selected.includes(item)) {
    setSelected(selected.filter((i) => i !== item));
  } else {
    setSelected([...selected, item]);
  }
};

const useStyles = createStyles(({ css, token }) => ({
  btn: css`
    cursor: pointer;

    padding-block: 10px;
    padding-inline: 24px;
    border-radius: 8px;

    font-weight: 500;

    transition: all 0.2s ease;
  `,
  btnPrimary: css`
    border: none;
    color: white;
    background: ${token.colorPrimary};

    &:hover {
      background: ${token.colorPrimaryHover};
    }

    &:disabled {
      cursor: not-allowed;
      background: ${token.colorPrimaryBg};
      color: ${token.colorTextDisabled};
    }
  `,
  btnLoading: css`
    display: inline-flex;
    gap: 8px;
    align-items: center;

    background: ${token.colorPrimary};
    color: white;
    cursor: wait;
  `,
  btnSecondary: css`
    border: 1px solid ${token.colorBorderSecondary};
    color: ${token.colorTextSecondary};
    background: transparent;

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
  btnText: css`
    border: none;
    color: ${token.colorTextSecondary};
    background: transparent;

    &:hover {
      color: ${token.colorText};
    }
  `,
  container: css`
    overflow-y: auto;
    max-height: 70vh;
    padding: 24px;
  `,
  empty: css`
    font-size: 13px;
    font-style: italic;
    color: ${token.colorTextTertiary};
  `,
  footer: css`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-block-start: 24px;
  `,
  item: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 10px;
    padding-inline: 14px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    background: ${token.colorBgContainer};

    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  itemGrid: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  itemLabel: css`
    font-size: 13px;
    font-weight: 500;
  `,
  itemSelected: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  section: css`
    margin-block-end: 20px;
  `,
  sectionHeader: css`
    display: flex;
    gap: 8px;
    align-items: center;

    margin-block-end: 12px;

    font-size: 15px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
  subtitle: css`
    margin-block: 0 24px;
    margin-inline: 0;

    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
  title: css`
    margin-block: 0 8px;
    margin-inline: 0;

    font-size: 22px;
    font-weight: 600;
    text-align: center;
  `,
}));

// Display names for agents, models, features
const AGENT_NAMES: Record<string, { en: string; vi: string }> = {
  'artifact-creator': { en: 'Artifact Creator', vi: 'Tạo Artifact' },
  'biomedical-research-assistant': { en: 'Biomedical Research', vi: 'Nghiên cứu Y sinh' },
  'clinical-literature-reviewer': { en: 'Clinical Literature', vi: 'Phân tích Y văn' },
  'code-reviewer': { en: 'Code Reviewer', vi: 'Review Code' },
  'content-writer': { en: 'Content Writer', vi: 'Viết nội dung' },
  'email-writer': { en: 'Email Writer', vi: 'Viết Email' },
  'medical-educator': { en: 'Medical Educator', vi: 'Giảng viên Y khoa' },
};

const MODEL_NAMES: Record<string, string> = {
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'o3-deep-research': 'O3 Deep Research',
};

const FEATURE_NAMES: Record<string, { en: string; vi: string }> = {
  'artifacts': { en: 'Interactive Artifacts', vi: 'Artifacts tương tác' },
  'deep-research': { en: 'Deep Research Mode', vi: 'Chế độ nghiên cứu sâu' },
  'web-search': { en: 'Web Search', vi: 'Tìm kiếm Web' },
};

const PLUGIN_NAMES: Record<string, { en: string; vi: string }> = {
  'arxiv': { en: 'ArXiv Papers', vi: 'Bài báo ArXiv' },
  'clinical-calculator': { en: 'Clinical Calculator', vi: 'Máy tính lâm sàng' },
  'doi-resolver': { en: 'DOI Resolver', vi: 'Phân giải DOI' },
  'drug-interactions': { en: 'Drug Interactions', vi: 'Tương tác thuốc' },
  'pubmed-search': { en: 'PubMed Search', vi: 'Tìm kiếm PubMed' },
  'semantic-scholar': { en: 'Semantic Scholar', vi: 'Semantic Scholar' },
};

interface RecommendationModalProps {
  loading?: boolean;
  onComplete: (selections: RecommendationSelections) => void;
  onSkip: () => void;
  professions: string[];
}

const RecommendationModal = memo<RecommendationModalProps>(
  ({ professions, onComplete, onSkip, loading }) => {
    const { styles, cx } = useStyles();
    const { i18n } = useTranslation();
    const lang = i18n.language?.startsWith('vi') ? 'vi' : 'en';

    const recommendations = useMemo(() => getAggregatedRecommendations(professions), [professions]);

    const [selectedAgents, setSelectedAgents] = useState<string[]>(recommendations.agents);
    const [selectedPlugins, setSelectedPlugins] = useState<string[]>(recommendations.plugins);
    const [selectedModel, setSelectedModel] = useState<string | undefined>(
      recommendations.models[0],
    );
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(recommendations.features);

    const handleEnableAll = () => {
      setSelectedAgents(recommendations.agents);
      setSelectedPlugins(recommendations.plugins);
      setSelectedModel(recommendations.models[0]);
      setSelectedFeatures(recommendations.features);
    };

    const handleApply = () => {
      onComplete({
        defaultModel: selectedModel,
        enabledAgents: selectedAgents,
        enabledFeatures: selectedFeatures,
        enabledPlugins: selectedPlugins,
      });
    };

    const hasSelections =
      selectedAgents.length > 0 ||
      selectedPlugins.length > 0 ||
      selectedModel ||
      selectedFeatures.length > 0;

    const hasAnyRecommendations =
      recommendations.agents.length > 0 ||
      recommendations.plugins.length > 0 ||
      recommendations.models.length > 0 ||
      recommendations.features.length > 0;

    if (!hasAnyRecommendations) {
      // No recommendations for selected professions, skip this step
      onSkip();
      return null;
    }

    return (
      <div className={styles.container}>
        <h2 className={styles.title}>
          {lang === 'vi' ? '✨ Gợi ý dành cho bạn' : '✨ Recommendations for You'}
        </h2>
        <p className={styles.subtitle}>
          {lang === 'vi'
            ? 'Dựa trên lựa chọn của bạn, chúng tôi gợi ý bật các tính năng sau'
            : 'Based on your selections, we suggest enabling these features'}
        </p>

        {/* Agents Section */}
        {recommendations.agents.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon={Bot} size={18} />
              <span>{lang === 'vi' ? 'Trợ lý AI' : 'AI Assistants'}</span>
            </div>
            <div className={styles.itemGrid}>
              {recommendations.agents.map((agent) => (
                <div
                  className={cx(styles.item, selectedAgents.includes(agent) && styles.itemSelected)}
                  key={agent}
                  onClick={() => toggleItem(agent, selectedAgents, setSelectedAgents)}
                >
                  <Checkbox checked={selectedAgents.includes(agent)} />
                  <span className={styles.itemLabel}>{AGENT_NAMES[agent]?.[lang] || agent}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Models Section */}
        {recommendations.models.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon={Cpu} size={18} />
              <span>{lang === 'vi' ? 'Model mặc định' : 'Default Model'}</span>
            </div>
            <div className={styles.itemGrid}>
              {recommendations.models.map((model) => (
                <div
                  className={cx(styles.item, selectedModel === model && styles.itemSelected)}
                  key={model}
                  onClick={() => setSelectedModel(model === selectedModel ? undefined : model)}
                >
                  <Radio checked={selectedModel === model} />
                  <span className={styles.itemLabel}>{MODEL_NAMES[model] || model}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        {recommendations.features.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon={Sparkles} size={18} />
              <span>{lang === 'vi' ? 'Tính năng' : 'Features'}</span>
            </div>
            <div className={styles.itemGrid}>
              {recommendations.features.map((feature) => (
                <div
                  className={cx(
                    styles.item,
                    selectedFeatures.includes(feature) && styles.itemSelected,
                  )}
                  key={feature}
                  onClick={() => toggleItem(feature, selectedFeatures, setSelectedFeatures)}
                >
                  <Checkbox checked={selectedFeatures.includes(feature)} />
                  <span className={styles.itemLabel}>
                    {FEATURE_NAMES[feature]?.[lang] || feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plugins Section */}
        {recommendations.plugins.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon={Puzzle} size={18} />
              <span>{lang === 'vi' ? 'Plugins' : 'Plugins'}</span>
            </div>
            <div className={styles.itemGrid}>
              {recommendations.plugins.map((plugin) => (
                <div
                  className={cx(
                    styles.item,
                    selectedPlugins.includes(plugin) && styles.itemSelected,
                  )}
                  key={plugin}
                  onClick={() => toggleItem(plugin, selectedPlugins, setSelectedPlugins)}
                >
                  <Checkbox checked={selectedPlugins.includes(plugin)} />
                  <span className={styles.itemLabel}>{PLUGIN_NAMES[plugin]?.[lang] || plugin}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divider style={{ margin: '16px 0' }} />

        <Flexbox className={styles.footer}>
          <button
            className={cx(styles.btn, styles.btnText)}
            disabled={loading}
            onClick={onSkip}
            type="button"
          >
            {lang === 'vi' ? 'Bỏ qua' : 'Skip'}
          </button>
          <button
            className={cx(styles.btn, styles.btnSecondary)}
            disabled={loading}
            onClick={handleEnableAll}
            type="button"
          >
            {lang === 'vi' ? 'Chọn tất cả' : 'Select All'}
          </button>
          <button
            className={cx(styles.btn, loading ? styles.btnLoading : styles.btnPrimary)}
            disabled={!loading && !hasSelections}
            onClick={handleApply}
            type="button"
          >
            {loading ? (
              <>
                <Spin size="small" />
                {lang === 'vi' ? 'Đang lưu...' : 'Saving...'}
              </>
            ) : lang === 'vi' ? (
              'Áp dụng'
            ) : (
              'Apply'
            )}
          </button>
        </Flexbox>
      </div>
    );
  },
);

RecommendationModal.displayName = 'RecommendationModal';

export default RecommendationModal;
