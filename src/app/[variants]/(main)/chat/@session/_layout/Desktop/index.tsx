import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

import PanelBody from './PanelBody';
import Header from './SessionHeader';

const DesktopLayout = ({ children }: PropsWithChildren) => {
  return (
    <Flexbox height="100%" style={{ position: 'relative' }}>
      <Header />
      <PanelBody>{children}</PanelBody>
    </Flexbox>
  );
};

export default DesktopLayout;
