import { memo, useEffect, useMemo, useRef } from 'react';

interface HTMLRendererProps {
  height?: string;
  htmlContent: string;
  width?: string;
}

/**
 * HTMLRenderer component for rendering HTML content in an iframe
 * Uses Blob URL approach for better ES6 module support and external script loading
 * This approach creates a proper document URL, avoiding srcDoc limitations
 */
const HTMLRenderer = memo<HTMLRendererProps>(({ htmlContent, width = '100%', height = '100%' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Create blob URL from HTML content
  const blobUrl = useMemo(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [htmlContent]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      src={blobUrl}
      style={{ border: 'none', height, width }}
      title="html-renderer"
    />
  );
});

export default HTMLRenderer;
