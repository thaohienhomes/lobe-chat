'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';

const manualContent: string = `
# Hướng Dẫn Sử Dụng Module Nghiên Cứu Khoa Học (Academic Research)

![Academic Research Guide](/images/generated/academic_research_manual_hero.png)

Chào mừng bạn đến với hướng dẫn chi tiết sử dụng bộ công cụ Nghiên cứu Khoa học trên Phở Chat. Module này được thiết kế để hỗ trợ tối đa cho **Nghiên cứu sinh, Tiến sĩ, Giảng viên và Sinh viên** trong quá trình tìm kiếm, tổng hợp và trích dẫn tài liệu học thuật.

---

## 🚀 1. Kích Hoạt Module

Để có trải nghiệm tốt nhất, hãy đảm bảo bạn đã chọn nghề nghiệp phù hợp:

1.  Vào **Settings** -> **Profile**.
2.  Tại mục **Profession**, chọn **"Nghiên cứu sinh / Tiến sĩ"** (Graduate Student / PhD) hoặc **"Nhà nghiên cứu"** (Researcher).
3.  Hệ thống sẽ tự động tối ưu hóa các plugin và model cho công việc của bạn.

---

## 📚 2. Tìm Kiếm & Tra Cứu Tài Liệu

### Sử dụng Semantic Scholar
Tìm kiếm hàng triệu bài báo với metadata chi tiết.

*   **Cú pháp:** Hỏi tự nhiên, ví dụ: "Tìm các bài báo mới nhất về LLM Hallucination năm 2024".
*   **Kết quả:** Bạn sẽ thấy các **Academic Cards** hiển thị Tiêu đề, Tác giả, Năm xuất bản, Tạp chí, và quan trọng nhất là **Số lượng trích dẫn (Citation Count)** để đánh giá độ uy tín.

![Citation Card Example](/images/generated/academic_citation_card_illustration.png)

### Sử dụng ArXiv Nâng Cao
*   **Tìm theo ID:** Nếu bạn đã có mã ArXiv, chỉ cần gõ: "Tóm tắt bài báo 2401.04088". Phở Chat sẽ lấy nội dung chi tiết và link PDF ngay lập tức.
*   **Tóm tắt dài:** Abstract được lấy về với độ dài tối đa 1000 ký tự, giúp AI hiểu sâu nội dung hơn để trả lời câu hỏi của bạn (RAG).

### Sử dụng DOI Resolver
Chuyển đổi DOI thành thông tin trích dẫn chuẩn.
*   **Cú pháp:** "Resolve DOI 10.1038/s41586-021-03819-2" hoặc "Lấy trích dẫn cho DOI này..."
*   **Kết quả:** Phở Chat sẽ trả về tên bài, tác giả, và chuỗi trích dẫn IEEE.

---

## ✍️ 3. Trích Dẫn & Danh Mục Tham Khảo (Bibliography)

Đây là tính năng tiết kiệm thời gian nhất cho bạn.

1.  Trong quá trình chat, khi Phở Chat sử dụng thông tin từ các bài báo (qua Semantic Scholar, ArXiv, hoặc DOI), nó sẽ đánh số tham khảo \`[1]\`, \`[2]\`.
2.  Cuối mỗi câu trả lời, một phần **References** sẽ tự động xuất hiện.
3.  Danh sách này tuân thủ chuẩn **IEEE** (phổ biến trong KHMT & Kỹ thuật).

![Bibliography Example](/images/generated/automated_bibliography_illustration.png)

> **Mẹo:** Nhấn nút **Copy** (biểu tượng sao chép) ở góc phải phần References để copy toàn bộ danh sách và dán vào Zotero, Mendeley hoặc bài viết của bạn.

---

## 💡 Câu Hỏi Thường Gặp (FAQ)

**Q: Tôi có thể đổi định dạng trích dẫn sang APA không?**
A: Hiện tại hệ thống mặc định là IEEE. APA và Vancouver sẽ được bổ sung trong bản cập nhật tới.

**Q: Làm sao để tải PDF?**
A: Các thẻ bài báo ArXiv và Semantic Scholar đều có link trực tiếp (hoặc link DOI). Click vào tiêu đề bài báo để mở trang gốc và tải PDF.

**Q: Tính năng này có miễn phí không?**
A: Hoàn toàn miễn phí cho tất cả người dùng Phở Chat.

---

*Chúc bạn có những giờ phút nghiên cứu hiệu quả cùng Phở Chat!* 🎓
`;

export default function AcademicManualPage() {
  return (
    <html lang="vi">
      <head>
        <title>Hướng Dẫn Sử Dụng Module Nghiên Cứu Khoa Học | Phở Chat</title>
        <meta
          content="Hướng dẫn chi tiết cách sử dụng Semantic Scholar, ArXiv, DOI Resolver và tính năng trích dẫn tự động trên Phở Chat."
          name="description"
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background: #09090b;
            color: #e4e4e7;
            line-height: 1.6;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          
          .manual-content {
            background: #18181b;
            padding: 40px;
            border-radius: 16px;
            border: 1px solid #27272a;
          }

          h1 { color: #a78bfa; margin-bottom: 2rem; }
          h2 { color: #fff; border-bottom: 1px solid #3f3f46; padding-bottom: 0.5rem; margin-top: 2rem; }
          h3 { color: #e4e4e7; margin-top: 1.5rem; }
          
          img {
            max-width: 100%;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #3f3f46;
          }
          
          code {
            background: #27272a;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            color: #fb7185;
          }
          
          blockquote {
            border-left: 4px solid #a78bfa;
            margin: 0;
            padding-left: 1rem;
            color: #a1a1aa;
            background: rgba(167, 139, 250, 0.1);
            padding: 1rem;
            border-radius: 4px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <main className="manual-content">
            <nav style={{ marginBottom: '20px' }}>
              <Link
                href="/blog/academic-research-module"
                style={{ color: '#a78bfa', textDecoration: 'none' }}
              >
                ← Quay lại bài giới thiệu
              </Link>
            </nav>
            <Markdown>{manualContent}</Markdown>
          </main>
        </div>
      </body>
    </html>
  );
}
