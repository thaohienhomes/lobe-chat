import { ChangelogIndexItem } from '@/types/changelog';

/**
 * Local changelog entries for Phở.chat
 * These are displayed on /changelog page
 */
export const PHO_CHANGELOGS: ChangelogIndexItem[] = [
  {
    date: '2026-02-27',
    id: 'v1.134.0',
    image: '/images/changelog/models-feb-2026.png',
    versionRange: ['1.134.0'],
  },
  {
    date: '2026-02-07',
    id: 'v1.133.0',
    image: '/images/changelog/academic-research.png',
    versionRange: ['1.133.0'],
  },
  {
    date: '2026-02-03',
    id: 'v1.132.4',
    image: '/images/changelog/onboarding-recommendations.png',
    versionRange: ['1.132.4'],
  },
  {
    date: '2026-02-01',
    id: 'v1.132.0',
    image: '/images/changelog/biomedical-agents.png',
    versionRange: ['1.132.0'],
  },
  {
    date: '2026-01-28',
    id: 'v1.131.0',
    image: '/images/changelog/pho-points.png',
    versionRange: ['1.131.0'],
  },
];

/**
 * Changelog content (markdown)
 */
export const PHO_CHANGELOG_CONTENT: Record<
  string,
  { content: string; contentVi?: string; title: string; titleVi?: string }
