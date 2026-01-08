import { PropsWithChildren } from 'react';

const LifetimeLayout = ({ children }: PropsWithChildren) => {
  return (
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
  );
};

export default LifetimeLayout;
