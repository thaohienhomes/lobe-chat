import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeAppearance } from 'antd-style';
import { ResolvingViewport } from 'next';
import Script from 'next/script';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';
import { isRtlLang } from 'rtl-detect';

import Analytics from '@/components/Analytics';
import { DEFAULT_LANG } from '@/const/locale';
import { isDesktop } from '@/const/version';
import PWAInstall from '@/features/PWAInstall';
import AuthProvider from '@/layout/AuthProvider';
import GlobalProvider from '@/layout/GlobalProvider';
// VoiceSupport temporarily disabled for performance — Feb 2026
// import VoiceSupport from '@/features/VoiceSupport';
import { Locales } from '@/locales/resources';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

// Lifetime banner temporarily hidden — pending copy/pricing review
// const NewYearLifetimeBanner = nextDynamic(
//   () => import('@/features/PromotionBanner/NewYearLifetimeBanner'),
// );

// NOTE: force-dynamic REMOVED for performance — Feb 2026
// Clerk hooks only run in 'use client' components, they don't need force-dynamic.
// Removing this enables Vercel edge caching and ISR, dramatically improving TTFB and LCP.

const inVercel = process.env.VERCEL === '1';

interface RootLayoutProps extends DynamicLayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

const RootLayout = async ({ children, params, modal }: RootLayoutProps) => {
  const { variants } = await params;

  const { locale, isMobile, theme, primaryColor, neutralColor } =
    RouteVariants.deserializeVariants(variants);

  const direction = isRtlLang(locale) ? 'rtl' : 'ltr';

  return (
    <html dir={direction} lang={locale}>
      <head>
        {/* === Critical Resource Hints — Improve FCP/LCP by parallelizing connections === */}
        {/* Clerk auth domain — loads ~200KB+ JS, preconnect saves ~200ms */}
        <link rel="preconnect" href="https://clerk.pho.chat" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://clerk.pho.chat" />
        {/* Clerk CDN for JS bundles */}
        <link rel="preconnect" href="https://cdn.clerk.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.clerk.com" />
        {/* Google Analytics */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Vercel Speed Insights */}
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />

        {/* === Global Error Handlers (Feb 2026) === */}
        {/* 1. Stub zaloJSV2 for Zalo in-app browser */}
        {/* 2. Suppress benign ResizeObserver loop warnings */}
        {/* 3. Auto-reload on ChunkLoadError (stale Vercel deployments, Clerk JS 404) */}
        {/* 4. Gracefully handle unhandled tRPC promise rejections */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if(typeof window!=='undefined'){
  if(!window.zaloJSV2)window.zaloJSV2={};

  // Global error handler
  var _origOnErr=window.onerror;
  window.onerror=function(m,src,line,col,err){
    // Suppress ResizeObserver noise
    if(typeof m==='string'&&m.indexOf('ResizeObserver')!==-1)return true;

    // Auto-reload on ChunkLoadError (stale deployment chunks 404)
    if(err&&(err.name==='ChunkLoadError'||
      (typeof m==='string'&&(m.indexOf('Loading chunk')!==-1||m.indexOf('Failed to fetch dynamically imported')!==-1)))){
      var rk='__chunk_reload';
      try{
        if(!sessionStorage.getItem(rk)){
          sessionStorage.setItem(rk,'1');
          window.location.reload();
          return true;
        }
      }catch(e){}
    }
    return _origOnErr?_origOnErr.apply(window,arguments):false;
  };

  // Catch unhandled promise rejections (tRPC Failed to fetch, UNAUTHORIZED)
  window.addEventListener('unhandledrejection',function(e){
    var r=e&&e.reason;
    if(!r)return;
    var msg=r.message||'';
    // Auto-reload on chunk load promises
    if(r.name==='ChunkLoadError'||msg.indexOf('Loading chunk')!==-1){
      var rk='__chunk_reload';
      try{
        if(!sessionStorage.getItem(rk)){
          sessionStorage.setItem(rk,'1');
          window.location.reload();
        }
      }catch(ex){}
      e.preventDefault();
      return;
    }
    // Suppress tRPC UNAUTHORIZED (expected during auth transitions)
    if(msg==='UNAUTHORIZED'&&r.constructor&&r.constructor.name==='TRPCClientError'){
      e.preventDefault();
      return;
    }
    // Suppress transient network errors (tRPC Failed to fetch)
    if(msg==='Failed to fetch'&&r.constructor&&r.constructor.name==='TRPCClientError'){
      e.preventDefault();
      return;
    }
  });

  // Clear chunk reload flag on successful page load
  window.addEventListener('load',function(){
    try{sessionStorage.removeItem('__chunk_reload');}catch(e){}
  });
}`,
          }}
        />
        {/* Google Site Verification */}
        <meta content="PLACEHOLDER_REPLACE_WITH_ACTUAL_CODE" name="google-site-verification" />
        {process.env.DEBUG_REACT_SCAN === '1' && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script crossOrigin="anonymous" src="https://unpkg.com/react-scan/dist/auto.global.js" />
        )}
      </head>
      <body>
        <NuqsAdapter>
          <GlobalProvider
            appearance={theme}
            isMobile={isMobile}
            locale={locale}
            neutralColor={neutralColor}
            primaryColor={primaryColor}
            variants={variants}
          >
            <AuthProvider>
              {children}
              {!isMobile && modal}
              {/* VoiceSupport temporarily disabled for performance — Feb 2026 */}
            </AuthProvider>
            <PWAInstall />
            {/* Lifetime banner temporarily hidden — pending copy/pricing review */}
            {/* <NewYearLifetimeBanner /> */}
          </GlobalProvider>
        </NuqsAdapter>
        <Analytics />
        {/* Google tag (gtag.js) - deferred to avoid blocking LCP */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-17766075190" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17766075190');`}
        </Script>
        {inVercel && <SpeedInsights />}
      </body>
    </html>
  );
};

export default RootLayout;

export { generateMetadata } from './metadata';

export const generateViewport = async (props: DynamicLayoutProps): ResolvingViewport => {
  const isMobile = await RouteVariants.getIsMobile(props);

  const dynamicScale = isMobile ? { maximumScale: 1, userScalable: false } : {};

  return {
    ...dynamicScale,
    initialScale: 1,
    minimumScale: 1,
    themeColor: [
      { color: '#f8f8f8', media: '(prefers-color-scheme: light)' },
      { color: '#000', media: '(prefers-color-scheme: dark)' },
    ],
    viewportFit: 'cover',
    width: 'device-width',
  };
};

export const generateStaticParams = () => {
  const themes: ThemeAppearance[] = ['dark', 'light'];
  const mobileOptions = isDesktop ? [false] : [true, false];
  // only static for serveral page, other go to dynamtic
  const staticLocales: Locales[] = [DEFAULT_LANG, 'zh-CN'];

  const variants: { variants: string }[] = [];

  for (const locale of staticLocales) {
    for (const theme of themes) {
      for (const isMobile of mobileOptions) {
        variants.push({
          variants: RouteVariants.serializeVariants({ isMobile, locale, theme }),
        });
      }
    }
  }

  return variants;
};
