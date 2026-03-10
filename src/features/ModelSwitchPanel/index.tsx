import { ModelIcon } from '@lobehub/icons';
import { createStyles, useThemeMode } from 'antd-style';
import { Eye, Plug, Search } from 'lucide-react';
import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

/* ──────────── Tier palette ──────────── */
const TIER = {
  0: {
    accent: '#ec4899',
    icon: '✨',
    labelKey: 'ModelSwitchPanel.tierAuto' as const,
    quotaCount: 0,
    quotaKey: '',
  },
  1: {
    accent: '#22c55e',
    icon: '⚡',
    labelKey: 'ModelSwitchPanel.tierFree' as const,
    quotaCount: 0,
    quotaKey: '',
  },
  2: {
    accent: '#a78bfa',
    icon: '🔮',
    labelKey: 'ModelSwitchPanel.tierPro' as const,
    quotaCount: 20,
    quotaKey: 'ModelSwitchPanel.quotaHint' as const,
  },
  3: {
    accent: '#f59e0b',
    icon: '👑',
    labelKey: 'ModelSwitchPanel.tierFlagship' as const,
    quotaCount: 5,
    quotaKey: 'ModelSwitchPanel.quotaHint' as const,
  },
} as const;

/* ──────────── Model-access hook ──────────── */
const useModelAccess = () => {
  const [allowed, setAllowed] = useState<number[]>([1]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/subscription/models/allowed');
        if (r.ok) {
          const d = await r.json();
          if (d.success && d.data) setAllowed(d.data.allowedTiers || [1]);
        }
      } catch {
        /* default [1] */
      }
    })();
  }, []);
  return useCallback(
    (id: string) => {
      const tier = id.toLowerCase().includes('auto') ? 0 : getModelTier(id);
      // Tier 0 (Phở Auto) is always accessible
      return tier === 0 || allowed.includes(tier);
    },
    [allowed],
  );
};

/* ──────────── Helpers ──────────── */
const ctxLabel = (n?: number) =>
  !n ? '' : n >= 1e6 ? `${Math.round(n / 1e6)}M` : `${Math.round(n / 1e3)}K`;

const iconBg = (tier: number, isDark: boolean) => {
  if (tier === 0) {
    return isDark ? 'rgba(236,72,153,0.18)' : 'rgba(236,72,153,0.1)';
  }
  if (isDark) {
    return tier === 1
      ? 'rgba(34,197,94,0.15)'
      : tier === 2
        ? 'rgba(139,92,246,0.15)'
        : 'rgba(245,158,11,0.15)';
  }
  return tier === 1
    ? 'rgba(34,197,94,0.1)'
    : tier === 2
      ? 'rgba(139,92,246,0.1)'
      : 'rgba(245,158,11,0.1)';
};

