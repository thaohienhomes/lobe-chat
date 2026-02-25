import { ClerkProvider } from '@clerk/nextjs';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  description: 'Tin tức, cập nhật và hướng dẫn sử dụng Phở Chat.',
  title: {
    default: 'Phở Chat Blog',
    template: '%s | Phở Chat Blog',
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
