import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── SVG templates ────────────────────────────────────────────────────────────

const academicManualSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#07071a"/>
      <stop offset="50%" style="stop-color:#0d0a2e"/>
      <stop offset="100%" style="stop-color:#0f1535"/>
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(139,92,246,0.18)"/>
      <stop offset="100%" style="stop-color:rgba(59,130,246,0.08)"/>
    </linearGradient>
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c084fc"/>
      <stop offset="50%" style="stop-color:#f472b6"/>
      <stop offset="100%" style="stop-color:#fb923c"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-strong">
      <feGaussianBlur stdDeviation="16" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:rgba(139,92,246,0.35)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
    <radialGradient id="glow-top" cx="50%" cy="0%" r="70%">
      <stop offset="0%" style="stop-color:rgba(139,92,246,0.22)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
  </defs>

  <!-- BG -->
  <rect width="1200" height="675" fill="url(#bg)"/>

  <!-- Ambient glows -->
  <ellipse cx="600" cy="0" rx="600" ry="300" fill="url(#glow-top)" opacity="0.7"/>
  <ellipse cx="900" cy="400" rx="300" ry="250" fill="rgba(236,72,153,0.07)"/>
  <ellipse cx="200" cy="300" rx="250" ry="200" fill="rgba(59,130,246,0.07)"/>

  <!-- Grid lines (subtle) -->
  <g stroke="rgba(139,92,246,0.06)" stroke-width="1">
    <line x1="0" y1="112" x2="1200" y2="112"/>
    <line x1="0" y1="225" x2="1200" y2="225"/>
    <line x1="0" y1="337" x2="1200" y2="337"/>
    <line x1="0" y1="450" x2="1200" y2="450"/>
    <line x1="0" y1="562" x2="1200" y2="562"/>
    <line x1="200" y1="0" x2="200" y2="675"/>
    <line x1="400" y1="0" x2="400" y2="675"/>
    <line x1="600" y1="0" x2="600" y2="675"/>
    <line x1="800" y1="0" x2="800" y2="675"/>
    <line x1="1000" y1="0" x2="1000" y2="675"/>
  </g>

  <!-- Main chat panel -->
  <rect x="80" y="100" width="540" height="380" rx="20" fill="url(#panel)" stroke="rgba(139,92,246,0.25)" stroke-width="1.5"/>
  
  <!-- Chat header -->
  <rect x="80" y="100" width="540" height="52" rx="20" fill="rgba(139,92,246,0.15)"/>
  <rect x="80" y="132" width="540" height="20" fill="rgba(139,92,246,0.15)"/>
  <circle cx="110" cy="126" r="8" fill="rgba(139,92,246,0.6)"/>
  <text x="130" y="131" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.9)">Phở Chat Medical</text>
  
  <!-- Chat messages -->
  <!-- User message -->
  <rect x="240" y="175" width="340" height="52" rx="12" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.2)" stroke-width="1"/>
  <text x="260" y="197" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">Tìm nghiên cứu về SGLT-2 inhibitor</text>
  <text x="260" y="215" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">trong điều trị tiểu đường type 2</text>
  
  <!-- AI response -->
  <rect x="95" y="248" width="380" height="86" rx="12" fill="rgba(15,10,40,0.6)" stroke="rgba(59,130,246,0.2)" stroke-width="1"/>
  <circle cx="113" cy="260" r="6" fill="#8b5cf6"/>
  <text x="128" y="266" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#c084fc">Phở AI</text>
  <text x="110" y="286" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.75)">Tìm thấy 847 bài báo từ PubMed</text>
  <text x="110" y="303" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.75)">• Empagliflozin reduces HbA1c by 0.8%...</text>
  <text x="110" y="320" font-family="Inter, sans-serif" font-size="11" fill="rgba(100,200,255,0.8)">DOI: 10.1056/NEJMoa1800145 ↗</text>
  
  <!-- Steps indicator -->
  <g transform="translate(100, 370)">
    <circle cx="20" cy="20" r="18" fill="rgba(139,92,246,0.25)" stroke="#8b5cf6" stroke-width="1.5" filter="url(#glow)"/>
    <text x="20" y="25" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#c084fc" text-anchor="middle">1</text>
    <line x1="38" y1="20" x2="108" y2="20" stroke="rgba(139,92,246,0.4)" stroke-width="1.5" stroke-dasharray="4,3"/>
    <circle cx="126" cy="20" r="18" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="1.5" filter="url(#glow)"/>
    <text x="126" y="25" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#60a5fa" text-anchor="middle">2</text>
    <line x1="144" y1="20" x2="214" y2="20" stroke="rgba(59,130,246,0.4)" stroke-width="1.5" stroke-dasharray="4,3"/>
    <circle cx="232" cy="20" r="18" fill="rgba(236,72,153,0.25)" stroke="#ec4899" stroke-width="1.5" filter="url(#glow)"/>
    <text x="232" y="25" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#f472b6" text-anchor="middle">3</text>
  </g>

  <!-- Floating badge nodes on right -->
  <!-- PubMed badge -->
  <rect x="700" y="120" width="130" height="38" rx="19" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <circle cx="722" cy="139" r="6" fill="#22c55e"/>
  <text x="736" y="144" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#4ade80">PubMed</text>
  
  <!-- ArXiv badge -->
  <rect x="860" y="200" width="130" height="38" rx="19" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <circle cx="882" cy="219" r="6" fill="#f97316"/>
  <text x="896" y="224" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#fb923c">ArXiv</text>
  
  <!-- DOI badge -->
  <rect x="680" y="290" width="110" height="38" rx="19" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <circle cx="700" cy="309" r="6" fill="#3b82f6"/>
  <text x="714" y="314" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#60a5fa">DOI</text>
  
  <!-- Semantic Scholar badge -->
  <rect x="780" y="370" width="200" height="38" rx="19" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <circle cx="800" cy="389" r="6" fill="#8b5cf6"/>
  <text x="814" y="394" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#c084fc">Semantic Scholar</text>
  
  <!-- Network lines connecting badges -->
  <g stroke="rgba(139,92,246,0.2)" stroke-width="1" stroke-dasharray="5,4">
    <line x1="765" y1="139" x2="800" y2="219"/>
    <line x1="860" y1="219" x2="790" y2="309"/>
    <line x1="790" y1="309" x2="880" y2="389"/>
  </g>

  <!-- Title text at bottom -->
  <text x="600" y="565" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="url(#title-grad)" text-anchor="middle" filter="url(#glow)">Hướng Dẫn Module Nghiên Cứu Khoa Học</text>
  <text x="600" y="605" font-family="Inter, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle">Semantic Scholar · ArXiv · DOI Resolver · PubMed</text>
  
  <!-- Phở Chat branding -->
  <text x="600" y="648" font-family="Inter, sans-serif" font-size="13" fill="rgba(139,92,246,0.6)" text-anchor="middle">pho.chat</text>
