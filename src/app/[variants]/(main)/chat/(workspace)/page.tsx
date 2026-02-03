import StructuredData from '@/components/StructuredData';
import { BRANDING_NAME } from '@/const/branding';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import PageTitle from '../features/PageTitle';

// Changelog removed for pho.chat - Feb 2026
// import Changelog from './features/ChangelogModal';
// TelemetryNotification removed - pho.chat doesn't need Lobe telemetry consent
// import TelemetryNotification from './features/TelemetryNotification';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('metadata', locale);
  return metadataModule.generate({
    description: t('chat.description', { appName: BRANDING_NAME }),
    title: t('chat.title', { appName: BRANDING_NAME }),
    url: '/chat',
  });
};

// Wrap in single root element (div) instead of fragment to fix React boundary error
// "A previously unvisited boundary must have exactly one root segment"
// Sentry issue: PHO-JAVASCRIPT-NEXTJS-J
const Page = async (props: DynamicLayoutProps) => {
  const { locale } = await RouteVariants.getVariantsFromProps(props);
  const { t } = await translation('metadata', locale);
  const ld = ldModule.generate({
    description: t('chat.description', { appName: BRANDING_NAME }),
    title: t('chat.title', { appName: BRANDING_NAME }),
    url: '/chat',
  });

  return (
    <div>
      <StructuredData ld={ld} />
      <PageTitle />
      {/* TelemetryNotification removed for pho.chat */}
      {/* Changelog modal disabled for pho.chat - Feb 2026 */}
      {/* {!isDesktop && showChangelog && !hideDocs && !isMobile && (
        <Suspense>
          <Changelog />
        </Suspense>
      )} */}
    </div>
  );
};

Page.displayName = 'Chat';

export default Page;
