interface TemplateFilesParams {
  title?: string;
}
export const createTemplateFiles = ({ title }: TemplateFilesParams = {}) => ({
  '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title || 'Phở Artifact'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #root { height: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
`,
  '/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
});
