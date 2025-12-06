import { Flexbox } from 'react-layout-kit';

import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import ChatHydration from './features/ChatHydration';
import ChatInput from './features/ChatInput';
import ChatList from './features/ChatList';
import ThreadHydration from './features/ThreadHydration';
import ZenModeToast from './features/ZenModeToast';

// Wrap in single root element (Flexbox) instead of fragment to fix React boundary error
// "A previously unvisited boundary must have exactly one root segment"
// Sentry issue: PHO-JAVASCRIPT-NEXTJS-J
const ChatConversation = async (props: DynamicLayoutProps) => {
  const isMobile = await RouteVariants.getIsMobile(props);

  return (
    <Flexbox flex={1} height={'100%'} style={{ position: 'relative' }} width={'100%'}>
      <ZenModeToast />
      <ChatList mobile={isMobile} />
      <ChatInput mobile={isMobile} />
      <ChatHydration />
      <ThreadHydration />
    </Flexbox>
  );
};

ChatConversation.displayName = 'ChatConversation';

export default ChatConversation;
