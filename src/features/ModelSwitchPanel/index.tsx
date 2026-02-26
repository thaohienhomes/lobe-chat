import { ModelIcon } from '@lobehub/icons';
import { createStyles } from 'antd-style';
import { Search } from 'lucide-react';
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

/* ──────────── Tier config ──────────── */
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
  const canUse = useCallback(
    (id: string) => allowed.includes(id.toLowerCase().includes('auto') ? 2 : getModelTier(id)),
    [allowed],
  );
  return canUse;
};

/* ──────────── Helpers ──────────── */
const ctxLabel = (n?: number) => (!n ? '' : n >= 1e6 ? `${Math.round(n / 1e6)}M` : `${Math.round(n / 1e3)}K`);
const iconBg = (tier: number) =>
  tier === 1 ? 'rgba(34,197,94,0.12)' : tier === 2 ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)';

/* Badge for tier */
const tierBadge = (tier: number) => {
  if (tier === 1)
    return <span style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 4, color: '#4ade80', fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 7px' }}>FREE</span>;
  if (tier === 2)
    return <span style={{ background: 'rgba(168,85,247,0.2)', borderRadius: 4, color: '#c084fc', fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 7px' }}>PRO</span>;
  return <span style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.15))', borderRadius: 4, color: '#fbbf24', fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 7px' }}>MAX</span>;
};

/* ──────────── Styles ──────────── */
const useStyles = createStyles(({ css, token }) => ({
  backdrop: css`position:fixed;inset:0;z-index:1000;`,
  capIcon: css`
    width:18px; height:18px; border-radius:4px;
    display:flex; align-items:center; justify-content:center;
    font-size:10px;
    background: rgba(139,92,246,0.1);
    color: rgba(168,85,247,0.7);
  `,
  capIconInactive: css`
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.3);
  `,
  ctx: css`
    font-size:10px; color:rgba(255,255,255,0.2); font-weight:500;
    min-width:30px; text-align:right; flex-shrink:0;
  `,
  dot: css`width:6px;height:6px;border-radius:50%;flex-shrink:0;`,
  footer: css`
    padding:10px 16px;
    border-top:1px solid ${token.colorBorderSecondary};
    display:flex; justify-content:space-between; align-items:center;
  `,
  footerLink: css`font-size:11px;color:rgba(139,92,246,0.6);cursor:pointer;&:hover{color:#a78bfa;}`,
  modelIcon: css`
    width:32px; height:32px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    font-size:16px; flex-shrink:0;
  `,
  modelName: css`
    font-size:13px; font-weight:600; color:${token.colorText};
    display:flex; align-items:center; gap:6px; line-height:1.3;
  `,
  modelRow: css`
    display:flex; align-items:center; gap:10px;
    padding:9px 16px; cursor:pointer; position:relative;
    transition:background 0.15s;
    &:hover { background:rgba(255,255,255,0.04); }
  `,
  modelRowDisabled: css`
    pointer-events:none; cursor:not-allowed;
    filter:grayscale(1); opacity:0.45;
  `,
  modelSub: css`
    font-size:11px; color:rgba(255,255,255,0.35); margin-top:1px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  `,
  newBadge: css`
    display:inline-flex; padding:2px 7px; border-radius:4px;
    font-size:9px; font-weight:700; letter-spacing:0.3px;
    background:rgba(239,68,68,0.15); color:#f87171;
    animation:pk 2s infinite;
    @keyframes pk{0%,100%{opacity:1}50%{opacity:0.6}}
  `,
  panel: css`
    position:fixed; z-index:1001; width:380px; max-height:540px;
    background: ${token.colorBgElevated};
    border:1px solid ${token.colorBorderSecondary};
    border-radius:16px;
    box-shadow:0 20px 60px rgba(0,0,0,0.5);
    display:flex; flex-direction:column; overflow:hidden;
    animation: slideUp 0.18s ease-out;
    @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `,
  scroll: css`
    flex:1; overflow-y:auto; overflow-x:hidden;
    &::-webkit-scrollbar{width:4px}
    &::-webkit-scrollbar-thumb{background:${token.colorTextQuaternary};border-radius:2px}
  `,
  search: css`
    padding:12px 16px; border-bottom:1px solid ${token.colorBorderSecondary};
    position:relative;
  `,
  searchIcon: css`
    position:absolute; left:28px; top:50%; transform:translateY(-50%);
    color:${token.colorTextQuaternary}; pointer-events:none;
  `,
  searchInput: css`
    width:100%; padding:10px 14px 10px 38px;
    background:${token.colorFillTertiary};
    border:1px solid ${token.colorBorderSecondary};
    border-radius:10px; color:${token.colorText};
    font-size:13px; font-family:inherit; outline:none;
    &::placeholder{color:${token.colorTextQuaternary}}
    &:focus{border-color:rgba(139,92,246,0.4)}
  `,
  section: css`padding:6px 0;&+&{border-top:1px solid ${token.colorBorderSecondary}}`,
  sectionHeader: css`
    display:flex; align-items:center; gap:6px;
    padding:10px 16px 6px; font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:0.8px;
  `,
  selected: css`background:rgba(139,92,246,0.08);`,
  selectedBar: css`
    position:absolute; left:0; top:4px; bottom:4px; width:3px;
    border-radius:0 3px 3px 0;
  `,
  speedBadge: css`
    display:inline-flex; align-items:center; gap:2px;
    padding:2px 6px; border-radius:4px; font-size:8px; font-weight:700;
    background:linear-gradient(135deg,#eab308,#f97316); color:#000;
  `,
  speedBar: css`height:3px;border-radius:2px;flex-shrink:0;`,
  speedLabel: css`font-size:9px;color:rgba(255,255,255,0.25);`,
  tierLegend: css`
    display:flex;gap:10px;font-size:10px;color:rgba(255,255,255,0.3);
    &>span{display:flex;align-items:center;gap:3px}
  `,
  trigger: css`cursor:pointer;`,
}));

