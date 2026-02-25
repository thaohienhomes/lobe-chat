'use client';

import Link from 'next/link';

export default function DoctorsDayCampaignPage() {
  const handleCTAClick = (source: string) => {
    try {
      (window as any).posthog?.capture('doctors_day_cta_clicked', {
        campaign: 'ngay_thay_thuoc_2026',
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
        <title>Tri Ân Ngày Thầy Thuốc 27/2 | Phở Chat Medical — 999K/năm</title>
        <meta
          content="Nhân ngày Thầy Thuốc Việt Nam 27/2, Phở Chat ưu đãi gói Medical Beta — trợ lý AI y khoa chỉ 999K/năm. PubMed, ClinicalTrials, Drug Check, 10 Calculator lâm sàng."
          name="description"
        />
        <meta content="Phở Chat, Ngày Thầy Thuốc, AI y khoa, Medical Beta, PubMed, bác sĩ Việt Nam" name="keywords" />
        <meta content="🏥 Tri Ân Ngày Thầy Thuốc Việt Nam 27/2 — Phở Chat Medical" property="og:title" />
        <meta content="Trợ lý AI y khoa chỉ 999K/năm. PubMed, Drug Check, 10 Clinical Calculators tích hợp sẵn." property="og:description" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #0f2027 40%, #1a1a3a 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }

          .campaign-container {
            max-width: 920px;
            margin: 0 auto;
            padding: 40px 24px;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            margin-bottom: 32px;
            font-size: 0.85rem;
            transition: color 0.2s;
          }
          .back-link:hover { color: #22c55e; }

          /* ========== HERO ========== */
          .hero {
            text-align: center;
            margin-bottom: 56px;
            position: relative;
          }

          .event-badge {
            display: inline-block;
            padding: 8px 20px;
            background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
            border-radius: 24px;
            font-size: 0.85rem;
            font-weight: 700;
            color: white;
            margin-bottom: 20px;
            animation: pulse 2s ease-in-out infinite;
            letter-spacing: 0.5px;
          }

          .deadline-badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(234, 179, 8, 0.15);
            border: 1px solid rgba(234, 179, 8, 0.4);
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            color: #fbbf24;
            margin-left: 8px;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.02); }
          }

          .hero-title {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #f43f5e 0%, #ffffff 40%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            line-height: 1.15;
            filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.2));
          }

          .hero-subtitle {
            color: rgba(255, 255, 255, 0.75);
            font-size: 1.15rem;
            line-height: 1.7;
            max-width: 700px;
            margin: 0 auto 32px;
          }

          .hero-price-box {
            display: inline-block;
            padding: 20px 40px;
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.25);
            border-radius: 16px;
            margin-bottom: 8px;
          }

          .hero-price {
            font-size: 2.5rem;
            font-weight: 800;
            color: #22c55e;
            text-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
          }

          .hero-price-note {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            margin-top: 4px;
          }

          .hero-price-old {
            text-decoration: line-through;
            color: rgba(255, 255, 255, 0.4);
            font-size: 1.1rem;
          }

          /* ========== SECTIONS ========== */
          .section-card {
            position: relative;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 32px;
            overflow: hidden;
            transition: border-color 0.3s;
          }
          .section-card:hover {
            border-color: rgba(34, 197, 94, 0.25);
          }

          .section-card::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, transparent, #22c55e, transparent);
            animation: borderBeam 5s infinite linear;
          }
          @keyframes borderBeam {
            0% { left: -100%; }
            100% { left: 100%; }
          }

          .section-icon {
            font-size: 2.5rem;
            margin-bottom: 16px;
          }

          .section-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }

          .section-subtitle {
            color: rgba(255,255,255,0.5);
            font-size: 0.9rem;
            margin-bottom: 24px;
          }

          .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .feature-item {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            transition: background 0.2s;
          }
          .feature-item:hover {
            background: rgba(34, 197, 94, 0.05);
          }

          .new-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            padding: 2px 8px;
            background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
            color: white;
            font-size: 0.6rem;
            font-weight: 700;
            border-radius: 0 10px 0 8px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            animation: badgePulse 2.5s ease-in-out infinite;
            z-index: 2;
          }
          @keyframes badgePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.75; }
          }

          .feature-emoji { font-size: 1.5rem; flex-shrink: 0; }

          .feature-name {
            font-weight: 600;
            color: #fff;
            font-size: 0.95rem;
            margin-bottom: 4px;
          }

          .feature-desc {
            color: rgba(255,255,255,0.6);
            font-size: 0.82rem;
            line-height: 1.5;
          }

          /* ========== PROMPT EXAMPLES ========== */
          .prompt-box {
            background: rgba(34, 197, 94, 0.06);
            border-left: 3px solid #22c55e;
            border-radius: 0 10px 10px 0;
            padding: 16px 20px;
            margin: 20px 0;
            font-size: 0.92rem;
            color: rgba(255,255,255,0.9);
            line-height: 1.6;
          }
          .prompt-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #22c55e;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          /* ========== COMPARISON ========== */
          .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }
          .comparison-table th {
            background: rgba(34, 197, 94, 0.12);
            color: #22c55e;
            padding: 12px 14px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            border-bottom: 1px solid rgba(34, 197, 94, 0.2);
          }
          .comparison-table td {
            padding: 10px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 0.88rem;
            color: rgba(255,255,255,0.8);
          }
          .comparison-table tr:hover td {
            background: rgba(34, 197, 94, 0.03);
          }

          /* ========== CTA ========== */
          .cta-section {
            text-align: center;
            padding: 56px 40px;
            background: rgba(34, 197, 94, 0.04);
            border-radius: 24px;
            border: 1px solid rgba(34, 197, 94, 0.2);
            margin: 48px 0 32px;
            position: relative;
          }

          .cta-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 12px;
          }

          .cta-subtitle {
            color: rgba(255,255,255,0.7);
            font-size: 1rem;
            margin-bottom: 28px;
            line-height: 1.6;
          }

          .cta-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            border-radius: 14px;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
            z-index: 10;
          }
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(34, 197, 94, 0.35);
          }

          .cta-deadline {
            color: #fbbf24;
            font-size: 0.9rem;
            font-weight: 600;
            margin-top: 16px;
          }

          .cta-secondary {
            display: inline-block;
            color: rgba(255,255,255,0.6);
            text-decoration: none;
            font-size: 0.85rem;
            margin-top: 16px;
            transition: color 0.2s;
          }
          .cta-secondary:hover { color: #22c55e; }

          /* ========== STATS ========== */
          .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: 32px 0;
          }
          .stat-item {
            text-align: center;
            padding: 20px 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
          }
          .stat-number {
            font-size: 1.8rem;
            font-weight: 800;
            color: #22c55e;
          }
          .stat-label {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
          }

          .footer {
            text-align: center;
            padding: 24px;
            color: rgba(255,255,255,0.4);
            font-size: 0.85rem;
          }
          .footer a { color: #22c55e; text-decoration: none; }

          @media (max-width: 768px) {
            .campaign-container { padding: 24px 16px; }
            .hero-title { font-size: 1.8rem; }
            .hero-price { font-size: 1.8rem; }
            .section-card { padding: 24px 20px; }
            .feature-grid { grid-template-columns: 1fr; }
            .stats-row { grid-template-columns: repeat(2, 1fr); }
            .cta-section { padding: 32px 20px; }
          }
        `}</style>
      </head>

      <div className="campaign-container">
        <Link className="back-link" href="/">← Quay lại Phở Chat</Link>

        {/* ===== HERO ===== */}
        <section className="hero">
          <div>
            <span className="event-badge">🏥 Ngày Thầy Thuốc Việt Nam 27/2</span>
            <span className="deadline-badge">⏰ Ưu đãi đến 28/2</span>
          </div>
          <h1 className="hero-title">
            Tri Ân Thầy Thuốc —<br />
            Trợ Lý AI Y Khoa Chỉ Từ 83K/Tháng
          </h1>
          <p className="hero-subtitle">
            Phở Chat Medical tích hợp sẵn <strong style={{ color: '#fff' }}>4 cơ sở dữ liệu quốc tế</strong>,{' '}
            <strong style={{ color: '#fff' }}>10 công cụ tính toán lâm sàng</strong>, và{' '}
            <strong style={{ color: '#fff' }}>trích dẫn tự động</strong> — được thiết kế riêng cho bác sĩ, dược sĩ, và nghiên cứu sinh Việt Nam.
          </p>
          <div className="hero-price-box">
            <div className="hero-price-old">2.400.000đ/năm</div>
            <div className="hero-price">999.000đ/năm</div>
            <div className="hero-price-note">≈ 83K/tháng · Tiết kiệm 83% so với ChatGPT Plus</div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-number">4</div>
            <div className="stat-label">Cơ sở dữ liệu<br />y khoa quốc tế</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10</div>
            <div className="stat-label">Công cụ tính toán<br />lâm sàng</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">500K</div>
            <div className="stat-label">Phở Points<br />mỗi tháng</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Hỗ trợ<br />tiếng Việt</div>
          </div>
        </div>

        {/* ===== SECTION 1: TRA CỨU ===== */}
        <div className="section-card">
          <div className="section-icon">🔬</div>
          <h2 className="section-title">Tra Cứu Nghiên Cứu Từ 4 Cơ Sở Dữ Liệu — Trong Vài Giây</h2>
          <p className="section-subtitle">Thay vì mở 4 tab, chỉ cần 1 câu hỏi tiếng Việt</p>

          <div className="feature-grid">
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">📚</span>
              <div>
                <div className="feature-name">PubMed — 36 triệu bài báo</div>
                <div className="feature-desc">Tìm kiếm thông minh với MeSH terms, phân trang, link DOI/PMID trực tiếp</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">🌐</span>
              <div>
                <div className="feature-name">OpenAlex — 250 triệu bài</div>
                <div className="feature-desc">Mở rộng tìm kiếm ra toàn bộ lĩnh vực khoa học, kỹ thuật y sinh</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">🧪</span>
              <div>
                <div className="feature-name">ClinicalTrials.gov</div>
                <div className="feature-desc">Thử nghiệm lâm sàng đang tuyển bệnh nhân, giai đoạn I–IV</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">💊</span>
              <div>
                <div className="feature-name">FDA Drug Database</div>
                <div className="feature-desc">Drug labels, cảnh báo an toàn, tương tác thuốc chính thống từ FDA</div>
              </div>
            </div>
          </div>

          <div className="prompt-box">
            <div className="prompt-label">💬 Ví dụ prompt</div>
            &quot;Tìm 10 bài meta-analysis mới nhất về metformin trong đái tháo đường type 2, kèm kiểm tra thử nghiệm lâm sàng đang tuyển bệnh nhân&quot;
          </div>
        </div>

        {/* ===== SECTION 2: VIẾT BÀI ===== */}
        <div className="section-card">
          <div className="section-icon">✍️</div>
          <h2 className="section-title">Viết Bài Khoa Học Nhanh Gấp 3 Lần</h2>
          <p className="section-subtitle">Citation tự động + PICO + GRADE + IMRAD — tất cả trong 1 cuộc trò chuyện</p>

          <div className="feature-grid">
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">📝</span>
              <div>
                <div className="feature-name">Citation Manager</div>
                <div className="feature-desc">PMID/DOI → APA, Vancouver, BibTeX tức thì. Không cần Zotero</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">🎯</span>
              <div>
                <div className="feature-name">PICO Framework</div>
                <div className="feature-desc">Tự động phân tích câu hỏi nghiên cứu theo Patient, Intervention, Comparison, Outcome</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">📊</span>
              <div>
                <div className="feature-name">GRADE Evidence</div>
                <div className="feature-desc">Đánh giá mức độ tin cậy bằng chứng: Cao → Trung bình → Thấp</div>
              </div>
            </div>
            <div className="feature-item">
              <span className="new-badge">Mới</span>
              <span className="feature-emoji">🇻🇳</span>
              <div>
                <div className="feature-name">Tổng hợp tiếng Việt</div>
                <div className="feature-desc">Hỏi tiếng Việt, dữ liệu quốc tế, kết quả tổng hợp tiếng Việt</div>
              </div>
            </div>
          </div>

          <div className="prompt-box">
            <div className="prompt-label">💬 Ví dụ prompt</div>
            &quot;Viết literature review tổng hợp về statin trong dự phòng tim mạch ở bệnh nhân đái tháo đường, đánh giá evidence theo GRADE, trích dẫn Vancouver&quot;
          </div>
        </div>

        {/* ===== SECTION 3: LÂM SÀNG ===== */}
        <div className="section-card">
          <div className="section-icon">🧮</div>
          <h2 className="section-title">10 Công Cụ Tính Toán Lâm Sàng — Ngay Trong Chat</h2>
          <p className="section-subtitle">Không cần mở Google — gõ 1 câu, ra kết quả kèm diễn giải</p>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Công cụ</th>
                <th>Ứng dụng lâm sàng</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><strong>eGFR (CKD-EPI)</strong></td><td>Đánh giá chức năng thận → chỉnh liều thuốc</td></tr>
              <tr><td><strong>CrCl (Cockcroft-Gault)</strong></td><td>Clearance creatinine → chỉnh liều kháng sinh</td></tr>
              <tr><td><strong>MELD / MELD-Na</strong></td><td>Mức độ nặng bệnh gan → ưu tiên ghép gan</td></tr>
              <tr><td><strong>CHA₂DS₂-VASc</strong></td><td>Nguy cơ đột quỵ trong rung nhĩ → chỉ định kháng đông</td></tr>
              <tr><td><strong>Wells Score</strong></td><td>Nguy cơ huyết khối tĩnh mạch sâu (DVT/PE)</td></tr>
              <tr><td><strong>Glasgow Coma Scale</strong></td><td>Đánh giá ý thức trong cấp cứu</td></tr>
              <tr><td><strong>APGAR Score</strong></td><td>Đánh giá sơ sinh tại phòng sinh</td></tr>
              <tr><td><strong>BMI</strong></td><td>Đánh giá thể trạng dinh dưỡng</td></tr>
              <tr><td><strong>Corrected Na</strong></td><td>Na hiệu chỉnh khi tăng đường huyết</td></tr>
              <tr><td><strong>NNT</strong></td><td>Nghiên cứu: số cần điều trị để ngăn 1 biến cố</td></tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div className="prompt-box" style={{ flex: 1, minWidth: '280px' }}>
              <div className="prompt-label">💬 Tính GFR</div>
              &quot;Bệnh nhân nữ 72 tuổi, 55kg, creatinine 2.1. Tính eGFR và CrCl&quot;
            </div>
            <div className="prompt-box" style={{ flex: 1, minWidth: '280px' }}>
              <div className="prompt-label">💬 Kiểm tra tương tác</div>
              &quot;Kiểm tra tương tác giữa warfarin, aspirin và omeprazole&quot;
            </div>
          </div>
        </div>

        {/* ===== SO SÁNH ===== */}
        <div className="section-card">
          <div className="section-icon">⚡</div>
          <h2 className="section-title">So Sánh: Tra Cứu Thủ Công vs Phở Chat</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Công việc</th>
                <th>Thủ công</th>
                <th style={{ color: '#22c55e' }}>Phở Chat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tìm 10 bài PubMed + đọc abstract</td>
                <td>30–45 phút</td>
                <td style={{ color: '#22c55e', fontWeight: 600 }}>30 giây</td>
              </tr>
              <tr>
                <td>Kiểm tra thử nghiệm lâm sàng</td>
                <td>15–20 phút</td>
                <td style={{ color: '#22c55e', fontWeight: 600 }}>15 giây</td>
              </tr>
              <tr>
                <td>Tính GFR + MELD + tương tác thuốc</td>
                <td>10 phút (3 trang web)</td>
                <td style={{ color: '#22c55e', fontWeight: 600 }}>10 giây (1 câu)</td>
              </tr>
              <tr>
                <td>Tổng hợp bằng tiếng Việt</td>
                <td>1–2 giờ</td>
                <td style={{ color: '#22c55e', fontWeight: 600 }}>1 phút</td>
              </tr>
              <tr style={{ borderTop: '2px solid rgba(34,197,94,0.3)' }}>
                <td><strong>Tổng cộng</strong></td>
                <td><strong>~3 giờ</strong></td>
                <td style={{ color: '#22c55e', fontSize: '1.05rem', fontWeight: 700 }}>~2 phút</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== CTA SECTION ===== */}
        <div className="cta-section" id="register">
          <h2 className="cta-title">🏥 Nhân Ngày Thầy Thuốc Việt Nam 27/2</h2>
          <p className="cta-subtitle">
            Tặng bạn trọn bộ trợ lý AI y khoa với giá chỉ <strong style={{ color: '#22c55e' }}>999.000đ/năm</strong>
            <br />
            <span style={{ fontSize: '0.9rem' }}>500.000 Phở Points/tháng · Unlimited AI Tier 1 · 20 lượt Tier 2/ngày</span>
          </p>
          <a
            className="cta-button"
            href="https://pho.chat/subscription/checkout?plan=medical_beta&provider=sepay"
            onClick={() => handleCTAClick('main_cta')}
            rel="noreferrer"
            target="_blank"
          >
            🩺 Đăng Ký Medical Beta — 999K/năm
          </a>
          <div className="cta-deadline">⏰ Ưu đãi Ngày Thầy Thuốc chỉ đến hết ngày 28/02/2026</div>
          <div>
            <a
              className="cta-secondary"
              href="https://pho.chat"
              onClick={() => handleCTAClick('free_trial')}
            >
              Hoặc dùng thử miễn phí (50K points/tháng) →
            </a>
          </div>
        </div>

        {/* ===== DISCLAIMER ===== */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.82rem',
          lineHeight: 1.7,
          marginBottom: '24px',
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          ⚕️ Phở Chat cung cấp công cụ tra cứu và tính toán tham khảo. Kết quả không thay thế đánh giá lâm sàng của bác sĩ.
          <br />Luôn xác nhận kết quả với nguồn chính thức trước khi đưa ra quyết định điều trị.
        </div>

        <footer className="footer">
          <p>
            <a href="https://pho.chat">Phở Chat</a> — Trợ lý AI thông minh cho người Việt
            <br />
            <span style={{ fontSize: '0.78rem' }}>© 2026 Phở Chat. Chúc mừng Ngày Thầy Thuốc Việt Nam 27/2 🏥</span>
          </p>
        </footer>
      </div>
    </>
  );
}
