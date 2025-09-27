import { Metadata } from 'next';

import ServerLayout from '@/components/server/ServerLayout';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import PlansContent from './features/PlansContent';

export const generateMetadata = async (props: DynamicLayoutProps): Promise<Metadata> => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('setting', locale);

  return metadataModule.generate({
    description: t('subscription.plans.title'),
    locale,
    title: t('subscription.plans.title'),
    url: '/subscription/plans',
  });
};

const Layout = ServerLayout({ Desktop, Mobile });

const SubscriptionPlansPage = async (props: DynamicLayoutProps) => {
  return (
    <Layout {...props}>
      <PlansContent />
    </Layout>
  );
};

export default SubscriptionPlansPage;