/* ──────────── Component ──────────── */
interface IProps {
  children?: ReactNode;
  onOpenChange?: (v: boolean) => void;
  open?: boolean;
  updating?: boolean;
}

const ModelSwitchPanel = memo<IProps>(({ children, onOpenChange, open: extOpen }) => {
  const { styles, cx } = useStyles();
  const model = useAgentStore((s) => agentSelectors.currentAgentModel(s));
  const updateAgentConfig = useAgentStore((s) => s.updateAgentConfig);
  const tiers = useEnabledChatModels() as TierGroup[];
  const canUse = useModelAccess();
  const [q, setQ] = useState('');
  const trigRef = useRef<HTMLDivElement>(null);

  /* ── internal open state ── */
  const [intOpen, setIntOpen] = useState(false);
  const isOpen = extOpen ?? intOpen;
  const setOpen = useCallback((v: boolean) => { setIntOpen(v); onOpenChange?.(v); if (!v) setQ(''); }, [onOpenChange]);

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
          (m) => m.id.toLowerCase().includes(s) || m.displayName.toLowerCase().includes(s) || (MODEL_DESCRIPTIONS[m.id] || '').toLowerCase().includes(s),
        ),
      }))
      .filter((t) => t.children.length > 0);
  }, [tiers, q]);

  const onSelect = useCallback(
    async (id: string, prov: string) => { await updateAgentConfig({ model: id, provider: prov }); setOpen(false); },
    [updateAgentConfig, setOpen],
  );



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
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 400, marginLeft: 'auto', textTransform: 'none' }}>
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
                          className={cx(styles.modelRow, sel && styles.selected, !ok && styles.modelRowDisabled)}
                          key={m.id}
                          onClick={ok ? () => onSelect(m.id, prov) : undefined}
                        >
                          {/* Selected bar */}
                          {sel && <div className={styles.selectedBar} style={{ background: cfg.accent }} />}

                          {/* Icon */}
                          <div className={styles.modelIcon} style={{ background: speed ? 'linear-gradient(135deg,rgba(250,204,21,0.15),rgba(251,146,60,0.12))' : iconBg(t) }}>
                            <ModelIcon model={m.id} size={18} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.modelName}>
                              {m.displayName}
                              {mTier > 1 && tierBadge(mTier)}
                              {speed && <span className={styles.speedBadge}>⚡ {speed} tok/s</span>}
                              {isNew && <span className={styles.newBadge}>MỚI</span>}
                            </div>
                            {/* Subtitle or speed bar */}
                            {speed ? (
                              <div style={{ alignItems: 'center', display: 'flex', gap: 3, marginTop: 2 }}>
                                <div className={styles.speedBar} style={{ background: 'linear-gradient(90deg,#eab308,#f97316)', width: 36 }} />
                                <span className={styles.speedLabel}>{desc || 'Instant generation'}</span>
                              </div>
                            ) : desc ? (
                              <div className={styles.modelSub}>{desc}</div>
                            ) : null}
                          </div>

                          {/* Capability icons */}
                          <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 4 }}>
                            {m.abilities?.functionCall && <div className={styles.capIcon} title="Plugins">🔌</div>}
                            {m.abilities?.vision && <div className={styles.capIcon} title="Vision">👁</div>}
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
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 16px', textAlign: 'center' }}>
                  Không tìm thấy model nào
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={styles.footer}>
              <div className={styles.tierLegend}>
                <span><span className={styles.dot} style={{ background: '#22c55e' }} /> Free</span>
                <span><span className={styles.dot} style={{ background: '#a78bfa' }} /> Pro</span>
                <span><span className={styles.dot} style={{ background: '#f59e0b' }} /> Max</span>
              </div>
              <span className={styles.footerLink} onClick={() => setOpen(false)}>Xem tất cả →</span>
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default ModelSwitchPanel;
