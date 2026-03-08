'use client';

import Link, { LinkProps } from 'next/link';
import { FC } from 'react';

const EXTERNAL_HREF_REGEX = /https?:\/\//;

const A: FC<LinkProps> = ({ href = '', ...props }) => {
  const isOutbound = EXTERNAL_HREF_REGEX.test(href as string);
  const isOfficial = String(href).includes('lobechat') || String(href).includes('lobehub');

  // Use native <a> for external URLs to avoid Next.js prefetch errors
  // Next.js <Link> tries to prefetch external domains which causes
  // "Cannot prefetch" PostHog exceptions (e.g. doi.org, pubmed)
  if (isOutbound) {
    return (
      <a
        href={href as string}
        rel={isOfficial ? undefined : 'noopener noreferrer nofollow'}
        target="_blank"
        {...(props as any)}
      />
    );
  }

  return <Link href={href} {...props} />;
};

export default A;
