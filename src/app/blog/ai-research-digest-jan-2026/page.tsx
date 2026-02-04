'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';
import { Flexbox } from 'react-layout-kit';

const newsletterContent = `
Chào bạn,

Chào mừng đến với bản tin AI Research Digest đầu tiên của năm 2026! Trong số này, chúng ta sẽ cùng điểm qua những xu hướng AI nổi bật và cách áp dụng vào nghiên cứu y sinh học.

---

## 📰 Tin Nổi Bật

### 1. Gemini 2.0 Flash - Tốc Độ & Hiệu Năng

Google vừa ra mắt **Gemini 2.0 Flash** với khả năng xử lý văn bản và hình ảnh nhanh hơn 40% so với phiên bản trước. Đây là tin tuyệt vời cho các nhà nghiên cứu cần phân tích tài liệu y khoa nhanh chóng.

### 2. Claude 3.5 Sonnet - Reasoning Upgrade

Anthropic cập nhật Claude với khả năng suy luận logic cải tiến, đặc biệt hữu ích trong việc phân tích các ca lâm sàng phức tạp và đưa ra đề xuất điều trị.

### 3. GPT-4o - Multimodal Excellence

OpenAI tiếp tục cải tiến GPT-4o với khả năng xử lý đồng thời văn bản, hình ảnh, và audio - lý tưởng cho việc phân tích dữ liệu y khoa đa phương tiện.

---

## 🔬 Ứng Dụng Trong Y Sinh

### Literature Review Tự Động

Sử dụng AI để tổng hợp và tóm tắt hàng trăm bài báo nghiên cứu trong vài phút, thay vì hàng tuần đọc thủ công.

### Drug Discovery Acceleration

Các mô hình AI protein folding như AlphaFold 3 đang cách mạng hóa việc phát hiện thuốc mới.

### Clinical Decision Support

AI hỗ trợ bác sĩ đưa ra quyết định lâm sàng dựa trên phân tích dữ liệu bệnh nhân và literature hiện có.

---

## 💡 Tip of the Month

**Sử dụng Phở Chat's PubMed plugin** để nhanh chóng tìm kiếm và tóm tắt các bài báo liên quan đến chủ đề nghiên cứu của bạn. Chỉ cần gõ:

> "Tìm kiếm 5 bài báo mới nhất về CRISPR gene therapy trong treatment of cancer"

AI sẽ tìm kiếm PubMed, tóm tắt nội dung, và trả về kết quả có cấu trúc!

---

## 📚 Đọc Thêm

- [AlphaFold 3 Documentation](https://alphafold.com) - Hướng dẫn sử dụng AlphaFold cho protein research
- [NIH AI Guidelines](https://nih.gov/ai) - Hướng dẫn sử dụng AI trong nghiên cứu y sinh từ NIH
- [Phở Chat Plugin Store](https://pho.chat) - Khám phá các plugin nghiên cứu của chúng tôi

---

Hẹn gặp lại trong số tới!

**Team Phở Chat** 🍜
`;

export default function NewsletterPage() {
  return (
    <html lang="vi">
      <head>
        <title>AI Research Digest - Tháng 1/2026 | Phở Chat Newsletter</title>
        <meta
          content="Bản tin AI Research Digest - Cập nhật xu hướng AI và ứng dụng trong nghiên cứu y sinh học"
          name="description"
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f35 100%);
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
            color: #a855f7;
          }
          
          .header {
            margin-bottom: 48px;
          }
          
          .category-badge {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
            margin-bottom: 16px;
          }
          
          .title {
            font-size: 2.25rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
          }
          
          .date {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.95rem;
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
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(59, 130, 246, 0.3);
          }
          
          h2:first-child {
            margin-top: 0;
          }
          
          h3 {
            font-size: 1.15rem;
            color: #60a5fa;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          
          p {
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 16px;
          }
          
          ul, ol {
            padding-left: 24px;
            margin-bottom: 16px;
          }
          
          li {
            margin: 10px 0;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.8);
          }
          
          li::marker {
            color: #3b82f6;
          }
          
          strong {
            color: #fff;
          }
          
          blockquote {
            padding: 16px 24px;
            background: rgba(59, 130, 246, 0.1);
            border-left: 4px solid #3b82f6;
            border-radius: 0 12px 12px 0;
            margin: 20px 0;
            font-style: italic;
            color: rgba(255, 255, 255, 0.9);
          }
          
          a {
            color: #60a5fa;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
            margin: 40px 0;
          }
          
          .footer {
            text-align: center;
            margin-top: 48px;
            color: rgba(255, 255, 255, 0.5);
          }
          
          .footer a {
            color: #a855f7;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <Link className="back-link" href="/blog">
            ← Quay lại Blog
          </Link>

          <header className="header">
            <span className="category-badge">📬 Newsletter</span>
            <h1 className="title">AI Research Digest</h1>
            <p className="date">Tháng 1, 2026</p>
          </header>

          <main className="content">
            <Flexbox gap={24}>
              <Markdown>{newsletterContent}</Markdown>
            </Flexbox>
          </main>

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
