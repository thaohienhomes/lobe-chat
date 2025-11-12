import { NextRequest } from 'next/server';

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '').toLowerCase();

const rawOrigins = [
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.APP_URL,
  process.env.SEPAY_RETURN_URL,
  process.env.SEPAY_CANCEL_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  'http://localhost:3000',
  'http://localhost:3010',
].filter(Boolean) as string[];

const originMap = new Map(rawOrigins.map((origin) => [normalizeOrigin(origin), origin]));
const fallbackOrigin = rawOrigins[0];

export const resolveCorsHeaders = (
  request: NextRequest,
  methods: string[],
): Record<string, string> => {
  const originHeader = request.headers.get('origin');
  const normalizedOrigin = originHeader ? normalizeOrigin(originHeader) : undefined;
  const matchedOrigin =
    normalizedOrigin && originMap.has(normalizedOrigin)
      ? originMap.get(normalizedOrigin)
      : undefined;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': methods.join(', '),
    'Vary': 'Origin',
  };

  const allowOrigin = matchedOrigin ?? (!originHeader ? fallbackOrigin : undefined);

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
};