/* ──────────── Styles ──────────── */
const useStyles = createStyles(({ css, token, isDarkMode }) => {
  const isDark = isDarkMode;
  const mutedText = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const subtleText = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.32)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const selectedBg = isDark ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.08)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const sectionBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const panelShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.1)'
    : '0 16px 48px rgba(0,0,0,0.14), 0 0 1px rgba(0,0,0,0.12)';
  const capBg = isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)';
  const capColor = isDark ? 'rgba(167,139,250,0.9)' : 'rgba(109,40,217,0.7)';
  const capBorder = isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)';

  return {
    backdrop: css`
      position: fixed;
      z-index: 1000;
      inset: 0;
    `,

    capIcon: css`
      display: flex;
      align-items: center;
      justify-content: center;

      width: 20px;
      height: 20px;
      border: 1px solid ${capBorder};
      border-radius: 5px;

      color: ${capColor};

      background: ${capBg};
    `,

    ctx: css`
      flex-shrink: 0;

      min-width: 30px;

      font-size: 10px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: ${subtleText};
      text-align: end;
    `,

    dot: css`
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
    `,

    empty: css`
      padding-block: 28px;
      padding-inline: 16px;

      font-size: 13px;
      color: ${mutedText};
      text-align: center;
    `,

    footer: css`
      display: flex;
      align-items: center;
      justify-content: center;

      padding-block: 10px;
      padding-inline: 16px;
      border-block-start: 1px solid ${sectionBorder};
    `,

    modelIcon: css`
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      width: 32px;
      height: 32px;
      border-radius: 8px;

      transition: transform 0.15s;
    `,

    modelName: css`
      display: flex;
      gap: 6px;
      align-items: center;

      font-size: 13px;
      font-weight: 600;
      line-height: 1.3;
      color: ${token.colorText};
    `,

    modelRow: css`
      cursor: pointer;

      position: relative;

      display: flex;
      gap: 10px;
      align-items: center;

      padding-block: 8px;
      padding-inline: 16px;

      transition: background 0.15s ease;

      &:hover {
        background: ${hoverBg};
      }

      &:active {
        background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
      }
    `,

    modelRowDisabled: css`
      pointer-events: none;
      cursor: not-allowed;
      opacity: 0.4;
      filter: grayscale(0.8);
    `,

    modelSub: css`
      overflow: hidden;

      margin-block-start: 2px;

      font-size: 11px;
      color: ${mutedText};
      text-overflow: ellipsis;
      white-space: nowrap;
    `,

    newBadge: css`
      display: inline-flex;

      padding-block: 2px;
      padding-inline: 7px;
      border-radius: 4px;

      font-size: 9px;
      font-weight: 700;
      color: ${isDark ? '#f87171' : '#dc2626'};
      letter-spacing: 0.3px;

      background: ${isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'};

      animation: moi-pulse 2s ease-in-out infinite;

      @keyframes moi-pulse {
        0%,
        100% {
          opacity: 1;
        }

        50% {
          opacity: 0.55;
        }
      }
    `,

    panel: css`
      position: fixed;
      z-index: 1001;

      overflow: hidden;
      display: flex;
      flex-direction: column;

      width: 380px;
      max-height: 540px;
      border: 1px solid ${panelBorder};
      border-radius: 16px;

      background: ${token.colorBgElevated};
      box-shadow: ${panelShadow};

      animation: panel-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      @keyframes panel-in {
        from {
          transform: translateY(8px) scale(0.98);
          opacity: 0;
        }

        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
    `,

    scroll: css`
      overflow: hidden auto;
      flex: 1;

      &::-webkit-scrollbar {
        width: 5px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};

        &:hover {
          background: ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'};
        }
      }
    `,

    search: css`
      position: relative;
      padding-block: 12px;
      padding-inline: 16px;
      border-block-end: 1px solid ${sectionBorder};
    `,

    searchIcon: css`
      pointer-events: none;

      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 28px;
      transform: translateY(-50%);

      color: ${token.colorTextQuaternary};
    `,

    searchInput: css`
      width: 100%;
      padding-block: 10px;
      padding-inline: 38px 14px;
      border: 1px solid ${panelBorder};
      border-radius: 10px;

      font-family: inherit;
      font-size: 13px;
      color: ${token.colorText};

      background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)'};
      outline: none;

      transition:
        border-color 0.2s,
        box-shadow 0.2s;

      &::placeholder {
        color: ${token.colorTextQuaternary};
      }

      &:focus {
        border-color: ${isDark ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.4)'};
        box-shadow: 0 0 0 3px ${isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.08)'};
      }
    `,

    section: css`
      padding-block: 4px;
      padding-inline: 0;

      & + & {
        border-block-start: 1px solid ${sectionBorder};
      }
    `,

    sectionHeader: css`
      display: flex;
      gap: 6px;
      align-items: center;

      padding-block: 10px 6px;
      padding-inline: 16px;

      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    `,

    selected: css`
      background: ${selectedBg};
    `,

    selectedBar: css`
      position: absolute;
      inset-block: 4px 4px;
      inset-inline-start: 0;

      width: 3px;
      border-radius: 0 3px 3px 0;
    `,

    speedBadge: css`
      display: inline-flex;
      gap: 2px;
      align-items: center;

      padding-block: 2px;
      padding-inline: 6px;
      border-radius: 4px;

      font-size: 8px;
      font-weight: 700;
      color: #000;

      background: linear-gradient(135deg, #eab308, #f97316);
    `,

    speedBar: css`
      flex-shrink: 0;
      height: 3px;
      border-radius: 2px;
    `,

    speedLabel: css`
      font-size: 9px;
      color: ${subtleText};
    `,

    tierLegend: css`
      display: flex;
      gap: 10px;
      font-size: 10px;
      color: ${mutedText};

      & > span {
        display: flex;
        gap: 3px;
        align-items: center;
      }
    `,

    trigger: css`
      cursor: pointer;
    `,
  };
});

