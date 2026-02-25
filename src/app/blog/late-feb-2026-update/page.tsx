'use client';

import Link from 'next/link';

export default function LateFeb2026UpdatePage() {
    return (
        <html lang="vi">
            <head>
                <title>Phở Chat — Plugins Y Khoa Nâng Cấp & Model AI Mới (Tháng 2/2026)</title>
                <meta
                    content="PubMed v2, Drug Interactions mở rộng 42 thuốc, OpenAlex, 3 model AI mới và nhiều cải tiến trải nghiệm."
                    name="description"
                />
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f35 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }
          .container { max-width: 860px; margin: 0 auto; padding: 48px 24px; }
          .back-link {
            display: inline-flex; align-items: center; gap: 8px;
            color: rgba(255,255,255,0.5); text-decoration: none;
            margin-bottom: 32px; font-size: 0.9rem; transition: color 0.2s;
          }
          .back-link:hover { color: #a855f7; }
          .badge {
            display: inline-block; padding: 6px 16px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 20px; font-size: 0.82rem; font-weight: 600;
            color: white; margin-bottom: 16px;
          }
          h1 {
            font-size: 2.1rem; font-weight: 700;
            background: linear-gradient(135deg, #a855f7, #ec4899, #f97316);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; margin-bottom: 10px; line-height: 1.3;
          }
          .date { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin-bottom: 48px; }
          .section {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px; padding: 36px; margin-bottom: 24px;
          }
          .section-icon { font-size: 2rem; margin-bottom: 12px; }
          h2 { font-size: 1.35rem; color: #fff; margin-bottom: 8px; }
          .tag {
            display: inline-block; padding: 3px 10px; border-radius: 20px;
            font-size: 0.72rem; font-weight: 600; margin-left: 8px;
            vertical-align: middle;
          }
          .tag-v2    { background: rgba(59,130,246,0.2);  color: #60a5fa; }
          .tag-new   { background: rgba(168,85,247,0.2); color: #c084fc; }
          .tag-free  { background: rgba(34,197,94,0.2);  color: #22c55e; }
          .section-desc { color: rgba(255,255,255,0.55); font-size: 0.88rem; margin-bottom: 20px; }
          ul { padding-left: 22px; }
          li { margin: 9px 0; line-height: 1.65; color: rgba(255,255,255,0.78); font-size: 0.95rem; }
          li::marker { color: #a855f7; }
          strong { color: #fff; }
          .demo-gif {
            width: 100%; border-radius: 14px; margin-top: 20px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .model-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .model-table th, .model-table td {
            padding: 12px 16px; text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            font-size: 0.9rem;
          }
          .model-table th { color: rgba(255,255,255,0.5); font-weight: 500; }
          .model-table td { color: rgba(255,255,255,0.8); }
          .cta-section { text-align: center; margin-top: 48px; }
          .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #d946ef);
            color: #fff; text-decoration: none;
            padding: 16px 40px; border-radius: 14px;
            font-weight: 600; font-size: 1rem;
            box-shadow: 0 4px 24px rgba(139,92,246,0.35);
            transition: all 0.3s;
          }
          .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(139,92,246,0.5); }
          footer { text-align: center; margin-top: 56px; color: rgba(255,255,255,0.35); font-size: 0.82rem; }
          footer a { color: #a855f7; text-decoration: none; }
        `}</style>
            </head>
            <body>
                <div className="container">
                    <Link className="back-link" href="/blog">← Quay lại Blog</Link>

                    <header>
                        <span className="badge">v1.135 · Changelog</span>
                        <h1>🔬 Plugins Y Khoa Nâng Cấp & Model AI Mới</h1>
                        <p className="date">25 tháng 2, 2026</p>
                    </header>

                    {/* PubMed v2 */}
                    <div className="section">
                        <div className="section-icon">🔬</div>
                        <h2>PubMed Search <span className="tag tag-v2">v2</span></h2>
                        <p className="section-desc">Nâng cấp toàn diện engine tìm kiếm y văn</p>
                        <ul>
                            <li><strong>Phân trang (Pagination)</strong> — duyệt hàng trăm kết quả, không giới hạn 10 bài</li>
                            <li><strong>Tổng số kết quả</strong> — hiển thị tổng số bài trên toàn PubMed</li>
                            <li><strong>MeSH Terms</strong> — hỗ trợ cú pháp chuẩn y khoa, gợi ý tự động</li>
                            <li><strong>Clickable URLs</strong> — link PubMed + DOI trực tiếp trong kết quả</li>
                            <li><strong>Keywords & MeSH tags</strong> — trích xuất từ khóa từ mỗi bài</li>
                            <li><strong>Sắp xếp</strong> theo độ liên quan hoặc ngày đăng</li>
                        </ul>
                        <img alt="Demo PubMed Search v2" className="demo-gif" src="/demos/pubmed-demo.gif" />
                    </div>

                    {/* Drug Interactions */}
                    <div className="section">
                        <div className="section-icon">💊</div>
                        <h2>Drug Interactions <span className="tag tag-new">Mở Rộng</span></h2>
                        <p className="section-desc">Cơ sở dữ liệu tương tác thuốc toàn diện hơn</p>
                        <ul>
                            <li><strong>42 thuốc</strong> được ánh xạ đầy đủ (từ 10 thuốc ban đầu)</li>
                            <li><strong>10 nhóm dược lý</strong>: kháng đông, kháng sinh, tim mạch, tiểu đường, thần kinh...</li>
                            <li><strong>Adverse Events</strong> — tra cứu tác dụng phụ từ FDA database</li>
                            <li>Mức độ: 🔴 Cao / 🟡 Trung bình / 🟢 Thấp — có giải thích cơ chế</li>
                            <li>Nguồn: FDA labels, Lexicomp, clinical pharmacology references</li>
                        </ul>
                        <img alt="Demo Drug Interactions" className="demo-gif" src="/demos/drug-interactions-demo.gif" />
                    </div>

                    {/* Clinical Calculator */}
                    <div className="section">
                        <div className="section-icon">🩺</div>
                        <h2>Clinical Calculator <span className="tag tag-new">Cải Tiến</span></h2>
                        <p className="section-desc">Tính toán lâm sàng ổn định hơn</p>
                        <ul>
                            <li>eGFR (CKD-EPI 2021), BMI, MELD, MELD-Na, CrCl, CHA₂DS₂-VASc, Anion Gap, NNT, Osmolality</li>
                            <li>Tham số boolean tùy chọn (female, black race) không còn gây lỗi khi thiếu</li>
                            <li>Trả về giải thích lâm sàng rõ ràng cho từng kết quả</li>
                        </ul>
                        <img alt="Demo Clinical Calculator" className="demo-gif" src="/demos/clinical-calc-demo.gif" />
                    </div>

                    {/* New Plugins */}
                    <div className="section">
                        <div className="section-icon">🆕</div>
                        <h2>Plugins Mới</h2>
                        <ul>
                            <li><strong>OpenAlex</strong> — tra cứu hàng triệu công trình học thuật (citation index, authors, institutions)</li>
                            <li><strong>Clinical Trials</strong> — tìm thử nghiệm lâm sàng toàn cầu từ ClinicalTrials.gov</li>
                        </ul>
                    </div>

                    {/* New Models */}
                    <div className="section">
                        <div className="section-icon">🤖</div>
                        <h2>3 Model AI Mới</h2>
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
                                    <td><strong>Kimi K2</strong> (Moonshot AI)</td>
                                    <td><span className="tag tag-new" style={{ marginLeft: 0 }}>Tier 2</span></td>
                                    <td>MoE 1T params, tool calling xuất sắc, 128K context</td>
                                </tr>
                                <tr>
                                    <td><strong>Gemma 3 27B</strong> (Google)</td>
                                    <td><span className="tag tag-free" style={{ marginLeft: 0 }}>Miễn Phí</span></td>
                                    <td>Nhanh, nhẹ, hỗ trợ plugin tốt</td>
                                </tr>
                                <tr>
                                    <td><strong>Llama 4 Scout</strong> (Meta)</td>
                                    <td><span className="tag tag-free" style={{ marginLeft: 0 }}>Miễn Phí</span></td>
                                    <td>Chuyển từ Tier 2 → Free users được hưởng!</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* UX */}
                    <div className="section">
                        <div className="section-icon">✨</div>
                        <h2>Cải Tiến Trải Nghiệm</h2>
                        <ul>
                            <li>Plugin tự động chuyển sang model phù hợp khi quota hết — không bị gián đoạn</li>
                            <li>Thông báo quota rõ ràng hơn, gợi ý model thay thế</li>
                            <li>Cải thiện hiệu suất và độ ổn định tổng thể</li>
                        </ul>
                    </div>

                    {/* 999K Medical Beta Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.08))',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '18px',
                        marginTop: '40px',
                        padding: '36px 32px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏥</div>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>
                            Dùng Phở Chat cho Nghiên Cứu & Học Thuật
                        </h2>
                        <div style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 800, margin: '8px 0', textShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
                            chỉ 999.000đ / năm
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 24px' }}>
                            Truy cập không giới hạn tất cả plugins y khoa & học thuật:<br />
                            PubMed, OpenAlex, ClinicalTrials, Drug Interactions,<br />
                            Clinical Calculator, DOI Resolver, Citation Manager...
                        </p>
                        <a
                            href="https://pho.chat/subscription/checkout?plan=medical_beta&provider=sepay"
                            style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
                                color: '#fff',
                                display: 'inline-block',
                                fontSize: '1rem',
                                fontWeight: 700,
                                padding: '14px 36px',
                                textDecoration: 'none',
                            }}
                        >
                            🩺 Đăng Ký Medical Beta →
                        </a>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: '16px 0 0' }}>
                            ≈ 83K/tháng · Tiết kiệm 83% so với ChatGPT Plus
                        </p>
                    </div>

                    <footer>
                        <p>© 2026 <a href="https://pho.chat">Phở Chat</a>. Made with 💜 in Vietnam</p>
                    </footer>
                </div>
            </body>
        </html>
    );
}
