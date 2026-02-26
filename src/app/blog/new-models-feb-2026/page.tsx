'use client';

import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';

export default function NewModelsFeb2026Page() {
    const handleCTAClick = (source: string) => {
        try {
            (window as any).posthog?.capture('new_models_cta_clicked', {
                campaign: 'new_models_feb_2026',
                plan: 'medical_beta',
                source,
            });
        } catch {
            // Analytics not available
        }
    };

    return (
        <>
            <head>
                <title>4 Model AI Mới: Claude Opus 4.6, Sonnet 4.6, Gemini 3.1 Pro, Mercury 2 ⚡ | Phở Chat</title>
                <meta
                    content="Phở Chat cập nhật 4 model AI flagship mới nhất: Claude Opus 4.6, Claude Sonnet 4.6, Gemini 3.1 Pro và Mercury 2 — model AI nhanh nhất thế giới. Nâng cấp Medical Beta lên Tier 3."
                    name="description"
                />
                <meta content="Phở Chat, Claude Opus 4.6, Claude Sonnet 4.6, Gemini 3.1 Pro, Mercury 2, AI y khoa" name="keywords" />
                <meta content="🚀 4 Model AI Mới — Claude Opus 4.6, Gemini 3.1 Pro, Mercury 2 ⚡" property="og:title" />
                <meta content="Flagship models mới nhất + Mercury siêu nhanh 1000+ tok/s. Medical Beta nâng cấp Tier 3." property="og:description" />
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #0f1a2e 40%, #1a1a3a 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }

          .container { max-width: 880px; margin: 0 auto; padding: 48px 24px; }

          .back-link {
            display: inline-flex; align-items: center; gap: 8px;
            color: rgba(255,255,255,0.5); text-decoration: none;
            margin-bottom: 32px; font-size: 0.85rem; transition: color 0.2s;
          }
          .back-link:hover { color: #a855f7; }

          .badge {
            display: inline-block; padding: 6px 16px;
            background: linear-gradient(135deg, #8b5cf6, #d946ef);
            border-radius: 20px; font-size: 0.82rem; font-weight: 600;
            color: white; margin-bottom: 16px;
          }

          h1 {
            font-size: 2.2rem; font-weight: 800; line-height: 1.25;
            background: linear-gradient(135deg, #60a5fa 0%, #a855f7 40%, #f43f5e 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; margin-bottom: 10px;
          }

          .date { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-bottom: 48px; }

          /* Section cards */
          .section {
            position: relative;
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px; padding: 36px; margin-bottom: 28px;
            overflow: hidden; transition: border-color 0.3s;
          }
          .section:hover { border-color: rgba(139,92,246,0.25); }
          .section::before {
            content: ''; position: absolute; top: 0; left: -100%;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
            animation: borderBeam 5s infinite linear;
          }
          @keyframes borderBeam { 0% { left: -100%; } 100% { left: 100%; } }

          .section-icon { font-size: 2.2rem; margin-bottom: 12px; }
          h2 { font-size: 1.35rem; color: #fff; margin-bottom: 8px; }
          .section-desc { color: rgba(255,255,255,0.55); font-size: 0.88rem; margin-bottom: 20px; }

          /* Tags */
          .tag {
            display: inline-block; padding: 3px 10px; border-radius: 20px;
            font-size: 0.72rem; font-weight: 600; margin-left: 8px;
            vertical-align: middle;
          }
          .tag-flagship { background: rgba(239,68,68,0.2); color: #f87171; }
          .tag-tier2    { background: rgba(168,85,247,0.2); color: #c084fc; }
          .tag-tier1    { background: rgba(34,197,94,0.2);  color: #22c55e; }
          .tag-new      { background: rgba(59,130,246,0.2); color: #60a5fa; }
          .tag-medical  { background: rgba(244,63,94,0.2);  color: #fb7185; }

          /* Model table */
          .model-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .model-table th, .model-table td {
            padding: 14px 16px; text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            font-size: 0.9rem;
          }
          .model-table th { color: rgba(255,255,255,0.5); font-weight: 500; }
          .model-table td { color: rgba(255,255,255,0.8); }
          .model-table tr:hover td { background: rgba(139,92,246,0.04); }

          /* Feature list */
          ul { padding-left: 22px; }
          li { margin: 9px 0; line-height: 1.65; color: rgba(255,255,255,0.78); font-size: 0.95rem; }
          li::marker { color: #a855f7; }
          strong { color: #fff; }

          /* Mercury highlight box */
          .mercury-box {
            background: linear-gradient(135deg, rgba(250,204,21,0.08), rgba(251,146,60,0.06));
            border: 1px solid rgba(250,204,21,0.2);
            border-radius: 14px; padding: 24px; margin-top: 16px;
          }
          .speed-badge {
            display: inline-block; padding: 4px 12px;
            background: linear-gradient(135deg, #eab308, #f97316);
            border-radius: 20px; font-size: 0.75rem; font-weight: 700;
            color: #000; margin-bottom: 8px;
          }

          /* Medical Beta upgrade */
          .medical-box {
            background: linear-gradient(135deg, rgba(244,63,94,0.08), rgba(168,85,247,0.05));
            border: 1px solid rgba(244,63,94,0.2);
            border-radius: 14px; padding: 24px; margin-top: 16px;
          }

          /* CTA Section */
          .cta-section {
            text-align: center; padding: 56px 40px;
            background: rgba(34,197,94,0.04);
            border-radius: 24px;
            border: 1px solid rgba(34,197,94,0.2);
            margin: 48px 0 32px; position: relative;
          }
          .cta-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
          .cta-subtitle {
            color: rgba(255,255,255,0.7); font-size: 1rem;
            margin-bottom: 28px; line-height: 1.6;
          }
          .steps-guide {
            display: flex; justify-content: center; gap: 8px;
            margin-bottom: 28px; flex-wrap: wrap;
          }
          .step-item {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 16px; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px; font-size: 0.82rem; color: rgba(255,255,255,0.7);
          }
          .step-number {
            display: flex; align-items: center; justify-content: center;
            width: 22px; height: 22px; background: rgba(34,197,94,0.2);
            border-radius: 50%; font-size: 0.7rem; font-weight: 700;
            color: #22c55e; flex-shrink: 0;
          }
          .step-arrow { color: rgba(255,255,255,0.25); font-size: 0.8rem; }
          .cta-button {
            display: inline-block; padding: 16px 40px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white; font-weight: 700; font-size: 1.1rem;
            border-radius: 14px; text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative; z-index: 10;
          }
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(34,197,94,0.35);
          }
          .clerk-signin-trigger {
            display: inline-block; padding: 16px 40px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white; font-weight: 700; font-size: 1.1rem;
            border-radius: 14px; text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer; border: none; font-family: inherit;
          }
          .clerk-signin-trigger:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(34,197,94,0.35);
          }
          .cta-deadline { color: #fbbf24; font-size: 0.9rem; font-weight: 600; margin-top: 16px; }
          .cta-secondary {
            display: inline-block; color: rgba(255,255,255,0.5);
            text-decoration: none; font-size: 0.85rem; margin-top: 16px;
            transition: color 0.2s;
          }
          .cta-secondary:hover { color: #22c55e; }

          footer {
            text-align: center; margin-top: 56px;
            color: rgba(255,255,255,0.35); font-size: 0.82rem;
          }
          footer a { color: #a855f7; text-decoration: none; }

          @media (max-width: 768px) {
            .container { padding: 24px 16px; }
            h1 { font-size: 1.6rem; }
            .section { padding: 24px 20px; }
            .cta-section { padding: 32px 20px; }
            .steps-guide { gap: 6px; }
            .step-item { padding: 6px 12px; font-size: 0.75rem; }
            .step-arrow { display: none; }
          }
        `}</style>
            </head>

            <div className="container">
                <Link className="back-link" href="/blog">← Quay lại Blog</Link>

                <header>
                    <span className="badge">v1.135.5 · Changelog</span>
                    <h1>🚀 4 Model AI Mới — Flagship + Siêu Nhanh</h1>
                    <p className="date">26 tháng 2, 2026</p>
                </header>

                {/* ===== NEW MODELS TABLE ===== */}
                <div className="section">
                    <div className="section-icon">🤖</div>
                    <h2>4 Model AI Mới <span className="tag tag-new">HOT</span></h2>
                    <p className="section-desc">Cập nhật flagship models mới nhất từ Anthropic, Google & InceptionLabs</p>

                    <table className="model-table">
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Tier</th>
                                <th>Điểm nổi bật</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Claude Opus 4.6</strong></td>
                                <td><span className="tag tag-flagship" style={{ marginLeft: 0 }}>Tier 3</span></td>
                                <td>Model mạnh nhất Anthropic — suy luận sâu, phân tích y khoa phức tạp</td>
                            </tr>
                            <tr>
                                <td><strong>Claude Sonnet 4.6</strong></td>
                                <td><span className="tag tag-tier2" style={{ marginLeft: 0 }}>Tier 2</span></td>
                                <td>Cân bằng tốc độ & chất lượng — coding, viết nội dung xuất sắc</td>
                            </tr>
                            <tr>
                                <td><strong>Gemini 3.1 Pro</strong></td>
                                <td><span className="tag tag-flagship" style={{ marginLeft: 0 }}>Tier 3</span></td>
                                <td>Google flagship — 2M context, multimodal, Google Search tích hợp</td>
                            </tr>
                            <tr style={{ background: 'rgba(250,204,21,0.04)' }}>
                                <td><strong>Mercury 2 ⚡</strong></td>
                                <td><span className="tag tag-tier1" style={{ marginLeft: 0 }}>Miễn Phí</span></td>
                                <td>Model AI nhanh nhất thế giới — 1000+ tokens/giây 🔥</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== MERCURY HIGHLIGHT ===== */}
                <div className="section">
                    <div className="section-icon">⚡</div>
                    <h2>Mercury 2 — AI Nhanh Nhất Thế Giới</h2>
                    <p className="section-desc">Công nghệ Diffusion LLM sinh tokens song song, mang lại trải nghiệm phản hồi tức thì</p>

                    <div className="mercury-box">
                        <span className="speed-badge">⚡ 1000+ TOKENS/GIÂY</span>
                        <ul style={{ marginTop: '12px' }}>
                            <li><strong>Miễn phí (Tier 1)</strong> — tất cả users đều sử dụng được, không giới hạn</li>
                            <li><strong>128K context window</strong> — đọc tài liệu dài, phân tích code lớn</li>
                            <li><strong>Tool calling & Structured Outputs</strong> — tương thích plugins y khoa</li>
                            <li><strong>OpenAI-compatible API</strong> — ổn định, sẵn sàng production</li>
                        </ul>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '16px' }}>
                            💡 Tip: Dùng Mercury 2 khi cần câu trả lời nhanh, brainstorming, hoặc khi hết quota Tier 2/3
                        </p>
                    </div>
                </div>

                {/* ===== MEDICAL BETA UPGRADE ===== */}
                <div className="section">
                    <div className="section-icon">🏥</div>
                    <h2>Medical Beta Nâng Cấp <span className="tag tag-medical">Tier 3</span></h2>
                    <p className="section-desc">Bác sĩ sử dụng gói Medical Beta giờ có thể truy cập các model flagship</p>

                    <div className="medical-box">
                        <ul>
                            <li><strong>Claude Opus 4.6</strong> và <strong>Gemini 3.1 Pro</strong> — 5 lượt/ngày cho phân tích ca lâm sàng phức tạp</li>
                            <li><strong>Claude Sonnet 4.6</strong>, GPT-5.2, Gemini 2.5 Pro — 20 lượt/ngày cho tra cứu thường xuyên</li>
                            <li><strong>Mercury 2 ⚡</strong> + Gemini Flash + Llama 4 — không giới hạn cho câu hỏi nhanh</li>
                        </ul>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '16px' }}>
                            Tất cả với giá chỉ <strong style={{ color: '#22c55e' }}>999.000đ/năm</strong> ≈ 83K/tháng
                        </p>
                    </div>
                </div>

                {/* ===== SMART LIMIT WARNINGS ===== */}
                <div className="section">
                    <div className="section-icon">🔔</div>
                    <h2>Cảnh Báo Thông Minh</h2>
                    <p className="section-desc">Khi hết hạn mức model cao cấp, hệ thống tự động gợi ý model thay thế phù hợp</p>

                    <ul>
                        <li><strong>Hết Tier 3?</strong> → Hệ thống gợi ý Claude Sonnet 4.6, Gemini 2.5 Pro, GPT-5.2</li>
                        <li><strong>Hết Tier 2?</strong> → Chuyển sang Mercury 2 ⚡, Gemini Flash, Llama 4 Scout — miễn phí không giới hạn</li>
                        <li><strong>Reset hàng ngày</strong> — hạn mức reset lúc 0:00, không tích lũy</li>
                    </ul>
                </div>

                {/* ===== CTA: MEDICAL BETA 999K ===== */}
                <div className="cta-section" id="register">
                    <h2 className="cta-title">🏥 Nhân Ngày Thầy Thuốc Việt Nam 27/2</h2>
                    <p className="cta-subtitle">
                        Tặng bạn trọn bộ trợ lý AI y khoa với giá chỉ <strong style={{ color: '#22c55e' }}>999.000đ/năm</strong>
                        <br />
                        <span style={{ fontSize: '0.9rem' }}>
                            500.000 Phở Points/tháng · Unlimited AI Tier 1 · 20 lượt Tier 2 · 5 lượt Tier 3/ngày
                        </span>
                    </p>

                    <div className="steps-guide">
                        <div className="step-item">
                            <span className="step-number">1</span>
                            Đăng nhập / Đăng ký
                        </div>
                        <span className="step-arrow">→</span>
                        <div className="step-item">
                            <span className="step-number">2</span>
                            Chuyển khoản 999K
                        </div>
                        <span className="step-arrow">→</span>
                        <div className="step-item">
                            <span className="step-number">3</span>
                            Dùng ngay! ✨
                        </div>
                    </div>

                    <SignedIn>
                        <Link
                            className="cta-button"
                            href="/subscription/checkout?plan=medical_beta&provider=sepay"
                            onClick={() => handleCTAClick('changelog_cta_signed_in')}
                        >
                            ✨ Thanh Toán Medical Beta — 999K/năm
                        </Link>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton
                            forceRedirectUrl="/subscription/checkout?plan=medical_beta&provider=sepay"
                            mode="modal"
                        >
                            <button
                                className="clerk-signin-trigger"
                                onClick={() => handleCTAClick('changelog_cta_signed_out')}
                            >
                                ✨ Thanh Toán Medical Beta — 999K/năm
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <div className="cta-deadline">🎁 Ưu đãi Ngày Thầy Thuốc chỉ đến hết ngày 28/02/2026</div>
                    <br />
                    <Link className="cta-secondary" href="/">
                        Hoặc dùng thử miễn phí (50K points/tháng) →
                    </Link>
                </div>

                <footer>
                    <p>© 2026 <a href="https://pho.chat">Phở Chat</a>. Made with 💜 in Vietnam</p>
                </footer>
            </div>
        </>
    );
}
