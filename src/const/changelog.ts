import { ChangelogIndexItem } from '@/types/changelog';

/**
 * Local changelog entries for Phở.chat
 * These are displayed on /changelog page
 */
export const PHO_CHANGELOGS: ChangelogIndexItem[] = [
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
  { content: string; contentVi?: string, title: string; titleVi?: string; }
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
};