> = {
  'v1.131.0': {
    content: `
## What's New

### Phở Points Economy
Introducing our new credit system:
- **50,000 free points** monthly for all users
- **Fair usage pricing** based on model complexity
- **Real-time balance tracking** in your profile

### Tiered Model Access
Models are now organized into tiers:
- **Tier 1**: Fast models (GPT-4o Mini, Gemini Flash) - 10 points/message
- **Tier 2**: Standard models (GPT-4o, Claude 3.5) - 50 points/message  
- **Tier 3**: Premium models (O3, Deep Research) - 200 points/message

### Vietnam-First Pricing
Special pricing tiers for Vietnamese users with VND payment options.
`,
    contentVi: `
## Có gì mới

### Hệ thống Phở Points
Ra mắt hệ thống credit mới:
- **50,000 points miễn phí** mỗi tháng cho tất cả người dùng
- **Giá hợp lý** dựa trên độ phức tạp của model
- **Theo dõi số dư** real-time trong profile

### Phân cấp Model
Các model giờ được tổ chức theo tier:
- **Tier 1**: Model nhanh (GPT-4o Mini, Gemini Flash) - 10 points/message
- **Tier 2**: Model chuẩn (GPT-4o, Claude 3.5) - 50 points/message
- **Tier 3**: Model cao cấp (O3, Deep Research) - 200 points/message

### Giá ưu đãi cho Việt Nam
Bảng giá đặc biệt cho người dùng Việt Nam với tùy chọn thanh toán VND.
`,
    title: '💎 Phở Points System',
    titleVi: '💎 Hệ thống Phở Points',
  },
  'v1.132.0': {
    content: `
## What's New

### Specialized Biomedical Agents
New AI assistants designed for researchers and medical professionals:
- **Biomedical Research Assistant**: Deep analysis of medical literature
- **Clinical Literature Reviewer**: Systematic review support
- **Medical Educator**: Teaching and patient education

### Medical Disclaimer Integration
All medical-related responses now include appropriate disclaimers to ensure responsible AI use.

### Enhanced PubMed Integration
Improved plugin for searching and analyzing research papers from PubMed and ArXiv.
`,
    contentVi: `
## Có gì mới

### Trợ lý Y sinh Chuyên biệt
Các trợ lý AI mới được thiết kế cho nghiên cứu sinh và chuyên gia y tế:
- **Trợ lý Nghiên cứu Y sinh**: Phân tích chuyên sâu y văn
- **Phân tích Y văn Lâm sàng**: Hỗ trợ tổng quan hệ thống
- **Giảng viên Y khoa**: Dạy học và giáo dục bệnh nhân

### Tích hợp Tuyên bố Y khoa
Tất cả câu trả lời liên quan đến y tế giờ đây bao gồm tuyên bố thích hợp để đảm bảo sử dụng AI có trách nhiệm.

### Cải thiện Tích hợp PubMed
Plugin cải tiến để tìm kiếm và phân tích bài báo nghiên cứu từ PubMed và ArXiv.
`,
    title: '🔬 Biomedical Research Agents',
    titleVi: '🔬 Trợ lý Nghiên cứu Y sinh',
  },
  'v1.132.4': {
    content: `
## What's New

### Multi-Profession Selection
You can now select multiple professions during onboarding to get tailored recommendations for AI assistants, models, and features that match your work.

### Smart Recommendations
Based on your selected professions, Phở.chat will suggest:
- **AI Assistants** specialized for your field
- **Default models** optimized for your tasks  
- **Plugins** to enhance your workflow
- **Features** like Deep Research, Web Search, and Artifacts

### User Choice
All recommendations are opt-in. You can:
- Enable all suggestions with one click
- Select only the features you want
- Skip recommendations entirely

This update makes Phở.chat more personalized from your first interaction!
`,
    contentVi: `
## Có gì mới

### Chọn nhiều nghề nghiệp
Bạn có thể chọn nhiều nghề nghiệp trong quá trình onboarding để nhận gợi ý phù hợp về trợ lý AI, model và tính năng cho công việc của bạn.

### Gợi ý thông minh
Dựa trên nghề nghiệp đã chọn, Phở.chat sẽ gợi ý:
- **Trợ lý AI** chuyên biệt cho lĩnh vực của bạn
- **Model mặc định** tối ưu cho công việc
- **Plugins** để nâng cao workflow
- **Tính năng** như Deep Research, Web Search, và Artifacts

### Quyền lựa chọn
Tất cả gợi ý đều là opt-in. Bạn có thể:
- Bật tất cả gợi ý với một click
- Chọn riêng từng tính năng mong muốn
- Bỏ qua hoàn toàn

Cập nhật này giúp Phở.chat cá nhân hóa hơn ngay từ lần đầu sử dụng!
`,
    title: '✨ Personalized Onboarding Experience',
    titleVi: '✨ Trải nghiệm Onboarding Cá nhân hóa',
  },
  'v1.133.0': {
    content: `
## What's New

### 🎓 Academic Research Module
A comprehensive suite of tools for researchers and students:
- **Semantic Scholar Integration**: Search millions of papers with citation counts and detailed metadata.
- **Enhanced ArXiv**: Lookup papers by ID, get longer abstracts for better context, and extract DOIs automatically.
- **DOI Resolver**: Instantly convert DOIs into full IEEE citations and metadata.
- **Smart Citations**: Beautiful academic cards in search results and an automated Bibliography section at the end of messages.

### 📜 Automated Bibliography
Assistant messages now automatically generate a standard IEEE bibliography for all academic sources used in the conversation.
`,
    contentVi: `
## Có gì mới

### 🎓 Module Nghiên cứu Khoa học
Bộ công cụ toàn diện cho nhà nghiên cứu và sinh viên:
- **Tích hợp Semantic Scholar**: Tìm kiếm hàng triệu bài báo với số lượng trích dẫn và metadata chi tiết.
- **Nâng cấp ArXiv**: Tìm kiếm theo ID, tóm tắt dài hơn cho ngữ cảnh tốt hơn và tự động trích xuất DOI.
- **Phân giải DOI**: Chuyển đổi DOI thành nội dung trích dẫn IEEE đầy đủ ngay lập tức.
- **Trích dẫn thông minh**: Thẻ bài báo học thuật đẹp mắt trong kết quả tìm kiếm và danh mục tham khảo tự động ở cuối tin nhắn.

### 📜 Danh mục tham khảo tự động
Các phản hồi từ trợ lý giờ đây tự động tạo danh mục tham khảo chuẩn IEEE cho tất cả các nguồn học thuật được sử dụng.
`,
    title: '🎓 Academic Research Module',
    titleVi: '🎓 Module Nghiên cứu Khoa học',
  },
  'v1.134.0': {
    content: `
## What's New

### ✨ Phở Auto — Smart Model Routing
New intelligent auto-routing that selects the best AI model for your query:
- **Score-based classification** analyzes your prompt's complexity and category
- **7 categories** supported: coding, math, medical, analysis, creative, translation, general
- **Tier-walking** automatically picks the optimal model from your available options
- Simply select "Phở Auto ✨" from the model picker and let AI choose the best model for you

### 🤖 New Models Added
- **GPT-5.3 Codex** — OpenAI's latest coding flagship, 25% faster
- **Grok 4.2** — xAI's 4-agent architecture, 65% less hallucination
- **Kimi K2.5** — MoonshotAI Agent Swarm with 100 simultaneous agents
- **Mercury 2** — World's fastest AI (1000+ tokens/sec), diffusion-based parallel generation
- **Claude Opus 4.6 & Sonnet 4.6** — Anthropic's upgraded models
- **Gemini 3.1 Pro** — Google's advanced reasoning model

### 🗑️ Deprecated Models Removed
- GPT-4o and GPT-4.1 (retired by OpenAI)
- Claude 4 Sonnet/Opus old versions (replaced by 4.6)
`,
    contentVi: `
## Có gì mới

### ✨ Phở Auto — Tự Động Chọn Model
Cơ chế route thông minh tự động chọn model AI tốt nhất cho yêu cầu của bạn:
- **Phân loại điểm số** phân tích độ phức tạp và loại câu hỏi
- **7 chuyên mục**: lập trình, toán học, y khoa, phân tích, sáng tạo, dịch thuật, chung
- **Tự động tối ưu** chọn model phù hợp nhất từ danh sách khả dụng
- Chỉ cần chọn "Phở Auto ✨" từ model picker và để AI chọn giúp bạn

### 🤖 Models Mới
- **GPT-5.3 Codex** — Model coding mới nhất của OpenAI, nhanh hơn 25%
- **Grok 4.2** — Kiến trúc 4-agent của xAI, giảm 65% hallucination
- **Kimi K2.5** — Agent Swarm của MoonshotAI với 100 agents đồng thời
- **Mercury 2** — AI nhanh nhất thế giới (1000+ tokens/giây), sinh tokens song song
- **Claude Opus 4.6 & Sonnet 4.6** — Models nâng cấp của Anthropic
- **Gemini 3.1 Pro** — Model suy luận nâng cao của Google

### 🗑️ Models Đã Xóa
- GPT-4o và GPT-4.1 (đã bị OpenAI ngừng hỗ trợ)
- Claude 4 Sonnet/Opus phiên bản cũ (được thay bằng 4.6)
`,
    title: '✨ Phở Auto & New Models (Feb 2026)',
    titleVi: '✨ Phở Auto & Models Mới (Tháng 2/2026)',
  },
};
