'use client';

import { Markdown } from '@lobehub/ui';
import { Flexbox } from 'react-layout-kit';

const blogContent = `
# Phở Medical — 3 Tính Năng AI Mới Cho Nghiên Cứu Y Khoa

*Ngày 8 tháng 3, 2026 · Nhân ngày Quốc tế Phụ nữ 🌸*

---

Chúng tôi vui mừng giới thiệu **ba tính năng hoàn toàn mới** được thiết kế dành riêng cho các chuyên gia y tế, nhà nghiên cứu và giảng viên. Đây là những công cụ AI mạnh mẽ nhất mà Phở Chat từng ra mắt, giúp nâng cao hiệu suất nghiên cứu và học thuật của bạn.

---

## 🔬 Scientific Skills

**170+ kỹ năng khoa học chuyên biệt** được tích hợp sẵn, bao gồm:

- ✅ Tổng quan & tổng hợp tài liệu từ PubMed, Scopus
- ✅ Hướng dẫn phân tích thống kê cho dữ liệu lâm sàng
- ✅ Hỗ trợ xây dựng giả thuyết và thiết kế nghiên cứu
- ✅ Tra cứu thuật ngữ y khoa và mã ICD
- ✅ Phân tích PICO cho systematic review
- ✅ Đánh giá chất lượng bằng chứng theo GRADE

Scientific Skills biến Phở Chat thành một trợ lý nghiên cứu thực sự — hiểu context y khoa, apply đúng phương pháp luận, và output theo chuẩn quốc tế.

👉 [Xem chi tiết Scientific Skills →](https://docs.pho.chat/features/scientific-skills)

---

## 📊 Research Mode

Không gian làm việc chuyên dụng cho nghiên cứu hệ thống, với:

- ✅ Đầu ra nghiên cứu có cấu trúc với trích dẫn đúng chuẩn
- ✅ So sánh đa nguồn và phân loại bằng chứng
- ✅ Định dạng học thuật sẵn sàng xuất (APA, Vancouver, IEEE)
- ✅ Sổ tay nghiên cứu với lịch sử phiên bản
- ✅ Quy trình 5 bước: Topic → Search → Analyze → Synthesize → Export

Research Mode giúp bạn đi từ ý tưởng đến bài báo với workflow được hướng dẫn từng bước, đảm bảo chất lượng academic ở mọi giai đoạn.

👉 [Xem chi tiết Research Mode →](https://docs.pho.chat/features/research-mode)

---

## 🧠 Deep Research

Vượt qua những câu trả lời bề mặt. **Deep Research** thực hiện phân tích đa bước qua hàng trăm nguồn để cung cấp thông tin chi tiết, toàn diện và chuyên sâu:

- ✅ Suy luận đa bước qua hơn 100 bài nghiên cứu
- ✅ Hỗ trợ tổng quan hệ thống theo phương pháp PRISMA
- ✅ Đối chiếu hướng dẫn lâm sàng và phân tích tổng hợp
- ✅ Tạo báo cáo toàn diện với mức độ bằng chứng
- ✅ Tự động tổng hợp và so sánh cross-reference

Deep Research là công cụ lý tưởng cho systematic review, meta-analysis, và các dự án nghiên cứu đòi hỏi phân tích sâu rộng.

👉 [Xem chi tiết Deep Research →](https://docs.pho.chat/features/deep-research)

---

## 💰 Nâng Cấp Phở Medical

Tất cả 3 tính năng trên đều có sẵn trong gói **Phở Medical** với giá chỉ **999.000đ/năm** — bao gồm cả hạn mức sử dụng đã được nâng cấp cho tất cả tài khoản.

Nếu bạn đang sử dụng Medical Beta, hạn mức mới sẽ được áp dụng tự động.

---

## 🌸 Nhân Ngày 8/3

Nhân ngày Quốc tế Phụ nữ, chúng tôi gửi lời tri ân đặc biệt đến tất cả những nhà nghiên cứu, bác sĩ, giảng viên và chuyên gia y tế nữ — những người đang mỗi ngày góp phần thay đổi ngành y tế bằng tri thức và đam mê.

*Happy International Women's Day! 🌸*

---

*© 2026 Phở Chat. Made with 💚 for researchers.*
`;

