import { ReactNode } from 'react';

interface DesktopProps {
  children: ReactNode;
}

export default function Desktop({ children }: DesktopProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: '1024px', width: '100%' }}>{children}</div>
    </div>
  );
}
