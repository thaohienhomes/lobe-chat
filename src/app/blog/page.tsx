'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

interface BlogPost {
  category: 'blog' | 'newsletter' | 'changelog';
  date: string;
  description: string;
  emoji: string;
  image?: string;
  slug: string;
  title: string;
}

const posts: BlogPost[] = [
  {
    category: 'blog',
    date: '2026-02-07',
    description:
      'Hướng dẫn chi tiết từng bước cách sử dụng Semantic Scholar, ArXiv, DOI Resolver và trích dẫn tự động.',
    emoji: '📖',
    image: '/images/generated/academic_research_manual_hero.png',
    slug: 'academic-research-manual',
    title: 'Hướng Dẫn Sử Dụng Module Nghiên Cứu Khoa Học',
  },
  {
    category: 'blog',
    date: '2026-02-07',
    description:
      'Chính thức ra mắt bộ công cụ Academic Research: Semantic Scholar, DOI Resolver, và IEEE Bibliography.',
    emoji: '🎓',
    image: '/images/blog/academic-research-banner.png',
    slug: 'academic-research-module',
    title: 'Ra Mắt Module Nghiên Cứu Khoa Học (Academic Research)',
  },
  {
    category: 'blog',
    date: '2026-02-04',
    description:
      'Ra mắt Phở Studio - Nền tảng tạo ảnh và video AI với FLUX, Kling, Stable Diffusion và nhiều model hàng đầu.',
    emoji: '🎨',
    image: '/images/blog/pho-studio.png',
    slug: 'pho-studio-launch',
    title: 'Phở Studio - Nền Tảng Tạo Ảnh & Video AI',
  },
  {
    category: 'blog',
    date: '2026-02-03',
    description:
      'Tìm hiểu về Gemini 2.0 Flash Thinking - mô hình AI với khả năng suy luận vượt trội từ Google.',
    emoji: '🧠',
    image: '/images/blog/gemini-flash.png',
    slug: 'gemini-flash-thinking',
    title: 'Gemini 2.0 Flash Thinking - AI Suy Luận Mới',
  },
  {
    category: 'blog',
    date: '2026-02-04',
    description:
      'Khám phá cách Phở Chat hỗ trợ nghiên cứu y sinh học với PubMed, ArXiv và các công cụ y khoa chuyên biệt.',
    emoji: '🔬',
    image: '/images/blog/pubmed-guide.png',
    slug: 'research-features',
    title: 'Trợ Lý AI Thông Minh Cho Nghiên Cứu Y Sinh Học',
  },
  {
    category: 'changelog',
    date: '2026-02-01',
    description:
      'Phở Points, gói Lifetime, và nhiều tính năng mới trong bản cập nhật tháng 2/2026.',
    emoji: '🎉',
    slug: 'february-2026-update',
    title: 'Phở Chat v1.132 - New Year Update',
  },
  {
    category: 'newsletter',
    date: '2026-01-15',
    description:
      'Tổng hợp các tính năng AI mới nhất và xu hướng công nghệ trong nghiên cứu y sinh học.',
    emoji: '📬',
    slug: 'ai-research-digest-jan-2026',
    title: 'AI Research Digest - Tháng 1/2026',
  },
];

const categoryLabels = {
  blog: { color: '#a855f7', label: 'Blog' },
  changelog: { color: '#22c55e', label: 'Changelog' },
  newsletter: { color: '#3b82f6', label: 'Newsletter' },
};

