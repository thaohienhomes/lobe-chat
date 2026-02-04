'use client';

import { Markdown } from '@lobehub/ui';
import Link from 'next/link';
import { Flexbox } from 'react-layout-kit';

const changelogContent = `
## 🎉 Phở Points & Lifetime Launch

Chúng tôi vui mừng giới thiệu hệ thống **Phở Points** - cách mới để tính toán và quản lý credits sử dụng AI.

### ✨ Tính Năng Mới

- **Phở Points System**: Hệ thống credit thống nhất cho tất cả AI models
- **Lifetime Package**: Gói trọn đời với giá ưu đãi Tết Nguyên Đán
- **Bundled Plugins**: PubMed, ArXiv, Drug Interactions tích hợp sẵn
- **Improved Artifacts**: Preview HTML/React/3D ngay trong chat

### 🔧 Cải Tiến

- Tối ưu hiệu suất chat response
- Cải thiện UI/UX cho mobile
- Hỗ trợ thêm nhiều model mới: Gemini 2.0, Claude 3.5, GPT-4o

### 🐛 Bug Fixes

- Sửa lỗi preview Sandpack không hiển thị đúng
- Sửa lỗi sync settings giữa các devices
- Cải thiện tốc độ load plugin store

### 📝 Ghi Chú Khác

- Database migration: Thêm bảng recommendation_selections
- Cập nhật dependencies cho Next.js 15.5.7
`;

export default function ChangelogPage() {
  return (
    <html lang="vi">
      <head>
        <title>Changelog - Phở Chat v1.132</title>
        <meta
          content="Cập nhật mới nhất của Phở Chat - Phở Points, Lifetime Package và nhiều tính năng mới"
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
          
          .version-badge {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
            margin-bottom: 24px;
          }
          
          h3 {
            font-size: 1.15rem;
            color: #c084fc;
            margin-top: 32px;
            margin-bottom: 16px;
          }
          
          ul {
            padding-left: 24px;
          }
          
          li {
            margin: 10px 0;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.8);
          }
          
          li::marker {
            color: #a855f7;
          }
          
          strong {
            color: #fff;
          }
          
          .footer {
            text-align: center;
            margin-top: 48px;
            color: rgba(255, 255, 255, 0.5);
          }
          
          .footer a {
            color: #a855f7;
            text-decoration: none;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <Link className="back-link" href="/blog">
            ← Quay lại Blog
          </Link>

          <header className="header">
            <span className="version-badge">v1.132.4</span>
            <h1 className="title">🎉 New Year Update</h1>
            <p className="date">1 tháng 2, 2026</p>
          </header>

          <main className="content">
            <Flexbox gap={24}>
              <Markdown>{changelogContent}</Markdown>
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
