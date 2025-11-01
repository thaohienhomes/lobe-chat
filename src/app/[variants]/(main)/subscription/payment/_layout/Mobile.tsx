import { ReactNode } from 'react';

interface MobileProps {
  children: ReactNode;
}

export default function Mobile({ children }: MobileProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 16px',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

