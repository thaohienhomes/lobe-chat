import { Markdown } from '@lobehub/ui';

const blogContent = `
# Phở Chat: Ra Mắt Module Nghiên Cứu Khoa Học (Academic Research) 🎓

![Academic Research Banner](/images/blog/academic-research-banner.png)

## Sự Kết Hợp Hoàn Hảo Giữa AI và Tri Thức Học Thuật

Chúng tôi hiểu rằng việc tiếp cận và tổng hợp tri thức từ hàng triệu bài báo khoa học là một thách thức lớn đối với các nhà nghiên cứu. Hôm nay, Phở Chat chính thức ra mắt **Module Nghiên Cứu Khoa Học**, một bộ công cụ chuyên biệt giúp bạn biến quá trình nghiên cứu trở nên thông minh và hiệu quả hơn bao giờ hết.

---

## 🚀 Các Tính Năng Đột Phá

### 1. Tích Hợp Semantic Scholar 🎓
Truy cập mạng lưới tri thức khổng lồ từ Semantic Scholar với:
- **Thông tin trích dẫn**: Biết ngay tầm ảnh hưởng của bài báo qua số lượng trích dẫn (citation count).
- **Metadata chi tiết**: Tác giả, năm xuất bản, tạp chí (venue) và Abstract đầy đủ.
- **Link DOI**: Kết nối trực tiếp đến nguồn bài báo gốc.

### 2. Nâng Cấp Trải Nghiệm ArXiv 📚
Chúng tôi đã cải tiến ArXiv plugin để phục vụ nghiên cứu chuyên sâu:
- **Duyệt bài qua ID**: Tìm chính xác bài báo khi bạn đã có ID ArXiv.
- **Tóm tắt dài (Longer Abstract)**: Cung cấp nhiều ngữ cảnh hơn cho RAG, giúp AI hiểu sâu nội dung trước khi bạn đọc PDF.
- **Trích xuất DOI tự động**: Từ ArXiv ID sang DOI chỉ trong tích tắc.

### 3. Bộ Phân Giải DOI (DOI Resolver) 🔗
Chỉ cần nhập DOI, Phở Chat sẽ:
- Trình bày đầy đủ thông tin định danh bài báo.
- Tự động tạo chuỗi trích dẫn chuẩn **IEEE** để bạn đưa vào bài viết của mình.

### 4. Giao Diện Trích Dẫn Thông Minh & Bibliography 📜
Đây là điểm khác biệt lớn nhất:
- **Academic Cards**: Kết quả tìm kiếm học thuật được hiển thị dưới dạng thẻ chuyên nghiệp.
- **IEEE Bibliography**: Ở cuối mỗi phản hồi, Phở Chat sẽ tự động tổng hợp danh mục tham khảo đúng chuẩn IEEE cho tất cả các nguồn đã sử dụng. Bạn chỉ cần click **"Copy All"** để đưa vào Mendelet, Zotero hoặc bài báo của mình.

---

## 👥 Dành Cho Ai?

- **Nghiên cứu sinh & Tiến sĩ**: Đẩy nhanh tiến độ Literature Review.
- **Giảng viên**: Cập nhật những phát kiến mới nhất để soạn bài giảng.
- **Sinh viên**: Tiếp cận nguồn tài liệu uy tín thay vì chỉ dựa vào web search thông thường.

---

## 💡 Tại Sao Nên Dùng Phở Chat Cho Nghiên Cứu?

| Tính Năng | Phở Chat (Academic) | ChatGPT / Gemini |
|-----------|------------------|------------------|
| Citation Count | ✅ | ❌ |
| Chuẩn IEEE | ✅ | Phụ thuộc prompt |
| DOI Lookup | ✅ | ❌ |
| ArXiv ID support | ✅ | ❌ |
| Danh mục tham khảo | Tự động & Chuẩn hóa | Thủ công |

---

## 🚀 Bắt Đầu Ngay

> **📖 HƯỚNG DẪN CHI TIẾT**: Xem **[Hướng Dẫn Sử Dụng Module Nghiên Cứu](/blog/academic-research-manual)** để nắm vững cách dùng từng tính năng.

Tính năng đã khả dụng cho tất cả người dùng Phở Chat. Nếu bạn là nhà nghiên cứu, hãy cập nhật Profession của mình thành **"Nghiên cứu sinh / Tiến sĩ"** trong phần Onboarding để nhận được các gợi ý plugin tốt nhất.

Truy cập **[pho.chat](https://pho.chat)** và trải nghiệm ngay hôm nay!

---

*Phở Chat - Đồng hành cùng trí tuệ Việt trên con đường chinh phục đỉnh cao khoa học.* 🍜🎓
`;

export default function AcademicResearchBlogPage() {
  return (
    <>
      <title>Ra Mắt Module Nghiên Cứu Khoa Học | Phở Chat</title>
      <meta
        content="Khám phá Module Nghiên cứu Khoa học mới của Phở Chat với Semantic Scholar, ArXiv nâng cao và hệ thống trích dẫn IEEE tự động."
        name="description"
      />
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background: #050510;
            color: #e0e0e0;
            min-height: 100vh;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 20px;
          }
          
          header {
            text-align: center;
            margin-bottom: 60px;
          }
          
          header h1 {
            font-size: 3rem;
            background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }
          
          .content-box {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          }
          
          .cta-area {
            text-align: center;
            margin-top: 60px;
          }
          
          .btn {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            transition: transform 0.2s;
          }
          
          .btn:hover {
            transform: scale(1.05);
          }

          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
          th { color: #7c3aed; }
        `}</style>
      <div className="container">
        <header>
          <h1>🍜 Phở Chat</h1>
          <p style={{ opacity: 0.6 }}>Academic Research Edition</p>
        </header>
        <div className="content-box">
          <Markdown>{blogContent}</Markdown>
        </div>
        <div className="cta-area">
          <a className="btn" href="https://pho.chat">
            🚀 Trải Nghiệm Ngay
          </a>
        </div>
      </div>
    </>
  );
}
