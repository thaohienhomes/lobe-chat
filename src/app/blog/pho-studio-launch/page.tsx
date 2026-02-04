'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';
import { Flexbox } from 'react-layout-kit';

const blogContent = `
![Phở Studio](/images/blog/pho-studio.png)

## Giới Thiệu Phở Studio

**Phở Studio** là nền tảng sáng tạo AI đa phương tiện, cho phép bạn tạo hình ảnh và video chất lượng cao chỉ với vài cú click.

Đây là sản phẩm mới trong hệ sinh thái Phở, bổ sung hoàn hảo cho **Phở Chat** - công cụ chatbot AI thông minh.

---

## 🎨 Tính Năng Chính

### 1. Image Generation
- **FLUX Pro 1.1** - Model mới nhất từ Black Forest Labs
- **Stable Diffusion 3.5** - Chất lượng cao, đa dạng style
- **Recraft V3** - Thiết kế đồ họa chuyên nghiệp
- **Ideogram V2** - Tạo chữ trong ảnh hoàn hảo

### 2. Video Generation
- **Kling 1.6** - Video AI chất lượng điện ảnh
- **Minimax Hailuo** - Video dài, chuyển động mượt
- **LTX Video** - Mã nguồn mở, tốc độ nhanh

### 3. Công Cụ Nâng Cao
- **Virtual Try-On** - Thử trang phục AI
- **Image Upscaler** - Nâng cấp độ phân giải
- **Background Remover** - Xóa nền tự động
- **Lip Sync** - Đồng bộ môi với audio

---

## 💎 Phở Points System

Phở Studio sử dụng hệ thống **Phở Points** thống nhất với Phở Chat:

| Gói | Phở Points/tháng | Giá |
|-----|-----------------|-----|
| Free | 100,000 | Miễn phí |
| Pro | 1,000,000 | 199K/tháng |
| Ultimate | 5,000,000 | 499K/tháng |
| Lifetime | 2,000,000/tháng | 2.990K một lần |

---

## 🔗 Tích Hợp Với Phở Chat

- Sử dụng cùng tài khoản Phở Chat
- Chia sẻ Phở Points giữa các sản phẩm
- Gọi Phở Studio từ Phở Chat qua Artifacts

---

## 🚀 Bắt Đầu Ngay

1. Truy cập **[studio.pho.chat](https://studio.pho.chat)**
2. Đăng nhập với tài khoản Phở Chat
3. Chọn công cụ và bắt đầu sáng tạo!

---

*Phở Studio - Sáng tạo không giới hạn với AI* ✨
`;

export default function PhoStudioLaunchPage() {
  return (
    <html lang="vi">
      <head>
        <title>Phở Studio Launch - Nền Tảng Tạo Ảnh & Video AI</title>
        <meta
          content="Ra mắt Phở Studio - Tạo ảnh và video AI chất lượng cao với FLUX, Kling, và nhiều model hàng đầu"
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
          
          .container { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
          
          .back-link {
            display: inline-flex; align-items: center; gap: 8px;
            color: rgba(255, 255, 255, 0.6); text-decoration: none;
            margin-bottom: 32px; font-size: 0.9rem; transition: color 0.2s;
          }
          .back-link:hover { color: #a855f7; }
          
          .header { margin-bottom: 48px; }
          
          .category-badge {
            display: inline-block; padding: 6px 16px;
            background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
            border-radius: 20px; font-size: 0.85rem; font-weight: 600;
            color: white; margin-bottom: 16px;
          }
          
          .title {
            font-size: 2.25rem; font-weight: 700;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; margin-bottom: 12px;
          }
          
          .date { color: rgba(255, 255, 255, 0.5); font-size: 0.95rem; }
          
          .content {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px; padding: 48px;
          }
          
          .content img {
            width: 100%; border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            margin-bottom: 32px;
          }
          
          h2 { font-size: 1.5rem; color: #fff; margin-top: 40px; margin-bottom: 20px;
               padding-bottom: 10px; border-bottom: 2px solid rgba(236, 72, 153, 0.3); }
          h2:first-child { margin-top: 0; }
          h3 { font-size: 1.15rem; color: #f472b6; margin-top: 24px; margin-bottom: 12px; }
          p, li { line-height: 1.8; color: rgba(255, 255, 255, 0.8); }
          ul { padding-left: 24px; }
          li { margin: 10px 0; }
          li::marker { color: #ec4899; }
          strong { color: #fff; }
          a { color: #f472b6; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: none; height: 1px;
               background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.5), transparent);
               margin: 40px 0; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0;
                  background: rgba(0, 0, 0, 0.2); border-radius: 12px; overflow: hidden; }
          th, td { padding: 16px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
          th { background: rgba(236, 72, 153, 0.2); font-weight: 600; color: #fff; }
          tr:hover { background: rgba(236, 72, 153, 0.05); }
          
          .footer { text-align: center; margin-top: 48px; color: rgba(255, 255, 255, 0.5); }
          .footer a { color: #a855f7; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <Link className="back-link" href="/blog">
            ← Quay lại Blog
          </Link>

          <header className="header">
            <span className="category-badge">🚀 Product Launch</span>
            <h1 className="title">Phở Studio - Nền Tảng Tạo Ảnh & Video AI</h1>
            <p className="date">4 tháng 2, 2026</p>
          </header>

          <main className="content">
            <Flexbox gap={24}>
              <Markdown>{blogContent}</Markdown>
            </Flexbox>
          </main>

          <footer className="footer">
            <p>
              <a href="https://studio.pho.chat">→ Truy cập Phở Studio</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
