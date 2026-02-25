import analyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import ReactComponentName from 'react-scan/react-component-name/webpack';

const isProd = process.env.NODE_ENV === 'production';
const buildWithDocker = process.env.DOCKER === 'true';
const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';
const enableReactScan = !!process.env.REACT_SCAN_MONITOR_API_KEY;
const isUsePglite = process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite';
const shouldUseCSP = process.env.ENABLED_CSP === '1';

// if you need to proxy the api endpoint to remote server

const isStandaloneMode = buildWithDocker || isDesktop;

const standaloneConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: { '*': ['public/**/*', '.next/static/**/*'] },
};

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX;

const nextConfig: NextConfig = {
  ...(isStandaloneMode ? standaloneConfig : {}),
  assetPrefix,
  compiler: {
    emotion: true,
  },
  compress: isProd,
  eslint: {
    ignoreDuringBuilds: true,
  },


  experimental: {
    optimizePackageImports: [
      'emoji-mart',
      '@emoji-mart/react',
      '@emoji-mart/data',
      '@icons-pack/react-simple-icons',
      '@lobehub/ui',
      '@lobehub/icons',
      '@ant-design/icons',
      'lucide-react',
      'gpt-tokenizer',
      'antd',
      'antd-style',
      'posthog-js',
      'react-layout-kit',
      'react-i18next',
      // Added for performance optimization — Feb 2026
      'framer-motion',
      'lodash-es',
      'ahooks',
      'dayjs',
      'react-hotkeys-hook',
      '@clerk/nextjs',
    ],
    // oidc provider depend on constructor.name
    // but swc minification will remove the name
    // so we need to disable it
    // refs: https://github.com/lobehub/lobe-chat/pull/7430
    serverMinification: false,
    webVitalsAttribution: ['CLS', 'LCP'],
    webpackMemoryOptimizations: true,
  },


  async headers() {
    const securityHeaders = [
      {
        key: 'x-robots-tag',
        value: 'all',
      },
    ];

    if (shouldUseCSP) {
      securityHeaders.push(
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'none';",
        },
      );
    }

    return [
      {
        headers: securityHeaders,
        source: '/:path*',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/icons/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/images/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/videos/(.*).(mp4|webm|ogg|avi|mov|wmv|flv|mkv)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/screenshots/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/og/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon-32x32.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/apple-touch-icon.png',
      },
    ];
  },

  // Image optimization – prefer WebP for smaller payloads
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31_536_000, // 1 year
  },

  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  // Exclude unnecessary files from serverless function bundles to reduce size
  // Moved from experimental to top-level in Next.js 15
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'node_modules/webpack',
      'node_modules/rollup',
      'node_modules/terser',
    ],
  },
  reactStrictMode: true,

  redirects: async () => [
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap.xml',
    },
    // ... existing redirects
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap-0.xml',
    },
    {
      destination: '/sitemap/plugins-1.xml',
      permanent: true,
      source: '/sitemap/plugins.xml',
    },
    {
      destination: '/sitemap/assistants-1.xml',
      permanent: true,
      source: '/sitemap/assistants.xml',
    },
    {
      destination: '/manifest.webmanifest',
      permanent: true,
      source: '/manifest.json',
    },
    {
      destination: '/discover/assistant',
      permanent: true,
      source: '/discover/assistants',
    },
    {
      destination: '/discover/plugin',
      permanent: true,
      source: '/discover/plugins',
    },
    {
      destination: '/discover/model',
      permanent: true,
      source: '/discover/models',
    },
    {
      destination: '/discover/provider',
      permanent: true,
      source: '/discover/providers',
    },
    // {
    //   destination: '/settings/common',
    //   permanent: true,
    //   source: '/settings',
    // },
    {
      destination: '/chat',
      permanent: true,
      source: '/welcome',
    },
    // TODO: 等 V2 做强制跳转吧
    // {
    //   destination: '/settings/provider/volcengine',
    //   permanent: true,
    //   source: '/settings/provider/doubao',
    // },
    // we need back /repos url in the further
    {
      destination: '/files',
      permanent: false,
      source: '/repos',
    },
  ],

  rewrites: async () => [
    {
      destination: 'https://us.i.posthog.com/:path*',
      source: '/ingest/:path*',
    },
    {
      destination: 'https://us.i.posthog.com/static/:path*',
      source: '/ingest/static/:path*',
    },
  ],

  // when external packages in dev mode with turbopack, this config will lead to bundle error
  // For production we also externalize large server-only SDKs to keep individual
  // Serverless Function bundles smaller (the packages are still present in
  // node_modules at runtime on Vercel).
  serverExternalPackages: isProd
    ? [
      '@electric-sql/pglite',
      '@xmldom/xmldom',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
      'sharp',
      '@img/sharp-libvips-linux-x64',
      '@img/sharp-libvips-linuxmusl-x64',
      '@shikijs/langs',
      '@shikijs/themes',
      '@shikijs/engine-oniguruma',
    ]
    : ['@xmldom/xmldom'],
  transpilePackages: ['pdfjs-dist', 'mermaid'],

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // 开启该插件会导致 pglite 的 fs bundler 被改表
    if (enableReactScan && !isUsePglite) {
      config.plugins.push(ReactComponentName({}));
    }

    // to fix shikiji compile error
    // refs: https://github.com/antfu/shikiji/issues/23
    config.module.rules.push({
      resolve: {
        fullySpecified: false,
      },
      test: /\.m?js$/,
      type: 'javascript/auto',
    });

    // https://github.com/pinojs/pino/issues/688#issuecomment-637763276
    config.externals.push('pino-pretty');

    config.resolve.alias.canvas = false;

    // to ignore epub2 compile error
    // refs: https://github.com/lobehub/lobe-chat/discussions/6769
    config.resolve.fallback = {
      ...config.resolve.fallback,
      zipfile: false,
    };

    if (assetPrefix && (assetPrefix.startsWith('http://') || assetPrefix.startsWith('https://'))) {
      // fix the Worker URL cross-origin issue
      // refs: https://github.com/lobehub/lobe-chat/pull/9624
      config.module.rules.push({
        generator: {
          // @see https://webpack.js.org/configuration/module/#rulegeneratorpublicpath
          publicPath: '/_next/',
        },
        test: /worker\.ts$/,
        // @see https://webpack.js.org/guides/asset-modules/
        type: 'asset/resource',
      });
    }

    return config;
  },
};

const noWrapper = (config: NextConfig) => config;

const withBundleAnalyzer = process.env.ANALYZE === 'true' ? analyzer() : noWrapper;

const withPWA =
  isProd && !isDesktop
    ? withSerwistInit({
      // Allow precaching of large PGLite assets for offline functionality
      // Reduced from 10MB to 5MB to optimize build memory usage on Vercel
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

      register: false,

      swDest: 'public/sw.js',

      swSrc: 'src/app/sw.ts', // 5MB
    })
    : noWrapper;

// Conditionally wrap with Sentry based on environment variable
// NOTE: Sentry has been fully removed for performance optimization
// The entire @sentry/nextjs package was adding ~200KB+ to the client bundle
// and causing ~8s of main thread blocking time on the /chat page

export default withBundleAnalyzer(withPWA(nextConfig as NextConfig));
