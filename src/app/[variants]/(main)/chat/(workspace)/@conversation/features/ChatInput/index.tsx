import dynamic from 'next/dynamic';

const DesktopChatInput = dynamic(() => import('./Desktop'));
const MobileChatInput = dynamic(() => import('./V1Mobile'));

const ChatInput = ({ mobile }: { mobile: boolean }) => {
  const Input = mobile ? MobileChatInput : DesktopChatInput;

  return <Input />;
};

export default ChatInput;
