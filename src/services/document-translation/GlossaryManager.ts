/**
 * Custom Glossary Manager — Domain-specific term overrides
 *
 * Manages glossaries for specialized document translation.
 * Supports:
 * - Built-in glossaries for common domains (construction, medical, legal)
 * - User-uploaded custom glossary files (CSV, JSON)
 * - Per-job glossary overrides
 *
 * Glossary entries are applied BEFORE AI translation (no token cost).
 */

// ─── Built-in Domain Glossaries ─────────────────────────────────────

/** Construction & Engineering (Chinese → Vietnamese) */
/* eslint-disable sort-keys-fix/sort-keys-fix */
const CONSTRUCTION_ZH_VI: Record<string, string> = {
  图纸: 'Bản vẽ',
  剖面图: 'Mặt cắt',
  垂直: 'Đứng',
  基础: 'Móng',
  墙: 'Tường',
  尺寸: 'Kích thước',
  平面图: 'Mặt bằng',
  承载力: 'Khả năng chịu lực',
  施工: 'Thi công',
  保温: 'Cách nhiệt',
  板: 'Sàn',
  排水: 'Thoát nước',
  柱: 'Cột',
  标高: 'Cao độ',
  梁: 'Dầm',
  弱电: 'Điện nhẹ',
  楼梯: 'Cầu thang',
  强电: 'Điện mạnh',
  混凝土: 'Bê tông',
  暖通: 'Cơ điện',
  结构: 'Kết cấu',
  型号: 'Mã hiệu',
  钢筋: 'Cốt thép',
  单位: 'Đơn vị',
  模板: 'Ván khuôn',
  数量: 'Số lượng',
  设计: 'Thiết kế',
  材料: 'Vật liệu',
  水平: 'Ngang',
  消防: 'PCCC',
  轴线: 'Trục',
  电梯: 'Thang máy',
  电气: 'Điện',
  立面图: 'Mặt đứng',
  给水: 'Cấp nước',
  荷载: 'Tải trọng',
  规格: 'Quy cách',
  详图: 'Chi tiết',
  通风: 'Thông gió',
  配筋: 'Bố trí thép',
  防水: 'Chống thấm',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

/** Construction & Engineering (Chinese → English) */
/* eslint-disable sort-keys-fix/sort-keys-fix */
const CONSTRUCTION_ZH_EN: Record<string, string> = {
  剖面图: 'Cross Section',
  图纸: 'Drawing',
  基础: 'Foundation',
  墙: 'Wall',
  尺寸: 'Dimension',
  平面图: 'Floor Plan',
  承载力: 'Bearing Capacity',
  保温: 'Thermal Insulation',
  施工: 'Construction',
  排水: 'Drainage',
  板: 'Slab',
  柱: 'Column',
  标高: 'Elevation',
  材料: 'Material',
  梁: 'Beam',
  数量: 'Quantity',
  楼梯: 'Staircase',
  模板: 'Formwork',
  混凝土: 'Concrete',
  消防: 'Fire Protection',
  结构: 'Structure',
  电梯: 'Elevator',
  钢筋: 'Rebar',
  电气: 'Electrical',
  立面图: 'Elevation View',
  给水: 'Water Supply',
  设计: 'Design',
  荷载: 'Load',
  规格: 'Specification',
  详图: 'Detail Drawing',
  轴线: 'Axis',
  通风: 'Ventilation',
  配筋: 'Reinforcement Layout',
  防水: 'Waterproofing',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

// ─── Glossary Registry ──────────────────────────────────────────────

type DomainKey = 'construction';

const BUILT_IN_GLOSSARIES: Record<string, Record<string, string>> = {
  'construction:zh_en': CONSTRUCTION_ZH_EN,
  'construction:zh_vi': CONSTRUCTION_ZH_VI,
};

// ─── GlossaryManager ────────────────────────────────────────────────

export class GlossaryManager {
  /**
   * Get the merged glossary for a domain + language pair.
   *
   * Priority: custom > built-in
   */
  getGlossary(
    domain: DomainKey | undefined,
    sourceLang: string,
    targetLang: string,
    customGlossary?: Record<string, string>,
  ): Record<string, string> {
    const merged: Record<string, string> = {};

    // Built-in glossary
    if (domain) {
      const key = `${domain}:${sourceLang}_${targetLang}`;
      const builtIn = BUILT_IN_GLOSSARIES[key];
      if (builtIn) {
        Object.assign(merged, builtIn);
      }
    }

    // Custom glossary (overrides built-in)
    if (customGlossary) {
      Object.assign(merged, customGlossary);
    }

    return merged;
  }

  /**
   * Parse a CSV glossary upload.
   * Format: original,translated (one pair per line)
   */
  static parseCSVGlossary(csvContent: string): Record<string, string> {
    const glossary: Record<string, string> = {};
    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Skip header row if present
      if (line.toLowerCase().startsWith('original') || line.toLowerCase().startsWith('source')) {
        continue;
      }

      const parts = line.split(',').map((p) => p.trim().replaceAll(/^["']|["']$/g, ''));
      if (parts.length >= 2 && parts[0] && parts[1]) {
        glossary[parts[0]] = parts[1];
      }
    }

    return glossary;
  }

  /**
   * Parse a JSON glossary upload.
   * Format: { "original": "translated", ... }
   */
  static parseJSONGlossary(jsonContent: string): Record<string, string> {
    const parsed = JSON.parse(jsonContent);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Glossary must be a flat JSON object');
    }
    return parsed as Record<string, string>;
  }

  /**
   * Detect domain from document content (heuristic).
   */
  static detectDomain(texts: string[]): DomainKey | undefined {
    const sample = texts.slice(0, 20).join(' ');

    // Construction keywords
    const constructionKeywords = [
      '混凝土',
      '钢筋',
      '施工',
      '结构',
      '基础',
      '标高',
      '平面图',
      '剖面图',
      '柱',
      '梁',
      '板',
      '楼梯',
      'concrete',
      'rebar',
      'foundation',
      'elevation',
      'beam',
      'column',
      'bê tông',
      'cốt thép',
      'móng',
      'kết cấu',
      'thi công',
    ];

    const matches = constructionKeywords.filter((kw) =>
      sample.toLowerCase().includes(kw.toLowerCase()),
    );

    if (matches.length >= 2) return 'construction';

    return undefined;
  }
}
