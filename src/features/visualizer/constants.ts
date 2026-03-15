export const CDN_ALLOWLIST = [
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
  'https://esm.sh',
] as const;

export const STYLE_CDN_ALLOWLIST = [
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
  'https://fonts.googleapis.com',
] as const;

export const MORPHDOM_CDN_URL =
  'https://cdn.jsdelivr.net/npm/morphdom@2/dist/morphdom-umd.min.js';

export const DEFAULT_MAX_WIDGETS = 3;

export const DEBOUNCE_MS = 150;

export const MAX_WIDGET_CODE_SIZE = 500 * 1024; // 500KB

export const SCRIPT_EXECUTION_TIMEOUT_MS = 120_000; // 120s
