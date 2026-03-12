import { NextRequest, NextResponse } from 'next/server';

/**
 * Document Translation Plugin - Manifest
 *
 * Single tool: translateDocument — downloads file, translates, returns result.
 * Fully stateless (no job IDs), works on Vercel serverless.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3010';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const manifest = {
    $schemas: 'https://chat-plugins.lobehub.com/schema/v1/manifest.json',
    api: [
      {
        description:
          'Translate a Word document (.docx) to another language. Upload the file first, then call this with the file URL and target language. Returns translated text samples and a base64-encoded translated .docx file. Preserves 100% of original layout, shapes, diagrams, and formatting.',
        name: 'translateDocument',
        parameters: {
          properties: {
            fileUrl: {
              description:
                'URL of the uploaded .docx file (from file upload). Can be an S3 URL, a relative path like /api/file/..., or base64 data URL.',
              type: 'string',
            },
            glossary: {
              additionalProperties: { type: 'string' },
              description:
                'Optional custom glossary (key: original term, value: preferred translation)',
              type: 'object',
            },
            sourceLang: {
              description:
                'Source language (auto-detected if omitted). Examples: zh, vi, en, ja, ko',
              type: 'string',
            },
            targetLang: {
              description:
                'Target language. Examples: vi (Vietnamese), en (English), zh (Chinese), ja (Japanese)',
              type: 'string',
            },
          },
          required: ['fileUrl', 'targetLang'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/document-translation/gateway`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/document-translation',
    identifier: 'document-translation',
    meta: {
      avatar: '📄',
      description:
        'Translate Word documents (.docx) while preserving 100% layout, shapes, and diagrams. Supports Chinese ↔ Vietnamese ↔ English with domain-specific glossaries for construction & engineering.',
      tags: ['translation', 'document', 'docx', 'diagram', 'construction'],
      title: 'Document Translation',
    },
    settings: {
      properties: {},
      type: 'object',
    },
    systemRole: `## Document Translation Plugin

When the user uploads a .docx file and asks to translate it:

1. Call \`translateDocument\` with the file URL and target language
2. Show key translation samples (original → translated) from the result
3. The response includes a base64-encoded translated .docx file
4. Tell the user the translation is complete and show the stats

IMPORTANT RULES:
- The tool does everything in one call: extract text → translate → generate output file
- Source language is auto-detected from the content
- For construction/engineering documents, a specialized glossary is auto-applied  
- The output .docx preserves 100% of the original layout, shapes, colors, and formatting
- If the user doesn't specify a target language, ask them which language they want
- If fileUrl is a relative path (starts with /), the tool will convert it to an absolute URL automatically`,
    type: 'default',
    version: '2.0',
  };

  return NextResponse.json(manifest);
}