/* ──────────── Tier badges (theme-aware) ──────────── */
const TierBadge = memo<{ isDark: boolean; tier: number }>(({ tier, isDark }) => {
  if (tier === 1)
    return (
      <span
        style={{
          background: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.12)',
          borderRadius: 4,
          color: isDark ? '#4ade80' : '#15803d',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.3,
          padding: '2px 7px',
        }}
      >
        FREE
      </span>
    );
  if (tier === 2)
    return (
      <span
        style={{
          background: isDark ? 'rgba(168,85,247,0.22)' : 'rgba(124,58,237,0.14)',
          borderRadius: 4,
          color: isDark ? '#c084fc' : '#6d28d9',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.3,
          padding: '2px 7px',
        }}
      >
        PRO
      </span>
    );
  return (
    <span
      style={{
        background: isDark
          ? 'linear-gradient(135deg,rgba(245,158,11,0.22),rgba(239,68,68,0.18))'
          : 'linear-gradient(135deg,rgba(217,119,6,0.16),rgba(220,38,38,0.12))',
        borderRadius: 4,
        color: isDark ? '#fbbf24' : '#b45309',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.3,
        padding: '2px 7px',
      }}
    >
      MAX
    </span>
  );
});

/* ──────────── Component ──────────── */
interface IProps {
  children?: ReactNode;
  onOpenChange?: (v: boolean) => void;
  open?: boolean;
  updating?: boolean;
}

