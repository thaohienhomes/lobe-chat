'use client';

import { Markdown } from '@lobehub/ui';
import { Flexbox } from 'react-layout-kit';

const blogContent = `
# Phở Chat: Trợ Lý AI Thông Minh Cho Nghiên Cứu Y Sinh Học

![Phở Chat Research Infographic](/images/blog/pho-chat-research-infographic.png)

## Giới Thiệu

Trong kỷ nguyên số hóa, nghiên cứu y sinh học đang đối mặt với khối lượng thông tin khổng lồ. **Phở Chat** ra đời như một giải pháp AI thông minh, hỗ trợ các nhà nghiên cứu, giảng viên, bác sỹ và nghiên cứu sinh tối ưu hóa quy trình làm việc.

---

## 🔬 Tính Năng Nổi Bật

### 1. Tìm Kiếm PubMed Thông Minh
- Truy cập nhanh cơ sở dữ liệu y khoa toàn cầu
- Lọc kết quả theo chủ đề, thời gian, và loại nghiên cứu
- Tóm tắt tự động các bài báo khoa học

### 2. Hỗ Trợ Viết Bài Khoa Học
- Tạo bản nháp, sửa lỗi ngữ pháp
- Gợi ý cấu trúc bài báo theo chuẩn quốc tế
- Trích dẫn tài liệu tự động theo định dạng APA, MLA, Vancouver

### 3. Phân Tích Dữ Liệu
- Xử lý tập dữ liệu lớn
- Trích xuất thông tin chi tiết
- Tạo biểu đồ trực quan cho các phát hiện nghiên cứu

### 4. Giải Thích Khái Niệm Phức Tạp
- Phân tích và đơn giản hóa các cơ chế sinh học
- Cung cấp giải thích dễ hiểu cho người dùng mọi cấp độ
- Hỗ trợ đa ngôn ngữ (Tiếng Việt, English, 中文,...)

### 5. Công Cụ Chuyên Biệt Y Khoa
- **Tính Toán Lâm Sàng**: BMI, GFR, MELD, Creatinine Clearance
- **Kiểm Tra Tương Tác Thuốc**: Phát hiện tương tác thuốc nguy hiểm
- **Tìm Kiếm ArXiv**: Truy cập preprint nghiên cứu mới nhất

---

## 👥 Đối Tượng Người Dùng

### 🎓 Giảng Viên
- Soạn bài giảng chuyên sâu
- Tạo câu hỏi thi và bài tập
- Cập nhật kiến thức mới nhất trong lĩnh vực

### 🩺 Bác Sỹ
- Cập nhật phác đồ điều trị mới
- Tra cứu thông tin y khoa lâm sàng
- Phân tích case study phức tạp

### 📚 Nghiên Cứu Sinh (NCS/Tiến Sĩ)
- Đẩy nhanh tiến độ nghiên cứu
- Literature review hiệu quả
- Tổng quan tài liệu chuyên sâu
- Hỗ trợ viết luận văn, luận án

---

## 💡 Ưu Điểm Vượt Trội

| Tính Năng | Phở Chat | ChatGPT | Gemini |
|-----------|----------|---------|--------|
| Tích hợp PubMed | ✅ | ❌ | ❌ |
| Công cụ y khoa | ✅ | ❌ | ❌ |
| Giao diện Tiếng Việt | ✅ | Hạn chế | Hạn chế |
| Artifacts tương tác | ✅ | ✅ | ❌ |
| Pricing hợp lý | ✅ | Đắt | Đắt |

---

## 🚀 Bắt Đầu Ngay

1. Truy cập **[pho.chat](https://pho.chat)**
2. Đăng ký tài khoản miễn phí
3. Khám phá các tính năng trong Plugin Store
4. Nâng cấp lên **Phở Pro** để trải nghiệm không giới hạn

---

## 📞 Liên Hệ & Hỗ Trợ

- **Website**: [pho.chat](https://pho.chat)
- **Email**: support@pho.chat
- **Zalo Community**: Liên hệ admin để được tham gia

---

*Phở Chat - Nâng Cao Hiệu Suất & Đổi Mới trong Nghiên Cứu Y Sinh Học* 🧬
`;

