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
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <Flexbox
          padding={24}
          style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
            minHeight: '100vh',
          }}
        >
          <Flexbox
            style={{
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              margin: '0 auto',
              maxWidth: 900,
              padding: 32,
            }}
          >
            <Markdown>{blogContent}</Markdown>
          </Flexbox>
        </Flexbox>
      </body>
    </html>
  );
}
