import { getUserAuth } from '@lobechat/utils/server';
import { notFound } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';

import { SharedConversationModel } from '@/database/models/sharedConversation';
import { getServerDB } from '@/database/server';
import { PagePropsWithId } from '@/types/next';

import SharedConversationView from './SharedConversationView';

const SharedConversationPage = async (props: PagePropsWithId) => {
  const params = await props.params;
  const { id } = params;

  // Get database instance
  const serverDB = await getServerDB();

  // Get shared conversation (public - no auth required)
  const model = new SharedConversationModel(serverDB);
  const sharedConversation = await model.getPublicById(id);

  if (!sharedConversation) {
    notFound();
  }

  // Check if user is authenticated
  const auth = await getUserAuth();

  return (
    <Flexbox height={'100%'} width={'100%'}>
      <SharedConversationView isAuthenticated={!!auth} sharedConversation={sharedConversation} />
    </Flexbox>
  );
};

export default SharedConversationPage;

// Make this page dynamic (no static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
