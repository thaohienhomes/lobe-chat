import type { PropsWithChildren } from 'react';

export default function PaymentLayout({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        bottom: 0,
        left: 0,
        overflow: 'auto',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
}
