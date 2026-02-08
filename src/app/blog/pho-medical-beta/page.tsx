'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';
import { Flexbox } from 'react-layout-kit';

const medicalBetaContent = `
## Phở Chat Medical — Trợ Lý AI Lâm Sàng Đầu Tiên Cho Bác Sĩ Việt Nam

### 🩺 Vấn Đề

Bác sĩ & dược sĩ Việt Nam đang dùng ChatGPT để tra cứu y khoa, nhưng:
- **Drug Interaction?** ChatGPT hallucinate — không tin được
- **PubMed?** Phải tab ra ngoài, copy-paste DOI
- **Calculator y khoa?** Tính BMI, GFR, MELD bằng tay hoặc Google
- **LaTeX paper?** Không thể upload và chat trực tiếp

### ✅ Giải Pháp: Phở Chat Medical

**6 plugin chuyên biệt** tích hợp sẵn, không cần cài thêm:

| Plugin | Mô tả |
|--------|-------|
| 🔬 **PubMed Search** | Tìm paper trực tiếp — title, abstract, MeSH terms |
| 📄 **ArXiv Search** | Paper AI/ML y sinh — preprints mới nhất |
| 💊 **Drug Interaction Check** | 42 thuốc, 10 nhóm dược lý — severity + khuyến cáo |
| 🧮 **Clinical Calculator** | BMI, GFR, MELD, CHA₂DS₂-VASc — chính xác 100% |
| 📚 **Semantic Scholar** | Tìm kiếm học thuật nâng cao — citation graph |
| 🔗 **DOI Resolver** | Tra cứu paper theo DOI — metadata CrossRef |

**Bonus tích hợp sẵn:**
- 📐 **LaTeX Loader** — Upload file .tex, parse & chat trực tiếp
- 📋 **BibliographySection** — Citation định dạng IEEE tự động
- 🔍 **Grounding Citations** — Trích dẫn nguồn từ web search

### 💰 Giá Ưu Đãi Early Bird

| | Chi tiết |
|---|---------|
| **Giá** | **999.000 VNĐ/năm** (~83k/tháng, ~$40 USD) |
| **Phở Points** | 500.000 điểm/tháng |
| **AI Models** | Unlimited Tier 1 + 20 Tier 2/ngày |
| **So với ChatGPT Plus** | Tiết kiệm **83%** ($40 vs $240/năm) |

### 🏥 So Sánh Với Đối Thủ

| | ChatGPT | OpenAI Prism | **Phở Medical** |
|---|---------|-------------|-----------------|
| PubMed tích hợp | ❌ | ❌ | ✅ |
| Drug Interaction | ❌ Hallucinate | ❌ | ✅ 42 thuốc |
| Clinical Calculator | ❌ | ❌ | ✅ |
| LaTeX support | ❌ | ✅ Editor | ✅ Loader + Parser |
| Citation IEEE | ❌ | ✅ | ✅ |
| Tiếng Việt y khoa | Trung bình | ❌ | ✅ Tối ưu |
| Giá/năm | $240 | Miễn phí* | **$40** |

*\\*Prism hiện miễn phí nhưng có thể thu phí khi hết beta*

### 🚀 Cách Đăng Ký

1. **Đăng ký** tài khoản Phở Chat tại [pho.chat](https://pho.chat)
2. **Chuyển khoản** 999.000 VNĐ qua Sepay/VietQR
3. **Nhận promo code** qua Zalo/Email sau khi xác nhận
4. **Kích hoạt** tại Settings → nhập code → xong!

> **⏰ Chỉ 200 suất Early Bird!** Giá sẽ tăng lên 1.499k–1.999k sau Tết.

### 💬 Cộng Đồng

Tham gia **Zalo Group "Phở Medical Founding Team"** để:
- 🐛 Report bugs trực tiếp
- 💡 Đề xuất tính năng mới
- 🤝 Kết nối với đồng nghiệp y khoa
- 🏅 Nhận badge "Medical Pioneer" trên profile

### ❓ FAQ

**Q: Tôi cần cài thêm gì không?**
A: Không! Tất cả 6 plugins đã tích hợp sẵn. Chỉ cần đăng nhập và dùng.

**Q: Dữ liệu Drug Interaction có đáng tin không?**
A: Database dựa trên FDA labels và Lexicomp, 42 thuốc phổ biến nhất. Luôn double-check với dược thư và tham khảo bác sĩ.

**Q: Có hỗ trợ mobile không?**
A: Có! Phở Chat responsive 100%, dùng tốt trên điện thoại khi đi buồng.

**Q: Sau khi hết 1 năm thì sao?**
A: Gia hạn theo giá mới (có ưu đãi cho early adopters). Points reset hàng tháng.
`;

