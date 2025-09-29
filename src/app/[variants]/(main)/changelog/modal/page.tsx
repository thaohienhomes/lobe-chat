'use client';

import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Flexbox } from 'react-layout-kit';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

/**
 * @description: Changelog Modal (intercepting routes fallback when hard refresh)
 * @example: /changelog/modal => /changelog
 * @refs: https://github.com/lobehub/lobe-chat/discussions/2295#discussioncomment-9290942
 */

function ChangelogModalContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/changelog');
  }, [router]);

  return null;
}

const ChangelogModal = () => {
  return (
    <Suspense
      fallback={
        <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
          <Spin size="large" />
        </Flexbox>
      }
    >
      <ChangelogModalContent />
    </Suspense>
  );
};

export default ChangelogModal;
