import { createStyles } from 'antd-style';
import { Lock, Zap } from 'lucide-react';
import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender } from '@/components/ModelSelect';
import { getModelTier } from '@/config/pricing';
import {
  MODEL_DESCRIPTIONS,
  NEW_MODEL_IDS,
  SPEED_MODELS,
  type TierGroup,
  useEnabledChatModels,
} from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/slices/chat';

// ── Tier visual configuration ──────────────────────────────────────────────
const TIER_CONFIGS = {
  1: { accent: '#22c55e', dotClass: 'dotFree', icon: '⚡', label: 'Nhanh & Miễn Phí', quotaLabel: '' },
  2: { accent: '#a78bfa', dotClass: 'dotPro', icon: '🔮', label: 'Chuyên Nghiệp', quotaLabel: '20 lượt/ngày' },
  3: { accent: '#f59e0b', dotClass: 'dotFlagship', icon: '👑', label: 'Flagship', quotaLabel: '5 lượt/ngày' },
} as const;

// ── Access check hook ──────────────────────────────────────────────────────
const useModelAccess = () => {
  const [allowedTiers, setAllowedTiers] = useState<number[]>([1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/subscription/models/allowed');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) { setAllowedTiers(data.data.allowedTiers || [1]); }
        } else { setAllowedTiers([1]); }
      } catch { setAllowedTiers([1]); }
      finally { setLoading(false); }
    };
    check();
  }, []);

  const canUseModel = useCallback(
    (modelId: string) => {
      if (modelId.toLowerCase().includes('auto')) return true;
      return allowedTiers.includes(getModelTier(modelId));
    },
    [allowedTiers],
  );

  return { canUseModel, loading };
};

