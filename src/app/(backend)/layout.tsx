import { PropsWithChildren } from 'react';

export default function BackendLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