export default function MarchMedicalFeaturesPage() {
  return (
    <>
      <title>Phở Medical — 3 Tính Năng AI Mới Cho Nghiên Cứu Y Khoa | Phở Chat Blog</title>
      <meta
        content="Ra mắt 3 tính năng mới cho gói Medical: Scientific Skills, Research Mode và Deep Research — công cụ AI mạnh mẽ cho nghiên cứu & học thuật."
        name="description"
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f35 100%);
          min-height: 100vh;
          color: #e0e0e0;
        }

        .blog-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 32px;
          transition: color 0.2s;
        }
        .back-link:hover { color: rgba(255,255,255,0.8); }

        .blog-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 40px;
          background: linear-gradient(135deg, rgba(15,118,110,0.2) 0%, rgba(0,137,123,0.1) 100%);
          border-radius: 24px;
          border: 1px solid rgba(15,118,110,0.3);
          box-shadow: 0 0 60px rgba(15,118,110,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .blog-header h1 {
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6EE7B7 0%, #0F766E 50%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 12px 0;
          line-height: 1.25;
        }

        .blog-header .subtitle {
          font-size: 1rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
        }

        .blog-header .date {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          margin-top: 8px;
        }

        .blog-content {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #0F766E 0%, #059669 100%);
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(15,118,110,0.4);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(15,118,110,0.5);
        }

        .footer { text-align: center; margin-top: 48px; padding: 32px; border-top: 1px solid rgba(255,255,255,0.1); }
        .footer a { color: #34D399; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }

        /* Markdown overrides */
        h1, h2, h3 { color: #fff; }
        h2 { font-size: 1.6rem; margin-top: 40px; padding-bottom: 10px; border-bottom: 2px solid rgba(15,118,110,0.3); }
        h3 { font-size: 1.2rem; color: #6EE7B7; margin-top: 20px; }
        p, li { line-height: 1.8; color: rgba(255,255,255,0.8); }
        a { color: #34D399; }
        hr { border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(15,118,110,0.5), transparent); margin: 40px 0; }
        strong { color: #fff; }
        ul { padding-left: 24px; }
        li { margin: 6px 0; }
        li::marker { color: #34D399; }
        em { color: rgba(255,255,255,0.6); }

        @media (max-width: 768px) {
          .blog-container { padding: 24px 16px; }
          .blog-header { padding: 28px 20px; }
          .blog-header h1 { font-size: 1.6rem; }
          .blog-content { padding: 28px 20px; }
        }
      `}</style>

      <div className="blog-container">
        <a className="back-link" href="/blog">
          ← Quay lại Blog
        </a>

        <header className="blog-header">
          <h1>🔬 Phở Medical — Tính Năng Mới</h1>
          <p className="subtitle">
            Scientific Skills · Research Mode · Deep Research
          </p>
          <p className="date">8 tháng 3, 2026</p>
        </header>

        <main className="blog-content">
          <Flexbox gap={24}>
            <Markdown>{blogContent}</Markdown>
          </Flexbox>

          <Flexbox align="center" gap={16} justify="center" style={{ marginTop: 48 }}>
            <a className="cta-button" href="https://pho.chat/subscription/checkout?plan=medical_beta&provider=sepay">
              🔥 Nâng Cấp Phở Medical — 999K/Năm
            </a>
          </Flexbox>
        </main>

        <footer className="footer">
          <p>
            © 2026 <a href="https://pho.chat">Phở Chat</a>. Made with 💚 for researchers.
          </p>
        </footer>
      </div>
    </>
  );
}
