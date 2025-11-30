import dynamic from 'next/dynamic';

import { isDesktop } from '@/const/version';
import { analyticsEnv } from '@/envs/analytics';

import Desktop from './Desktop';
import Google from './Google';
import Sentry from './Sentry';
import Vercel from './Vercel';

const Plausible = dynamic(() => import('./Plausible'));
const Umami = dynamic(() => import('./Umami'));
const Clarity = dynamic(() => import('./Clarity'));
const ReactScan = dynamic(() => import('./ReactScan'));
const TikTok = dynamic(() => import('./TikTok'));
const TikTokProvider = dynamic(() => import('./TikTokProvider'));

const Analytics = () => {
  return (
    <>
      {process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1' && <Sentry />}
      {analyticsEnv.ENABLE_VERCEL_ANALYTICS && <Vercel />}
      {analyticsEnv.ENABLE_GOOGLE_ANALYTICS && <Google />}
      {analyticsEnv.ENABLED_PLAUSIBLE_ANALYTICS && (
        <Plausible
          domain={analyticsEnv.PLAUSIBLE_DOMAIN}
          scriptBaseUrl={analyticsEnv.PLAUSIBLE_SCRIPT_BASE_URL}
        />
      )}
      {analyticsEnv.ENABLED_UMAMI_ANALYTICS && (
        <Umami
          scriptUrl={analyticsEnv.UMAMI_SCRIPT_URL}
          websiteId={analyticsEnv.UMAMI_WEBSITE_ID}
        />
      )}
      {analyticsEnv.ENABLED_CLARITY_ANALYTICS && (
        <Clarity projectId={analyticsEnv.CLARITY_PROJECT_ID} />
      )}
      {!!analyticsEnv.REACT_SCAN_MONITOR_API_KEY && (
        <ReactScan apiKey={analyticsEnv.REACT_SCAN_MONITOR_API_KEY} />
      )}
      {analyticsEnv.ENABLED_TIKTOK_PIXEL && (
        <TikTokProvider>
          <TikTok pixelId={analyticsEnv.TIKTOK_PIXEL_ID} />
        </TikTokProvider>
      )}
      {isDesktop && <Desktop />}
    </>
  );
};

export default Analytics;
