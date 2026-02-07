import ElevenLabs from './features/ElevenLabs';
import OpenAI from './features/OpenAI';
import STT from './features/STT';

const Page = () => {
  return (
    <>
      <STT />
      <OpenAI />
      <ElevenLabs />
    </>
  );
};

Page.displayName = 'TtsSetting';

export default Page;