export default function MedicalBetaPage() {
    return (
        <html lang="vi">
            <head>
                <title>Phở Chat Medical — Trợ Lý AI Lâm Sàng | 999k/năm</title>
                <meta
                    content="Trợ lý AI y khoa đầu tiên cho bác sĩ Việt Nam. PubMed, Drug Interaction, Clinical Calculator tích hợp sẵn. Chỉ 999k VNĐ/năm."
                    name="description"
                />
                <meta content="Phở Chat Medical, AI y khoa, PubMed, Drug Interaction, Clinical Calculator, bác sĩ" name="keywords" />
                <meta content="Phở Chat Medical — Trợ Lý AI Lâm Sàng" property="og:title" />
                <meta content="PubMed, Drug Interaction, Clinical Calculator tích hợp sẵn. 999k VNĐ/năm." property="og:description" />
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #0f2027 40%, #1a1a3a 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }
          
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 48px 24px;
          }
          
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            margin-bottom: 32px;
            font-size: 0.9rem;
            transition: color 0.2s;
          }
          
          .back-link:hover {
            color: #22c55e;
          }
          
          .header {
            margin-bottom: 48px;
            text-align: center;
          }
          
          .beta-badge {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(135deg, #22c55e 0%, #059669 100%);
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
            margin-bottom: 16px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          .title {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
            line-height: 1.2;
          }
          
          .subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.1rem;
            line-height: 1.5;
          }
          
          .content {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 48px;
          }
          
          h2 {
            font-size: 1.5rem;
            color: #fff;
            margin-bottom: 24px;
          }
          
          h3 {
            font-size: 1.15rem;
            color: #22c55e;
            margin-top: 32px;
            margin-bottom: 16px;
          }
          
          ul, ol {
            padding-left: 24px;
          }
          
          li {
            margin: 10px 0;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.8);
          }
          
          li::marker {
            color: #22c55e;
          }
          
          strong {
            color: #fff;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          
          th {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            border-bottom: 1px solid rgba(34, 197, 94, 0.3);
          }
          
          td {
            padding: 10px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          
          blockquote {
            border-left: 3px solid #22c55e;
            padding: 12px 20px;
            margin: 20px 0;
            background: rgba(34, 197, 94, 0.08);
            border-radius: 0 8px 8px 0;
          }
          
          .cta-section {
            text-align: center;
            margin-top: 48px;
            padding: 32px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-radius: 16px;
            border: 1px solid rgba(34, 197, 94, 0.2);
          }
          
          .cta-button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            font-weight: 600;
            font-size: 1.05rem;
            border-radius: 12px;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
          }
          
          .footer {
            text-align: center;
            margin-top: 48px;
            color: rgba(255, 255, 255, 0.5);
          }
          
          .footer a {
            color: #22c55e;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            .content { padding: 24px 16px; }
            .title { font-size: 1.75rem; }
            .container { padding: 24px 16px; }
          }
        `}</style>
            </head>
            <body>
                <div className="container">
                    <Link className="back-link" href="/blog">
                        ← Quay lại Blog
                    </Link>

                    <header className="header">
                        <span className="beta-badge">🏥 Early Bird — Chỉ 200 suất</span>
                        <h1 className="title">Phở Chat Medical</h1>
                        <p className="subtitle">
                            Trợ lý AI lâm sàng duy nhất có PubMed, Drug Check, Calculator Y khoa VÀ LaTeX/Citation.
                            <br />Chỉ 999k VNĐ/năm.
                        </p>
                    </header>

                    <main className="content">
                        <Flexbox gap={24}>
                            <Markdown>{medicalBetaContent}</Markdown>
                        </Flexbox>
                    </main>

                    <div className="cta-section">
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '16px' }}>
                            Sẵn sàng nâng cấp workflow y khoa?
                        </p>
                        <a className="cta-button" href="https://pho.chat">
                            🏥 Đăng Ký Medical Beta
                        </a>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '12px' }}>
                            Early Bird: 999k VNĐ/năm · Giá tăng sau Tết
                        </p>
                    </div>

                    <footer className="footer">
                        <p>
                            <a href="https://pho.chat">← Quay lại Phở Chat</a>
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    );
}