const ModelSwitchPanel = memo<IProps>(({ children, onOpenChange, open: extOpen }) => {
  const { styles, cx } = useStyles();
  const { isDarkMode: isDark } = useThemeMode();
  const { t } = useTranslation('components');
  const model = useAgentStore((s) => agentSelectors.currentAgentModel(s));
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);
  const tiers = useEnabledChatModels() as TierGroup[];
  const canUse = useModelAccess();
  const [q, setQ] = useState('');
  const trigRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── internal open state ── */
  const [intOpen, setIntOpen] = useState(false);
  const isOpen = extOpen ?? intOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      setIntOpen(v);
      onOpenChange?.(v);
      if (!v) setQ('');
    },
    [onOpenChange],
  );

  /* ── position ── */
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!isOpen || !trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    const h = 540;
    setPos({
      x: Math.max(8, Math.min(r.left, window.innerWidth - 396)),
      y: r.top > h + 16 ? r.top - h - 8 : r.bottom + 8,
    });
  }, [isOpen]);

  /* ── search filter ── */
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return tiers;
    return tiers
      .map((t) => ({
        ...t,
        children: t.children.filter(
          (m) =>
            m.id.toLowerCase().includes(s) ||
            m.displayName.toLowerCase().includes(s) ||
            (MODEL_DESCRIPTIONS[m.id] || '').toLowerCase().includes(s),
        ),
      }))
      .filter((t) => t.children.length > 0);
  }, [tiers, q]);

  const onSelect = useCallback(
    async (id: string, prov: string) => {
      await updateAgentConfig({ model: id, provider: prov });
      setOpen(false);
    },
    [updateAgentConfig, setOpen],
  );

  /* ── quota hint color ── */
  const quotaColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  return (
    <>
      <div
        className={styles.trigger}
        onClick={() => setOpen(!isOpen)}
        onMouseEnter={() => {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          if (!isOpen) {
            hoverTimerRef.current = setTimeout(() => setOpen(true), 200);
          }
        }}
        onMouseLeave={() => {
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          closeTimerRef.current = setTimeout(() => setOpen(false), 300);
        }}
        ref={trigRef}
      >
        {children}
      </div>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div
            className={styles.panel}
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              closeTimerRef.current = setTimeout(() => setOpen(false), 300);
            }}
            ref={panelRef}
            style={{ left: pos.x, top: pos.y }}
          >
            {/* ── Search ── */}
            <div className={styles.search}>
              <Search className={styles.searchIcon} size={15} />
              <input
                autoFocus
                className={styles.searchInput}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('ModelSwitchPanel.searchPlaceholder')}
                type="text"
                value={q}
              />
            </div>

            {/* ── Scroll ── */}
            <div className={styles.scroll}>
              {filtered.map((tier) => {
                const tierNum = (tier.tierGroup ?? 1) as 0 | 1 | 2 | 3;
                const cfg = TIER[tierNum];
                return (
                  <div className={styles.section} key={tier.id}>
                    {/* Section header — skip for tier 0 (Phở Auto) */}
                    {tierNum !== 0 && (
                      <div className={styles.sectionHeader} style={{ color: cfg.accent }}>
                        <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                        {t(cfg.labelKey)}
                        {cfg.quotaKey && (
                          <span
                            style={{
                              color: quotaColor,
                              fontSize: 9,
                              fontWeight: 400,
                              marginLeft: 'auto',
                              textTransform: 'none',
                            }}
                          >
                            {t(cfg.quotaKey as 'ModelSwitchPanel.quotaHint', {
                              count: cfg.quotaCount,
                            })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Model rows */}
                    {tier.children.map((m) => {
                      const ok = canUse(m.id);
                      const prov = (m as any).originProvider || tier.id;
                      const sel = model === m.id;
                      const isNew = NEW_MODEL_IDS.has(m.id);
                      const speed = SPEED_MODELS[m.id];
                      const desc = MODEL_DESCRIPTIONS[m.id];
                      const ctx = ctxLabel(m.contextWindowTokens);
                      const mTier = getModelTier(m.id);

                      return (
                        <div
                          className={cx(
                            styles.modelRow,
                            sel && styles.selected,
                            !ok && styles.modelRowDisabled,
                          )}
                          key={m.id}
                          onClick={ok ? () => onSelect(m.id, prov) : undefined}
                        >
                          {/* Selected accent bar */}
                          {sel && (
                            <div
                              className={styles.selectedBar}
                              style={{ background: cfg.accent }}
                            />
                          )}

                          {/* Model icon */}
                          <div
                            className={styles.modelIcon}
                            style={{
                              background: speed
                                ? isDark
                                  ? 'linear-gradient(135deg,rgba(250,204,21,0.15),rgba(251,146,60,0.12))'
                                  : 'linear-gradient(135deg,rgba(250,204,21,0.12),rgba(251,146,60,0.08))'
                                : iconBg(tierNum, isDark),
                            }}
                          >
                            <ModelIcon model={m.id} size={18} />
                          </div>

                          {/* Model info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.modelName}>
                              {m.displayName}
                              {mTier > 1 && <TierBadge isDark={isDark} tier={mTier} />}
                              {speed && <span className={styles.speedBadge}>⚡ {speed} tok/s</span>}
                              {isNew && <span className={styles.newBadge}>MỚI</span>}
                            </div>
                            {/* Subtitle or speed indicator */}
                            {speed ? (
                              <div
                                style={{
                                  alignItems: 'center',
                                  display: 'flex',
                                  gap: 4,
                                  marginTop: 3,
                                }}
                              >
                                <div
                                  className={styles.speedBar}
                                  style={{
                                    background: 'linear-gradient(90deg,#eab308,#f97316)',
                                    width: 36,
                                  }}
                                />
                                <span className={styles.speedLabel}>
                                  {desc || 'Instant generation'}
                                </span>
                              </div>
                            ) : desc ? (
                              <div className={styles.modelSub}>{desc}</div>
                            ) : null}
                          </div>

                          {/* Capability icons (SVG via lucide) */}
                          <div
                            style={{
                              alignItems: 'center',
                              display: 'flex',
                              flexShrink: 0,
                              gap: 4,
                            }}
                          >
                            {m.abilities?.functionCall && (
                              <div className={styles.capIcon} title="Plugins">
                                <Plug size={11} />
                              </div>
                            )}
                            {m.abilities?.vision && (
                              <div className={styles.capIcon} title="Vision">
                                <Eye size={11} />
                              </div>
                            )}
                          </div>

                          {/* Context size */}
                          {ctx && <span className={styles.ctx}>{ctx}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className={styles.empty}>{t('ModelSwitchPanel.emptySearch')}</div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={styles.footer}>
              <div className={styles.tierLegend}>
                <span>
                  <span className={styles.dot} style={{ background: '#22c55e' }} />{' '}
                  {t('ModelSwitchPanel.legendFree')}
                </span>
                <span>
                  <span className={styles.dot} style={{ background: '#a78bfa' }} />{' '}
                  {t('ModelSwitchPanel.legendPro')}
                </span>
                <span>
                  <span className={styles.dot} style={{ background: '#f59e0b' }} />{' '}
                  {t('ModelSwitchPanel.legendMax')}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default ModelSwitchPanel;