</svg>
`;

const academicBannerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#07071a"/>
      <stop offset="40%" style="stop-color:#130a2e"/>
      <stop offset="100%" style="stop-color:#0a0f1e"/>
    </linearGradient>
    <linearGradient id="title2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="50%" style="stop-color:#e879f9"/>
      <stop offset="100%" style="stop-color:#f472b6"/>
    </linearGradient>
    <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:rgba(139,92,246,0.45)"/>
      <stop offset="60%" style="stop-color:rgba(217,70,239,0.15)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
    <filter id="glow2">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="blur-soft">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>

  <!-- BG -->
  <rect width="1200" height="675" fill="url(#bg2)"/>
  
  <!-- Center glow -->
  <ellipse cx="600" cy="320" rx="400" ry="280" fill="url(#center-glow)" filter="url(#blur-soft)"/>
  
  <!-- Particle dots -->
  <g fill="rgba(139,92,246,0.4)">
    <circle cx="150" cy="100" r="2"/>
    <circle cx="280" cy="60" r="1.5"/>
    <circle cx="380" cy="130" r="2.5"/>
    <circle cx="900" cy="80" r="2"/>
    <circle cx="1050" cy="150" r="1.5"/>
    <circle cx="980" cy="50" r="2"/>
    <circle cx="100" cy="500" r="2"/>
    <circle cx="1100" cy="450" r="2.5"/>
    <circle cx="200" cy="600" r="1.5"/>
    <circle cx="1000" cy="580" r="2"/>
  </g>
  <g fill="rgba(217,70,239,0.3)">
    <circle cx="450" cy="80" r="2"/>
    <circle cx="750" cy="60" r="1.5"/>
    <circle cx="650" cy="590" r="2"/>
    <circle cx="350" cy="560" r="1.5"/>
    <circle cx="850" cy="530" r="2.5"/>
  </g>

  <!-- Orbit rings -->
  <circle cx="600" cy="310" r="200" fill="none" stroke="rgba(139,92,246,0.1)" stroke-width="1" stroke-dasharray="8,6"/>
  <circle cx="600" cy="310" r="280" fill="none" stroke="rgba(139,92,246,0.07)" stroke-width="1" stroke-dasharray="12,10"/>

  <!-- Center icon: graduation cap emoji-style -->
  <!-- Cap top -->
  <rect x="540" y="240" width="120" height="16" rx="4" fill="#8b5cf6" filter="url(#glow2)"/>
  <!-- Cap base -->
  <polygon points="540,256 600,285 660,256 600,227" fill="#7c3aed" filter="url(#glow2)"/>
  <!-- Tassel -->
  <line x1="660" y1="256" x2="680" y2="300" stroke="#c084fc" stroke-width="3"/>
  <circle cx="680" cy="305" r="5" fill="#c084fc" filter="url(#glow2)"/>
  
  <!-- Center glow circle behind cap -->
  <circle cx="600" cy="260" r="70" fill="rgba(139,92,246,0.12)" filter="url(#blur-soft)"/>

  <!-- Tool cards floating around -->
  <!-- Semantic Scholar - top left -->
  <rect x="90" y="160" width="220" height="78" rx="16" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.3)" stroke-width="1.5"/>
  <text x="110" y="192" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="rgba(139,92,246,0.9)" letter-spacing="0.06em">SEMANTIC SCHOLAR</text>
  <text x="110" y="212" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)">200M+ bài báo khoa học</text>
  <text x="110" y="228" font-family="Inter, sans-serif" font-size="11" fill="rgba(139,92,246,0.8)">✓ AI-powered search</text>

  <!-- DOI Resolver - top right -->
  <rect x="890" y="160" width="220" height="78" rx="16" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" stroke-width="1.5"/>
  <text x="910" y="192" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="rgba(59,130,246,0.9)" letter-spacing="0.06em">DOI RESOLVER</text>
  <text x="910" y="212" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)">Trích dẫn tự động</text>
  <text x="910" y="228" font-family="Inter, sans-serif" font-size="11" fill="rgba(59,130,246,0.8)">✓ APA · Vancouver · MLA</text>

  <!-- IEEE Bibliography - bottom left -->
  <rect x="90" y="440" width="220" height="78" rx="16" fill="rgba(236,72,153,0.12)" stroke="rgba(236,72,153,0.3)" stroke-width="1.5"/>
  <text x="110" y="472" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="rgba(236,72,153,0.9)" letter-spacing="0.06em">IEEE BIBLIOGRAPHY</text>
  <text x="110" y="492" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)">Chuẩn IEEE cho kỹ thuật</text>
  <text x="110" y="508" font-family="Inter, sans-serif" font-size="11" fill="rgba(236,72,153,0.8)">✓ Engineering papers</text>

  <!-- Connector lines -->
  <line x1="310" y1="200" x2="510" y2="270" stroke="rgba(139,92,246,0.2)" stroke-width="1" stroke-dasharray="5,4"/>
  <line x1="890" y1="200" x2="690" y2="270" stroke="rgba(59,130,246,0.2)" stroke-width="1" stroke-dasharray="5,4"/>
  <line x1="310" y1="480" x2="510" y2="360" stroke="rgba(236,72,153,0.2)" stroke-width="1" stroke-dasharray="5,4"/>

  <!-- Launch badge at top center -->
  <rect x="465" y="60" width="270" height="48" rx="24" fill="linear-gradient(135deg,#7c3aed,#db2777)" stroke="none"/>
  <rect x="465" y="60" width="270" height="48" rx="24" fill="rgba(124,58,237,0.25)" stroke="rgba(192,132,252,0.5)" stroke-width="1.5"/>
  <circle cx="490" cy="84" r="5" fill="#4ade80"/>
  <text x="504" y="89" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="white" letter-spacing="0.05em">RA MẮT CHÍNH THỨC</text>

  <!-- Title -->
  <text x="600" y="570" font-family="Inter, sans-serif" font-size="36" font-weight="800" fill="url(#title2)" text-anchor="middle" filter="url(#glow2)">Module Nghiên Cứu Khoa Học</text>
  <text x="600" y="612" font-family="Inter, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle">Academic Research Suite — Ra mắt tháng 2/2026</text>
  <text x="600" y="648" font-family="Inter, sans-serif" font-size="13" fill="rgba(139,92,246,0.6)" text-anchor="middle">pho.chat</text>
</svg>
`;

async function generateThumbnail(svgContent, outputPath) {
    const buffer = Buffer.from(svgContent);
    await sharp(buffer)
        .png({ compressionLevel: 8, quality: 95 })
        .resize(1200, 675)
        .toFile(outputPath);
    console.log(`✅ Generated: ${outputPath}`);
}

async function main() {
    // Ensure directories exist
    mkdirSync(join(publicDir, 'images', 'generated'), { recursive: true });
    mkdirSync(join(publicDir, 'images', 'blog'), { recursive: true });

    await generateThumbnail(
        academicManualSvg,
        join(publicDir, 'images', 'generated', 'academic_research_manual_hero.png')
    );

    await generateThumbnail(
        academicBannerSvg,
        join(publicDir, 'images', 'blog', 'academic-research-banner.png')
    );

    console.log('\n🎉 All thumbnails generated successfully!');
}

main().catch(console.error);
