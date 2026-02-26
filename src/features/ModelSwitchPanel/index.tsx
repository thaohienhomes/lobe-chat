import { ModelIcon } from '@lobehub/icons';
import { createStyles, useThemeMode } from 'antd-style';
import { Plug, Search, Eye } from 'lucide-react';
import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  1: { accent: '#22c55e', icon: '⚡', label: 'Nhanh & Miễn Phí', quota: '' },
  2: { accent: '#a78bfa', icon: '🔮', label: 'Chuyên Nghiệp', quota: '20 lượt/ngày' },
  3: { accent: '#f59e0b', icon: '👑', label: 'Flagship', quota: '5 lượt/ngày' },
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
      } catch { /* default [1] */ }
    })();
  }, []);
  return useCallback(
    (id: string) => allowed.includes(id.toLowerCase().includes('auto') ? 2 : getModelTier(id)),
    [allowed],
  );
};

/* ──────────── Helpers ──────────── */
const ctxLabel = (n?: number) =>
  !n ? '' : n >= 1e6 ? `${Math.round(n / 1e6)}M` : `${Math.round(n / 1e3)}K`;

const iconBg = (tier: number, isDark: boolean) => {
  if (isDark) {
    return tier === 1 ? 'rgba(34,197,94,0.12)' : tier === 2 ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)';
  }
  return tier === 1 ? 'rgba(34,197,94,0.08)' : tier === 2 ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)';
};

/* ──────────── Styles ──────────── */
const useStyles = createStyles(({ css, token, isDarkMode }) => {
  const isDark = isDarkMode;
  const mutedText = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
  const subtleText = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const selectedBg = isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)';
  const panelShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.08)'
    : '0 12px 48px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)';
  const capBg = isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)';
  const capColor = isDark ? 'rgba(167,139,250,0.8)' : 'rgba(139,92,246,0.7)';

  return {
    backdrop: css`
      position: fixed;
      inset: 0;
      z-index: 1000;
    `,

    capIcon: css`
      width: 20px;
      height: 20px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${capBg};
      color: ${capColor};
    `,

    ctx: css`
      font-size: 10px;
      color: ${subtleText};
      font-weight: 500;
      min-width: 30px;
      text-align: right;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    `,

    dot: css`
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    `,

    empty: css`
      padding: 28px 16px;
      text-align: center;
      font-size: 13px;
      color: ${mutedText};
    `,

    footer: css`
      padding: 10px 16px;
      border-top: 1px solid ${token.colorBorderSecondary};
      display: flex;
      justify-content: space-between;
      align-items: center;
    `,

    footerLink: css`
      font-size: 11px;
      font-weight: 500;
      color: ${isDark ? 'rgba(167,139,250,0.7)' : '#7c3aed'};
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: ${isDark ? '#c4b5fd' : '#6d28d9'};
      }
    `,

    modelIcon: css`
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s;
    `,

    modelName: css`
      font-size: 13px;
      font-weight: 600;
      color: ${token.colorText};
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.3;
    `,

    modelRow: css`
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      cursor: pointer;
      position: relative;
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
      filter: grayscale(0.8);
      opacity: 0.4;
    `,

    modelSub: css`
      font-size: 11px;
      color: ${mutedText};
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,

    newBadge: css`
      display: inline-flex;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.3px;
      background: ${isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'};
      color: ${isDark ? '#f87171' : '#dc2626'};
      animation: moi-pulse 2s ease-in-out infinite;

      @keyframes moi-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.55; }
      }
    `,

    panel: css`
      position: fixed;
      z-index: 1001;
      width: 380px;
      max-height: 540px;
      background: ${token.colorBgElevated};
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 16px;
      box-shadow: ${panelShadow};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: panel-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      @keyframes panel-in {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,

    scroll: css`
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;

      &::-webkit-scrollbar {
        width: 5px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
        border-radius: 4px;

        &:hover {
          background: ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'};
        }
      }
    `,

    search: css`
      padding: 12px 16px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      position: relative;
    `,

    searchIcon: css`
      position: absolute;
      left: 28px;
      top: 50%;
      transform: translateY(-50%);
      color: ${token.colorTextQuaternary};
      pointer-events: none;
    `,

    searchInput: css`
      width: 100%;
      padding: 10px 14px 10px 38px;
      background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 10px;
      color: ${token.colorText};
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;

      &::placeholder {
        color: ${token.colorTextQuaternary};
      }

      &:focus {
        border-color: ${isDark ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.4)'};
        box-shadow: 0 0 0 3px ${isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.08)'};
      }
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
      padding: 10px 16px 6px;
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
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 700;
      background: linear-gradient(135deg, #eab308, #f97316);
      color: #000;
    `,

    speedBar: css`
      height: 3px;
      border-radius: 2px;
      flex-shrink: 0;
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
        align-items: center;
        gap: 3px;
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
          background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
          borderRadius: 4,
          color: isDark ? '#4ade80' : '#16a34a',
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
          background: isDark ? 'rgba(168,85,247,0.2)' : 'rgba(139,92,246,0.12)',
          borderRadius: 4,
          color: isDark ? '#c084fc' : '#7c3aed',
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
          ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.15))'
          : 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))',
        borderRadius: 4,
        color: isDark ? '#fbbf24' : '#d97706',
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
  const model = useAgentStore((s) => agentSelectors.currentAgentModel(s));
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);
  const tiers = useEnabledChatModels() as TierGroup[];
  const canUse = useModelAccess();
  const [q, setQ] = useState('');
  const trigRef = useRef<HTMLDivElement>(null);

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
      <div className={styles.trigger} onClick={() => setOpen(!isOpen)} ref={trigRef}>
        {children}
      </div>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel} style={{ left: pos.x, top: pos.y }}>
            {/* ── Search ── */}
            <div className={styles.search}>
              <Search className={styles.searchIcon} size={15} />
              <input
                autoFocus
                className={styles.searchInput}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm model..."
                type="text"
                value={q}
              />
            </div>

            {/* ── Scroll ── */}
            <div className={styles.scroll}>
              {filtered.map((tier) => {
                const t = (tier.tierGroup || 1) as 1 | 2 | 3;
                const cfg = TIER[t];
                return (
                  <div className={styles.section} key={tier.id}>
                    {/* Section header */}
                    <div className={styles.sectionHeader} style={{ color: cfg.accent }}>
                      <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                      {cfg.label}
                      {cfg.quota && (
                        <span
                          style={{
                            color: quotaColor,
                            fontSize: 9,
                            fontWeight: 400,
                            marginLeft: 'auto',
                            textTransform: 'none',
                          }}
                        >
                          {cfg.quota}
                        </span>
                      )}
                    </div>

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
                                : iconBg(t, isDark),
                            }}
                          >
                            <ModelIcon model={m.id} size={18} />
                          </div>

                          {/* Model info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.modelName}>
                              {m.displayName}
                              {mTier > 1 && <TierBadge isDark={isDark} tier={mTier} />}
                              {speed && (
                                <span className={styles.speedBadge}>⚡ {speed} tok/s</span>
                              )}
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
                <div className={styles.empty}>Không tìm thấy model nào</div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={styles.footer}>
              <div className={styles.tierLegend}>
                <span>
                  <span className={styles.dot} style={{ background: '#22c55e' }} /> Free
                </span>
                <span>
                  <span className={styles.dot} style={{ background: '#a78bfa' }} /> Pro
                </span>
                <span>
                  <span className={styles.dot} style={{ background: '#f59e0b' }} /> Max
                </span>
              </div>
              <span className={styles.footerLink} onClick={() => setOpen(false)}>
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
