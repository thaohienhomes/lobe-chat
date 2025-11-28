import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TikTok from '../TikTok';

// Mock Next.js Script component to avoid script execution in tests
vi.mock('next/script', () => ({
  default: ({ children, id, dangerouslySetInnerHTML, ...props }: any) => (
    <script
      id={id}
      data-testid="mocked-script"
      data-script-content={dangerouslySetInnerHTML?.__html}
      {...props}
    >
      {children}
    </script>
  ),
}));

describe('TikTok', () => {
  it('should render TikTok Pixel script when pixelId is provided', () => {
    const { container } = render(<TikTok pixelId="D4KRIFBC77U4IAHDO190" />);

    const script = container.querySelector('#tiktok-pixel');
    expect(script).toBeInTheDocument();
    expect(script?.getAttribute('id')).toBe('tiktok-pixel');

    // Check that the script contains the pixel ID and key TikTok functions
    const scriptContent = script?.getAttribute('data-script-content') || '';
    expect(scriptContent).toContain('D4KRIFBC77U4IAHDO190');
    expect(scriptContent).toContain('TiktokAnalyticsObject');
    expect(scriptContent).toContain('ttq');
  });

  it('should not render script when pixelId is not provided', () => {
    const { container } = render(<TikTok />);

    const script = container.querySelector('#tiktok-pixel');
    expect(script).not.toBeInTheDocument();
  });

  it('should not render script when pixelId is empty', () => {
    const { container } = render(<TikTok pixelId="" />);

    const script = container.querySelector('#tiktok-pixel');
    expect(script).not.toBeInTheDocument();
  });
});
