import { memo, useMemo } from 'react';

interface HTMLRendererProps {
  height?: string;
  htmlContent: string;
  width?: string;
}

/**
 * HTMLRenderer component for rendering HTML content in an iframe
 * Uses srcDoc instead of doc.write() for better compatibility with ES6 modules
 * Includes sandbox attributes for security and proper script execution
 * Injects base tag to support external CDN resources (Three.js, etc.)
 */
const HTMLRenderer = memo<HTMLRendererProps>(({ htmlContent, width = '100%', height = '100%' }) => {
  // Inject base tag to support external resources from CDN
  const processedContent = useMemo(() => {
    // If content already has a base tag, don't inject
    if (htmlContent.includes('<base')) return htmlContent;

    // Inject base tag after <head> or at the beginning
    const baseTag = '<base href="https://pho.chat/" target="_blank">';

    if (htmlContent.includes('<head>')) {
      return htmlContent.replace('<head>', `<head>${baseTag}`);
    } else if (htmlContent.includes('<head ')) {
      return htmlContent.replace(/<head\s/, `<head>${baseTag}<head `);
    } else {
      // If no head tag, wrap content with html structure
      return `<!DOCTYPE html><html><head>${baseTag}</head><body>${htmlContent}</body></html>`;
    }
  }, [htmlContent]);

  return (
    <iframe
      sandbox="allow-scripts allow-same-origin"
      srcDoc={processedContent}
      style={{ border: 'none', height, width }}
      title="html-renderer"
    />
  );
});

export default HTMLRenderer;
