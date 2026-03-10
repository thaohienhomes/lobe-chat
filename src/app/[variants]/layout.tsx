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
        <link crossOrigin="anonymous" href="https://clerk.pho.chat" rel="preconnect" />
        <link href="https://clerk.pho.chat" rel="dns-prefetch" />
        {/* Clerk CDN for JS bundles */}
        <link crossOrigin="anonymous" href="https://cdn.clerk.com" rel="preconnect" />
        <link href="https://cdn.clerk.com" rel="dns-prefetch" />
        {/* Google Analytics */}
        <link crossOrigin="anonymous" href="https://www.googletagmanager.com" rel="preconnect" />
        <link href="https://www.googletagmanager.com" rel="dns-prefetch" />
        {/* Vercel Speed Insights */}
        <link href="https://va.vercel-scripts.com" rel="dns-prefetch" />

        {/* === Global Error Handlers (Mar 2026) === */}
        {/* 1. Stub zaloJSV2 for Zalo in-app browser */}
        {/* 2. Suppress benign ResizeObserver loop warnings */}
        {/* 3. Auto-reload on ChunkLoadError with multi-retry + backoff (Clerk CDN timeout fix) */}
        {/* 4. Gracefully handle unhandled tRPC promise rejections */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if(typeof window!=='undefined'){
  if(!window.zaloJSV2)window.zaloJSV2={};

  // Multi-retry helper: allows up to 3 reloads with exponential backoff
  // Tracks per-page retries to handle Clerk CDN timeouts in slow regions (VN)
  function _chunkRetry(){
    var MAX=3,rk='__chunk_retries';
    try{
      var c=parseInt(sessionStorage.getItem(rk)||'0',10);
      if(c<MAX){
        sessionStorage.setItem(rk,String(c+1));
        var delay=Math.min(1000*Math.pow(2,c),8000);
        setTimeout(function(){window.location.reload();},delay);
        return true;
      }
    }catch(e){}
    return false;
  }

  // Global error handler
  var _origOnErr=window.onerror;
  window.onerror=function(m,src,line,col,err){
    // Suppress ResizeObserver noise
    if(typeof m==='string'&&m.indexOf('ResizeObserver')!==-1)return true;

    // Auto-reload on ChunkLoadError with multi-retry
    if(err&&(err.name==='ChunkLoadError'||
      (typeof m==='string'&&(m.indexOf('Loading chunk')!==-1||m.indexOf('Failed to fetch dynamically imported')!==-1)))){
      if(_chunkRetry())return true;
    }
    return _origOnErr?_origOnErr.apply(window,arguments):false;
  };

  // Catch unhandled promise rejections (tRPC Failed to fetch, UNAUTHORIZED)
  window.addEventListener('unhandledrejection',function(e){
    var r=e&&e.reason;
    if(!r)return;
    var msg=r.message||'';
    // Auto-reload on chunk load promises with multi-retry
    if(r.name==='ChunkLoadError'||msg.indexOf('Loading chunk')!==-1){
      _chunkRetry();
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

  // Clear retry counter on successful page load (all chunks loaded OK)
  window.addEventListener('load',function(){
    try{sessionStorage.removeItem('__chunk_retries');}catch(e){}
  });
}`,
          }}
        />
        {/* === Client-side Error Reporter (Mar 2026) === */}
        {/* Catches JS errors, unhandled rejections, and fetch 500s */}
        {/* Deduplicates and sends to /api/error-report + PostHog */}
        {/* Production only (pho.chat hostname) — 0 bundle size */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if(typeof window!=='undefined'&&window.location.hostname.indexOf('pho.chat')!==-1){
  var _errMap={},_errReset=Date.now(),_ERR_MAX=100,_ERR_WIN=300000;

  function _errHash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h.toString(36);}

  function _errClean(){var n=Date.now();if(n-_errReset>600000){_errMap={};_errReset=n;}}

  function _errReport(type,msg,stack,url){
    if(!msg)return;
    _errClean();
    var k=_errHash(type+':'+msg);
    var e=_errMap[k];
    if(!e){
      if(Object.keys(_errMap).length>=_ERR_MAX)return;
      e={c:0,t:Date.now()};_errMap[k]=e;
    }
    if(Date.now()-e.t>_ERR_WIN){e.c=0;e.t=Date.now();}
    e.c++;
    if(e.c>3)return;
    try{
      var body=JSON.stringify({type:type,message:msg.slice(0,500),stack:(stack||'').slice(0,1000),url:url||window.location.pathname,userAgent:navigator.userAgent,timestamp:new Date().toISOString()});
      if(navigator.sendBeacon){navigator.sendBeacon('/api/error-report',new Blob([body],{type:'application/json'}));}
      else{fetch('/api/error-report',{method:'POST',body:body,headers:{'Content-Type':'application/json'},keepalive:true}).catch(function(){});}
    }catch(x){}
    try{if(window.posthog&&window.posthog.capture){window.posthog.capture('$exception',{$exception_type:type,$exception_message:msg,$exception_stack_trace_raw:stack});}}catch(x){}
  }

  // Catch JS errors (skip ResizeObserver & ChunkLoadError — handled above)
  var _prevErr=window.onerror;
  window.onerror=function(m,src,line,col,err){
    if(typeof m==='string'&&(m.indexOf('ResizeObserver')!==-1||m.indexOf('Loading chunk')!==-1||m.indexOf('ChunkLoadError')!==-1))return _prevErr?_prevErr.apply(window,arguments):false;
    _errReport('js_error',typeof m==='string'?m:(err&&err.message)||'Unknown',err&&err.stack,src);
    return _prevErr?_prevErr.apply(window,arguments):false;
  };

  // Catch unhandled promise rejections (skip tRPC & ChunkLoadError — handled above)
  window.addEventListener('unhandledrejection',function(ev){
    var r=ev&&ev.reason;if(!r)return;
    var msg=r.message||String(r);
    if(r.name==='ChunkLoadError'||msg.indexOf('Loading chunk')!==-1)return;
    if(msg==='UNAUTHORIZED'||msg==='Failed to fetch')return;
    _errReport('js_error',msg,r.stack);
  });

  // Intercept fetch for 500+ errors
  var _origFetch=window.fetch;
  window.fetch=function(){
    return _origFetch.apply(this,arguments).then(function(res){
      if(res.status>=500){
        _errReport('api_error','HTTP '+res.status+' '+res.url.split('?')[0],null,res.url.split('?')[0]);
      }
      return res;
    });
  };
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
