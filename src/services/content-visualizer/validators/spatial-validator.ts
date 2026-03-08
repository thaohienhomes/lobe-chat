/**
 * Stage 2: Spatial Validation
 * Static analysis of coordinates in generated React Artifact code.
 * Ensures all elements are within 0–100% viewport bounds (Track A).
 */

export interface SpatialValidationResult {
  errors: string[];
  valid: boolean;
  warnings: string[];
}

/**
 * Patterns that indicate percentage-based positioning.
 * Values outside 0-100% range are flagged.
 */
const PERCENTAGE_PATTERNS = [
  // Tailwind classes with arbitrary values: top-[120%], left-[-10%]
  /(?:top|left|right|bottom)-\[(-?\d+(?:\.\d+)?)%\]/g,
  // Inline style percentages: top: '120%', left: '-10%'
  /(?:top|left|right|bottom)\s*:\s*['"](-?\d+(?:\.\d+)?)%['"]/g,
];

/**
 * Patterns for pixel-based positioning.
 * Values larger than reasonable viewport bounds are warned.
 */
const PIXEL_PATTERNS = [
  // Tailwind classes: top-[2000px], left-[-500px]
  /(?:top|left|right|bottom)-\[(-?\d+(?:\.\d+)?)px\]/g,
  // Inline style pixels: top: '2000px'
  /(?:top|left|right|bottom)\s*:\s*['"](-?\d+(?:\.\d+)?)px['"]/g,
  // Inline style numbers: top: 2000
  /(?:top|left|right|bottom)\s*:\s*(-?\d+(?:\.\d+)?)[,}\s]/g,
];

/**
 * SVG coordinate patterns — viewBox and transform.
 */
const SVG_PATTERNS = [
  // viewBox="0 0 width height"
  /viewBox\s*=\s*["'](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']/g,
  // SVG x/y/cx/cy attributes
  /\b(?:cx|cy|x1|x2|y1|y2|x|y)\s*=\s*[{"](-?\d+(?:\.\d+)?)/g,
  // transform translate
  /translate\((-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)\)/g,
];

/** Reasonable viewport pixel bounds */
const MAX_PIXEL_VALUE = 4096;
const MIN_PIXEL_VALUE = -1000;

/** Maximum SVG coordinate value */
const MAX_SVG_COORDINATE = 10_000;

/**
 * Check percentage-based positioning values.
 */
function checkPercentagePositions(code: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const pattern of PERCENTAGE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(code)) !== null) {
      const value = Number.parseFloat(match[1]);
      if (value < -50 || value > 150) {
        errors.push(
          `Percentage position out of bounds: ${value}% (expected -50% to 150%). ` +
          `Context: "${match[0]}"`,
        );
      } else if (value < 0 || value > 100) {
        warnings.push(
          `Percentage position near edge: ${value}%. May be partially off-screen. ` +
          `Context: "${match[0]}"`,
        );
      }
    }
  }

  return { errors, warnings };
}

/**
 * Check pixel-based positioning values.
 */
function checkPixelPositions(code: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const pattern of PIXEL_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(code)) !== null) {
      const value = Number.parseFloat(match[1]);
      if (value > MAX_PIXEL_VALUE || value < MIN_PIXEL_VALUE) {
        errors.push(
          `Pixel position out of viewport: ${value}px ` +
          `(expected ${MIN_PIXEL_VALUE}–${MAX_PIXEL_VALUE}px). Context: "${match[0]}"`,
        );
      }
    }
  }

  return { errors, warnings };
}

/**
 * Check SVG coordinates are within reasonable bounds.
 */
function checkSvgCoordinates(code: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const pattern of SVG_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(code)) !== null) {
      // Check all captured groups (some patterns have multiple coordinate groups)
      for (let i = 1; i < match.length; i++) {
        if (match[i] === undefined) continue;
        const value = Number.parseFloat(match[i]);
        if (Math.abs(value) > MAX_SVG_COORDINATE) {
          errors.push(
            `SVG coordinate out of bounds: ${value} ` +
            `(expected -${MAX_SVG_COORDINATE} to ${MAX_SVG_COORDINATE}). Context: "${match[0]}"`,
          );
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * Validate spatial positioning in generated React Artifact code.
 *
 * @param code - JSX source code string
 * @returns SpatialValidationResult with errors and warnings
 */
export function validateSpatial(code: string): SpatialValidationResult {
  const percentResult = checkPercentagePositions(code);
  const pixelResult = checkPixelPositions(code);
  const svgResult = checkSvgCoordinates(code);

  const errors = [
    ...percentResult.errors,
    ...pixelResult.errors,
    ...svgResult.errors,
  ];

  const warnings = [
    ...percentResult.warnings,
    ...pixelResult.warnings,
    ...svgResult.warnings,
  ];

  return {
    errors,
    valid: errors.length === 0,
    warnings,
  };
}