// ── Styles ─────────────────────────────────────────────────────────────────
const useStyles = createStyles(({ css, token }) => ({
  backdrop: css`
    position: fixed;
    inset: 0;
    z-index: 1000;
  `,
  capIcon: css`
    width: 18px;
    height: 18px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    background: rgba(139, 92, 246, 0.1);
    color: rgba(168, 85, 247, 0.7);
  `,
  ctx: css`
    font-size: 10px;
    color: ${token.colorTextQuaternary};
    font-weight: 500;
    min-width: 28px;
    text-align: right;
    flex-shrink: 0;
  `,
  dot: css`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  `,
  dotFlagship: css`
    background: #f59e0b;
  `,
  dotFree: css`
    background: #22c55e;
  `,
  dotPro: css`
    background: #a78bfa;
  `,
  footer: css`
    padding: 8px 16px;
    border-top: 1px solid ${token.colorBorderSecondary};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  footerLink: css`
    font-size: 11px;
    color: rgba(139, 92, 246, 0.6);
    cursor: pointer;
    user-select: none;
    &:hover { color: #a78bfa; }
  `,
  modelRow: css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    position: relative;
    transition: background 0.15s;
    &:hover {
      background: ${token.colorBgTextHover};
    }
  `,
  modelRowDisabled: css`
    pointer-events: none;
    cursor: not-allowed;
    filter: grayscale(1);
    opacity: 0.5;
  `,
  modelSub: css`
    font-size: 11px;
    line-height: 1.3;
    color: ${token.colorTextQuaternary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  `,
  newBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
    line-height: 1.5;
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    flex-shrink: 0;
    animation: pulseBadge 2s infinite;
    @keyframes pulseBadge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `,
  panel: css`
    position: fixed;
    z-index: 1001;
    width: 380px;
    max-height: 560px;
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 6px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  scrollArea: css`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
      background: ${token.colorTextQuaternary};
      border-radius: 2px;
    }
  `,
  searchIcon: css`
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    color: ${token.colorTextQuaternary};
    font-size: 14px;
    pointer-events: none;
  `,
  searchInput: css`
    width: 100%;
    padding: 10px 14px 10px 36px;
    background: ${token.colorFillTertiary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;
    color: ${token.colorText};
    font-size: 13px;
    font-family: inherit;
    outline: none;
    &::placeholder { color: ${token.colorTextQuaternary}; }
    &:focus { border-color: rgba(139, 92, 246, 0.4); }
  `,
  searchWrap: css`
    padding: 12px 16px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    position: relative;
  `,
  section: css`
    padding: 4px 0;
    & + & {
      border-top: 1px solid ${token.colorBorderSecondary};
    }
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  `,
  sectionQuota: css`
    margin-left: auto;
    font-size: 9px;
    font-weight: 400;
    text-transform: none;
    color: ${token.colorTextQuaternary};
  `,
  selectedBar: css`
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 0 3px 3px 0;
  `,
  speedBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    background: linear-gradient(135deg, #eab308, #f97316);
    color: #000;
    flex-shrink: 0;
  `,
  speedBar: css`
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
  `,
  tag: css`
    cursor: pointer;
  `,
  tierLegend: css`
    display: flex;
    gap: 10px;
    font-size: 10px;
    color: ${token.colorTextQuaternary};
    & > span {
      display: flex;
      align-items: center;
      gap: 3px;
    }
  `,
}));

// ── Helpers ────────────────────────────────────────────────────────────────
const formatContext = (tokens?: number) => {
  if (!tokens) return '';
  if (tokens >= 1_000_000) return `${Math.round(tokens / 1_000_000)}M`;
  return `${Math.round(tokens / 1000)}K`;
};

// ── Component ──────────────────────────────────────────────────────────────
interface IProps {
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  updating?: boolean;
}

const ModelSwitchPanel = memo<IProps>(({ children, onOpenChange, open }) => {
  const { styles, cx } = useStyles();
  const model = useAgentStore((s) => agentSelectors.currentAgentModel(s));
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);
  const enabledList = useEnabledChatModels() as TierGroup[];
  const { canUseModel } = useModelAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Panel positioning
  const [panelPos, setPanelPos] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({
        left: Math.max(8, rect.left),
        top: Math.max(8, rect.top - 570),
      });
    }
  }, [open]);

  // Filter models by search
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enabledList;
    return enabledList
      .map((tier) => ({
        ...tier,
        children: tier.children.filter(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            m.displayName.toLowerCase().includes(q) ||
            (MODEL_DESCRIPTIONS[m.id] || '').toLowerCase().includes(q),
        ),
      }))
      .filter((tier) => tier.children.length > 0);
  }, [enabledList, searchQuery]);

  const handleSelect = useCallback(
    async (modelId: string, modelProvider: string) => {
      await updateAgentConfig({ model: modelId, provider: modelProvider });
      onOpenChange?.(false);
      setSearchQuery('');
    },
    [updateAgentConfig, onOpenChange],
  );

  const handleClose = useCallback(() => {
    onOpenChange?.(false);
    setSearchQuery('');
  }, [onOpenChange]);

  return (
    <>
      <div className={styles.tag} onClick={() => onOpenChange?.(!open)} ref={triggerRef}>
        {children}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div className={styles.backdrop} onClick={handleClose} />

          {/* Panel */}
          <div
            className={styles.panel}
            ref={panelRef}
            style={{ left: panelPos.left, top: panelPos.top }}
          >
            {/* Search bar */}
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                autoFocus
                className={styles.searchInput}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm model..."
                type="text"
                value={searchQuery}
              />
            </div>

            {/* Scrollable model list */}
            <div className={styles.scrollArea}>
              {filteredList.map((tierGroup) => {
                const tierNum = (tierGroup.tierGroup || 1) as 1 | 2 | 3;
                const cfg = TIER_CONFIGS[tierNum];

                return (
                  <div className={styles.section} key={tierGroup.id}>
                    {/* Section header */}
                    <div className={styles.sectionHeader} style={{ color: cfg.accent }}>
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      {cfg.quotaLabel && (
                        <span className={styles.sectionQuota}>{cfg.quotaLabel}</span>
                      )}
                    </div>

                    {/* Model rows */}
                    {tierGroup.children.map((modelItem) => {
                      const canAccess = canUseModel(modelItem.id);
                      const modelProvider =
                        (modelItem as any).originProvider || tierGroup.id;
                      const isSelected = model === modelItem.id;
                      const isNew = NEW_MODEL_IDS.has(modelItem.id);
                      const speedLabel = SPEED_MODELS[modelItem.id];
                      const description = MODEL_DESCRIPTIONS[modelItem.id];
                      const ctxLabel = formatContext(modelItem.contextWindowTokens);

                      return (
                        <div
                          className={cx(
                            styles.modelRow,
                            !canAccess && styles.modelRowDisabled,
                          )}
                          key={modelItem.id}
                          onClick={
                            canAccess
                              ? () => handleSelect(modelItem.id, modelProvider)
                              : undefined
                          }
                        >
                          {/* Selected indicator */}
                          {isSelected && (
                            <div
                              className={styles.selectedBar}
                              style={{ background: cfg.accent }}
                            />
                          )}

                          {/* Model info */}
                          <Flexbox style={{ flex: 1, minWidth: 0 }}>
                            <Flexbox align="center" gap={5} horizontal>
                              <ModelItemRender
                                {...modelItem}
                                {...modelItem.abilities}
                                isLocked={!canAccess}
                              />
                              {speedLabel && (
                                <span className={styles.speedBadge}>
                                  <Zap size={8} /> {speedLabel} tok/s
                                </span>
                              )}
                              {isNew && <span className={styles.newBadge}>MỚI</span>}
                            </Flexbox>
                            {description && (
                              <div className={styles.modelSub}>
                                {speedLabel ? (
                                  <>
                                    <span
                                      className={styles.speedBar}
                                      style={{
                                        background: speedLabel === '1000+'
                                          ? 'linear-gradient(90deg, #eab308, #f97316)'
                                          : 'linear-gradient(90deg, #22c55e, #4ade80)',
                                        display: 'inline-block',
                                        marginRight: 6,
                                        verticalAlign: 'middle',
                                        width: speedLabel === '1000+' ? 36 : 20,
                                      }}
                                    />
                                    {description}
                                  </>
                                ) : (
                                  description
                                )}
                              </div>
                            )}
                          </Flexbox>

                          {/* Context window */}
                          {ctxLabel && <span className={styles.ctx}>{ctxLabel}</span>}

                          {/* Lock icon */}
                          {!canAccess && (
                            <Lock
                              size={14}
                              style={{
                                color: 'rgba(255,255,255,0.25)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredList.length === 0 && (
                <Flexbox
                  align="center"
                  justify="center"
                  style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 16px' }}
                >
                  Không tìm thấy model nào
                </Flexbox>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.tierLegend}>
                <span>
                  <span className={cx(styles.dot, styles.dotFree)} /> Free
                </span>
                <span>
                  <span className={cx(styles.dot, styles.dotPro)} /> Pro
                </span>
                <span>
                  <span className={cx(styles.dot, styles.dotFlagship)} /> Max
                </span>
              </div>
              <span className={styles.footerLink} onClick={handleClose}>
                Xem tất cả →
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default ModelSwitchPanel;
