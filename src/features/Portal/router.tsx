'use client';

import React, { memo } from 'react';

import { Artifacts } from './Artifacts';
import { DeepResearch } from './DeepResearch';
import { FilePreview } from './FilePreview';
import { HomeBody, HomeTitle } from './Home';
import { MessageDetail } from './MessageDetail';
import { Plugins } from './Plugins';
import { Research } from './Research';
import { Thread } from './Thread';
import Header from './components/Header';
import { PortalImpl } from './type';

const items: PortalImpl[] = [DeepResearch, Research, Thread, MessageDetail, Artifacts, Plugins, FilePreview];

export const PortalTitle = memo(() => {
  const enabledList: boolean[] = [];

  for (const item of items) {
    const enabled = item.useEnable();
    enabledList.push(enabled);
  }

  for (const [i, element] of enabledList.entries()) {
    const Title = items[i].Title;
    if (element) {
      return <Title />;
    }
  }

  return <HomeTitle />;
});

export const PortalHeader = memo(() => {
  const enabledList: boolean[] = [];

  for (const item of items) {
    const enabled = item.useEnable();
    enabledList.push(enabled);
  }

  for (const [i, element] of enabledList.entries()) {
    const Header = items[i].Header;
    if (element && Header) {
      return <Header />;
    }
  }

  return <Header title={<PortalTitle />} />;
});

const PortalBody = memo(() => {
  const enabledList: boolean[] = [];

  for (const item of items) {
    const enabled = item.useEnable();
    enabledList.push(enabled);
  }

  // Deep Research is items[0] — keep it always mounted so article generation
  // continues when user closes the panel. Hide via CSS when not active.
  const deepResearchEnabled = enabledList[0];
  const DeepResearchBody = items[0].Body;

  // Find which other portal item is active
  let activeBody: React.ReactNode = null;
  for (let i = 1; i < enabledList.length; i++) {
    if (enabledList[i]) {
      const Body = items[i].Body;
      activeBody = <Body />;
      break;
    }
  }

  return (
    <>
      {/* Deep Research: always mounted, hidden when not the active panel */}
      <div style={{ display: deepResearchEnabled && !activeBody ? undefined : 'none', height: '100%' }}>
        <DeepResearchBody />
      </div>
      {/* Other portal items render normally */}
      {activeBody || (!deepResearchEnabled && <HomeBody />)}
    </>
  );
});

export default PortalBody;
