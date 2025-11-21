import { memo } from 'react';

interface HTMLRendererProps {
  height?: string;
  htmlContent: string;
  width?: string;
}

/**
 * HTMLRenderer component for rendering HTML content in an iframe
 * Uses srcDoc instead of doc.write() for better compatibility with ES6 modules
 * Includes sandbox attributes for security and proper script execution
 */
const HTMLRenderer = memo<HTMLRendererProps>(({ htmlContent, width = '100%', height = '100%' }) => {
  return (
    <iframe
      sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals allow-popups"
      srcDoc={htmlContent}
      style={{ border: 'none', height, width }}
      title="html-renderer"
    />
  );
});

export default HTMLRenderer;
