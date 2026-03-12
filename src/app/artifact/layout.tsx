import type { PropsWithChildren } from 'react';

export default function ArtifactLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