export default function BlogIndexPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        body: JSON.stringify({ email, source: 'blog' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setStatusMessage(data.message || 'Đăng ký thành công!');
        setEmail('');
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setStatus('error');
      setStatusMessage('Không thể kết nối, vui lòng thử lại.');
    }
  };

  return (
    <>
      <title>Phở Chat Blog - Tin Tức, Changelog & Newsletter</title>
      <meta
        content="Cập nhật mới nhất từ Phở Chat - Blog, Newsletter và Changelog"
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
            max-width: 1100px;
            margin: 0 auto;
            padding: 48px 24px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 64px;
          }
          
          .logo {
            font-size: 3rem;
            margin-bottom: 16px;
          }
          
          .title {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
          }
          
          .subtitle {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.6);
            max-width: 600px;
            margin: 0 auto;
          }
          
          .nav-tabs {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 48px;
            flex-wrap: wrap;
          }
          
          .nav-tab {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
          }
          
          .nav-tab:hover, .nav-tab.active {
            background: rgba(138, 43, 226, 0.2);
            border-color: rgba(138, 43, 226, 0.5);
            color: #fff;
          }
          
          .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 24px;
          }
          
          .post-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 0;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: block;
          }
          
          .post-card:hover {
            background: rgba(138, 43, 226, 0.08);
            border-color: rgba(138, 43, 226, 0.3);
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(138, 43, 226, 0.15);
          }
          
          .post-image {
            width: 100%;
            height: 180px;
            object-fit: cover;
          }
          
          .post-content {
            padding: 24px;
          }
          
          .post-emoji {
            font-size: 2.5rem;
            margin-bottom: 16px;
          }
          
          .post-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }
          
          .post-category {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .post-date {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
          }
          
          .post-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 12px;
            line-height: 1.4;
          }
          
          .post-description {
            font-size: 0.95rem;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.6;
          }
          
          .newsletter-section {
            margin-top: 80px;
            padding: 48px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
            border-radius: 24px;
            border: 1px solid rgba(99, 102, 241, 0.2);
            text-align: center;
          }
          
          .newsletter-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 12px;
          }
          
          .newsletter-desc {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 24px;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .newsletter-form {
            display: flex;
            gap: 12px;
            max-width: 400px;
            margin: 0 auto;
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .newsletter-input {
            flex: 1;
            min-width: 200px;
            padding: 14px 20px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            color: #fff;
            font-size: 1rem;
            outline: none;
          }
          
          .newsletter-input:focus {
            border-color: rgba(138, 43, 226, 0.5);
            box-shadow: 0 0 20px rgba(138, 43, 226, 0.2);
          }
          
          .newsletter-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }
          
          .newsletter-button {
            padding: 14px 28px;
            background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
          }
          
          .newsletter-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
          }
          
          .footer {
            text-align: center;
            margin-top: 80px;
            padding-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
          }
          
          .footer a {
            color: #a855f7;
            text-decoration: none;
          }
          
          .footer a:hover {
            text-decoration: underline;
          }
          
          @media (max-width: 768px) {
            .title {
              font-size: 2rem;
            }
            
            .posts-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      <div className="container">
        <header className="header">
          <div className="logo">🍜</div>
          <h1 className="title">Phở Chat Blog</h1>
          <p className="subtitle">
            Tin tức, cập nhật sản phẩm và những câu chuyện từ team Phở Chat
          </p>
        </header>

        <nav className="nav-tabs">
          <Link className="nav-tab active" href="/blog">
            📝 Tất Cả
          </Link>
          <Link className="nav-tab" href="/blog?category=blog">
            📰 Blog
          </Link>
          <Link className="nav-tab" href="/blog?category=newsletter">
            📬 Newsletter
          </Link>
          <Link className="nav-tab" href="/blog?category=changelog">
            🚀 Changelog
          </Link>
        </nav>

        <Flexbox className="posts-grid">
          {posts.map((post) => (
            <Link className="post-card" href={`/blog/${post.slug}`} key={post.slug}>
              {post.image ? (
                <img alt={post.title} className="post-image" src={post.image} />
              ) : (
                <div className="post-content" style={{ paddingTop: 0 }}>
                  <div className="post-emoji">{post.emoji}</div>
                </div>
              )}
              <div className="post-content">
                <div className="post-meta">
                  <span
                    className="post-category"
                    style={{
                      background: `${categoryLabels[post.category].color}20`,
                      color: categoryLabels[post.category].color,
                    }}
                  >
                    {categoryLabels[post.category].label}
                  </span>
                  <span className="post-date">
                    {new Date(post.date).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-description">{post.description}</p>
              </div>
            </Link>
          ))}
        </Flexbox>

        <section className="newsletter-section">
          <h2 className="newsletter-title">📬 Đăng Ký Newsletter</h2>
          <p className="newsletter-desc">
            Nhận cập nhật mới nhất về AI, nghiên cứu y sinh học và các tính năng mới từ Phở Chat.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              className="newsletter-input"
              disabled={status === 'loading'}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
              value={email}
            />
            <button className="newsletter-button" disabled={status === 'loading'} type="submit">
              {status === 'loading' ? 'Đang gửi...' : 'Đăng Ký'}
            </button>
          </form>
          {statusMessage && (
            <p
              style={{
                color: status === 'success' ? '#22c55e' : '#ef4444',
                marginTop: 16,
              }}
            >
              {statusMessage}
            </p>
          )}
        </section>

        <footer className="footer">
          <p>
            © 2026 <Link href="https://pho.chat">Phở Chat</Link>. Made with 💜 in Vietnam
          </p>
        </footer>
      </div>
    </>
  );
}
