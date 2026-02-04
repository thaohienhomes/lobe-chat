import Appearance from './features/Appearance';
import ChatAppearance from './features/ChatAppearance';
import Common from './features/Common/Common';
import Memory from './features/Memory';

const Page = () => {
  return (
    <>
      <Common />
      <Memory />
      <Appearance />
      <ChatAppearance />
    </>
  );
};

Page.displayName = 'CommonSetting';

export default Page;
