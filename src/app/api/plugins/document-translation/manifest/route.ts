import { NextRequest, NextResponse } from 'next/server';

/**
 * Document Translation Plugin - Manifest
 *
 * Returns the plugin manifest for LobeChat plugin system.
 * Provides 3 tools: extract → translate → apply
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
          'Extract translatable text from a Word document (.docx). Upload the file first, then call this with the file URL. Returns extracted text elements from shapes, textboxes, diagrams, and paragraphs, along with a jobId for subsequent steps.',
        name: 'extractDocumentText',
        parameters: {
          properties: {
            fileUrl: {
              description:
                'URL of the uploaded .docx file (from file upload), or base64-encoded file data',
              type: 'string',
            },
          },
          required: ['fileUrl'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/document-translation/gateway`,
      },
      {
        description:
          'Translate extracted text elements from a document. Requires a jobId from extractDocumentText. Supports Chinese, Vietnamese, English, Japanese, Korean and more. Automatically detects domain (construction, engineering) and applies specialized glossary.',
        name: 'translateDocumentText',
        parameters: {
          properties: {
            glossary: {
              additionalProperties: { type: 'string' },
              description:
                'Optional custom glossary overrides (key: original term, value: translation)',
              type: 'object',
            },
            jobId: {
              description: 'Job ID returned from extractDocumentText',
              type: 'string',
            },
            sourceLang: {
              description:
                'Source language (auto-detected if omitted). Examples: zh, vi, en, ja, ko',
              type: 'string',
            },
            targetLang: {
              description:
                'Target language for translation. Examples: vi (Vietnamese), en (English), zh (Chinese)',
              type: 'string',
            },
          },
          required: ['jobId', 'targetLang'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/document-translation/gateway`,
      },
      {
        description:
          'Apply translations back to the document and generate the downloadable .docx file. Preserves 100% of original layout, shapes, and formatting. Returns a download URL for the translated file.',
        name: 'applyDocumentTranslation',
        parameters: {
          properties: {
            jobId: {
              description: 'Job ID from the previous steps',
              type: 'string',
            },
            translations: {
              description: 'Optional user-edited translations to override AI results',
              items: {
                properties: {
                  id: { description: 'Text element ID', type: 'string' },
                  translated: { description: 'User-edited translation', type: 'string' },
                },
                required: ['id', 'translated'],
                type: 'object',
              },
              type: 'array',
            },
          },
          required: ['jobId'],
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

1. Call \`extractDocumentText\` with the file URL to extract all text from shapes, textboxes, and paragraphs
2. Review the extracted elements and report what was found (number of shapes, text elements, detected language)
3. Call \`translateDocumentText\` with the jobId and target language
4. Present the translations showing original → translated for key terms
5. Call \`applyDocumentTranslation\` to generate the final .docx download

IMPORTANT RULES:
- Always detect the source language automatically from the extracted text
- For construction/engineering documents, the built-in glossary will be auto-applied
- Show key translation results to the user before generating the final file
- The output .docx preserves 100% of the original layout, shapes, colors, and formatting
- If the user doesn't specify a target language, ask them which language they want`,
    type: 'default',
    version: '1.0',
  };

  return NextResponse.json(manifest);
}
