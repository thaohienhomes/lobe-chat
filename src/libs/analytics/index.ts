import { createServerAnalytics } from '@lobehub/analytics/server';

import { BUSINESS_LINE } from '@/const/analytics';
import {
  ENABLED_POSTHOG_ANALYTICS,
  POSTHOG_HOST,
  POSTHOG_KEY,
  analyticsEnv,
} from '@/envs/analytics';
import { isDev } from '@/utils/env';

export const serverAnalytics = createServerAnalytics({
  business: BUSINESS_LINE,
  debug: isDev,
  providers: {
    posthogNode: {
      debug: analyticsEnv.DEBUG_POSTHOG_ANALYTICS,
      enabled: ENABLED_POSTHOG_ANALYTICS,
      host: POSTHOG_HOST,
      key: POSTHOG_KEY ?? '',
    },
  },
});

export const initializeServerAnalytics = async () => {
  await serverAnalytics.initialize();
  return serverAnalytics;
};

export default serverAnalytics;
