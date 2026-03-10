import { BRANDING_NAME } from '@/const/branding';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Client from './Client';

export const dynamic = 'force-dynamic';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('openclaw', locale);
  return metadataModule.generate({
    description: t('meta.description', { appName: BRANDING_NAME }),
    locale,
    title: `My Bots — ${t('meta.title')}`,
    url: '/openclaw/dashboard',
  });
};

const DashboardPage = async () => {
  return <Client />;
};

DashboardPage.displayName = 'OpenClawDashboardPage';

export default DashboardPage;
