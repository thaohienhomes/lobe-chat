import { Metadata } from 'next';

import ServerLayout from '@/components/server/ServerLayout';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import PaymentContent from './features/PaymentContent';

export const generateMetadata = async (props: DynamicLayoutProps): Promise<Metadata> => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('setting', locale);

  return metadataModule.generate({
    description: t('subscription.payment.title', { defaultValue: 'Update Payment Method' }),
    locale,
    title: t('subscription.payment.title', { defaultValue: 'Update Payment Method' }),
    url: '/subscription/payment',
  });
};

const Layout = ServerLayout({ Desktop, Mobile });

const SubscriptionPaymentPage = async (props: DynamicLayoutProps) => {
  return (
    <Layout {...props}>
      <PaymentContent />
    </Layout>
  );
};

export default SubscriptionPaymentPage;

