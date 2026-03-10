import StructuredData from '@/components/StructuredData';
import { BRANDING_NAME } from '@/const/branding';
import { ldModule } from '@/server/ld';
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
    title: t('meta.title'),
    url: '/openclaw',
  });
};

const OpenClawPage = async (props: DynamicLayoutProps) => {
  const { locale } = await RouteVariants.getVariantsFromProps(props);
  const { t } = await translation('openclaw', locale);
  const ld = ldModule.generate({
    description: t('meta.description', { appName: BRANDING_NAME }),
    locale,
    title: t('meta.title'),
    url: '/openclaw',
  });

  return (
    <>
      <StructuredData ld={ld} />
      <Client />
    </>
  );
};

OpenClawPage.displayName = 'OpenClawPage';

export default OpenClawPage;