export default function ResearchFeaturesPage() {
  return (
    <html lang="vi">
      <head>
        <title>Phở Chat - Trợ Lý AI Cho Nghiên Cứu Y Sinh Học</title>
        <meta
          content="Phở Chat - AI thông minh hỗ trợ nghiên cứu y sinh học với tích hợp PubMed, ArXiv, và công cụ y khoa chuyên biệt."
          name="description"
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f1f35 100%);
            min-height: 100vh;
            color: #e0e0e0;
          }
          
          .blog-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 24px;
          }
          
          .blog-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px;
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(75, 0, 130, 0.1) 100%);
            border-radius: 24px;
            border: 1px solid rgba(138, 43, 226, 0.3);
            box-shadow: 
              0 0 60px rgba(138, 43, 226, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }
          
          .blog-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 16px 0;
            line-height: 1.2;
          }
          
          .blog-header .subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
          }
          
          .blog-content {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 48px;
            box-shadow: 
              0 20px 60px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }
          
          .infographic-container {
            margin: 32px 0;
            padding: 24px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
            border-radius: 16px;
            border: 1px solid rgba(99, 102, 241, 0.2);
          }
          
          .infographic-container img {
            width: 100%;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }
          
          .cta-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 16px 32px;
            background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin: 32px 0;
          }
          
          .feature-card {
            padding: 24px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            transition: all 0.3s ease;
          }
          
          .feature-card:hover {
            background: rgba(138, 43, 226, 0.08);
            border-color: rgba(138, 43, 226, 0.3);
            transform: translateY(-4px);
          }
          
          .footer {
            text-align: center;
            margin-top: 48px;
            padding: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .footer a {
            color: #a855f7;
            text-decoration: none;
          }
          
          .footer a:hover {
            text-decoration: underline;
          }
          
          /* Markdown overrides */
          h1, h2, h3 {
            color: #fff;
          }
          
          h2 {
            font-size: 1.75rem;
            margin-top: 48px;
            padding-bottom: 12px;
            border-bottom: 2px solid rgba(138, 43, 226, 0.3);
          }
          
          h3 {
            font-size: 1.25rem;
            color: #c084fc;
            margin-top: 24px;
          }
          
          p, li {
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.8);
          }
          
          a {
            color: #a855f7;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            overflow: hidden;
          }
          
          th, td {
            padding: 16px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          
          th {
            background: rgba(138, 43, 226, 0.2);
            font-weight: 600;
            color: #fff;
          }
          
          tr:hover {
            background: rgba(138, 43, 226, 0.05);
          }
          
          hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.5), transparent);
            margin: 48px 0;
          }
          
          strong {
            color: #fff;
          }
          
          ul {
            padding-left: 24px;
          }
          
          li {
            margin: 8px 0;
          }
          
          li::marker {
            color: #a855f7;
          }
        `}</style>
      </head>
      <body>
        <div className="blog-container">
          <header className="blog-header">
            <h1>🍜 Phở Chat</h1>
            <p className="subtitle">Trợ Lý AI Thông Minh Cho Nghiên Cứu Y Sinh Học</p>
          </header>

          <main className="blog-content">
            <Flexbox gap={24}>
              <Markdown>{blogContent}</Markdown>
            </Flexbox>

            <Flexbox align="center" gap={16} justify="center" style={{ marginTop: 48 }}>
              <a className="cta-button" href="https://pho.chat">
                🚀 Bắt Đầu Miễn Phí
              </a>
            </Flexbox>
          </main>

          <footer className="footer">
            <p>
              © 2026 <a href="https://pho.chat">Phở Chat</a>. Made with 💜 for researchers.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
