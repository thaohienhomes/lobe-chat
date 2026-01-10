import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  description: 'Own Pho.chat Forever. Zero Subscriptions. Lifetime access to all AI models.',
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.ico',
  },
  title: 'Lifetime Deal - Pho.chat',
};

const LifetimeRootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17766075190" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17766075190');
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            background: '#000',
            color: '#fff',
            minHeight: '100vh',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
      </body>
    </html>
  );
};

export default LifetimeRootLayout;
